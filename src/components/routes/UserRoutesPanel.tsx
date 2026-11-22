import { useEffect, useState } from 'react'
import { Alert, Box, Button, CircularProgress, Skeleton, ToggleButton, ToggleButtonGroup, Typography } from '@mui/material'
import { useNavigate } from 'react-router-dom'
import { routesApi, apiError, type RouteException, type RoutesView } from '../../api'
import { timeAgo } from '../vpn/utils'
import { AddSite, ExceptionList, SwitchRow } from './RoutesParts'

type Draft = { mode: 'default' | 'custom'; bypass_ru: boolean; exceptions: RouteException[]; locked: boolean }

const toDraft = (v: RoutesView): Draft => ({
  mode: v.mode, bypass_ru: v.bypass_ru, exceptions: v.exceptions.map((e) => ({ ...e, by: e.by ?? 'self' })), locked: v.locked,
})

/** Вкладка «Маршруты» в карточке друга: админ видит его настройки и может задать своё. */
export default function UserRoutesPanel({ userId }: { userId: string }) {
  const navigate = useNavigate()
  const [view, setView] = useState<RoutesView | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState('')
  const [busy, setBusy] = useState(false)

  const apply = (v: RoutesView) => { setView(v); setDraft(toDraft(v)) }

  useEffect(() => {
    routesApi.ofUser(userId).then(({ data }) => apply(data)).catch((e) => setError(apiError(e, 'Не удалось загрузить маршруты')))
  }, [userId])

  const run = async (fn: () => Promise<{ data: RoutesView }>, done: string) => {
    setBusy(true)
    setError('')
    setSaved('')
    try {
      apply((await fn()).data)
      setSaved(done)
    } catch (e) {
      setError(apiError(e, 'Не удалось сохранить'))
    } finally {
      setBusy(false)
    }
  }

  if (error && !view) return <Alert severity="error">{error}</Alert>
  if (!view || !draft) return <Skeleton variant="rounded" height={200} sx={{ borderRadius: 3 }} />

  const who = view.changed_by === 'admin' ? 'админ' : view.changed_by === 'self' ? 'сам друг' : null
  const set = (patch: Partial<Draft>) => { setSaved(''); setDraft({ ...draft, ...patch }) }
  const bypass = draft.mode === 'custom' ? draft.bypass_ru : view.default_bypass_ru

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 1 }}>
        <Typography variant="subtitle1" fontWeight={700} color="#042C53">Маршруты</Typography>
        {who && view.changed_at && (
          <Typography variant="caption" color="text.secondary">поменял {who} {timeAgo(view.changed_at)}</Typography>
        )}
      </Box>

      {error && <Alert severity="error">{error}</Alert>}
      {saved && <Alert severity="success">{saved}</Alert>}

      <ToggleButtonGroup exclusive fullWidth size="small" value={draft.mode} onChange={(_, v) => v && set({ mode: v })}
        aria-label="Настройки маршрутов">
        <ToggleButton value="default" sx={{ textTransform: 'none', fontWeight: 600 }}>Как у всех</ToggleButton>
        <ToggleButton value="custom" sx={{ textTransform: 'none', fontWeight: 600 }}>Своё</ToggleButton>
      </ToggleButtonGroup>

      <SwitchRow title="Российские сайты без VPN" checked={bypass} disabled={draft.mode !== 'custom'}
        hint={draft.mode === 'custom' ? 'только для этого друга' : `по общим правилам: ${view.default_bypass_ru ? 'включено' : 'выключено'}`}
        onChange={(v) => set({ bypass_ru: v })} />

      <Box>
        <Typography variant="caption" fontWeight={700} color="#4A6A93" sx={{ letterSpacing: '0.04em' }}>
          ИСКЛЮЧЕНИЯ · {draft.exceptions.length}
        </Typography>
        <Box sx={{ mt: 1 }}>
          <ExceptionList items={draft.exceptions} removable={() => true}
            whoLabel={(e) => (e.by === 'admin' ? 'админ' : 'сам')}
            onRemove={(e) => set({ exceptions: draft.exceptions.filter((x) => x.value !== e.value) })} />
        </Box>
        <Box sx={{ mt: 1.5 }}>
          <AddSite admin onAdd={(e) => set({
            exceptions: [...draft.exceptions.filter((x) => x.value !== e.value), { ...e, by: 'admin' }],
          })} />
        </Box>
      </Box>

      <Box sx={{ borderTop: '1px solid #E6F1FB', pt: 1.5 }}>
        <SwitchRow title="Запретить менять самому" hint="друг увидит настройки, но не сможет их поменять"
          checked={draft.locked} onChange={(v) => set({ locked: v })} />
      </Box>

      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button variant="outlined" disabled={busy} onClick={() => run(() => routesApi.resetUser(userId), 'Сброшено к общим правилам')}
          sx={{ flex: 1, borderRadius: 3, minHeight: 46 }}>
          Сбросить к общим
        </Button>
        <Button variant="contained" disabled={busy} onClick={() => run(() => routesApi.saveUser(userId, draft), 'Сохранено')}
          sx={{ flex: 1, borderRadius: 3, minHeight: 46 }}>
          {busy ? <CircularProgress size={18} color="inherit" /> : 'Сохранить'}
        </Button>
      </Box>
      <Button variant="text" onClick={() => navigate('/admin/routing')} sx={{ alignSelf: 'flex-start', textTransform: 'none', px: 0 }}>
        Общие правила: Ещё → Маршруты по умолчанию
      </Button>
    </Box>
  )
}
