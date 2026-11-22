import { useEffect, useState } from 'react'
import { Alert, Box, Skeleton, Typography } from '@mui/material'
import { Lock } from '@mui/icons-material'
import { vpnApi, apiError, type RouteException, type RoutesView } from '../../api'
import { AddSite, ExceptionList, RefreshHint, SiteCheck, SwitchRow, card } from './RoutesParts'

/** Вкладка друга «Маршруты»: обход российских сайтов и свои исключения. */
export default function RoutesPage() {
  const [view, setView] = useState<RoutesView | null>(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [changed, setChanged] = useState(false)

  useEffect(() => {
    vpnApi.routes().then(({ data }) => setView(data)).catch((e) => setError(apiError(e, 'Не удалось загрузить маршруты')))
  }, [])

  const save = async (data: { bypass_ru?: boolean; exceptions?: RouteException[] }) => {
    setBusy(true)
    setError('')
    try {
      setView((await vpnApi.updateRoutes(data)).data)
      setChanged(true)
    } catch (e) {
      setError(apiError(e, 'Не удалось сохранить'))
    } finally {
      setBusy(false)
    }
  }

  const own = (view?.exceptions ?? []).filter((e) => e.by !== 'admin')

  return (
    <Box>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h5" fontWeight={700}>Маршруты</Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>Какие сайты идут через VPN, а какие напрямую</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!view && !error && <Skeleton variant="rounded" height={220} sx={{ borderRadius: '16px' }} />}

      {view && (
        <>
          {!view.can_edit && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, background: '#FFF4E5', border: '1px solid #F5C27A', borderRadius: '14px', p: 1.5, mb: 2 }}>
              <Lock sx={{ fontSize: 18, color: '#8A4B00' }} />
              <Typography variant="body2" color="#6B3A00">Маршруты задал администратор, поменять их нельзя.</Typography>
            </Box>
          )}
          {changed && <RefreshHint />}

          <Box sx={card}>
            <SwitchRow title="Российские сайты без VPN" checked={view.bypass_ru} disabled={!view.can_edit || busy}
              hint="Госуслуги, банки и маркетплейсы открываются напрямую: быстрее и без капчи."
              onChange={(v) => save({ bypass_ru: v })} />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 1.5 }}>
              <Box sx={{ background: '#E8F5E9', borderRadius: '12px', p: 1.25 }}>
                <Typography variant="caption" fontWeight={700} color="#155D37">Напрямую</Typography>
                <Typography variant="caption" color="#155D37" display="block" sx={{ lineHeight: 1.45, mt: 0.5 }}>
                  {view.bypass_ru ? 'Госуслуги, банки, Ozon, Wildberries, Кинопоиск, ВКонтакте, все .ru и .рф' : 'только твои исключения'}
                </Typography>
              </Box>
              <Box sx={{ background: '#E6F1FB', borderRadius: '12px', p: 1.25 }}>
                <Typography variant="caption" fontWeight={700} color="#185FA5">Через VPN</Typography>
                <Typography variant="caption" color="#185FA5" display="block" sx={{ lineHeight: 1.45, mt: 0.5 }}>
                  YouTube, Instagram, ChatGPT и всё, что заблокировано, даже на .ru
                </Typography>
              </Box>
            </Box>
            {view.mode === 'custom' && (
              <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                У всех обход {view.default_bypass_ru ? 'включён' : 'выключен'}, у тебя — свой.
              </Typography>
            )}
          </Box>

          <Box sx={card}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 1 }}>
              <Typography variant="subtitle1" fontWeight={700} color="#042C53">Мои исключения</Typography>
              <Typography variant="caption" color="text.secondary">{view.exceptions.length}</Typography>
            </Box>
            <ExceptionList items={view.exceptions} whoLabel={(e) => (e.by === 'admin' ? 'добавил администратор' : 'добавил я')}
              removable={(e) => view.can_edit && e.by !== 'admin'}
              onRemove={(e) => save({ exceptions: own.filter((x) => x.value !== e.value) })} />
            {view.can_edit && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2" fontWeight={600} color="#042C53" mb={1}>Добавить сайт</Typography>
                <AddSite busy={busy} onAdd={(e) => save({ exceptions: [...own.filter((x) => x.value !== e.value), e] })} />
                <Typography variant="caption" color="text.secondary" display="block" mt={1}>
                  Сайт не открывается или просит выключить VPN? Добавь его сюда напрямую.
                </Typography>
              </Box>
            )}
          </Box>

          <SiteCheck bypass={view.bypass_ru} direct={view.global_direct} proxy={view.global_proxy} exceptions={view.exceptions} />
        </>
      )}
    </Box>
  )
}
