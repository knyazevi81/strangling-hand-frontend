import { useEffect, useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, TextField, Alert,
  CircularProgress, FormControlLabel, Switch, ButtonBase,
} from '@mui/material'
import { blocksApi, notifyApi, apiError, blockUntilText } from '../../../api'

const REASONS = ['Не оплатил', 'Передал ключ', 'Слишком много трафика', 'Другое']
const TERMS: { label: string; hours: number | null }[] = [
  { label: '1 день', hours: 24 }, { label: 'Неделя', hours: 24 * 7 }, { label: 'Месяц', hours: 24 * 30 }, { label: 'Навсегда', hours: null },
]

function Pill({ selected, children, onClick }: { selected: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <ButtonBase onClick={onClick} aria-pressed={selected} sx={{
      borderRadius: 2.5, px: 1.25, py: 1, minHeight: 40, fontSize: '0.8rem', fontWeight: 600,
      border: `1px solid ${selected ? '#185FA5' : '#B5D4F4'}`, background: selected ? '#185FA5' : '#fff',
      color: selected ? '#fff' : '#185FA5',
    }}>{children}</ButtonBase>
  )
}

export default function BlockDialog({ open, userId, email, onClose, onDone }: {
  open: boolean; userId: string; email: string; onClose: () => void; onDone: () => void
}) {
  const [reasonIdx, setReasonIdx] = useState(1)
  const [reason, setReason] = useState(REASONS[1])
  const [term, setTerm] = useState(1)
  const [notify, setNotify] = useState(true)
  const [reset, setReset] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setReasonIdx(1); setReason(REASONS[1]); setTerm(1); setNotify(true); setReset(true); setError('')
    notifyApi.settings().then(({ data }) => setNotify(data.block_emails)).catch(() => {})
  }, [open])

  const hours = TERMS[term].hours
  const until = hours ? new Date(Date.now() + hours * 3600_000).toISOString() : null

  const submit = async () => {
    setSaving(true); setError('')
    try {
      await blocksApi.block(userId, { reason: reason.trim() || undefined, until, notify, reset_on_unblock: reset })
      onDone()
    } catch (e) {
      setError(apiError(e, 'Не удалось заблокировать'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} fullWidth>
      <DialogTitle sx={{ pb: 0.5 }}>
        Заблокировать VPN
        <Typography variant="body2" color="text.secondary" noWrap>{email}</Typography>
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        <Typography variant="caption" color="#1E5A9A">
          Аккаунт на сайте останется. Ключи перестанут работать примерно через минуту, текущие соединения оборвутся.
        </Typography>
        {error && <Alert severity="error">{error}</Alert>}

        <Box>
          <Typography variant="body2" fontWeight={600} mb={0.75}>Причина</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
            {REASONS.map((r, i) => (
              <Pill key={r} selected={reasonIdx === i} onClick={() => { setReasonIdx(i); setReason(i === REASONS.length - 1 ? '' : r) }}>{r}</Pill>
            ))}
          </Box>
          <TextField fullWidth multiline minRows={2} value={reason} onChange={(e) => setReason(e.target.value)}
            placeholder="Что увидит друг" inputProps={{ maxLength: 500 }} />
        </Box>

        <Box>
          <Typography variant="body2" fontWeight={600} mb={0.75}>Срок</Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 0.75 }}>
            {TERMS.map((t, i) => <Pill key={t.label} selected={term === i} onClick={() => setTerm(i)}>{t.label}</Pill>)}
          </Box>
          <Typography variant="caption" color="text.secondary" display="block" mt={0.75}>
            {until ? `Доступ вернётся сам: ${blockUntilText(until).replace('до ', '')}` : 'Вернуть можно только вручную'}
          </Typography>
        </Box>

        <FormControlLabel sx={{ m: 0, background: '#F0F4FF', borderRadius: 2, p: 1, justifyContent: 'space-between' }}
          labelPlacement="start" control={<Switch checked={notify} onChange={(e) => setNotify(e.target.checked)} />}
          label={<Box><Typography variant="body2" fontWeight={600}>Написать другу на почту</Typography>
            <Typography variant="caption" color="#1E5A9A">с причиной и сроком</Typography></Box>} />
        <FormControlLabel sx={{ m: 0, background: '#F0F4FF', borderRadius: 2, p: 1, justifyContent: 'space-between' }}
          labelPlacement="start" control={<Switch checked={reset} onChange={(e) => setReset(e.target.checked)} />}
          label={<Box><Typography variant="body2" fontWeight={600}>Сбросить ключи при разблокировке</Typography>
            <Typography variant="caption" color="#1E5A9A">если ключ утёк: старые ссылки не оживут</Typography></Box>} />
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" sx={{ flex: 1 }} disabled={saving}>Отмена</Button>
        <Button onClick={submit} variant="contained" disabled={saving}
          sx={{ flex: 1, background: '#B3261E', '&:hover': { background: '#8E1E17' } }}>
          {saving ? <CircularProgress size={18} color="inherit" /> : 'Заблокировать'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
