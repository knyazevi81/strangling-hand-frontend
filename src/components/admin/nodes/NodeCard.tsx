import { useState } from 'react'
import {
  Box, Typography, Card, CardContent, Chip, Switch, Tooltip, IconButton, Collapse, Alert,
  Menu, MenuItem, ListItemIcon, Divider, LinearProgress,
} from '@mui/material'
import {
  MoreVert, Edit, Key, Code, Delete, ExpandMore, ExpandLess, Login, Public,
} from '@mui/icons-material'
import type { VpnNode } from '../../../api'
import { bytes, countryLabel, timeAgo } from '../../vpn/utils'

function syncChip(n: VpnNode) {
  if (!n.last_seen_at) return { label: 'ждёт установки', color: '#C07A00', bg: '#FFF8E1', border: '#FCD34D' }
  if (!n.online) return { label: 'нет связи', color: '#C0392B', bg: '#FFEBEE', border: '#F09595' }
  if (n.last_error) return { label: 'ошибка', color: '#C0392B', bg: '#FFEBEE', border: '#F09595' }
  if (n.in_sync === false) return { label: 'применяет конфиг', color: '#C07A00', bg: '#FFF8E1', border: '#FCD34D' }
  return { label: 'онлайн', color: '#1B7F4A', bg: '#E8F5E9', border: '#A5D6A7' }
}

function Meter({ label, value }: { label: string; value: number | undefined }) {
  if (value === undefined || value === null) return null
  const color = value > 90 ? 'error' : value > 70 ? 'warning' : 'primary'
  return (
    <Box sx={{ flex: 1, minWidth: 80 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="caption" fontWeight={600} color="#042C53">{Math.round(value)}%</Typography>
      </Box>
      <LinearProgress variant="determinate" value={Math.min(100, value)} color={color}
        sx={{ height: 5, borderRadius: 3, background: '#E6F1FB' }} />
    </Box>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Box sx={{ display: 'flex', gap: 1, py: 0.4 }}>
      <Typography variant="caption" color="text.secondary" sx={{ width: 110, flexShrink: 0 }}>{label}</Typography>
      <Typography variant="caption" color="#042C53" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
        {children}
      </Typography>
    </Box>
  )
}

export default function NodeCard({
  node, onToggle, onEdit, onRotate, onConfig, onDelete,
}: {
  node: VpnNode
  onToggle: (enabled: boolean) => void
  onEdit: () => void
  onRotate: () => void
  onConfig: () => void
  onDelete: () => void
}) {
  const [expanded, setExpanded] = useState(false)
  const [menu, setMenu] = useState<HTMLElement | null>(null)
  const st = syncChip(node)
  const r = node.report ?? {}
  const traffic = Object.entries(r.traffic?.users ?? {})
    .filter(([k]) => !k.startsWith('relay:'))
    .reduce((acc, [, v]) => acc + (v.up ?? 0) + (v.down ?? 0), 0)
  const balancer = Object.values(r.balancers ?? {}).find(Boolean)
  const RoleIcon = node.role === 'entry' ? Login : Public

  const act = (fn: () => void) => () => { setMenu(null); fn() }

  return (
    <Card sx={{ mb: 1.5, opacity: node.enabled ? 1 : 0.6 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 1.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: 2.5, flexShrink: 0,
            background: node.role === 'entry' ? '#E6F1FB' : '#EEF7F1',
            border: `1px solid ${node.role === 'entry' ? '#B5D4F4' : '#A5D6A7'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <RoleIcon sx={{ fontSize: 20, color: node.role === 'entry' ? '#185FA5' : '#1B7F4A' }} />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
              <Typography variant="subtitle1" fontWeight={700} color="#042C53" lineHeight={1.3}>{node.name}</Typography>
              <Chip label={st.label} size="small" sx={{
                height: 20, fontSize: '0.62rem', fontWeight: 600,
                color: st.color, background: st.bg, border: `1px solid ${st.border}`,
              }} />
            </Box>
            <Typography variant="caption" color="text.secondary" display="block">
              {node.role === 'entry' ? 'вход' : 'выход'}
              {node.country ? ` · ${countryLabel(node.country)}` : ''} · {node.address}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block">
              {node.last_seen_at ? `отчёт ${timeAgo(node.last_seen_at)}` : 'агент ещё не подключался'}
              {node.xray_version ? ` · Xray ${node.xray_version}` : ''}
              {node.role === 'entry' && r.traffic?.online !== undefined ? ` · онлайн ${r.traffic.online}` : ''}
            </Typography>
          </Box>

          <Tooltip title={node.enabled ? 'Включён: есть в подписке' : 'Выключен: убран из подписки и конфигов'}>
            <Switch size="small" checked={node.enabled} onChange={(e) => onToggle(e.target.checked)} />
          </Tooltip>
          <IconButton size="small" onClick={(e) => setMenu(e.currentTarget)}>
            <MoreVert fontSize="small" />
          </IconButton>
          <Menu anchorEl={menu} open={!!menu} onClose={() => setMenu(null)}
            PaperProps={{ sx: { borderRadius: 3, border: '1px solid #E6F1FB', minWidth: 200 } }}>
            <MenuItem onClick={act(onEdit)}><ListItemIcon><Edit fontSize="small" /></ListItemIcon>Изменить</MenuItem>
            <MenuItem onClick={act(onRotate)}><ListItemIcon><Key fontSize="small" /></ListItemIcon>Новый ключ</MenuItem>
            <MenuItem onClick={act(onConfig)}><ListItemIcon><Code fontSize="small" /></ListItemIcon>Конфиг Xray</MenuItem>
            <Divider />
            <MenuItem onClick={act(onDelete)} sx={{ color: '#C0392B' }}>
              <ListItemIcon><Delete fontSize="small" sx={{ color: '#C0392B' }} /></ListItemIcon>Удалить
            </MenuItem>
          </Menu>
        </Box>

        {node.last_error && (
          <Alert severity="error" sx={{ mt: 1.5, py: 0, '& .MuiAlert-message': { fontSize: '0.72rem' } }}>
            {node.last_error}
          </Alert>
        )}

        {node.role === 'entry' && (r.probes?.length ?? 0) > 0 && (
          <Box sx={{ mt: 1.5, display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {r.probes!.map((p) => {
              const chosen = balancer === p.tag
              const ok = p.ok
              return (
                <Tooltip key={p.tag} title={`${p.address}:${p.port}/${p.proto}${chosen ? ' · выбран балансировщиком' : ''}`}>
                  <Chip size="small" label={`${p.tag.replace(/^exit-/, '')}${p.ms != null ? ` ${Math.round(p.ms)} ms` : ''}`}
                    sx={{
                      height: 22, fontSize: '0.64rem', fontFamily: 'monospace',
                      fontWeight: chosen ? 700 : 500,
                      color: ok === false ? '#C0392B' : ok ? '#1B7F4A' : '#378ADD',
                      background: chosen ? '#E8F5E9' : '#fff',
                      border: `1px solid ${ok === false ? '#F09595' : chosen ? '#1B7F4A' : '#B5D4F4'}`,
                    }} />
                </Tooltip>
              )
            })}
          </Box>
        )}

        <Box onClick={() => setExpanded((v) => !v)} sx={{
          mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#B5D4F4',
        }}>
          {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
        </Box>

        <Collapse in={expanded}>
          {r.host && (
            <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
              <Meter label="Память" value={r.host.mem_used_pct} />
              <Meter label="Диск" value={r.host.disk_used_pct} />
              {r.host.load1 !== undefined && r.host.cpus ? (
                <Meter label={`Нагрузка ${r.host.load1}`} value={(r.host.load1 / r.host.cpus) * 100} />
              ) : null}
            </Box>
          )}
          {r.host?.os && <Row label="Система">{r.host.os} · {r.host.hostname}</Row>}
          {r.host?.uptime_sec !== undefined && <Row label="Аптайм">{Math.round(r.host.uptime_sec / 3600)} ч</Row>}
          {r.ports && <Row label="Порты">{r.ports.join(', ')}</Row>}
          {traffic > 0 && <Row label="Трафик друзей">{bytes(traffic)} за последний интервал</Row>}
          {balancer && <Row label="Балансировщик">{balancer}</Row>}
          <Row label="Ревизия">
            {node.reported_revision ?? '—'}{node.current_revision && node.current_revision !== node.reported_revision
              ? ` → ${node.current_revision}` : ''}
          </Row>
          <Row label="Ключ">{node.key_prefix}…</Row>
          {node.hy2_fingerprint && <Row label="Сертификат hy2">{node.hy2_fingerprint}</Row>}
          {r.agent_version && <Row label="Агент">{r.agent_version}</Row>}
        </Collapse>
      </CardContent>
    </Card>
  )
}
