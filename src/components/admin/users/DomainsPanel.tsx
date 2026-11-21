import { useEffect, useState } from 'react'
import { Box, Typography, Skeleton, Alert, ToggleButtonGroup, ToggleButton } from '@mui/material'
import { Link as RouterLink } from 'react-router-dom'
import { privacyApi, apiError, type DomainItem } from '../../../api'

/** Топ доменов друга (userId) или всех друзей (без userId). */
export default function DomainsPanel({ userId, title = 'Куда заходит' }: { userId?: string; title?: string }) {
  const [days, setDays] = useState(7)
  const [data, setData] = useState<{ collect: boolean; days: number; domains: DomainItem[] } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setData(null); setError('')
    const req = userId ? privacyApi.userDomains(userId, days) : privacyApi.topDomains(days)
    req.then(({ data }) => setData(data)).catch((e) => setError(apiError(e, 'Не удалось загрузить')))
  }, [userId, days])

  const max = Math.max(1, ...(data?.domains ?? []).map((d) => d.connections))
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, gap: 1, flexWrap: 'wrap' }}>
        <Typography variant="subtitle1" fontWeight={700} color="#042C53">{title}</Typography>
        <ToggleButtonGroup exclusive size="small" value={days} onChange={(_, v) => v && setDays(v)}>
          <ToggleButton value={1}>День</ToggleButton>
          <ToggleButton value={7}>Неделя</ToggleButton>
          <ToggleButton value={14}>14 дн.</ToggleButton>
        </ToggleButtonGroup>
      </Box>
      {error && <Alert severity="error">{error}</Alert>}
      {!data && !error && <Skeleton variant="rounded" height={200} />}
      {data && !data.collect && (
        <Alert severity="info" sx={{ mb: 1.5 }}>
          Сбор доменов выключен. Включить: <RouterLink to="/admin/privacy">настройки сбора данных</RouterLink>.
        </Alert>
      )}
      {data && data.domains.length === 0 && <Typography variant="body2" color="text.secondary" py={2}>Нет данных за период</Typography>}
      {data?.domains.map((d) => (
        <Box key={d.domain} sx={{ py: 0.75 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
            <Typography variant="body2" color="#042C53" noWrap>{d.domain}</Typography>
            <Typography variant="body2" color="#1E5A9A" sx={{ fontFamily: 'monospace', flexShrink: 0 }}>
              {d.connections.toLocaleString('ru-RU')}{!userId ? ` · ${d.users} чел.` : ''}
            </Typography>
          </Box>
          <Box sx={{ height: 5, borderRadius: 3, background: '#E6F1FB', mt: 0.5 }}>
            <Box sx={{ width: `${(d.connections / max) * 100}%`, height: 5, borderRadius: 3, background: '#185FA5' }} />
          </Box>
        </Box>
      ))}
      {data && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ background: '#F0F4FF', borderRadius: 2, p: 1.25, mt: 1 }}>
          Число подключений к домену, а не трафик. Только домены, без адресов страниц: всё под HTTPS. Хранится {data.days} дн.
        </Typography>
      )}
    </Box>
  )
}
