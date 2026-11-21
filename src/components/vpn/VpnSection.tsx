import { useEffect, useState } from 'react'
import { Alert, Card, CardContent, Skeleton, Typography } from '@mui/material'
import { vpnApi, apiError, type VpnMe } from '../../api'
import SubscriptionCard from './SubscriptionCard'
import StatusBoard from './StatusBoard'
import BlockedNotice from './BlockedNotice'

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
      {!me?.blocked && <StatusBoard profileNames={me?.profile_names} />}
      {me?.privacy && (me.privacy.collect_ips || me.privacy.collect_domains) && (
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: -0.5, mb: 2, px: 0.5, lineHeight: 1.5 }}>
          Администратор видит{me.privacy.collect_ips ? `, с каких IP вы подключаетесь (хранится ${me.privacy.ips_days} дн.)` : ''}
          {me.privacy.collect_ips && me.privacy.collect_domains ? ' и' : ''}
          {me.privacy.collect_domains ? ` какие сайты открываете — только домены, без адресов страниц (${me.privacy.domains_days} дн.)` : ''}.
        </Typography>
      )}
    </>
  )
}
