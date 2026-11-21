import { useEffect, useState } from 'react'
import { Alert, Card, CardContent, Skeleton } from '@mui/material'
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
    </>
  )
}
