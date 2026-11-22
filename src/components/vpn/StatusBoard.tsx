import { useCallback, useEffect, useState } from 'react'
import {
  Box, Typography, Card, CardContent, Skeleton, IconButton, Tooltip, Button, Chip,
} from '@mui/material'
import { Refresh, ReportProblem, Bolt } from '@mui/icons-material'
import { vpnApi, type NodeStatus } from '../../api'
import { timeAgo } from './utils'
import ProblemDialog from './ProblemDialog'

const REFRESH_MS = 30_000

function Dot({ ok }: { ok: boolean }) {
  return (
    <Box sx={{
      width: 9, height: 9, borderRadius: '50%', flexShrink: 0,
      background: ok ? '#1B7F4A' : '#C0392B',
      boxShadow: ok ? '0 0 6px rgba(27,127,74,0.5)' : 'none',
    }} />
  )
}

function latencyColor(ms: number | null) {
  if (ms === null) return '#B5D4F4'
  if (ms < 80) return '#1B7F4A'
  if (ms < 200) return '#C07A00'
  return '#C0392B'
}

function Badge({ text, auto }: { text: string; auto?: boolean }) {
  return (
    <Box sx={{
      width: 36, height: 36, borderRadius: 2.5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: auto ? '#185FA5' : '#E6F1FB', border: auto ? 0 : '1px solid #B5D4F4',
      color: auto ? '#fff' : '#185FA5', fontWeight: 700, fontSize: 13,
    }}>{auto ? <Bolt sx={{ fontSize: 20 }} /> : text}</Box>
  )
}

function CountryRow({ n }: { n: NodeStatus }) {
  const title = n.label || n.name
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, border: '1px solid #E6F1FB', borderRadius: 3, px: 1.5, py: 1.25 }}>
      <Badge text={(n.country || title).slice(0, 2).toUpperCase()} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Typography variant="body2" fontWeight={600} color="#042C53" noWrap>{title}</Typography>
          {n.active && (
            <Chip label="сейчас в «Авто»" size="small" sx={{
              height: 18, fontSize: '0.6rem', background: '#E8F5E9', color: '#155D37', border: '1px solid #A5D6A7',
            }} />
          )}
        </Box>
        <Typography variant="caption" color={n.online ? 'text.secondary' : '#C0392B'}>
          {n.online ? (n.in_subscription === false ? 'работает · только в «Авто»' : 'работает')
            : `нет связи, последний раз ${timeAgo(n.last_seen_at)}`}
        </Typography>
      </Box>
      {n.online && (
        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.8rem', fontWeight: 700, color: latencyColor(n.latency_ms) }}>
          {n.latency_ms !== null ? `${n.latency_ms} мс` : '—'}
        </Typography>
      )}
    </Box>
  )
}

export default function StatusBoard({ profileNames }: { profileNames?: string[] }) {
  const [nodes, setNodes] = useState<NodeStatus[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [problemOpen, setProblemOpen] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await vpnApi.status()
      setNodes(Array.isArray(data?.nodes) ? data.nodes : [])
      setFailed(false)
    } catch {
      setFailed(true)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, REFRESH_MS)
    return () => clearInterval(t)
  }, [load])

  const entries = nodes?.filter((n) => n.role === 'entry') ?? []
  const exits = nodes?.filter((n) => n.role === 'exit') ?? []
  const allDown = nodes !== null && nodes.length > 0 && entries.every((n) => !n.online)

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} color="#042C53">Страны</Typography>
            <Typography variant="caption" color="text.secondary">Выбирается в Happ: профиль с названием страны</Typography>
          </Box>
          <Tooltip title="Обновить">
            <span>
              <IconButton size="small" onClick={load} disabled={loading}>
                <Refresh sx={{ fontSize: 18, color: '#378ADD' }} />
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {nodes === null && !failed && [1, 2].map((i) => <Skeleton key={i} height={40} />)}
        {failed && nodes === null && (
          <Typography variant="body2" color="error" py={1}>Не удалось узнать статус серверов</Typography>
        )}
        {nodes !== null && nodes.length === 0 && (
          <Typography variant="body2" color="text.secondary" py={1}>Серверы ещё не подключены</Typography>
        )}

        {exits.length > 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, border: '1px solid #185FA5', background: '#F5F9FF', borderRadius: 3, px: 1.5, py: 1.25 }}>
              <Badge text="" auto />
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography variant="body2" fontWeight={600} color="#042C53">Авто</Typography>
                <Typography variant="caption" color="text.secondary">самая быстрая страна, переключается сама</Typography>
              </Box>
              <Chip label="советуем" size="small" sx={{ height: 20, fontSize: '0.65rem', background: '#E8F5E9', color: '#155D37' }} />
            </Box>
            {exits.map((n) => <CountryRow key={n.name} n={n} />)}
          </Box>
        )}
        {entries.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mt: 1.25 }}>
            {entries.map((n) => (
              <Box key={n.name} sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                <Dot ok={n.online} />
                <Typography variant="caption" color="text.secondary">
                  Вход {n.name}: {n.online ? 'работает' : `нет связи ${timeAgo(n.last_seen_at)}`}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {allDown && (
          <Typography variant="caption" color="#C0392B" display="block" mt={1}>
            Все входы сейчас недоступны. Мы уже видим это и чиним.
          </Typography>
        )}

        <Button
          fullWidth variant="outlined" color="warning" startIcon={<ReportProblem />}
          onClick={() => setProblemOpen(true)} sx={{ mt: 1.5, borderRadius: 2.5 }}
        >
          У меня не работает
        </Button>
      </CardContent>

      <ProblemDialog open={problemOpen} onClose={() => setProblemOpen(false)} profileNames={profileNames ?? []} />
    </Card>
  )
}
