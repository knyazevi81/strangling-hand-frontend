import { useCallback, useEffect, useState } from 'react'
import {
  Box, Typography, Button, Alert, Skeleton, Card, CardContent, Dialog, DialogTitle,
  DialogContent, DialogContentText, DialogActions, CircularProgress, IconButton, Tooltip,
} from '@mui/material'
import { Add, Dns, ContentCopy, Check } from '@mui/icons-material'
import { nodesApi, apiError, type NodeKeyResponse, type VpnNode } from '../../../api'
import { copyText } from '../../vpn/utils'
import NodeCard from './NodeCard'
import NodeFormDialog from './NodeFormDialog'
import NodeKeyDialog from './NodeKeyDialog'

const REFRESH_MS = 20_000

type Confirm = { kind: 'delete' | 'rotate'; node: VpnNode } | null

export default function NodesPage() {
  const [nodes, setNodes] = useState<VpnNode[] | null>(null)
  const [error, setError] = useState('')
  const [form, setForm] = useState<{ open: boolean; node: VpnNode | null }>({ open: false, node: null })
  const [keyData, setKeyData] = useState<{ data: NodeKeyResponse; rotated: boolean } | null>(null)
  const [confirm, setConfirm] = useState<Confirm>(null)
  const [busy, setBusy] = useState(false)
  const [config, setConfig] = useState<{ node: VpnNode; text: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    try {
      const { data } = await nodesApi.list()
      setNodes(Array.isArray(data?.nodes) ? data.nodes : [])
      setError('')
    } catch (e) {
      setError(apiError(e, 'Не удалось загрузить узлы'))
    }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, REFRESH_MS)
    return () => clearInterval(t)
  }, [load])

  const replace = (n: VpnNode) => setNodes((prev) => prev?.map((x) => (x.id === n.id ? n : x)) ?? [n])

  const toggle = async (n: VpnNode, enabled: boolean) => {
    replace({ ...n, enabled })
    try { replace((await nodesApi.update(n.id, { enabled })).data) }
    catch (e) { replace(n); setError(apiError(e, 'Не удалось изменить узел')) }
  }

  const runConfirm = async () => {
    if (!confirm) return
    setBusy(true)
    try {
      if (confirm.kind === 'delete') {
        await nodesApi.remove(confirm.node.id)
        setNodes((prev) => prev?.filter((x) => x.id !== confirm.node.id) ?? null)
      } else {
        const { data } = await nodesApi.rotateKey(confirm.node.id)
        replace(data.node)
        setKeyData({ data, rotated: true })
      }
      setConfirm(null)
    } catch (e) {
      setError(apiError(e, 'Не получилось'))
    } finally {
      setBusy(false)
    }
  }

  const showConfig = async (n: VpnNode) => {
    try {
      const { data } = await nodesApi.config(n.id)
      setConfig({ node: n, text: JSON.stringify(data, null, 2) })
    } catch (e) {
      setError(apiError(e, 'Не удалось получить конфиг'))
    }
  }

  const entries = nodes?.filter((n) => n.role === 'entry') ?? []
  const exits = nodes?.filter((n) => n.role === 'exit') ?? []
  const online = nodes?.filter((n) => n.enabled && n.online).length ?? 0
  const enabled = nodes?.filter((n) => n.enabled).length ?? 0

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2.5 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>Узлы</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {nodes ? `${online} из ${enabled} включённых онлайн` : 'Входы и выходы VPN'}
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<Add />} onClick={() => setForm({ open: true, node: null })}
          sx={{ borderRadius: 2.5, mt: 0.5 }}>
          Добавить
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}

      {nodes === null && !error && [1, 2].map((i) => (
        <Card key={i} sx={{ mb: 1.5 }}><CardContent><Skeleton width="50%" /><Skeleton width="80%" /></CardContent></Card>
      ))}

      {nodes !== null && nodes.length === 0 && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 5 }}>
            <Dns sx={{ fontSize: 48, color: '#B5D4F4', mb: 1.5 }} />
            <Typography variant="subtitle1" color="#185FA5" fontWeight={500}>Узлов пока нет</Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              Начни с выхода за границей, потом добавь вход в России
            </Typography>
          </CardContent>
        </Card>
      )}

      {[{ title: 'Входы', list: entries }, { title: 'Выходы', list: exits }].map(({ title, list }) =>
        list.length > 0 && (
          <Box key={title} sx={{ mb: 2 }}>
            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={1}>
              {title.toUpperCase()}
            </Typography>
            {list.map((n) => (
              <NodeCard key={n.id} node={n}
                onToggle={(v) => toggle(n, v)}
                onEdit={() => setForm({ open: true, node: n })}
                onRotate={() => setConfirm({ kind: 'rotate', node: n })}
                onConfig={() => showConfig(n)}
                onDelete={() => setConfirm({ kind: 'delete', node: n })}
              />
            ))}
          </Box>
        ))}

      <NodeFormDialog
        open={form.open} node={form.node}
        onClose={() => setForm({ open: false, node: null })}
        onSaved={(n) => { replace(n); setForm({ open: false, node: null }) }}
        onCreated={(res) => {
          setNodes((prev) => [...(prev ?? []), res.node])
          setForm({ open: false, node: null })
          setKeyData({ data: res, rotated: false })
        }}
      />

      <NodeKeyDialog data={keyData?.data ?? null} rotated={keyData?.rotated ?? false} onClose={() => setKeyData(null)} />

      <Dialog open={!!confirm} onClose={() => !busy && setConfirm(null)} fullWidth>
        <DialogTitle>
          {confirm?.kind === 'delete' ? `Удалить ${confirm.node.name}?` : `Новый ключ для ${confirm?.node.name}?`}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirm?.kind === 'delete'
              ? 'Узел пропадёт из подписок и конфигов других узлов. Xray на самом сервере продолжит работать со старым конфигом, пока его не удалить: sudo bash install.sh --uninstall.'
              : 'Старый ключ сразу перестанет работать. Узел не будет получать обновления, пока ты не заменишь ключ на сервере.'}
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setConfirm(null)} variant="outlined" sx={{ flex: 1 }} disabled={busy}>Отмена</Button>
          <Button onClick={runConfirm} variant="contained" color={confirm?.kind === 'delete' ? 'error' : 'warning'}
            sx={{ flex: 1 }} disabled={busy}>
            {busy ? <CircularProgress size={18} color="inherit" /> : confirm?.kind === 'delete' ? 'Удалить' : 'Выпустить'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!config} onClose={() => setConfig(null)} fullWidth maxWidth="md">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Конфиг {config?.node.name}
          <Tooltip title={copied ? 'Скопировано' : 'Скопировать'}>
            <IconButton size="small" onClick={async () => {
              if (!config) return
              await copyText(config.text); setCopied(true); setTimeout(() => setCopied(false), 2000)
            }}>
              {copied ? <Check fontSize="small" color="success" /> : <ContentCopy fontSize="small" />}
            </IconButton>
          </Tooltip>
        </DialogTitle>
        <DialogContent>
          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
            Это получит агент при следующей синхронизации. Здесь есть секреты, не пересылай.
          </Typography>
          <Box component="pre" sx={{
            m: 0, p: 1.5, borderRadius: 2, background: '#042C53', color: '#E6F1FB',
            fontSize: '0.68rem', overflow: 'auto', maxHeight: '60vh',
          }}>
            {config?.text}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfig(null)}>Закрыть</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
