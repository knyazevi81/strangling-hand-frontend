import { useCallback, useEffect, useState } from 'react'
import {
  Box, Typography, Card, CardContent, ToggleButtonGroup, ToggleButton, Skeleton, Alert, Chip,
} from '@mui/material'
import { trafficApi, apiError, type HourPoint, type TrafficOverview, type UserTraffic } from '../../../api'
import { bytes, timeAgo } from '../../vpn/utils'
import UsageBars, { type UsagePoint } from './UsageBars'
import UserTrafficDialog from './UserTrafficDialog'

const fmtHour = new Intl.DateTimeFormat('ru-RU', { hour: '2-digit', minute: '2-digit' })
const fmtDay = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' })
const fmtFull = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/** До двух суток — по часам, дальше — по дням (иначе столбцы превращаются в нитки). */
export function toUsagePoints(hourly: HourPoint[], days: number): UsagePoint[] {
  if (days <= 2) {
    return hourly.map((h) => {
      const d = new Date(h.hour)
      return { label: fmtHour.format(d), title: fmtFull.format(d), up: h.up, down: h.down }
    })
  }
  const byDay = new Map<string, UsagePoint>()
  for (const h of hourly) {
    const d = new Date(h.hour)
    const key = d.toDateString()
    const p = byDay.get(key) ?? { label: fmtDay.format(d), title: fmtDay.format(d), up: 0, down: 0 }
    p.up += h.up
    p.down += h.down
    byDay.set(key, p)
  }
  return [...byDay.values()]
}

function Stat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <Card sx={{ flex: 1, minWidth: 0 }}>
      <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
        <Typography variant="caption" color="text.secondary" display="block" noWrap>{label}</Typography>
        <Typography variant="h6" fontWeight={700} color="#042C53" lineHeight={1.2} noWrap>{value}</Typography>
        {hint && <Typography variant="caption" color="text.secondary" noWrap display="block">{hint}</Typography>}
      </CardContent>
    </Card>
  )
}

function UserRow({ u, max, onClick }: { u: UserTraffic; max: number; onClick: () => void }) {
  const pct = max > 0 ? (u.total / max) * 100 : 0
  return (
    <Box onClick={onClick} sx={{
      py: 1, px: 0.5, cursor: 'pointer', borderRadius: 2,
      '&:hover': { background: '#F0F4FF' },
    }}>
      <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
        <Typography variant="body2" fontWeight={600} color="#042C53" noWrap sx={{ flex: 1, minWidth: 0 }}>
          {u.email}
        </Typography>
        <Typography variant="body2" fontWeight={700} color="#042C53" sx={{ fontFamily: 'monospace' }}>
          {u.total ? bytes(u.total) : '—'}
        </Typography>
      </Box>
      <Box sx={{ mt: 0.5, height: 6, borderRadius: 3, background: '#E6F1FB', overflow: 'hidden' }}>
        <Box sx={{ width: `${pct}%`, height: '100%', background: '#185FA5', borderRadius: 3, minWidth: u.total ? 4 : 0 }} />
      </Box>
      <Typography variant="caption" color="text.secondary">
        {u.total
          ? `↓ ${bytes(u.down)} · ↑ ${bytes(u.up)} · активен ${u.active_hours} ч · последний раз ${timeAgo(u.last_active)}`
          : 'не пользовался за период'}
      </Typography>
    </Box>
  )
}

export default function TrafficDashboard() {
  const [days, setDays] = useState(7)
  const [data, setData] = useState<TrafficOverview | null>(null)
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<UserTraffic | null>(null)

  const load = useCallback(async (d: number) => {
    setError('')
    try {
      const { data } = await trafficApi.overview(d)
      setData(data)
    } catch (e) {
      setError(apiError(e, 'Не удалось загрузить трафик'))
    }
  }, [])

  useEffect(() => { setData(null); load(days) }, [days, load])

  const users = data?.users ?? []
  const active = users.filter((u) => u.total > 0)
  const max = Math.max(0, ...users.map((u) => u.total))
  const total = data ? data.total.up + data.total.down : 0
  const nodeMax = Math.max(0, ...(data?.nodes ?? []).map((n) => n.up + n.down))

  return (
    <Box>
      <ToggleButtonGroup exclusive size="small" value={days} onChange={(_, v) => v && setDays(v)} sx={{ mb: 2 }}>
        <ToggleButton value={1}>Сутки</ToggleButton>
        <ToggleButton value={7}>Неделя</ToggleButton>
        <ToggleButton value={30}>Месяц</ToggleButton>
      </ToggleButtonGroup>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!data && !error && <Skeleton variant="rounded" height={260} sx={{ borderRadius: 4 }} />}

      {data && (
        <>
          <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
            <Stat label="Всего" value={bytes(total)} hint={`↓ ${bytes(data.total.down)} · ↑ ${bytes(data.total.up)}`} />
            <Stat label="Пользовались" value={`${active.length} из ${users.length}`} hint="друзей за период" />
          </Box>

          <Card sx={{ mb: 1.5 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 1.5 } }}>
              <Typography variant="subtitle2" fontWeight={700} color="#042C53">
                Трафик {days <= 2 ? 'по часам' : 'по дням'}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                Все друзья вместе. Наведи на столбец, чтобы увидеть скачано и отдано.
              </Typography>
              <UsageBars data={toUsagePoints(data.hourly, days)} />
            </CardContent>
          </Card>

          <Card sx={{ mb: 1.5 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 1 } }}>
              <Typography variant="subtitle2" fontWeight={700} color="#042C53" mb={0.5}>Друзья</Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>
                По убыванию трафика. Нажми на друга, чтобы увидеть его график.
              </Typography>
              {users.length === 0 && (
                <Typography variant="body2" color="text.secondary" py={1}>Пока нет данных</Typography>
              )}
              {users.map((u) => <UserRow key={u.user_id} u={u} max={max} onClick={() => setSelected(u)} />)}
            </CardContent>
          </Card>

          {data.nodes.length > 0 && (
            <Card>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 1.5 } }}>
                <Typography variant="subtitle2" fontWeight={700} color="#042C53" mb={1}>По узлам</Typography>
                {data.nodes.map((n) => {
                  const t = n.up + n.down
                  return (
                    <Box key={n.node} sx={{ mb: 1 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
                          <Typography variant="body2" color="#042C53">{n.node}</Typography>
                          {total > 0 && (
                            <Chip size="small" label={`${Math.round((t / total) * 100)}%`}
                              sx={{ height: 18, fontSize: '0.62rem', background: '#E6F1FB', color: '#042C53' }} />
                          )}
                        </Box>
                        <Typography variant="body2" fontWeight={600} color="#042C53" sx={{ fontFamily: 'monospace' }}>
                          {bytes(t)}
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 0.5, height: 6, borderRadius: 3, background: '#E6F1FB' }}>
                        <Box sx={{ width: `${nodeMax ? (t / nodeMax) * 100 : 0}%`, height: '100%', background: '#185FA5', borderRadius: 3 }} />
                      </Box>
                    </Box>
                  )
                })}
                <Typography variant="caption" color="text.secondary">
                  Трафик считается на узле, к которому подключился друг: вход или выход в прямом профиле.
                </Typography>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <UserTrafficDialog user={selected} onClose={() => setSelected(null)} />
    </Box>
  )
}
