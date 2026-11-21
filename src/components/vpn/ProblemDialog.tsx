import { useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Alert,
  ToggleButtonGroup, ToggleButton, MenuItem, CircularProgress, Typography, Box,
} from '@mui/material'
import { Wifi, SignalCellularAlt, DevicesOther } from '@mui/icons-material'
import { vpnApi, apiError, type ProblemReport } from '../../api'
import { shortProfile } from './utils'

const TIPS = [
  'В Happ потяни список вниз, чтобы обновить подписку.',
  'Попробуй другой профиль: если на Wi-Fi не идёт Hysteria2, выбери REALITY или XHTTP, и наоборот.',
  'Переключись между Wi-Fi и мобильным интернетом: так понятно, в сети ли дело.',
]

export default function ProblemDialog({
  open, onClose, profileNames,
}: { open: boolean; onClose: () => void; profileNames: string[] }) {
  const [network, setNetwork] = useState<ProblemReport['network']>('wifi')
  const [provider, setProvider] = useState('')
  const [profile, setProfile] = useState('')
  const [comment, setComment] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  const close = () => {
    if (sending) return
    onClose()
    setTimeout(() => { setSent(false); setError('') }, 300)
  }

  const submit = async () => {
    setSending(true)
    setError('')
    try {
      await vpnApi.problem({
        network,
        provider: provider.trim() || undefined,
        profile: profile || undefined,
        comment: comment.trim() || undefined,
      })
      setSent(true)
      setComment('')
    } catch (e) {
      setError(apiError(e, 'Не удалось отправить'))
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onClose={close} fullWidth>
      <DialogTitle sx={{ pb: 1 }}>У меня не работает</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        {sent ? (
          <Alert severity="success">
            Отправили админу вместе со статусом серверов. Он посмотрит и напишет на почту.
          </Alert>
        ) : (
          <>
            <Box sx={{ background: '#F0F4FF', borderRadius: 2, p: 1.5 }}>
              <Typography variant="caption" fontWeight={600} color="#042C53" display="block" mb={0.5}>
                Сначала попробуй:
              </Typography>
              {TIPS.map((t) => (
                <Typography key={t} variant="caption" color="#185FA5" display="block">• {t}</Typography>
              ))}
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

            <Box>
              <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>
                Через какую сеть?
              </Typography>
              <ToggleButtonGroup exclusive fullWidth size="small" value={network}
                onChange={(_, v) => v && setNetwork(v)}>
                <ToggleButton value="wifi" sx={{ gap: 0.75 }}><Wifi fontSize="small" />Wi-Fi</ToggleButton>
                <ToggleButton value="mobile" sx={{ gap: 0.75 }}><SignalCellularAlt fontSize="small" />Мобильная</ToggleButton>
                <ToggleButton value="other" sx={{ gap: 0.75 }}><DevicesOther fontSize="small" />Другое</ToggleButton>
              </ToggleButtonGroup>
            </Box>

            <TextField label="Провайдер или оператор" placeholder="МТС, Ростелеком, Wi-Fi в кафе…"
              value={provider} onChange={(e) => setProvider(e.target.value)}
              inputProps={{ maxLength: 64 }} fullWidth />

            {profileNames.length > 0 && (
              <TextField select label="Какой профиль не работает" value={profile}
                onChange={(e) => setProfile(e.target.value)} fullWidth>
                <MenuItem value="">Никакой / не знаю</MenuItem>
                {profileNames.map((n) => <MenuItem key={n} value={n}>{shortProfile(n)}</MenuItem>)}
              </TextField>
            )}

            <TextField label="Что происходит" placeholder="Подключается, но сайты не открываются…"
              value={comment} onChange={(e) => setComment(e.target.value)}
              multiline minRows={2} inputProps={{ maxLength: 1000 }} fullWidth />
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        {sent ? (
          <Button onClick={close} variant="contained" fullWidth>Понятно</Button>
        ) : (
          <>
            <Button onClick={close} variant="outlined" sx={{ flex: 1 }} disabled={sending}>Отмена</Button>
            <Button onClick={submit} variant="contained" sx={{ flex: 1 }} disabled={sending}>
              {sending ? <CircularProgress size={18} color="inherit" /> : 'Отправить'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  )
}
