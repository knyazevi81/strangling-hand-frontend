import { useState, type ReactNode } from 'react'
import {
  Box, Button, IconButton, Switch, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material'
import { Close, Lock } from '@mui/icons-material'
import type { RouteException } from '../../api'
import { normalizeSite, routeFor, siteLabel } from './utils'

export const card = { background: '#fff', border: '1px solid #B5D4F4', borderRadius: 4, p: 2, mb: 2 } as const

export function ActionChip({ action }: { action: 'direct' | 'proxy' }) {
  const direct = action === 'direct'
  return (
    <Box component="span" sx={{
      fontSize: 12, borderRadius: 1.5, px: 1, py: 0.25, whiteSpace: 'nowrap',
      background: direct ? '#E8F5E9' : '#E6F1FB', color: direct ? '#155D37' : '#185FA5',
    }}>{direct ? 'напрямую' : 'через VPN'}</Box>
  )
}

export function SwitchRow({ title, hint, checked, disabled, onChange }: {
  title: ReactNode; hint?: ReactNode; checked: boolean; disabled?: boolean; onChange: (v: boolean) => void
}) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} color="#042C53">{title}</Typography>
        {hint && <Typography variant="caption" color="text.secondary" display="block" sx={{ lineHeight: 1.45, mt: 0.25 }}>{hint}</Typography>}
      </Box>
      <Switch checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)}
        inputProps={{ 'aria-label': typeof title === 'string' ? title : 'переключатель' }} />
    </Box>
  )
}

/** Список исключений. removable(e) — можно ли убрать эту строку. */
export function ExceptionList({ items, removable, onRemove, whoLabel }: {
  items: RouteException[]; removable: (e: RouteException) => boolean; onRemove: (e: RouteException) => void
  whoLabel: (e: RouteException) => string
}) {
  if (!items.length) {
    return <Typography variant="caption" color="text.secondary" display="block" sx={{ py: 1 }}>Исключений пока нет</Typography>
  }
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
      {items.map((e) => {
        const can = removable(e)
        return (
          <Box key={e.value} sx={{
            display: 'flex', alignItems: 'center', gap: 1, borderRadius: 3, pl: 1.5, pr: can ? 0.5 : 1.5, py: can ? 0.25 : 1,
            border: can ? '1px solid #E6F1FB' : '1px dashed #B5D4F4', background: can ? '#fff' : '#F8FAFE',
          }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontFamily: 'monospace', fontSize: 14, color: '#042C53', wordBreak: 'break-all' }}>{siteLabel(e.value)}</Typography>
              <Typography variant="caption" color="#4A6A93" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                {!can && <Lock sx={{ fontSize: 11 }} />}{whoLabel(e)}
              </Typography>
            </Box>
            <ActionChip action={e.action} />
            {can && (
              <IconButton aria-label={`Убрать ${siteLabel(e.value)}`} onClick={() => onRemove(e)}>
                <Close sx={{ fontSize: 16, color: '#4A6A93' }} />
              </IconButton>
            )}
          </Box>
        )
      })}
    </Box>
  )
}

/** Поле «Добавить сайт»: адрес и куда его направить. */
export function AddSite({ onAdd, busy, admin }: { onAdd: (e: RouteException) => Promise<void> | void; busy?: boolean; admin?: boolean }) {
  const [value, setValue] = useState('')
  const [action, setAction] = useState<'direct' | 'proxy'>('direct')
  const [error, setError] = useState('')
  const submit = async () => {
    const raw = value.trim()
    const rule = admin && /^(domain|full|geosite):/.test(raw) ? raw.toLowerCase() : normalizeSite(raw)
    if (!rule) { setError('Не похоже на адрес сайта'); return }
    setError('')
    await onAdd({ value: rule, action })
    setValue('')
  }
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <TextField size="small" label="Сайт" placeholder={admin ? 'sber.ru или geosite:category-ru' : 'например, sber.ru'}
        value={value} onChange={(e) => setValue(e.target.value)} error={!!error} helperText={error || ' '}
        onKeyDown={(e) => { if (e.key === 'Enter') submit() }} />
      <ToggleButtonGroup exclusive fullWidth size="small" value={action} onChange={(_, v) => v && setAction(v)}
        aria-label="Куда направить сайт" sx={{ mt: -1.5 }}>
        <ToggleButton value="direct" sx={{ textTransform: 'none', fontWeight: 600 }}>Напрямую</ToggleButton>
        <ToggleButton value="proxy" sx={{ textTransform: 'none', fontWeight: 600 }}>Через VPN</ToggleButton>
      </ToggleButtonGroup>
      <Button variant="contained" onClick={submit} disabled={busy || !value.trim()} sx={{ borderRadius: 3, minHeight: 44 }}>
        Добавить
      </Button>
    </Box>
  )
}

/** «Куда пойдёт сайт?» — считается прямо в браузере по тем же правилам, что получит Happ. */
export function SiteCheck({ bypass, direct, proxy, exceptions }: {
  bypass: boolean; direct: string[]; proxy: string[]; exceptions: RouteException[]
}) {
  const [value, setValue] = useState('')
  const site = normalizeSite(value)
  const verdict = site ? routeFor(site, { bypass, direct, proxy, exceptions }) : null
  return (
    <Box sx={card}>
      <Typography variant="subtitle2" fontWeight={700} color="#042C53" mb={1}>Куда пойдёт сайт?</Typography>
      <TextField size="small" fullWidth placeholder="gosuslugi.ru" value={value} onChange={(e) => setValue(e.target.value)}
        inputProps={{ 'aria-label': 'Сайт для проверки' }} />
      {verdict && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', mt: 1 }}>
          <ActionChip action={verdict.via} />
          <Typography variant="caption" color="#1E5A9A">{verdict.why}</Typography>
        </Box>
      )}
    </Box>
  )
}

export function RefreshHint() {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, background: '#FFF4E5', border: '1px solid #F5C27A', borderRadius: 3.5, p: 1.5, mb: 2 }}>
      <Typography variant="body2" sx={{ color: '#6B3A00', lineHeight: 1.45 }}>
        Изменения заработают после обновления подписки: в Happ нажми ↻ у подписки Savebit.
      </Typography>
    </Box>
  )
}
