import { useEffect, useState } from 'react'
import {
  Alert, Box, Button, ButtonBase, CircularProgress, IconButton, MenuItem, Skeleton, Switch, TextField, Typography,
} from '@mui/material'
import { ArrowDownward, ArrowUpward, Bolt, ChevronRight, Close, Lock } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { routesApi, apiError, type CountryItem, type RoutingDefaults } from '../../api'
import { normalizeSite, siteLabel } from './utils'
import { SiteCheck, SwitchRow, card } from './RoutesParts'

type Draft = {
  bypass_ru: boolean; allow_self: boolean; direct_domains: string[]; proxy_domains: string[]
  auto_prefer: string | null; countries: CountryItem[]
}

const toDraft = (d: RoutingDefaults): Draft => ({
  bypass_ru: d.bypass_ru, allow_self: d.allow_self, direct_domains: d.direct_domains, proxy_domains: d.proxy_domains,
  auto_prefer: d.auto_prefer, countries: d.countries,
})

function DomainChips({ items, color, onChange }: { items: string[]; color: 'direct' | 'proxy'; onChange: (v: string[]) => void }) {
  const [value, setValue] = useState('')
  const [error, setError] = useState(false)
  const direct = color === 'direct'
  const add = () => {
    const raw = value.trim()
    const rule = /^(domain|full|geosite):/.test(raw) ? raw.toLowerCase() : normalizeSite(raw)
    if (!rule) { setError(true); return }
    setError(false)
    onChange([...items.filter((x) => x !== rule), rule])
    setValue('')
  }
  return (
    <Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 1 }}>
        {items.map((d) => (
          <Box key={d} sx={{
            display: 'flex', alignItems: 'center', gap: 0.25, pl: 1, borderRadius: 2, fontFamily: 'monospace', fontSize: 12,
            background: direct ? '#E8F5E9' : '#E6F1FB', color: direct ? '#155D37' : '#185FA5',
          }}>
            {siteLabel(d)}
            <IconButton size="small" aria-label={`Убрать ${d}`} onClick={() => onChange(items.filter((x) => x !== d))}>
              <Close sx={{ fontSize: 14 }} />
            </IconButton>
          </Box>
        ))}
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <TextField size="small" fullWidth placeholder="сайт или geosite:категория" value={value} error={error}
          onChange={(e) => setValue(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') add() }}
          inputProps={{ 'aria-label': direct ? 'Добавить сайт напрямую' : 'Добавить сайт через VPN' }} />
        <Button variant="outlined" onClick={add} disabled={!value.trim()} sx={{ borderRadius: 2.5, flexShrink: 0 }}>Добавить</Button>
      </Box>
    </Box>
  )
}

/** «Ещё → Маршруты по умолчанию»: правила для всех, кто «как у всех», и страны в подписке. */
export default function RoutingDefaultsPage() {
  const navigate = useNavigate()
  const [data, setData] = useState<RoutingDefaults | null>(null)
  const [draft, setDraft] = useState<Draft | null>(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    routesApi.defaults().then(({ data }) => { setData(data); setDraft(toDraft(data)) })
      .catch((e) => setError(apiError(e, 'Не удалось загрузить')))
  }, [])

  const set = (patch: Partial<Draft>) => { setSaved(false); setDraft((d) => (d ? { ...d, ...patch } : d)) }

  const move = (i: number, dir: -1 | 1) => {
    if (!draft) return
    const list = [...draft.countries]
    const j = i + dir
    if (j < 0 || j >= list.length) return
    ;[list[i], list[j]] = [list[j], list[i]]
    set({ countries: list })
  }

  const save = async () => {
    if (!draft) return
    setBusy(true)
    setError('')
    try {
      const { data } = await routesApi.saveDefaults({
        bypass_ru: draft.bypass_ru, allow_self: draft.allow_self, direct_domains: draft.direct_domains,
        proxy_domains: draft.proxy_domains, auto_prefer: draft.auto_prefer,
        countries: draft.countries.map((c, i) => ({ id: c.id, label: c.label, in_subscription: c.in_subscription, sort: (i + 1) * 10 })),
      })
      setData(data)
      setDraft(toDraft(data))
      setSaved(true)
    } catch (e) {
      setError(apiError(e, 'Не удалось сохранить'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <Box>
      <Box sx={{ mb: 2.5 }}>
        <Typography variant="h5" fontWeight={700}>Маршруты по умолчанию</Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>Для всех друзей, у кого «как у всех»</Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {!draft && !error && <Skeleton variant="rounded" height={260} sx={{ borderRadius: 4 }} />}

      {draft && data && (
        <>
          {data.custom_users > 0 && (
            <ButtonBase onClick={() => navigate('/admin?filter=custom')} sx={{
              width: '100%', justifyContent: 'flex-start', textAlign: 'left', gap: 1, mb: 2, p: 1.5, borderRadius: 3.5,
              background: '#FFF8E8', border: '1px solid #F5D9A6',
            }}>
              <Typography variant="body2" sx={{ flex: 1, color: '#6B3A00' }}>
                <b>У {data.custom_users} друзей свои настройки</b> · общие правила их не меняют
              </Typography>
              <Typography variant="body2" fontWeight={600} color="#8A4B00">Показать</Typography>
              <ChevronRight sx={{ color: '#8A4B00', fontSize: 18 }} />
            </ButtonBase>
          )}

          <Box sx={card}>
            <SwitchRow title="Российские сайты без VPN" checked={draft.bypass_ru} onChange={(v) => set({ bypass_ru: v })}
              hint={`По умолчанию для всех · сейчас включено у ${data.bypass_users} из ${data.total_users}`} />
            <Typography variant="caption" fontWeight={700} color="#4A6A93" display="block" sx={{ mt: 2, letterSpacing: '0.04em' }}>НАПРЯМУЮ</Typography>
            <Typography variant="body2" color="#042C53" sx={{ mt: 0.5, lineHeight: 1.6 }}>
              Сайты, которые работают только в России · домены .ru, .рф, .su · российские IP-адреса
            </Typography>
            <Box sx={{ mt: 1 }}>
              <DomainChips items={draft.direct_domains} color="direct" onChange={(v) => set({ direct_domains: v })} />
            </Box>
            <Typography variant="caption" fontWeight={700} color="#4A6A93" display="block" sx={{ mt: 2, letterSpacing: '0.04em' }}>ВСЕГДА ЧЕРЕЗ VPN</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <Lock sx={{ fontSize: 14, color: '#4A6A93' }} />
              <Typography variant="body2" color="#042C53">Заблокированные в России · важнее правил выше</Typography>
            </Box>
            <Box sx={{ mt: 1 }}>
              <DomainChips items={draft.proxy_domains} color="proxy" onChange={(v) => set({ proxy_domains: v })} />
            </Box>
            <Box sx={{ borderTop: '1px solid #E6F1FB', mt: 2, pt: 1.5 }}>
              <SwitchRow title="Друзья могут менять сами" checked={draft.allow_self} onChange={(v) => set({ allow_self: v })}
                hint="включать и выключать обход, добавлять свои сайты" />
            </Box>
          </Box>

          <Box sx={card}>
            <Typography variant="subtitle1" fontWeight={700} color="#042C53">Страны в подписке</Typography>
            <Typography variant="caption" color="text.secondary" display="block" mb={1.5}>
              Каждый выход виден друзьям отдельным профилем. Порядок как в Happ.
            </Typography>
            <Box sx={{ border: '1px solid #185FA5', background: '#F5F9FF', borderRadius: 3, p: 1.5, mb: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25, mb: 1.25 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: 2.5, background: '#185FA5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Bolt sx={{ color: '#fff', fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="body2" fontWeight={600} color="#042C53">Авто</Typography>
                  <Typography variant="caption" color="text.secondary">
                    сейчас: {data.countries.find((c) => c.active)?.label ?? '—'}
                  </Typography>
                </Box>
              </Box>
              <TextField select size="small" fullWidth label="Выбирать" value={draft.auto_prefer ?? ''}
                onChange={(e) => set({ auto_prefer: e.target.value || null })}>
                <MenuItem value="">Самый быстрый</MenuItem>
                {draft.countries.map((c) => (
                  <MenuItem key={c.id} value={c.id}>Предпочитать «{c.label}», остальные в запасе</MenuItem>
                ))}
              </TextField>
            </Box>
            {draft.countries.map((c, i) => (
              <Box key={c.id} sx={{ display: 'flex', alignItems: 'center', gap: 1, border: '1px solid #E6F1FB', borderRadius: 3, p: 1, mb: 1 }}>
                <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                  <IconButton size="small" aria-label={`Выше: ${c.label}`} disabled={i === 0} onClick={() => move(i, -1)}>
                    <ArrowUpward sx={{ fontSize: 16 }} />
                  </IconButton>
                  <IconButton size="small" aria-label={`Ниже: ${c.label}`} disabled={i === draft.countries.length - 1} onClick={() => move(i, 1)}>
                    <ArrowDownward sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <TextField variant="standard" fullWidth value={c.label} placeholder={c.name}
                    inputProps={{ 'aria-label': `Название в Happ для ${c.name}`, maxLength: 48 }}
                    onChange={(e) => set({ countries: draft.countries.map((x) => (x.id === c.id ? { ...x, label: e.target.value } : x)) })} />
                  <Typography variant="caption" color={c.online && c.channels.length < 2 ? '#8A4B00' : 'text.secondary'}>
                    {c.name}
                    {c.online ? (c.latency_ms !== null ? ` · ${c.latency_ms} мс` : '') : ' · нет связи'}
                    {c.online && c.channels.length === 1 ? ` · только ${c.channels[0] === 'hy2' ? 'Hysteria2' : 'XHTTP'}` : ''}
                    {c.online && c.channels.length === 0 && draft.countries.some((x) => x.channels.length) ? ' · вход не достаёт' : ''}
                  </Typography>
                </Box>
                <Switch checked={c.in_subscription} inputProps={{ 'aria-label': `Показывать «${c.label}» в подписке` }}
                  onChange={(e) => set({ countries: draft.countries.map((x) => (x.id === c.id ? { ...x, in_subscription: e.target.checked } : x)) })} />
              </Box>
            ))}
            {draft.countries.length === 0 && (
              <Typography variant="body2" color="text.secondary">Выходов пока нет</Typography>
            )}
          </Box>

          <SiteCheck bypass={draft.bypass_ru} direct={draft.direct_domains} proxy={draft.proxy_domains} exceptions={[]} />

          {saved && <Alert severity="success" sx={{ mb: 2 }}>Сохранено. Друзья получат новые правила при обновлении подписки.</Alert>}
          <Button fullWidth variant="contained" onClick={save} disabled={busy} sx={{ borderRadius: 3, minHeight: 48, mb: 2 }}>
            {busy ? <CircularProgress size={20} color="inherit" /> : 'Сохранить'}
          </Button>
        </>
      )}
    </Box>
  )
}
