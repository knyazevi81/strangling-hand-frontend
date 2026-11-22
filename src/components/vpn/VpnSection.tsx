import { useEffect, useState } from 'react'
import { Alert, Box, ButtonBase, Card, CardContent, Skeleton, Typography } from '@mui/material'
import { AltRoute, ChevronRight } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { vpnApi, apiError, type VpnMe } from '../../api'
import SubscriptionCard from './SubscriptionCard'
import StatusBoard from './StatusBoard'
import BlockedNotice from './BlockedNotice'
import ConnectionCard from './ConnectionCard'

/** Ссылка на вкладку «Маршруты»: обход российских сайтов и свои исключения. */
function RoutesLink() {
  const navigate = useNavigate()
  const [text, setText] = useState('')
  useEffect(() => {
    vpnApi.routes().then(({ data }) => {
      const own = data.exceptions.length
      setText(`${data.bypass_ru ? 'включено' : 'выключено'}${own ? ` · исключений: ${own}` : ''}`)
    }).catch(() => setText(''))
  }, [])
  return (
    <ButtonBase onClick={() => navigate('/routes')} sx={{
      width: '100%', textAlign: 'left', background: '#fff', border: '1px solid #B5D4F4', borderRadius: '16px',
      p: 1.75, mb: 2, display: 'flex', alignItems: 'center', gap: 1.5,
    }}>
      <Box sx={{ width: 40, height: 40, borderRadius: '12px', background: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <AltRoute sx={{ color: '#155D37' }} />
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography variant="body2" fontWeight={600} color="#042C53">Российские сайты без VPN</Typography>
        {text && <Typography variant="caption" color="text.secondary">{text}</Typography>}
      </Box>
      <ChevronRight sx={{ color: '#4A6A93' }} />
    </ButtonBase>
  )
}

/** Подписка для Happ и статус серверов: верх страницы «Ключи». */
export default function VpnSection() {
  const [me, setMe] = useState<VpnMe | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    vpnApi.me()
      // старый бэкенд может не прислать profile_names: не падаем
      .then(({ data }) => setMe({ ...data, profiles: data.profiles ?? 0, profile_names: data.profile_names ?? [] }))
      .catch((e) => setError(apiError(e, 'Не удалось загрузить подписку')))
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      {loading && (
        <Card sx={{ mb: 2 }}>
          <CardContent sx={{ p: 2 }}>
            <Skeleton width="50%" height={22} />
            <Skeleton width="80%" height={16} sx={{ mt: 1 }} />
            <Skeleton variant="rounded" height={44} sx={{ mt: 2, borderRadius: 2 }} />
          </CardContent>
        </Card>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {me?.blocked && <BlockedNotice block={me.blocked} />}
      {me && !me.blocked && <SubscriptionCard me={me}
        onChange={(d) => setMe({ ...d, profiles: d.profiles ?? 0, profile_names: d.profile_names ?? [] })} />}
      {me?.connection && !me.blocked && <ConnectionCard c={me.connection} />}
      {!me?.blocked && <StatusBoard profileNames={me?.profile_names} />}
      {me && !me.blocked && <RoutesLink />}
    </>
  )
}
