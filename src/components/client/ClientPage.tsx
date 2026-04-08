import React, { useEffect, useState } from 'react'
import {
  Box, Typography, Card, CardContent, IconButton, Chip,
  CircularProgress, Alert, Snackbar, Skeleton, Tooltip,
  Divider,
} from '@mui/material'
import {
  ContentCopy, Check, VpnKey, Wifi, SignalCellularAlt,
  FiberManualRecord,
} from '@mui/icons-material'
import { subscribesApi, type Subscribe } from '../../api'

function ConnectionCard({ sub }: { sub: Subscribe }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sub.payload)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    } catch {
      // fallback for older mobile browsers
      const el = document.createElement('textarea')
      el.value = sub.payload
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  // Извлекаем имя подключения из payload (#name в конце)
  const name = sub.payload.split('#').pop() || `VPN ${sub.ip}`

  return (
    <Card
      sx={{
        mb: 2,
        position: 'relative',
        overflow: 'visible',
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:active': { transform: 'scale(0.98)' },
      }}
    >
      {/* Glow accent */}
      <Box
        sx={{
          position: 'absolute', top: -1, left: 24, right: 24, height: 2,
          background: 'linear-gradient(90deg, transparent, #00e5ff, transparent)',
          borderRadius: 1,
        }}
      />

      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
          {/* Icon */}
          <Box
            sx={{
              width: 48, height: 48, borderRadius: 3,
              background: 'linear-gradient(135deg, rgba(0,229,255,0.15), rgba(124,77,255,0.15))',
              border: '1px solid rgba(0,229,255,0.2)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <VpnKey sx={{ color: '#00e5ff', fontSize: 22 }} />
          </Box>

          {/* Info */}
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
              <FiberManualRecord sx={{ fontSize: 10, color: '#00e676' }} />
              <Typography variant="caption" color="success.main" fontWeight={600}>
                АКТИВНО
              </Typography>
            </Box>
            <Typography
              variant="subtitle1"
              fontWeight={600}
              sx={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                lineHeight: 1.3,
              }}
            >
              {decodeURIComponent(name)}
            </Typography>

            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
              <Chip
                icon={<Wifi sx={{ fontSize: '14px !important' }} />}
                label={sub.ip}
                size="small"
                sx={{
                  fontSize: '0.7rem',
                  fontFamily: '"JetBrains Mono", monospace',
                  background: 'rgba(0,229,255,0.08)',
                  border: '1px solid rgba(0,229,255,0.15)',
                  color: '#00e5ff',
                  height: 26,
                }}
              />
              <Chip
                icon={<SignalCellularAlt sx={{ fontSize: '14px !important' }} />}
                label={`:${sub.port}`}
                size="small"
                sx={{
                  fontSize: '0.7rem',
                  fontFamily: '"JetBrains Mono", monospace',
                  background: 'rgba(124,77,255,0.08)',
                  border: '1px solid rgba(124,77,255,0.15)',
                  color: '#b47cff',
                  height: 26,
                }}
              />
            </Box>
          </Box>

          {/* Copy button */}
          <Tooltip title={copied ? 'Скопировано!' : 'Скопировать ссылку'} placement="left">
            <IconButton
              onClick={handleCopy}
              sx={{
                width: 48, height: 48,
                background: copied
                  ? 'rgba(0,230,118,0.15)'
                  : 'rgba(0,229,255,0.1)',
                border: `1px solid ${copied ? 'rgba(0,230,118,0.3)' : 'rgba(0,229,255,0.2)'}`,
                borderRadius: 3,
                transition: 'all 0.3s',
                flexShrink: 0,
                '&:hover': {
                  background: copied
                    ? 'rgba(0,230,118,0.2)'
                    : 'rgba(0,229,255,0.2)',
                },
              }}
            >
              {copied
                ? <Check sx={{ color: '#00e676', fontSize: 20 }} />
                : <ContentCopy sx={{ color: '#00e5ff', fontSize: 20 }} />
              }
            </IconButton>
          </Tooltip>
        </Box>

        {/* Payload preview */}
        <Divider sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.06)' }} />
        <Typography
          variant="caption"
          sx={{
            fontFamily: '"JetBrains Mono", monospace',
            color: 'text.secondary',
            display: 'block',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: '0.65rem',
          }}
        >
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
  const [snack, setSnack] = useState('')

  useEffect(() => {
    subscribesApi.getMySubscribes()
      .then(({ data }) => setSubs(data.subscribes))
      .catch(() => setError('Не удалось загрузить подключения'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <Box sx={{ pb: 2 }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Мои подключения
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          {subs.length > 0
            ? `${subs.length} активных конфигурации`
            : 'Конфигурации ещё не выданы'}
        </Typography>
      </Box>

      {loading && (
        <>
          {[1, 2].map((i) => (
            <Card key={i} sx={{ mb: 2 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Skeleton variant="rounded" width={48} height={48} sx={{ borderRadius: 3 }} />
                  <Box sx={{ flex: 1 }}>
                    <Skeleton width="40%" height={14} sx={{ mb: 1 }} />
                    <Skeleton width="70%" height={20} sx={{ mb: 1 }} />
                    <Skeleton width="50%" height={26} sx={{ borderRadius: 2 }} />
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </>
      )}

      {error && <Alert severity="error" sx={{ borderRadius: 3, mb: 2 }}>{error}</Alert>}

      {!loading && subs.length === 0 && !error && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <VpnKey sx={{ fontSize: 56, color: 'text.secondary', mb: 2, opacity: 0.4 }} />
            <Typography variant="h6" color="text.secondary" fontWeight={500}>
              Нет активных подключений
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Обратитесь к администратору для получения доступа
            </Typography>
          </CardContent>
        </Card>
      )}

      {subs.map((sub) => (
        <ConnectionCard key={sub.id} sub={sub} />
      ))}

      <Snackbar
        open={!!snack}
        autoHideDuration={2000}
        onClose={() => setSnack('')}
        message={snack}
      />
    </Box>
  )
}
