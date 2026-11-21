import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Box, Typography, Card, CardContent, Switch, IconButton, Alert, Skeleton, TextField, Button,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, CircularProgress,
} from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import { privacyApi, apiError, type PrivacySettings } from '../../../api'

function Row({ title, desc, on, onToggle, days, onDays }: {
  title: string; desc: string; on: boolean; onToggle: (v: boolean) => void; days: number; onDays: (v: number) => void
}) {
  return (
    <Card sx={{ mb: 1.5 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={600} color="#042C53">{title}</Typography>
            <Typography variant="caption" color="#1E5A9A">{desc}</Typography>
          </Box>
          <Switch checked={on} onChange={(e) => onToggle(e.target.checked)} inputProps={{ 'aria-label': title }} />
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #E6F1FB', pt: 1.25, mt: 1.25 }}>
          <Typography variant="body2" color="text.secondary">Хранить, дней</Typography>
          <TextField size="small" type="number" value={days} sx={{ width: 90 }}
            inputProps={{ min: 1, max: 365, 'aria-label': `${title}: дней хранения` }}
            onChange={(e) => onDays(Math.max(1, Math.min(365, Number(e.target.value) || 1)))} />
        </Box>
      </CardContent>
    </Card>
  )
}

/** Что агенты собирают о друзьях и сколько хранится. */
export default function PrivacyPage() {
  const navigate = useNavigate()
  const [s, setS] = useState<PrivacySettings | null>(null)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [purge, setPurge] = useState(false)

  useEffect(() => {
    privacyApi.get().then(({ data }) => setS(data)).catch((e) => setError(apiError(e, 'Не удалось загрузить')))
  }, [])

  const patch = (p: Partial<PrivacySettings>) => { setS((prev) => (prev ? { ...prev, ...p } : prev)); setSaved(false) }

  const save = async () => {
    if (!s) return
    setSaving(true); setError('')
    try {
      const { collect_ips, collect_domains, ips_days, domains_days, share_threshold } = s
      const { data } = await privacyApi.set({ collect_ips, collect_domains, ips_days, domains_days, share_threshold })
      setS(data); setSaved(true)
    } catch (e) {
      setError(apiError(e, 'Не удалось сохранить'))
    } finally {
      setSaving(false)
    }
  }

  const doPurge = async () => {
    setSaving(true)
    try { await privacyApi.deleteData('all'); setPurge(false); setSaved(false) } finally { setSaving(false) }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton aria-label="Назад" onClick={() => navigate('/admin')} sx={{ border: '1px solid #E6F1FB', borderRadius: 2.5, background: '#fff' }}>
          <ArrowBack sx={{ fontSize: 18, color: '#185FA5' }} />
        </IconButton>
        <Typography variant="body2" color="text.secondary">Пользователи</Typography>
      </Box>
      <Typography variant="h5" fontWeight={700}>Сбор данных</Typography>
      <Typography variant="body2" color="text.secondary" mb={2}>Что узлы собирают о друзьях и сколько это хранится</Typography>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {saved && <Alert severity="success" sx={{ mb: 2 }}>Сохранено. Узлы применят изменения примерно за минуту.</Alert>}
      {!s && !error && <Skeleton variant="rounded" height={300} sx={{ borderRadius: 4 }} />}

      {s && (
        <>
          {(s.outdated_agents?.length ?? 0) > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              На узлах {s.outdated_agents!.join(', ')} старый агент, там журнал не включится. Обнови агента (команда в README репозитория deploy).
            </Alert>
          )}
          <Row title="IP-адреса и оператор" desc="С каких адресов подключаются друзья, оператор и город по GeoIP."
            on={s.collect_ips} onToggle={(v) => patch({ collect_ips: v })} days={s.ips_days} onDays={(v) => patch({ ips_days: v })} />
          <Row title="Домены" desc="Число подключений к каждому сайту за день. Без адресов страниц."
            on={s.collect_domains} onToggle={(v) => patch({ collect_domains: v })} days={s.domains_days} onDays={(v) => patch({ domains_days: v })} />

          <Card sx={{ mb: 1.5 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="subtitle1" fontWeight={600} color="#042C53">Подозрение на передачу ключа</Typography>
              <Typography variant="caption" color="#1E5A9A">
                Письмо тебе, если у друга за 3 минуты столько разных IP хотя бы из двух разных мест. 0 — не писать. Работает при включённом сборе IP.
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #E6F1FB', pt: 1.25, mt: 1.25 }}>
                <Typography variant="body2" color="text.secondary">Порог, адресов</Typography>
                <TextField size="small" type="number" value={s.share_threshold} sx={{ width: 90 }} inputProps={{ min: 0, max: 20, 'aria-label': 'Порог адресов' }}
                  onChange={(e) => patch({ share_threshold: Math.max(0, Math.min(20, Number(e.target.value) || 0)) })} />
              </Box>
            </CardContent>
          </Card>

          {!s.geoip_ready && (
            <Alert severity="info" sx={{ mb: 1.5 }}>База GeoIP ещё не скачана: оператор и город появятся после первого обновления (бэкенд качает её сам).</Alert>
          )}
          <Alert severity="warning" icon={false} sx={{ mb: 2, background: '#FFF4E5', color: '#6B3A00' }}>
            IP и домены друзей хранятся на сервере в России. Чем короче срок, тем меньше данных окажется у того, кто получит доступ к серверу. Друзья видят строку о сборе у себя в «Мой VPN».
          </Alert>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button variant="outlined" onClick={() => setPurge(true)} sx={{ flex: 1, borderRadius: 2.5 }}>Удалить собранное</Button>
            <Button variant="contained" onClick={save} disabled={saving} sx={{ flex: 1, borderRadius: 2.5 }}>
              {saving ? <CircularProgress size={18} color="inherit" /> : 'Сохранить'}
            </Button>
          </Box>
        </>
      )}

      <Dialog open={purge} onClose={() => !saving && setPurge(false)} fullWidth>
        <DialogTitle>Удалить собранные IP и домены?</DialogTitle>
        <DialogContent><DialogContentText>Удалятся все сохранённые IP-адреса и счётчики доменов всех друзей. Трафик останется.</DialogContentText></DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setPurge(false)} variant="outlined" sx={{ flex: 1 }}>Отмена</Button>
          <Button onClick={doPurge} variant="contained" sx={{ flex: 1, background: '#B3261E', '&:hover': { background: '#8E1E17' } }}>Удалить</Button>
        </DialogActions>
      </Dialog>
    </Box>
  )
}
