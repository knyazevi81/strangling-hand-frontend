import { useEffect, useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography,
  ToggleButtonGroup, ToggleButton, Skeleton, Alert,
} from '@mui/material'
import { trafficApi, apiError, type UserTraffic, type UserTrafficDetail } from '../../../api'
import { bytes, timeAgo } from '../../vpn/utils'
import UsageBars from './UsageBars'
import { toUsagePoints } from './TrafficDashboard'

/** Трафик одного друга: период, график, время суток, узлы. */
export function UserTrafficPanel({ userId }: { userId: string }) {
  const [days, setDays] = useState(30)
  const [data, setData] = useState<UserTrafficDetail | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setData(null)
    setError('')
    trafficApi.user(userId, days)
      .then(({ data }) => setData(data))
      .catch((e) => setError(apiError(e, 'Не удалось загрузить')))
  }, [userId, days])

  const hourOfDay = (data?.by_hour_of_day ?? []).map((v, h) => ({
    label: String(h), title: `${String(h).padStart(2, '0')}:00–${String(h).padStart(2, '0')}:59 по Москве`,
    up: 0, down: v, totalOnly: true,
  }))
  const total = data ? data.total.up + data.total.down : 0

  return (
    <Box>
      <ToggleButtonGroup exclusive size="small" value={days} onChange={(_, v) => v && setDays(v)} sx={{ mb: 2 }}>
        <ToggleButton value={1}>Сутки</ToggleButton>
        <ToggleButton value={7}>Неделя</ToggleButton>
        <ToggleButton value={30}>Месяц</ToggleButton>
      </ToggleButtonGroup>

      {error && <Alert severity="error">{error}</Alert>}
      {!data && !error && <Skeleton variant="rounded" height={300} />}

      {data && (
        <>
          <Box sx={{ display: 'flex', gap: 3, mb: 2, flexWrap: 'wrap' }}>
            {[
              { l: 'Всего', v: bytes(total) },
              { l: 'Скачано / отдано', v: `${bytes(data.total.down)} / ${bytes(data.total.up)}` },
              { l: 'Дней с VPN', v: `${data.active_days}` },
              { l: 'Последний раз', v: timeAgo(data.last_active) },
            ].map((s) => (
              <Box key={s.l}>
                <Typography variant="caption" color="text.secondary" display="block">{s.l}</Typography>
                <Typography variant="body2" fontWeight={700} color="#042C53">{s.v}</Typography>
              </Box>
            ))}
          </Box>

          <Typography variant="subtitle2" fontWeight={700} color="#042C53">{days <= 2 ? 'По часам' : 'По дням'}</Typography>
          <UsageBars data={toUsagePoints(data.hourly, days)} height={160} />

          <Typography variant="subtitle2" fontWeight={700} color="#042C53" mt={2}>В какое время суток (по Москве)</Typography>
          <Typography variant="caption" color="text.secondary" display="block">Сумма за период по каждому часу</Typography>
          <UsageBars data={hourOfDay} height={140} tickEvery={2} />

          {data.nodes.length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" fontWeight={700} color="#042C53" mb={0.5}>Через какие узлы</Typography>
              {data.nodes.map((n) => (
                <Box key={n.node} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.25 }}>
                  <Typography variant="body2" color="#042C53">{n.node}</Typography>
                  <Typography variant="body2" color="#042C53" sx={{ fontFamily: 'monospace' }}>{bytes(n.up + n.down)}</Typography>
                </Box>
              ))}
            </Box>
          )}
        </>
      )}
    </Box>
  )
}

export default function UserTrafficDialog({ user, onClose }: { user: UserTraffic | null; onClose: () => void }) {
  return (
    <Dialog open={!!user} onClose={onClose} fullWidth>
      <DialogTitle sx={{ pb: 0.5 }}>
        <Typography variant="h6" component="div" noWrap>{user?.email}</Typography>
      </DialogTitle>
      <DialogContent sx={{ pt: '8px !important' }}>{user && <UserTrafficPanel userId={user.user_id} />}</DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}><Button onClick={onClose}>Закрыть</Button></DialogActions>
    </Dialog>
  )
}
