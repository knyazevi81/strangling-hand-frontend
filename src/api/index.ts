import axios from 'axios'

export const API_BASE_URL = 'https://api.savebit.ru'

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
