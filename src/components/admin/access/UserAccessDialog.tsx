import { useEffect, useMemo, useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Checkbox,
  Alert, Skeleton, CircularProgress, Chip,
} from '@mui/material'
import { accessApi, apiError, type ExitMode, type UserAccess } from '../../../api'
import { countryLabel } from '../../vpn/utils'
import ModePicker from './ModePicker'

/** Через какие выходы ходит друг. Галочки «для выбранных» выходов работают и в режиме «все». */
export default function UserAccessDialog({ userId, email, open, onClose }: {
  userId: string; email: string; open: boolean; onClose: () => void
}) {
  const [data, setData] = useState<UserAccess | null>(null)
  const [mode, setMode] = useState<ExitMode>('all')
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!open) return
    setData(null); setError(''); setSaved(false)
    accessApi.user(userId).then(({ data }) => {
      setData(data)
      setMode(data.mode)
      setChecked(new Set(data.exits.filter((x) => x.granted || (data.mode === 'some' && x.allowed)).map((x) => x.node_id)))
    }).catch((e) => setError(apiError(e, 'Не удалось загрузить доступ')))
  }, [open, userId])

  const exits = data?.exits ?? []
  // что получит друг при текущих галочках (как на бэкенде)
  const allowed = useMemo(() => new Set(exits.filter((x) =>
    checked.has(x.node_id) || (mode === 'all' && !x.restricted)).map((x) => x.node_id)), [exits, checked, mode])
  const toggle = (id: string) => setChecked((prev) => {
    const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n
  })

  const save = async () => {
    setSaving(true); setError('')
    try {
      // в режиме «все» храним галочки только у выходов «для выбранных»
      const ids = exits.filter((x) => checked.has(x.node_id) && (mode === 'some' || x.restricted)).map((x) => x.node_id)
      const { data } = await accessApi.setUser(userId, mode, ids)
      setData(data); setSaved(true)
    } catch (e) {
      setError(apiError(e, 'Не удалось сохранить'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} fullWidth>
      <DialogTitle sx={{ pb: 0.5 }}>
        Доступ к выходам
        <Typography variant="body2" color="text.secondary" noWrap>{email}</Typography>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: '8px !important' }}>
        {error && <Alert severity="error">{error}</Alert>}
        {saved && <Alert severity="success">Сохранено. Узлы применят изменения примерно за минуту.</Alert>}
        {!data && !error && <Skeleton variant="rounded" height={220} />}
        {data && (
          <>
            <ModePicker value={mode} onChange={(v) => {
              // переход на «только выбранные»: сохраняем то, что у друга есть сейчас
              if (v === 'some' && mode === 'all') setChecked(new Set(allowed))
              setMode(v); setSaved(false)
            }} options={[
              { value: 'all', title: 'Все выходы', sub: 'и новые тоже' },
              { value: 'some', title: 'Только выбранные', sub: `${exits.filter((x) => allowed.has(x.node_id)).length} из ${exits.length}` },
            ]} />
            {exits.length === 0 && <Typography variant="body2" color="text.secondary">Выходов пока нет</Typography>}
            {exits.map((x) => {
              const auto = mode === 'all' && !x.restricted
              return (
                <Box key={x.node_id} sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.5, borderTop: '1px solid #E6F1FB', opacity: x.enabled ? 1 : 0.5 }}>
                  <Checkbox checked={allowed.has(x.node_id)} disabled={auto}
                    onChange={() => { toggle(x.node_id); setSaved(false) }} inputProps={{ 'aria-label': x.name }} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}>
                      <Typography variant="body2" fontWeight={600} color="#042C53" noWrap>{x.name}</Typography>
                      {x.restricted && <Chip size="small" label="для выбранных" sx={{ height: 18, fontSize: '0.6rem', background: '#FFF4E5', color: '#6B3A00' }} />}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {countryLabel(x.country)}{x.country ? ' · ' : ''}{!x.enabled ? 'выключен' : x.online ? 'работает' : 'нет связи'}
                      {auto ? ' · входит во «все выходы»' : ''}
                    </Typography>
                  </Box>
                </Box>
              )
            })}
            <Typography variant="caption" sx={{ background: '#F0F4FF', borderRadius: 2, p: 1.25, color: allowed.size === 0 ? '#A3261A' : '#5B7BA3' }}>
              {allowed.size === 0
                ? 'Ни одного выхода: VPN у друга работать не будет. Если нужно отключить доступ, лучше заблокировать.'
                : mode === 'all'
                  ? 'Новые выходы появятся у друга автоматически. Выходы «для выбранных» — только если отмечены.'
                  : 'Новые выходы друг не получит, пока ты их не отметишь.'}
            </Typography>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" sx={{ flex: 1 }} disabled={saving}>Закрыть</Button>
        <Button onClick={save} variant="contained" sx={{ flex: 1 }} disabled={saving || !data}>
          {saving ? <CircularProgress size={18} color="inherit" /> : 'Сохранить'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
