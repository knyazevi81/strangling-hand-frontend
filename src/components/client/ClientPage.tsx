import React, { useEffect, useState } from 'react'
import {
  Box, Typography, Card, CardContent, IconButton, Chip,
  CircularProgress, Alert, Skeleton, Tooltip, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button,
} from '@mui/material'
import { ContentCopy, Check, Wifi, SignalCellularAlt, Lock } from '@mui/icons-material'
import { subscribesApi, usersApi, type Subscribe } from '../../api'
import { useAuthStore } from '../../store/auth'
import PingPanel from './PingPanel'

function ChangePasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [oldPass, setOldPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await usersApi.changeMyPassword(oldPass, newPass)
      setSuccess(true)
      setTimeout(() => { onClose(); setSuccess(false); setOldPass(''); setNewPass('') }, 1500)
    } catch (err: any) {
      const msg = err?.response?.data?.result?.error || err?.response?.data?.detail || 'Ошибка'
      setError(typeof msg === 'string' ? msg : 'Неверный текущий пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle sx={{ pb: 1 }}>Сменить пароль</DialogTitle>
      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">Пароль успешно изменён</Alert>}
          <TextField label="Текущий пароль" type="password" value={oldPass}
            onChange={(e) => setOldPass(e.target.value)} required fullWidth />
          <TextField label="Новый пароль" type="password" value={newPass}
            onChange={(e) => setNewPass(e.target.value)} required fullWidth
            helperText="Минимум 8 символов" />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={onClose} variant="outlined" sx={{ flex: 1 }}>Отмена</Button>
          <Button type="submit" variant="contained" disabled={loading} sx={{ flex: 1 }}>
            {loading ? <CircularProgress size={18} color="inherit" /> : 'Сохранить'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}

function ConnectionCard({ sub }: { sub: Subscribe }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sub.payload)
    } catch {
      const el = document.createElement('textarea')
      el.value = sub.payload
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const name = sub.payload.split('#').pop() || `Подключение`

  return (
    <Card sx={{ mb: 1.5 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          <Box sx={{
            width: 44, height: 44, borderRadius: 2.5,
            background: '#E6F1FB', border: '1px solid #B5D4F4',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Wifi sx={{ color: '#185FA5', fontSize: 20 }} />
          </Box>

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="subtitle1" fontWeight={600} color="#042C53"
              sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}
            >
              {decodeURIComponent(name)}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.75, mt: 0.75, flexWrap: 'wrap' }}>
              <Chip icon={<Wifi sx={{ fontSize: '13px !important' }} />}
                label={sub.ip} size="small"
                sx={{ fontSize: '0.68rem', fontFamily: 'monospace', background: '#E6F1FB',
                  border: '1px solid #B5D4F4', color: '#185FA5', height: 24 }}
              />
              <Chip icon={<SignalCellularAlt sx={{ fontSize: '13px !important' }} />}
                label={`:${sub.port}`} size="small"
                sx={{ fontSize: '0.68rem', fontFamily: 'monospace', background: '#E6F1FB',
                  border: '1px solid #B5D4F4', color: '#185FA5', height: 24 }}
              />
            </Box>
          </Box>

          <Tooltip title={copied ? 'Скопировано!' : 'Скопировать'} placement="left">
            <IconButton onClick={handleCopy} sx={{
              width: 44, height: 44,
              background: copied ? '#E8F5E9' : '#E6F1FB',
              border: `1px solid ${copied ? '#A5D6A7' : '#B5D4F4'}`,
              borderRadius: 2, flexShrink: 0, transition: 'all 0.25s',
              '&:hover': { background: copied ? '#C8E6C9' : '#B5D4F4' },
            }}>
              {copied
                ? <Check sx={{ color: '#1B7F4A', fontSize: 18 }} />
                : <ContentCopy sx={{ color: '#185FA5', fontSize: 18 }} />
              }
            </IconButton>
          </Tooltip>
        </Box>

        <Divider sx={{ my: 1.5 }} />
        <Typography variant="caption" sx={{
          fontFamily: 'monospace', color: 'text.secondary', display: 'block',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.62rem',
        }}>
          {sub.payload}
        </Typography>
      </CardContent>
    </Card>
  )
}

export default function ClientPage() {
  const [subs, setSubs] = useState<Subscribe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [passDialogOpen, setPassDialogOpen] = useState(false)
  const user = useAuthStore((s) => s.user)

  useEffect(() => {
    subscribesApi.getMySubscribes()
      .then(({ data }) => setSubs(data.subscribes))
      .catch(() => setError('Не удалось загрузить подключения'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Box sx={{ pb: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5 }}>
        <Box>
          <Typography variant="h5">Мои подключения</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.3}>
            {subs.length > 0 ? `${subs.length} конфигурации` : 'Подключений пока нет'}
          </Typography>
        </Box>
        <Tooltip title="Сменить пароль">
          <IconButton onClick={() => setPassDialogOpen(true)}
            sx={{ border: '1px solid #B5D4F4', borderRadius: 2, background: '#fff', mt: 0.5 }}>
            <Lock sx={{ fontSize: 18, color: '#185FA5' }} />
          </IconButton>
        </Tooltip>
      </Box>

      {loading && [1, 2].map((i) => (
        <Card key={i} sx={{ mb: 1.5 }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <Skeleton variant="rounded" width={44} height={44} sx={{ borderRadius: 2.5 }} />
              <Box sx={{ flex: 1 }}>
                <Skeleton width="60%" height={18} sx={{ mb: 0.75 }} />
                <Skeleton width="40%" height={24} sx={{ borderRadius: 2 }} />
              </Box>
            </Box>
          </CardContent>
        </Card>
      ))}

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {!loading && subs.length === 0 && !error && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 5 }}>
            <Wifi sx={{ fontSize: 48, color: '#B5D4F4', mb: 1.5 }} />
            <Typography variant="subtitle1" color="#185FA5" fontWeight={500}>
              Нет активных подключений
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Обратитесь к администратору
            </Typography>
          </CardContent>
        </Card>
      )}

      {subs.map((sub) => <ConnectionCard key={sub.id} sub={sub} />)}

      {/* Ping panel — показываем только если есть подключения */}
      {!loading && subs.length > 0 && (
        <PingPanel subscribes={subs} />
      )}

      <ChangePasswordDialog open={passDialogOpen} onClose={() => setPassDialogOpen(false)} />
    </Box>
  )
}
