import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
  Box, Typography, Card, CardContent, IconButton,
  Alert, Skeleton, Tooltip, Chip, LinearProgress,
} from '@mui/material'
import {
  ContentCopy, Check, Refresh, InfoOutlined,
  SignalCellularAlt,
} from '@mui/icons-material'
import { freeVpnApi } from '../../api'

const REFRESH_INTERVAL = 10_000 // 10 секунд

function parseVless(url: string) {
  try {
    const withoutPrefix = url.replace('vless://', '')
    const atIdx = withoutPrefix.indexOf('@')
    const hostPart = withoutPrefix.slice(atIdx + 1)
    const [hostPort, rest] = hostPart.split('?')
    const [host, port] = hostPort.split(':')
    const params = new URLSearchParams(rest?.split('#')[0] || '')
    const hashPart = url.split('#')[1] || ''
    const name = decodeURIComponent(hashPart).replace(/[^\w\s\-_.@]/g, ' ').trim()
    const type = params.get('type') || 'tcp'
    const sni = params.get('sni') || ''
    return { host, port, type, sni, name: name || `${host}:${port}` }
  } catch {
    return { host: '—', port: '—', type: '—', sni: '—', name: url.slice(0, 40) }
  }
}

function ConfigCard({ item, index }: { item: { url: string }; index: number }) {
  const [copied, setCopied] = useState(false)
  const info = parseVless(item.url)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(item.url)
    } catch {
      const el = document.createElement('textarea')
      el.value = item.url
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <Card sx={{ mb: 1.5 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          {/* Number badge */}
          <Box sx={{
            width: 32, height: 32, borderRadius: 2,
            background: '#E6F1FB', border: '1px solid #B5D4F4',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, mt: 0.25,
          }}>
            <Typography sx={{ fontSize: '0.7rem', fontWeight: 700, color: '#185FA5' }}>
              {String(index + 1).padStart(2, '0')}
            </Typography>
          </Box>

          {/* Info */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} color="#042C53"
              sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', mb: 0.75 }}
            >
              {info.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap' }}>
              <Chip label={info.host} size="small" sx={{
                fontFamily: 'monospace', fontSize: '0.65rem',
                background: '#E6F1FB', color: '#185FA5',
                border: '1px solid #B5D4F4', height: 22,
              }} />
              <Chip label={`:${info.port}`} size="small" sx={{
                fontFamily: 'monospace', fontSize: '0.65rem',
                background: '#E6F1FB', color: '#185FA5',
                border: '1px solid #B5D4F4', height: 22,
              }} />
              <Chip
                icon={<SignalCellularAlt sx={{ fontSize: '11px !important' }} />}
                label={info.type.toUpperCase()}
                size="small"
                sx={{
                  fontSize: '0.62rem', height: 22,
                  background: info.type === 'grpc' ? '#EAF3DE' : '#E6F1FB',
                  color: info.type === 'grpc' ? '#3B6D11' : '#0C447C',
                  border: `1px solid ${info.type === 'grpc' ? '#C0DD97' : '#B5D4F4'}`,
                }}
              />
            </Box>
          </Box>

          {/* Copy button */}
          <Tooltip title={copied ? 'Скопировано!' : 'Копировать'} placement="left">
            <IconButton onClick={handleCopy} size="small" sx={{
              width: 36, height: 36, flexShrink: 0,
              background: copied ? '#E8F5E9' : '#E6F1FB',
              border: `1px solid ${copied ? '#A5D6A7' : '#B5D4F4'}`,
              borderRadius: 1.5, transition: 'all 0.2s',
              '&:hover': { background: copied ? '#C8E6C9' : '#B5D4F4' },
            }}>
              {copied
                ? <Check sx={{ fontSize: 16, color: '#1B7F4A' }} />
                : <ContentCopy sx={{ fontSize: 16, color: '#185FA5' }} />
              }
            </IconButton>
          </Tooltip>
        </Box>
      </CardContent>
    </Card>
  )
}

export default function FreeVpnPage() {
  const [configs, setConfigs] = useState<{ url: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchConfigs = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError('')
    try {
      const { data } = await freeVpnApi.getConfigs()
      setConfigs(data)
      setCountdown(REFRESH_INTERVAL / 1000)
    } catch {
      setError('Не удалось загрузить подключения. Попробуйте позже.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchConfigs()

    // Авто-обновление каждые 10 сек
    timerRef.current = setInterval(() => fetchConfigs(true), REFRESH_INTERVAL)

    // Обратный отсчёт
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? REFRESH_INTERVAL / 1000 : prev - 1))
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
      if (countdownRef.current) clearInterval(countdownRef.current)
    }
  }, [fetchConfigs])

  const handleManualRefresh = () => {
    if (timerRef.current) clearInterval(timerRef.current)
    if (countdownRef.current) clearInterval(countdownRef.current)
    fetchConfigs(true)
    timerRef.current = setInterval(() => fetchConfigs(true), REFRESH_INTERVAL)
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => (prev <= 1 ? REFRESH_INTERVAL / 1000 : prev - 1))
    }, 1000)
  }

  return (
    <Box sx={{ pb: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h5">Банк подключений</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.3}>
            {configs.length > 0 ? `${configs.length} конфигураций` : 'Загрузка...'}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
          <Typography variant="caption" color="text.secondary">
            {countdown}с
          </Typography>
          <Tooltip title="Обновить сейчас">
            <IconButton size="small" onClick={handleManualRefresh} disabled={refreshing}
              sx={{ border: '1px solid #B5D4F4', borderRadius: 2, background: '#fff' }}
            >
              <Refresh sx={{
                fontSize: 18, color: '#185FA5',
                animation: refreshing ? 'spin 0.8s linear infinite' : 'none',
                '@keyframes spin': { '0%': { transform: 'rotate(0deg)' }, '100%': { transform: 'rotate(360deg)' } },
              }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Progress bar — обратный отсчёт */}
      <LinearProgress
        variant="determinate"
        value={(countdown / (REFRESH_INTERVAL / 1000)) * 100}
        sx={{
          mb: 2, borderRadius: 1, height: 3,
          background: '#E6F1FB',
          '& .MuiLinearProgress-bar': { background: '#185FA5', borderRadius: 1 },
        }}
      />

      {/* Предупреждение */}
      <Alert
        severity="info"
        icon={<InfoOutlined fontSize="small" />}
        sx={{
          mb: 2, borderRadius: 2,
          background: '#E6F1FB',
          border: '1px solid #B5D4F4',
          color: '#042C53',
          '& .MuiAlert-icon': { color: '#185FA5' },
        }}
      >
        <Typography variant="body2" fontWeight={500} color="#042C53" gutterBottom>
          Резервные подключения
        </Typography>
        <Typography variant="caption" color="#378ADD" sx={{ lineHeight: 1.5 }}>
          Эти конфигурации предназначены для ситуаций, когда основной VPN заблокирован.
          Скорость и стабильность не гарантированы. Список обновляется автоматически каждые 10 секунд.
        </Typography>
      </Alert>

      {/* Skeletons */}
      {loading && Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} sx={{ mb: 1.5 }}>
          <CardContent sx={{ p: 2 }}>
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              <Skeleton variant="rounded" width={32} height={32} sx={{ borderRadius: 2, flexShrink: 0 }} />
              <Box sx={{ flex: 1 }}>
                <Skeleton width="55%" height={16} sx={{ mb: 0.75 }} />
                <Box sx={{ display: 'flex', gap: 0.75 }}>
                  <Skeleton width={90} height={22} sx={{ borderRadius: 2 }} />
                  <Skeleton width={50} height={22} sx={{ borderRadius: 2 }} />
                  <Skeleton width={50} height={22} sx={{ borderRadius: 2 }} />
                </Box>
              </Box>
              <Skeleton variant="rounded" width={36} height={36} sx={{ borderRadius: 1.5 }} />
            </Box>
          </CardContent>
        </Card>
      ))}

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {!loading && configs.length === 0 && !error && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 5 }}>
            <SignalCellularAlt sx={{ fontSize: 48, color: '#B5D4F4', mb: 1.5 }} />
            <Typography variant="subtitle1" color="#185FA5" fontWeight={500}>
              Нет доступных подключений
            </Typography>
          </CardContent>
        </Card>
      )}

      {configs.map((item, i) => (
        <ConfigCard key={`${item.url}-${i}`} item={item} index={i} />
      ))}
    </Box>
  )
}
