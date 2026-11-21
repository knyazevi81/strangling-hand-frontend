import { useEffect, useMemo, useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Checkbox,
  Alert, Skeleton, CircularProgress, TextField,
} from '@mui/material'
import { accessApi, apiError, type NodeAccess } from '../../../api'
import ModePicker from './ModePicker'

/** Кто может пользоваться выходом. Та же настройка, что в карточке друга. */
export default function NodeAccessDialog({ nodeId, name, open, onClose, onSaved }: {
  nodeId: string; name: string; open: boolean; onClose: () => void; onSaved?: (restricted: boolean) => void
}) {
  const [data, setData] = useState<NodeAccess | null>(null)
  const [restricted, setRestricted] = useState(false)
  const [checked, setChecked] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (!open) return
    setData(null); setError(''); setSaved(false); setQuery('')
    accessApi.node(nodeId).then(({ data }) => {
      setData(data); setRestricted(data.restricted)
      setChecked(new Set(data.users.filter((u) => u.granted).map((u) => u.user_id)))
    }).catch((e) => setError(apiError(e, 'Не удалось загрузить доступ')))
  }, [open, nodeId])

  const users = data?.users ?? []
  // «все выходы» у друга и выход открыт всем: доступ есть без галочки
  const isAuto = (mode: string) => mode === 'all' && !restricted
  const allowedCount = users.filter((u) => isAuto(u.mode) || checked.has(u.user_id)).length
  const shown = useMemo(() => users.filter((u) => u.email.toLowerCase().includes(query.trim().toLowerCase())), [users, query])

  const save = async () => {
    setSaving(true); setError('')
    try {
      const ids = users.filter((u) => checked.has(u.user_id) && !isAuto(u.mode)).map((u) => u.user_id)
      const { data } = await accessApi.setNode(nodeId, restricted, ids)
      setData(data); setSaved(true); onSaved?.(data.restricted)
    } catch (e) {
      setError(apiError(e, 'Не удалось сохранить'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} fullWidth>
      <DialogTitle sx={{ pb: 0.5 }}>
        Кто может пользоваться
        <Typography variant="body2" color="text.secondary">{name}</Typography>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, pt: '8px !important' }}>
        {error && <Alert severity="error">{error}</Alert>}
        {saved && <Alert severity="success">Сохранено. Узлы применят изменения примерно за минуту.</Alert>}
        {!data && !error && <Skeleton variant="rounded" height={240} />}
        {data && (
          <>
            <ModePicker value={restricted ? 'some' : 'all'} onChange={(v) => { setRestricted(v === 'some'); setSaved(false) }} options={[
              { value: 'all', title: 'Все друзья', sub: 'с режимом «все выходы»' },
              { value: 'some', title: 'Выбранные', sub: `${allowedCount} из ${users.length}` },
            ]} />
            {users.length > 6 && (
              <TextField size="small" placeholder="Найти друга" value={query} onChange={(e) => setQuery(e.target.value)} />
            )}
            {shown.map((u) => {
              const auto = isAuto(u.mode)
              return (
                <Box key={u.user_id} sx={{ display: 'flex', alignItems: 'center', gap: 1, borderTop: '1px solid #E6F1FB' }}>
                  <Checkbox checked={auto || checked.has(u.user_id)} disabled={auto}
                    inputProps={{ 'aria-label': u.email }}
                    onChange={() => { setSaved(false); setChecked((p) => { const n = new Set(p); n.has(u.user_id) ? n.delete(u.user_id) : n.add(u.user_id); return n }) }} />
                  <Typography variant="body2" color="#042C53" sx={{ flex: 1, minWidth: 0 }} noWrap>{u.email}</Typography>
                  <Typography variant="caption" color="text.secondary">{u.mode === 'all' ? 'все выходы' : 'выбранные'}</Typography>
                </Box>
              )
            })}
            <Typography variant="caption" sx={{ background: '#F0F4FF', borderRadius: 2, p: 1.25, color: '#5B7BA3' }}>
              {restricted
                ? 'Выход только у отмеченных. Новые друзья его не получат.'
                : 'Выход есть у всех друзей с режимом «все выходы». Друзьям с режимом «только выбранные» его нужно отметить.'}
              {' '}Галочки здесь и в карточке друга — одна и та же настройка.
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
