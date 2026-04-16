import React, { useState, useRef, useCallback } from 'react'
import {
  Box, Typography, Card, CardContent, IconButton, Chip,
  Button, CircularProgress, Tooltip, LinearProgress,
  Collapse, Alert,
} from '@mui/material'
import {
  NetworkCheck, ExpandMore, ExpandLess,
  SignalCellularAlt, WifiOff, Refresh,
} from '@mui/icons-material'
import { API_BASE_URL } from '../../api'
import { useAuthStore } from '../../store/auth'

// ws:// or wss:// depending on API URL
const WS_BASE = API_BASE_URL.replace('https://', 'wss://').replace('http://', 'ws://')

interface PingResult {
  uri: string
  name: string
  host: string
  port: number
  security: string
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
  if (ms === null) return '#B5D4F4'
  if (ms < 100) return '#1B7F4A'
  if (ms < 250) return '#C07A00'
  return '#C0392B'
}

function getLatencyBg(ms: number | null): string {
  if (ms === null) return '#E6F1FB'
  if (ms < 100) return '#E8F5E9'
  if (ms < 250) return '#FFF8E1'
  return '#FFEBEE'
}

function LatencyBadge({ ms }: { ms: number | null }) {
  return (
    <Box sx={{
      px: 1.25, py: 0.4,
      borderRadius: 2,
      background: getLatencyBg(ms),
      minWidth: 64,
      textAlign: 'center',
    }}>
      {ms === null ? (
        <Typography sx={{ fontSize: '0.72rem', color: '#C0392B', fontWeight: 600 }}>
          —
        </Typography>
      ) : (
        <Typography sx={{
          fontSize: '0.72rem',
          fontWeight: 700,
          fontFamily: 'monospace',
          color: getLatencyColor(ms),
        }}>
          {ms} ms
        </Typography>
      )}
    </Box>
  )
}

function PingResultRow({ result }: { result: PingResult }) {
  const [expanded, setExpanded] = useState(false)
  const name = decodeURIComponent(result.name).replace(/[^\w\s\-_.@]/g, ' ').trim()

  return (
    <Box sx={{
      border: '1px solid #E6F1FB',
      borderRadius: 2.5,
      mb: 1,
      overflow: 'hidden',
      background: '#fff',
    }}>
      {/* Main row */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1.5,
        px: 1.5, py: 1.25,
        cursor: result.status === 'ok' ? 'pointer' : 'default',
      }}
        onClick={() => result.status === 'ok' && setExpanded(!expanded)}
      >
        {/* Status dot */}
        <Box sx={{
          width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
          background: result.status === 'ok' ? '#1B7F4A'
            : result.status === 'timeout' ? '#C07A00' : '#C0392B',
          boxShadow: result.status === 'ok' ? '0 0 6px rgba(27,127,74,0.5)' : 'none',
        }} />

        {/* Name */}
        <Typography variant="body2" fontWeight={600} color="#042C53"
          sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.82rem' }}
        >
          {name}
        </Typography>

        {/* Latency badge */}
        <LatencyBadge ms={result.avg_ms} />

        {/* Expand arrow if ok */}
        {result.status === 'ok' && (
          <IconButton size="small" sx={{ p: 0.25, color: '#B5D4F4' }}>
            {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
          </IconButton>
        )}

        {/* Error / timeout label */}
        {result.status !== 'ok' && (
          <Typography variant="caption" color={result.status === 'timeout' ? '#C07A00' : '#C0392B'}
            sx={{ fontSize: '0.68rem', fontWeight: 500 }}>
            {result.status === 'timeout' ? 'таймаут' : 'ошибка'}
          </Typography>
        )}
      </Box>

      {/* Expanded details */}
      <Collapse in={expanded}>
        <Box sx={{
          px: 1.5, pb: 1.5, pt: 0.5,
          borderTop: '1px solid #F0F4FF',
          display: 'flex', gap: 1.5, flexWrap: 'wrap',
        }}>
          {[
            { label: 'min', value: result.min_ms != null ? `${result.min_ms} ms` : '—' },
            { label: 'avg', value: result.avg_ms != null ? `${result.avg_ms} ms` : '—' },
            { label: 'max', value: result.max_ms != null ? `${result.max_ms} ms` : '—' },
            { label: 'потери', value: `${result.loss}/${result.total}` },
            { label: 'host', value: `${result.host}:${result.port}` },
            { label: 'тип', value: result.security },
          ].map(({ label, value }) => (
            <Box key={label}>
              <Typography variant="caption" color="#B5D4F4" display="block" fontSize="0.62rem">
                {label}
              </Typography>
              <Typography variant="caption" fontWeight={600} color="#185FA5"
                sx={{ fontFamily: label === 'host' ? 'monospace' : 'inherit', fontSize: '0.72rem' }}>
                {value}
              </Typography>
            </Box>
          ))}
        </Box>
      </Collapse>
    </Box>
  )
}

interface Props {
  subscribes: { payload: string }[]
}

export default function PingPanel({ subscribes }: Props) {
  const [open, setOpen] = useState(false)
  const [results, setResults] = useState<PingResult[]>([])
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [progress, setProgress] = useState(0)
  const wsRef = useRef<WebSocket | null>(null)
  const user = useAuthStore((s) => s.user)

  const total = subscribes.length

  const startPing = useCallback(() => {
    if (running) return
    setResults([])
    setDone(false)
    setError('')
    setProgress(0)
    setRunning(true)

    const token = localStorage.getItem('access_token') || ''
    const ws = new WebSocket(`${WS_BASE}/api/v1/ping/ws`)
    wsRef.current = ws

    ws.onopen = () => {
      ws.send(JSON.stringify({ token }))
    }

    ws.onmessage = (e) => {
      try {
        const data: PingResult = JSON.parse(e.data)

        if (data.done) {
          setDone(true)
          setRunning(false)
          setProgress(100)
          return
        }

        if ((data as any).error && !(data as any).uri) {
          setError((data as any).error)
          setRunning(false)
          return
        }

        setResults((prev) => {
          const next = [...prev, data]
          setProgress(Math.round((next.length / total) * 100))
          return next
        })
      } catch {
        // ignore parse errors
      }
    }

    ws.onerror = () => {
      setError('Ошибка подключения к ping-service')
      setRunning(false)
    }

    ws.onclose = () => {
      setRunning(false)
    }
  }, [running, total])

  const stopPing = () => {
    wsRef.current?.close()
    setRunning(false)
  }

  const sortedResults = [...results].sort((a, b) => {
    if (a.status === 'ok' && b.status !== 'ok') return -1
    if (a.status !== 'ok' && b.status === 'ok') return 1
    return (a.avg_ms ?? 99999) - (b.avg_ms ?? 99999)
  })

  if (subscribes.length === 0) return null

  return (
    <Box sx={{ mb: 2 }}>
      {/* Header toggle */}
      <Card
        sx={{ cursor: 'pointer', transition: 'box-shadow 0.2s', '&:hover': { boxShadow: '0 2px 12px rgba(24,95,165,0.1)' } }}
        onClick={() => setOpen(!open)}
      >
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: 2,
              background: '#E6F1FB', border: '1px solid #B5D4F4',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <NetworkCheck sx={{ fontSize: 18, color: '#185FA5' }} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" fontWeight={600} color="#042C53">
                Проверить пинг
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Измерить задержку личных подключений
              </Typography>
            </Box>
            {open ? <ExpandLess sx={{ color: '#B5D4F4' }} /> : <ExpandMore sx={{ color: '#B5D4F4' }} />}
          </Box>
        </CardContent>
      </Card>

      {/* Panel */}
      <Collapse in={open}>
        <Card sx={{ mt: 1, border: '1px solid #B5D4F4' }}>
          <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
            {error && (
              <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>{error}</Alert>
            )}

            {/* Controls */}
            <Box sx={{ display: 'flex', gap: 1, mb: 1.5, alignItems: 'center' }}>
              <Button
                variant="contained" size="small"
                startIcon={running
                  ? <CircularProgress size={14} color="inherit" />
                  : <NetworkCheck fontSize="small" />
                }
                onClick={running ? stopPing : startPing}
                sx={{ borderRadius: 2.5, fontSize: '0.8rem' }}
              >
                {running ? 'Остановить' : done ? 'Повторить' : 'Запустить пинг'}
              </Button>

              {results.length > 0 && !running && (
                <Typography variant="caption" color="text.secondary">
                  {results.filter(r => r.status === 'ok').length} из {results.length} доступны
                </Typography>
              )}
            </Box>

            {/* Progress bar */}
            {(running || (done && results.length > 0)) && (
              <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                  mb: 1.5, borderRadius: 1, height: 3,
                  background: '#E6F1FB',
                  '& .MuiLinearProgress-bar': { background: '#185FA5', borderRadius: 1 },
                }}
              />
            )}

            {/* Results */}
            {sortedResults.map((r, i) => (
              <PingResultRow key={`${r.uri}-${i}`} result={r} />
            ))}

            {/* Skeleton while loading */}
            {running && results.length === 0 && (
              <Box sx={{ pt: 0.5 }}>
                {subscribes.map((_, i) => (
                  <Box key={i} sx={{
                    height: 44, border: '1px solid #E6F1FB',
                    borderRadius: 2.5, mb: 1, background: '#F8FAFF',
                    display: 'flex', alignItems: 'center', px: 1.5, gap: 1.5,
                  }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: '#B5D4F4' }} />
                    <Box sx={{ flex: 1, height: 10, background: '#E6F1FB', borderRadius: 1 }} />
                    <Box sx={{ width: 64, height: 24, background: '#E6F1FB', borderRadius: 2 }} />
                  </Box>
                ))}
              </Box>
            )}

            {done && results.length > 0 && (
              <Typography variant="caption" color="text.secondary" display="block" textAlign="center" mt={0.5}>
                Пинг завершён
              </Typography>
            )}
          </CardContent>
        </Card>
      </Collapse>
    </Box>
  )
}
