import { useCallback, useEffect, useState } from 'react'
import {
  Box, Typography, Card, CardContent, Skeleton, IconButton, Tooltip, Button, Chip,
} from '@mui/material'
import { Refresh, ReportProblem } from '@mui/icons-material'
import { vpnApi, type NodeStatus } from '../../api'
import { countryLabel, timeAgo } from './utils'
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

function NodeRow({ n }: { n: NodeStatus }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, py: 1 }}>
      <Dot ok={n.online} />
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Typography variant="body2" fontWeight={600} color="#042C53" noWrap>{n.name}</Typography>
          {n.active && (
            <Chip label="сейчас через него" size="small" sx={{
              height: 18, fontSize: '0.6rem', background: '#E8F5E9', color: '#1B7F4A', border: '1px solid #A5D6A7',
            }} />
          )}
        </Box>
        <Typography variant="caption" color="text.secondary">
          {countryLabel(n.country)}{n.country ? ' · ' : ''}
          {n.online ? 'работает' : `нет связи, последний раз ${timeAgo(n.last_seen_at)}`}
        </Typography>
      </Box>
      {n.role === 'exit' && n.online && (
        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.75rem', fontWeight: 700, color: latencyColor(n.latency_ms) }}>
          {n.latency_ms !== null ? `${n.latency_ms} ms` : '—'}
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
      setNodes(data.nodes)
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
          <Typography variant="subtitle1" fontWeight={700} color="#042C53">Серверы</Typography>
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

        {entries.length > 0 && (
          <>
            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
              Входы: к ним подключается Happ
            </Typography>
            {entries.map((n) => <NodeRow key={n.name} n={n} />)}
          </>
        )}
        {exits.length > 0 && (
          <>
            <Typography variant="caption" color="text.secondary" display="block" mt={1}>
              Выходы за границей: задержка от входа
            </Typography>
            {exits.map((n) => <NodeRow key={n.name} n={n} />)}
          </>
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
