import React, { useEffect, useState, useRef, useCallback } from 'react'
import {
  Box, Typography, Card, CardContent, IconButton, Chip,
  CircularProgress, Alert, Skeleton, Tooltip, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button,
} from '@mui/material'
import {
  ContentCopy, Check, Wifi, SignalCellularAlt, Lock,
  NetworkCheck,
} from '@mui/icons-material'
import { subscribesApi, usersApi, type Subscribe } from '../../api'
import { useAuthStore } from '../../store/auth'
import { API_BASE_URL } from '../../api'

const WS_BASE = API_BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://')

interface PingResult {
  uri: string
  status: 'ok' | 'timeout' | 'error'
  min_ms: number | null
  avg_ms: number | null
  max_ms: number | null
  loss: number
  total: number
  error?: string
  done?: boolean
}

function getLatencyColor(ms: number | null): string {
  if (ms === null) return '#C0392B'
  if (ms < 100) return '#1B7F4A'
  if (ms < 250) return '#C07A00'
  return '#C0392B'
}

function getStatusStyle(result: PingResult) {
  if (result.status !== 'ok') return { bg: '#FFEBEE', border: '#F09595', color: '#C0392B' }
  const c = getLatencyColor(result.avg_ms)
  const bg = result.avg_ms !== null && result.avg_ms < 100 ? '#E8F5E9'
    : result.avg_ms !== null && result.avg_ms < 250 ? '#FFF8E1' : '#FFEBEE'
  const border = result.avg_ms !== null && result.avg_ms < 100 ? '#A5D6A7'
    : result.avg_ms !== null && result.avg_ms < 250 ? '#FCD34D' : '#F09595'
  return { bg, border, color: c }
}

function PingResultBlock({ result, loading }: { result: PingResult | null; loading: boolean }) {
  if (loading) {
    return (
      <Box sx={{ mt: 1.5, p: 1.25, borderRadius: 2, background: '#F0F4FF', border: '1px solid #E6F1FB', display: 'flex', alignItems: 'center', gap: 1 }}>
        <CircularProgress size={12} sx={{ color: '#185FA5' }} />
        <Typography variant="caption" color="text.secondary">Измеряем задержку...</Typography>
      </Box>
    )
  }
  if (!result) return null

  const { bg, border, color } = getStatusStyle(result)
  const isOk = result.status === 'ok'

  return (
    <Box sx={{ mt: 1.5, p: 1.25, borderRadius: 2, background: bg, border: `1px solid ${border}` }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: isOk ? 0.75 : 0 }}>
        <Box sx={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: color }} />
        <Typography variant="caption" fontWeight={600} color={color} sx={{ flex: 1 }}>
          {isOk ? 'Подключение активно' : result.status === 'timeout' ? 'Таймаут' : 'Ошибка'}
        </Typography>
        {isOk && result.avg_ms !== null && (
          <Typography sx={{ fontFamily: 'monospace', fontSize: '0.78rem', fontWeight: 700, color }}>
            {result.avg_ms} ms
          </Typography>
        )}
      </Box>
      {isOk && (
        <Box sx={{ display: 'flex', gap: 2 }}>
          {[
            { label: 'min', value: result.min_ms != null ? `${result.min_ms} ms` : '—' },
            { label: 'avg', value: result.avg_ms != null ? `${result.avg_ms} ms` : '—' },
            { label: 'max', value: result.max_ms != null ? `${result.max_ms} ms` : '—' },
            { label: 'потери', value: `${result.loss}/${result.total}` },
          ].map(({ label, value }) => (
            <Box key={label}>
              <Typography variant="caption" color="#B5D4F4" display="block" fontSize="0.6rem">{label}</Typography>
              <Typography sx={{ fontFamily: 'monospace', fontSize: '0.7rem', fontWeight: 600, color: '#185FA5' }}>
                {value}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  )
}

function ConnectionCard({
  sub, pingResult, pinging, onPing,
}: {
  sub: Subscribe
  pingResult: PingResult | null
  pinging: boolean
  onPing: () => void
}) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try { await navigator.clipboard.writeText(sub.payload) }
    catch {
      const el = document.createElement('textarea')
      el.value = sub.payload
      document.body.appendChild(el); el.select()
      document.execCommand('copy'); document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const name = sub.payload.split('#').pop() || 'Подключение'
  const pingColor = !pingResult ? '#185FA5'
    : pingResult.status === 'ok' ? '#1B7F4A' : '#C0392B'
  const pingBg = !pingResult ? '#E6F1FB'
    : pingResult.status === 'ok' ? '#E8F5E9' : '#FFEBEE'
  const pingBorder = !pingResult ? '#B5D4F4'
    : pingResult.status === 'ok' ? '#A5D6A7' : '#F09595'

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
              sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3 }}>
              {decodeURIComponent(name)}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.75, mt: 0.75, flexWrap: 'wrap' }}>
              <Chip icon={<Wifi sx={{ fontSize: '13px !important' }} />}
                label={sub.ip} size="small"
                sx={{ fontSize: '0.68rem', fontFamily: 'monospace', background: '#E6F1FB', border: '1px solid #B5D4F4', color: '#185FA5', height: 24 }}
              />
              <Chip icon={<SignalCellularAlt sx={{ fontSize: '13px !important' }} />}
                label={`:${sub.port}`} size="small"
                sx={{ fontSize: '0.68rem', fontFamily: 'monospace', background: '#E6F1FB', border: '1px solid #B5D4F4', color: '#185FA5', height: 24 }}
              />
            </Box>
          </Box>

          <Tooltip title={copied ? 'Скопировано!' : 'Скопировать'} placement="top">
            <IconButton onClick={handleCopy} sx={{
              width: 36, height: 36,
              background: copied ? '#E8F5E9' : '#E6F1FB',
              border: `1px solid ${copied ? '#A5D6A7' : '#B5D4F4'}`,
              borderRadius: 2, flexShrink: 0, transition: 'all 0.2s',
              '&:hover': { background: copied ? '#C8E6C9' : '#B5D4F4' },
            }}>
              {copied ? <Check sx={{ color: '#1B7F4A', fontSize: 16 }} /> : <ContentCopy sx={{ color: '#185FA5', fontSize: 16 }} />}
            </IconButton>
          </Tooltip>

          <Tooltip title="Пинговать" placement="top">
            <IconButton onClick={onPing} disabled={pinging} sx={{
              width: 36, height: 36,
              background: pingBg, border: `1px solid ${pingBorder}`,
              borderRadius: 2, flexShrink: 0, transition: 'all 0.2s',
              '&:hover': { background: '#B5D4F4', borderColor: '#185FA5' },
              '&:disabled': { opacity: 0.7 },
            }}>
              {pinging
                ? <CircularProgress size={14} sx={{ color: '#185FA5' }} />
                : <NetworkCheck sx={{ fontSize: 16, color: pingColor }} />
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

        <PingResultBlock result={pingResult} loading={pinging} />
      </CardContent>
    </Card>
  )
}

function ChangePasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [oldPass, setOldPass] = useState('')
  const [newPass, setNewPass] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setLoading(true)
    try {
      await usersApi.changeMyPassword(oldPass, newPass)
      setSuccess(true)
      setTimeout(() => { onClose(); setSuccess(false); setOldPass(''); setNewPass('') }, 1500)
    } catch (err: any) {
      const msg = err?.response?.data?.result?.error || err?.response?.data?.detail || 'Ошибка'
      setError(typeof msg === 'string' ? msg : 'Неверный текущий пароль')
    } finally { setLoading(false) }
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
            onChange={(e) => setNewPass(e.target.value)} required fullWidth helperText="Минимум 8 символов" />
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

export default function ClientPage() {
  const [subs, setSubs] = useState<Subscribe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [passDialogOpen, setPassDialogOpen] = useState(false)
  const [pingResults, setPingResults] = useState<Record<string, PingResult>>({})
  const [pingingKeys, setPingingKeys] = useState<Record<string, boolean>>({})
  const [pingAllLoading, setPingAllLoading] = useState(false)
  const wsAllRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    subscribesApi.getMySubscribes()
      .then(({ data }) => setSubs(data.subscribes))
      .catch(() => setError('Не удалось загрузить подключения'))
      .finally(() => setLoading(false))
  }, [])

  const handlePingAll = useCallback(() => {
    if (pingAllLoading) {
      wsAllRef.current?.close()
      setPingAllLoading(false)
      return
    }
    setPingResults({})
    setPingAllLoading(true)
    const token = localStorage.getItem('access_token') || ''
    const ws = new WebSocket(`${WS_BASE}/api/v1/ping/ws`)
    wsAllRef.current = ws
    ws.onopen = () => ws.send(JSON.stringify({ token }))
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.done || data.error) { setPingAllLoading(false); return }
        if (data.uri) setPingResults((prev) => ({ ...prev, [data.uri]: data }))
      } catch { /* ignore */ }
    }
    ws.onerror = () => setPingAllLoading(false)
    ws.onclose = () => setPingAllLoading(false)
  }, [pingAllLoading])

  const handlePingSingle = useCallback((sub: Subscribe) => {
    const key = sub.id
    if (pingingKeys[key]) return
    setPingingKeys((prev) => ({ ...prev, [key]: true }))
    const token = localStorage.getItem('access_token') || ''
    const ws = new WebSocket(`${WS_BASE}/api/v1/ping/ws`)
    ws.onopen = () => ws.send(JSON.stringify({ token, single_id: sub.id }))
    ws.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data)
        if (data.done || data.error) { setPingingKeys((prev) => ({ ...prev, [key]: false })); ws.close(); return }
        if (data.uri) {
          setPingResults((prev) => ({ ...prev, [data.uri]: data }))
          setPingingKeys((prev) => ({ ...prev, [key]: false }))
          ws.close()
        }
      } catch { /* ignore */ }
    }
    ws.onerror = () => setPingingKeys((prev) => ({ ...prev, [key]: false }))
    ws.onclose = () => setPingingKeys((prev) => ({ ...prev, [key]: false }))
  }, [pingingKeys])

  return (
    <Box sx={{ pb: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5 }}>
        <Box>
          <Typography variant="h5">Мои подключения</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.3}>
            {subs.length > 0 ? `${subs.length} конфигурации` : 'Подключений пока нет'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 0.5 }}>
          {subs.length > 0 && (
            <Button
              variant={pingAllLoading ? 'outlined' : 'contained'}
              size="small"
              startIcon={pingAllLoading
                ? <CircularProgress size={14} color="inherit" />
                : <NetworkCheck sx={{ fontSize: '16px !important' }} />
              }
              onClick={handlePingAll}
              sx={{ borderRadius: 2.5, fontSize: '0.78rem', px: 1.5, whiteSpace: 'nowrap' }}
            >
              {pingAllLoading ? 'Остановить' : 'Пинговать все'}
            </Button>
          )}
          <Tooltip title="Сменить пароль">
            <IconButton onClick={() => setPassDialogOpen(true)}
              sx={{ border: '1px solid #B5D4F4', borderRadius: 2, background: '#fff' }}>
              <Lock sx={{ fontSize: 18, color: '#185FA5' }} />
            </IconButton>
          </Tooltip>
        </Box>
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
            <Typography variant="subtitle1" color="#185FA5" fontWeight={500}>Нет активных подключений</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>Обратитесь к администратору</Typography>
          </CardContent>
        </Card>
      )}

      {subs.map((sub) => (
        <ConnectionCard
          key={sub.id}
          sub={sub}
          pingResult={pingResults[sub.payload] ?? null}
          pinging={pingingKeys[sub.id] ?? false}
          onPing={() => handlePingSingle(sub)}
        />
      ))}

      <ChangePasswordDialog open={passDialogOpen} onClose={() => setPassDialogOpen(false)} />
    </Box>
  )
}
