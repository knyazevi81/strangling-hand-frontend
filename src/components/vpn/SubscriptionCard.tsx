import { useState } from 'react'
import {
  Box, Typography, Card, CardContent, Button, IconButton, Tooltip, Chip,
  Collapse, Alert, Dialog, DialogTitle, DialogContent, DialogContentText,
  DialogActions, CircularProgress,
} from '@mui/material'
import { ContentCopy, Check, QrCode2, OpenInNew, Autorenew, Shield } from '@mui/icons-material'
import { QRCodeSVG } from 'qrcode.react'
import { vpnApi, apiError, type VpnMe } from '../../api'
import { copyText, happLink, shortProfile } from './utils'

export default function SubscriptionCard({ me, onChange }: { me: VpnMe; onChange: (me: VpnMe) => void }) {
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [resetting, setResetting] = useState(false)

  const handleCopy = async () => {
    await copyText(me.subscription_url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const handleReset = async () => {
    setResetting(true)
    try {
      const { data } = await vpnApi.reset()
      onChange(data)
      setConfirmReset(false)
    } catch (e) {
      setError(apiError(e, 'Не удалось выпустить новую ссылку'))
    } finally {
      setResetting(false)
    }
  }

  return (
    <Card sx={{ mb: 2, borderColor: '#185FA5' }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: 2.5, background: '#185FA5', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Shield sx={{ color: '#fff', fontSize: 22 }} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={700} color="#042C53" lineHeight={1.3}>
              Подписка Savebit
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Одна ссылка, все серверы. Happ сам обновляет ключи.
            </Typography>
          </Box>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 1.5 }}>{error}</Alert>}

        <Button
          fullWidth variant="contained" size="large" startIcon={<OpenInNew />}
          href={happLink(me.subscription_url)}
          sx={{ borderRadius: 2.5, mb: 1 }}
        >
          Добавить в Happ
        </Button>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            fullWidth variant="outlined" onClick={handleCopy}
            startIcon={copied ? <Check /> : <ContentCopy />}
            color={copied ? 'success' : 'primary'}
            sx={{ borderRadius: 2.5 }}
          >
            {copied ? 'Скопировано' : 'Скопировать ссылку'}
          </Button>
          <Tooltip title="QR-код для другого телефона">
            <IconButton onClick={() => setShowQr((v) => !v)} sx={{
              border: '1px solid #B5D4F4', borderRadius: 2.5, width: 44,
              background: showQr ? '#E6F1FB' : '#fff',
            }}>
              <QrCode2 sx={{ color: '#185FA5' }} />
            </IconButton>
          </Tooltip>
        </Box>

        <Collapse in={showQr}>
          <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
            <Box sx={{ p: 1.5, background: '#fff', borderRadius: 3, border: '1px solid #E6F1FB' }}>
              <QRCodeSVG value={me.subscription_url} size={200} fgColor="#042C53" level="M" />
            </Box>
            <Typography variant="caption" color="text.secondary" textAlign="center">
              В Happ нажми «+» → «Сканировать QR-код»
            </Typography>
          </Box>
        </Collapse>

        {me.profile_names.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="text.secondary" display="block" mb={0.75}>
              В подписке {me.profiles} профил{me.profiles === 1 ? 'ь' : me.profiles < 5 ? 'я' : 'ей'}
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
              {me.profile_names.map((n) => (
                <Chip key={n} label={shortProfile(n)} size="small" sx={{
                  fontSize: '0.68rem', height: 24, background: '#E6F1FB',
                  border: '1px solid #B5D4F4', color: '#185FA5',
                }} />
              ))}
            </Box>
          </Box>
        )}
        {me.profiles === 0 && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Серверы ещё не подключены. Ссылку можно добавить уже сейчас, ключи появятся сами.
          </Alert>
        )}

        <Box sx={{
          mt: 2, pt: 1.5, borderTop: '1px solid #E6F1FB',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1,
        }}>
          <Typography variant="caption" color="text.secondary">
            Нет Happ? Найди «Happ» в App Store или Google Play
          </Typography>
          <Button size="small" startIcon={<Autorenew sx={{ fontSize: '16px !important' }} />}
            onClick={() => setConfirmReset(true)}
            sx={{ fontSize: '0.72rem', color: '#378ADD' }}>
            Новая ссылка
          </Button>
        </Box>
      </CardContent>

      <Dialog open={confirmReset} onClose={() => !resetting && setConfirmReset(false)} fullWidth>
        <DialogTitle>Выпустить новую ссылку?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Старая ссылка перестанет обновляться. Это нужно, если ты случайно ей с кем-то поделился.
            После этого добавь новую ссылку в Happ, а старую подписку удали.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setConfirmReset(false)} variant="outlined" sx={{ flex: 1 }} disabled={resetting}>
            Отмена
          </Button>
          <Button onClick={handleReset} variant="contained" color="warning" sx={{ flex: 1 }} disabled={resetting}>
            {resetting ? <CircularProgress size={18} color="inherit" /> : 'Выпустить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}
