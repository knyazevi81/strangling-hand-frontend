import { useEffect, useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Alert,
  ToggleButtonGroup, ToggleButton, CircularProgress, Typography, Box, Collapse,
  FormControlLabel, Switch,
} from '@mui/material'
import { ExpandMore, ExpandLess, Login, Public } from '@mui/icons-material'
import {
  nodesApi, apiError, type NodeKeyResponse, type NodeRole, type NodeSettings, type VpnNode,
} from '../../../api'

// Значения по умолчанию, как в бэкенде (app/application/service/xray_config.py)
const DEFAULTS: Record<NodeRole, Record<string, string>> = {
  entry: {
    reality_target: 'max.ru:443', reality_server_names: 'max.ru, www.max.ru',
    reality_port: '443', xhttp_port: '8443', hy2_port: '443', hy2_hop_ports: '20000-20050',
    brutal_mbps: '200',
  },
  exit: {
    reality_target: 'www.microsoft.com:443', reality_server_names: 'www.microsoft.com',
    xhttp_port: '443', hy2_port: '443',
  },
}

type Field = { key: keyof NodeSettings; label: string; help?: string; numeric?: boolean; roles: NodeRole[] }

const FIELDS: Field[] = [
  { key: 'reality_target', label: 'Сайт для маскировки REALITY', help: 'хост:порт, должен открываться с этого сервера', roles: ['entry', 'exit'] },
  { key: 'reality_server_names', label: 'SNI', help: 'через запятую', roles: ['entry', 'exit'] },
  { key: 'reality_port', label: 'Порт REALITY (TCP)', numeric: true, roles: ['entry'] },
  { key: 'xhttp_port', label: 'Порт XHTTP (TCP)', numeric: true, roles: ['entry', 'exit'] },
  { key: 'hy2_port', label: 'Порт Hysteria2 (UDP)', numeric: true, roles: ['entry', 'exit'] },
  { key: 'hy2_hop_ports', label: 'Смена портов Hysteria2', help: 'диапазон UDP, «-» чтобы отключить', roles: ['entry'] },
  { key: 'brutal_mbps', label: 'Brutal, Мбит/с', help: 'скорость, которую Hysteria2 держит при потерях', numeric: true, roles: ['entry'] },
]

function toForm(s: NodeSettings | undefined): Record<string, string> {
  const out: Record<string, string> = {}
  if (!s) return out
  for (const f of FIELDS) {
    const v = s[f.key]
    if (v === undefined || v === null) continue
    if (f.key === 'hy2_hop_ports' && v === '') out[f.key] = '-'
    else out[f.key] = Array.isArray(v) ? v.join(', ') : String(v)
  }
  return out
}

/** Пустое поле = значение по умолчанию (null), «-» в смене портов = выключить (''). */
function toSettings(form: Record<string, string>, role: NodeRole, directProfile: boolean | null): NodeSettings {
  const s: Record<string, unknown> = {}
  for (const f of FIELDS) {
    if (!f.roles.includes(role)) continue
    const raw = (form[f.key] ?? '').trim()
    if (!raw) { s[f.key] = null; continue }
    if (f.key === 'hy2_hop_ports') s[f.key] = raw === '-' ? '' : raw
    else if (f.key === 'reality_server_names') s[f.key] = raw.split(',').map((x) => x.trim()).filter(Boolean)
    else if (f.numeric) s[f.key] = Number(raw)
    else s[f.key] = raw
  }
  if (role === 'exit') s.direct_profile = directProfile
  return s as NodeSettings
}

export default function NodeFormDialog({
  open, node, onClose, onSaved, onCreated,
}: {
  open: boolean
  node: VpnNode | null              // null = новый узел
  onClose: () => void
  onSaved: (node: VpnNode) => void
  onCreated: (res: NodeKeyResponse) => void
}) {
  const [role, setRole] = useState<NodeRole>('entry')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [country, setCountry] = useState('')
  const [form, setForm] = useState<Record<string, string>>({})
  const [directProfile, setDirectProfile] = useState<boolean>(true)
  const [advanced, setAdvanced] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setError('')
    setRole(node?.role ?? 'entry')
    setName(node?.name ?? '')
    setAddress(node?.address ?? '')
    setCountry(node?.country ?? '')
    setForm(toForm(node?.settings))
    setDirectProfile(node?.settings?.direct_profile ?? true)
    setAdvanced(false)
  }, [open, node])

  const submit = async () => {
    setSaving(true)
    setError('')
    try {
      const settings = toSettings(form, role, role === 'exit' ? directProfile : null)
      if (node) {
        const { data } = await nodesApi.update(node.id, {
          name: name.trim(), address: address.trim(), country: country.trim() || undefined, settings,
        })
        onSaved(data)
      } else {
        // для нового узла не шлём пустые значения: там и так значения по умолчанию
        const clean = Object.fromEntries(Object.entries(settings).filter(([, v]) => v !== null)) as NodeSettings
        const { data } = await nodesApi.create({
          name: name.trim(), role, address: address.trim(), country: country.trim() || undefined, settings: clean,
        })
        onCreated(data)
      }
    } catch (e) {
      setError(apiError(e, 'Не удалось сохранить'))
    } finally {
      setSaving(false)
    }
  }

  const defaults = DEFAULTS[role]

  return (
    <Dialog open={open} onClose={() => !saving && onClose()} fullWidth>
      <DialogTitle sx={{ pb: 1 }}>{node ? `Узел ${node.name}` : 'Новый узел'}</DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        {error && <Alert severity="error">{error}</Alert>}

        {!node && (
          <ToggleButtonGroup exclusive fullWidth size="small" value={role} onChange={(_, v) => v && setRole(v)}>
            <ToggleButton value="entry" sx={{ gap: 0.75, flexDirection: 'column', py: 1 }}>
              <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}><Login fontSize="small" />Вход</Box>
              <Typography variant="caption" sx={{ textTransform: 'none', opacity: 0.7 }}>сервер в России</Typography>
            </ToggleButton>
            <ToggleButton value="exit" sx={{ gap: 0.75, flexDirection: 'column', py: 1 }}>
              <Box sx={{ display: 'flex', gap: 0.75, alignItems: 'center' }}><Public fontSize="small" />Выход</Box>
              <Typography variant="caption" sx={{ textTransform: 'none', opacity: 0.7 }}>сервер за границей</Typography>
            </ToggleButton>
          </ToggleButtonGroup>
        )}

        <TextField label="Имя" value={name} onChange={(e) => setName(e.target.value)} required fullWidth
          placeholder={role === 'entry' ? 'in-msk-1' : 'out-de-1'}
          helperText="Латиница, цифры, точка, дефис. Видно друзьям в Happ" />
        <TextField label="Адрес" value={address} onChange={(e) => setAddress(e.target.value)} required fullWidth
          placeholder="146.185.211.176 или in1.savebit.ru"
          helperText={role === 'entry' ? 'К нему подключаются друзья' : 'К нему подключаются входы'} />
        <TextField label="Страна" value={country} onChange={(e) => setCountry(e.target.value)} fullWidth
          placeholder={role === 'entry' ? 'RU' : 'DE'} inputProps={{ maxLength: 64 }} />

        {role === 'exit' && (
          <FormControlLabel
            control={<Switch checked={directProfile} onChange={(e) => setDirectProfile(e.target.checked)} />}
            label={<Box>
              <Typography variant="body2">Прямой профиль в подписке</Typography>
              <Typography variant="caption" color="text.secondary">Запасной вариант без входа, для домашнего Wi-Fi</Typography>
            </Box>}
          />
        )}

        <Button onClick={() => setAdvanced((v) => !v)} endIcon={advanced ? <ExpandLess /> : <ExpandMore />}
          sx={{ alignSelf: 'flex-start', px: 0 }}>
          Порты и маскировка
        </Button>
        <Collapse in={advanced}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="caption" color="text.secondary">
              Пустое поле — значение по умолчанию (показано серым). Узел подхватит изменения за минуту.
            </Typography>
            {FIELDS.filter((f) => f.roles.includes(role)).map((f) => (
              <TextField key={f.key} label={f.label} size="small" fullWidth
                value={form[f.key] ?? ''} placeholder={defaults[f.key] ?? ''}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                helperText={f.help} InputLabelProps={{ shrink: true }}
                inputProps={f.numeric ? { inputMode: 'numeric' } : undefined} />
            ))}
          </Box>
        </Collapse>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" sx={{ flex: 1 }} disabled={saving}>Отмена</Button>
        <Button onClick={submit} variant="contained" sx={{ flex: 1 }}
          disabled={saving || name.trim().length < 2 || address.trim().length < 3}>
          {saving ? <CircularProgress size={18} color="inherit" /> : node ? 'Сохранить' : 'Создать'}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
