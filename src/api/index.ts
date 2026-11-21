import axios from 'axios'

export const API_BASE_URL: string = import.meta.env.VITE_API_URL || 'https://api.savebit.ru'

const api = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (r) => r,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true
      const refresh = localStorage.getItem('refresh_token')
      if (refresh) {
        try {
          const { data } = await axios.post(`${API_BASE_URL}/api/v1/auth/refresh`, { refresh_token: refresh })
          localStorage.setItem('access_token', data.access_token)
          localStorage.setItem('refresh_token', data.refresh_token)
          original.headers.Authorization = `Bearer ${data.access_token}`
          return api(original)
        } catch {
          localStorage.clear()
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api

export interface User {
  id: string
  email: string
  is_active: boolean
  is_superuser: boolean
}

export interface Subscribe {
  id: string
  user_id: string
  ip: string
  port: string
  payload: string
}

export interface TokenResponse {
  access_token: string
  refresh_token: string
  token_type: string
}

export const authApi = {
  register: (email: string, password: string) => api.post<User>('/auth/register', { email, password }),
  login: (email: string, password: string) => api.post<TokenResponse>('/auth/login', { email, password }),
  me: () => api.get<User>('/auth/me'),
  logout: () => api.post('/auth/logout'),
  requestPasswordReset: (email: string) =>
    api.post<{ message: string }>('/auth/password-reset/request', { email }),
  confirmPasswordReset: (email: string, code: string, newPassword: string) =>
    api.post<{ message: string }>('/auth/password-reset/confirm', { email, code, new_password: newPassword }),
}

export const usersApi = {
  getAll: () => api.get<{ users: User[]; total: number }>('/users/'),
  getPending: () => api.get<{ users: User[]; total: number }>('/users/pending'),
  activate: (userId: string) => api.patch<User>(`/users/${userId}/activate`),
  adminChangePassword: (userId: string, newPassword: string) =>
    api.patch('/users/admin/change-password', { user_id: userId, new_password: newPassword }),
  changeMyPassword: (oldPassword: string, newPassword: string) =>
    api.patch('/users/me/password', { old_password: oldPassword, new_password: newPassword }),
  notifyAll: (subject: string, message: string) =>
    api.post<{ sent_to: number; message: string }>('/users/notifications/all', { subject, message }),
  notifyUser: (userId: string, subject: string, message: string) =>
    api.post('/users/notifications/user', { user_id: userId, subject, message }),
}

export const subscribesApi = {
  getMySubscribes: () => api.get<{ subscribes: Subscribe[]; total: number }>('/subscribes/me'),
  getAll: () => api.get<{ subscribes: Subscribe[]; total: number }>('/subscribes/'),
  getByUser: (userId: string) => api.get<{ subscribes: Subscribe[]; total: number }>(`/subscribes/user/${userId}`),
  create: (data: { user_id: string; ip: string; port: string; payload_template: string }) =>
    api.post<Subscribe>('/subscribes/', data),
  update: (id: string, data: { ip?: string; port?: string; payload_template?: string }) =>
    api.patch<Subscribe>(`/subscribes/${id}`, data),
  delete: (id: string) => api.delete(`/subscribes/${id}`),
}


export const freeVpnApi = {
  getConfigs: () => api.get<{ url: string }[]>('/free-vpn/configs'),
}

// ── VPN: подписка, статус узлов, узлы в админке ───────────────────────────────

export type NodeRole = 'entry' | 'exit'

export interface ProfileLink {
  name: string
  protocol: string
  url: string
}

export interface VpnMe {
  subscription_url: string
  profiles: number
  profile_names: string[]
  links?: ProfileLink[]
  blocked?: VpnBlock | null
  privacy?: PrivacyNotice | null
}

export interface PrivacyNotice { collect_ips: boolean; ips_days: number; collect_domains: boolean; domains_days: number }

export interface VpnBlock { since: string; until: string | null; reason: string | null; reset_on_unblock?: boolean }

export interface NodeStatus {
  name: string
  role: NodeRole
  country: string | null
  online: boolean
  last_seen_at: string | null
  latency_ms: number | null
  active: boolean | null
}

export interface NodeSettings {
  reality_target?: string | null
  reality_server_names?: string[] | null
  reality_port?: number | null
  xhttp_port?: number | null
  hy2_port?: number | null
  hy2_hop_ports?: string | null
  brutal_mbps?: number | null
  direct_profile?: boolean | null
  probe_url?: string | null
  probe_interval?: string | null
  api_port?: number | null
}

export interface NodeProbe {
  tag: string
  address: string
  port: number
  proto: string
  ok: boolean | null
  ms: number | null
}

export interface NodeReport {
  agent_version?: string
  revision?: string
  applied_at?: number
  error?: string | null
  xray?: { version?: string; active?: boolean }
  ports?: string[]
  probes?: NodeProbe[]
  balancers?: Record<string, string | null>
  traffic?: { users?: Record<string, { up: number; down: number }>; online?: number }
  host?: {
    hostname?: string; os?: string; kernel?: string; cpus?: number
    uptime_sec?: number; load1?: number; mem_used_pct?: number; disk_used_pct?: number
  }
}

export interface VpnNode {
  id: string
  name: string
  role: NodeRole
  address: string
  country: string | null
  enabled: boolean
  restricted?: boolean
  key_prefix: string
  settings: NodeSettings
  online: boolean
  in_sync: boolean | null
  current_revision: string | null
  reported_revision: string | null
  last_seen_at: string | null
  last_error: string | null
  xray_version: string | null
  hy2_fingerprint: string | null
  report: NodeReport | null
}

export interface NodeKeyResponse {
  node: VpnNode
  key: string
  install_command: string
}

export interface ProblemReport {
  network: 'wifi' | 'mobile' | 'other'
  provider?: string
  profile?: string
  comment?: string
}

export const vpnApi = {
  me: () => api.get<VpnMe>('/vpn/me'),
  reset: () => api.post<VpnMe>('/vpn/me/reset'),
  status: () => api.get<{ nodes: NodeStatus[]; updated_at: string }>('/vpn/status'),
  problem: (data: ProblemReport) => api.post<{ ok: boolean }>('/vpn/problem', data),
}

export const nodesApi = {
  list: () => api.get<{ nodes: VpnNode[]; total: number }>('/nodes/'),
  create: (data: { name: string; role: NodeRole; address: string; country?: string; settings?: NodeSettings }) =>
    api.post<NodeKeyResponse>('/nodes/', data),
  update: (id: string, data: { name?: string; address?: string; country?: string; enabled?: boolean; settings?: NodeSettings }) =>
    api.patch<VpnNode>(`/nodes/${id}`, data),
  rotateKey: (id: string) => api.post<NodeKeyResponse>(`/nodes/${id}/rotate-key`),
  remove: (id: string) => api.delete(`/nodes/${id}`),
  config: (id: string) => api.get<Record<string, unknown>>(`/nodes/${id}/config`),
}

export interface HourPoint { hour: string; up: number; down: number }
export interface UserTraffic {
  user_id: string; email: string; up: number; down: number; total: number
  active_hours: number; last_active: string | null
}
export interface NodeTraffic { node: string; up: number; down: number }
export interface TrafficOverview {
  since: string; until: string; days: number
  total: { up: number; down: number }
  hourly: HourPoint[]
  users: UserTraffic[]
  nodes: NodeTraffic[]
}
export interface UserTrafficDetail {
  user_id: string; email: string; since: string; until: string; days: number
  total: { up: number; down: number }
  hourly: HourPoint[]
  by_hour_of_day: number[]
  active_days: number; active_hours: number; last_active: string | null
  nodes: NodeTraffic[]
}

export const trafficApi = {
  overview: (days: number) => api.get<TrafficOverview>('/admin/traffic/', { params: { days } }),
  user: (id: string, days: number) => api.get<UserTrafficDetail>(`/admin/traffic/users/${id}`, { params: { days } }),
}

export type ExitMode = 'all' | 'some'
export interface ExitAccessItem {
  node_id: string; name: string; country: string | null; enabled: boolean; online: boolean
  restricted: boolean; granted: boolean; allowed: boolean
}
export interface UserAccess { user_id: string; email: string; mode: ExitMode; exits: ExitAccessItem[] }
export interface NodeAccessUser { user_id: string; email: string; mode: ExitMode; granted: boolean; allowed: boolean; locked: boolean }
export interface NodeAccess { node_id: string; name: string; restricted: boolean; users: NodeAccessUser[] }

export const accessApi = {
  user: (id: string) => api.get<UserAccess>(`/admin/access/users/${id}`),
  setUser: (id: string, mode: ExitMode, exitIds: string[]) =>
    api.put<UserAccess>(`/admin/access/users/${id}`, { mode, exit_ids: exitIds }),
  node: (id: string) => api.get<NodeAccess>(`/admin/access/nodes/${id}`),
  setNode: (id: string, restricted: boolean, userIds: string[]) =>
    api.put<NodeAccess>(`/admin/access/nodes/${id}`, { restricted, user_ids: userIds }),
}

export interface BlockedUser extends VpnBlock { user_id: string; email: string }

export const blocksApi = {
  list: () => api.get<{ users: BlockedUser[] }>('/admin/blocks/'),
  block: (userId: string, data: { reason?: string; until?: string | null; notify: boolean; reset_on_unblock: boolean }) =>
    api.post(`/admin/blocks/${userId}`, data),
  unblock: (userId: string, notify = true) => api.delete(`/admin/blocks/${userId}`, { params: { notify } }),
}

const fmtUntil = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
/** «до 1 декабря, 20:40» или «бессрочно». */
export function blockUntilText(until: string | null): string {
  return until ? `до ${fmtUntil.format(new Date(until))}` : 'бессрочно'
}

export interface PrivacySettings {
  collect_ips: boolean; collect_domains: boolean; ips_days: number; domains_days: number; share_threshold: number
  geoip_ready?: boolean; outdated_agents?: string[]
}
export interface UserIpItem {
  ip: string; first_seen: string; last_seen: string; connections: number; node_name: string | null
  country: string | null; city: string | null; org: string | null; now: boolean
}
export interface DomainItem { domain: string; connections: number; users: number }

export const privacyApi = {
  get: () => api.get<PrivacySettings>('/admin/privacy'),
  set: (data: Partial<PrivacySettings>) => api.put<PrivacySettings>('/admin/privacy', data),
  deleteData: (kind: 'ips' | 'domains' | 'all') => api.delete('/admin/privacy/data', { params: { kind } }),
  userIps: (id: string) => api.get<{ collect: boolean; days: number; geoip_ready: boolean; ips: UserIpItem[] }>(`/admin/users/${id}/ips`),
  userDomains: (id: string, days: number) =>
    api.get<{ collect: boolean; days: number; domains: DomainItem[] }>(`/admin/users/${id}/domains`, { params: { days } }),
  topDomains: (days: number) => api.get<{ collect: boolean; days: number; domains: DomainItem[] }>('/admin/domains', { params: { days } }),
}

export type NotifyGroup = 'all' | 'no_subscription' | 'inactive_7d' | 'blocked'
export interface NotifyGroupItem { id: NotifyGroup; title: string; count: number; emails: string[] }
export interface NotifyAutoItem { key: string; title: string; to: string; enabled: boolean }
export interface NotifySettings {
  admin_emails: string[]; effective_admin_emails: string[]
  node_alerts: boolean; share_alerts: boolean; problem_reports: boolean; block_emails: boolean
  auto: NotifyAutoItem[]
}

export const notifyApi = {
  groups: () => api.get<NotifyGroupItem[]>('/admin/notify/groups'),
  sendGroup: (group: NotifyGroup, subject: string, message: string) =>
    api.post<{ sent_to: number; message: string }>('/admin/notify/groups/send', { group, subject, message }),
  settings: () => api.get<NotifySettings>('/admin/notify/settings'),
  setSettings: (data: Partial<Omit<NotifySettings, 'auto' | 'effective_admin_emails'>>) =>
    api.put<NotifySettings>('/admin/notify/settings', data),
}

/** Текст ошибки из ответа бэкенда: формат {result: {error}} или {detail}. */
export function apiError(err: any, fallback = 'Ошибка'): string {
  const d = err?.response?.data
  const msg = d?.result?.error ?? d?.detail ?? d?.message
  if (typeof msg === 'string') return msg
  if (Array.isArray(msg) && msg[0]?.msg) return msg[0].msg
  return fallback
}
