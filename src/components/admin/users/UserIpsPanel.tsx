import { useEffect, useState } from 'react'
import { Box, Typography, Skeleton, Alert, Chip } from '@mui/material'
import { PhoneIphone } from '@mui/icons-material'
import { Link as RouterLink } from 'react-router-dom'
import { privacyApi, apiError, type UserIpItem } from '../../../api'
import { countryLabel, timeAgo } from '../../vpn/utils'

const fmtDay = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long' })

export default function UserIpsPanel({ userId }: { userId: string }) {
  const [data, setData] = useState<{ collect: boolean; days: number; geoip_ready: boolean; ips: UserIpItem[] } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setData(null); setError('')
    privacyApi.userIps(userId).then(({ data }) => setData(data)).catch((e) => setError(apiError(e, 'Не удалось загрузить')))
  }, [userId])

  if (error) return <Alert severity="error">{error}</Alert>
  if (!data) return <Skeleton variant="rounded" height={200} />

  const now = data.ips.filter((i) => i.now)
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
        <Typography variant="subtitle1" fontWeight={700} color="#042C53">С каких IP заходит</Typography>
        <Typography variant="caption" color="text.secondary">хранится {data.days} дн.</Typography>
      </Box>
      {!data.collect && (
        <Alert severity="info" sx={{ mb: 1.5 }}>
          Сбор IP выключен. Включить: <RouterLink to="/admin/privacy">настройки сбора данных</RouterLink>.
        </Alert>
      )}
      {now.length >= 3 && (
        <Alert severity="warning" sx={{ mb: 1.5 }}>
          Сейчас подключён с {now.length} адресов одновременно. Возможно, ключ передали.
        </Alert>
      )}
      {data.ips.length === 0 && (
        <Typography variant="body2" color="text.secondary" py={2}>
          {data.collect ? 'Пока нет данных: появятся после первых подключений через узлы с агентом 0.2.0.' : 'Нет данных.'}
        </Typography>
      )}
      {data.ips.map((i) => (
        <Box key={i.ip} sx={{ display: 'flex', gap: 1.25, py: 1.25, borderTop: '1px solid #E6F1FB' }}>
          <Box sx={{ width: 34, height: 34, borderRadius: 2.5, background: '#E6F1FB', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PhoneIphone sx={{ fontSize: 18, color: '#185FA5' }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 1 }}>
              <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center', minWidth: 0 }}>
                <Typography sx={{ fontFamily: 'monospace', fontSize: '0.85rem', fontWeight: 600 }} color="#042C53" noWrap>{i.ip}</Typography>
                {i.now && <Chip size="small" label="сейчас" sx={{ height: 18, fontSize: '0.6rem', background: '#E8F5E9', color: '#155D37' }} />}
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>{i.connections} подкл.</Typography>
            </Box>
            <Typography variant="caption" color="#1E5A9A" display="block">
              {[i.org, i.city, i.country ? countryLabel(i.country) : null].filter(Boolean).join(' · ') || (data.geoip_ready ? 'оператор неизвестен' : 'база GeoIP ещё не скачана')}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {i.now ? 'сейчас' : timeAgo(i.last_seen)} · с {fmtDay.format(new Date(i.first_seen))}{i.node_name ? ` · через ${i.node_name}` : ''}
            </Typography>
          </Box>
        </Box>
      ))}
      <Typography variant="caption" color="text.secondary" display="block" sx={{ background: '#F0F4FF', borderRadius: 2, p: 1.25, mt: 1 }}>
        Оператор и город — по офлайн-базе DB-IP Lite, точность до города. «Сейчас» — подключения за последние 3 минуты.
      </Typography>
    </Box>
  )
}
