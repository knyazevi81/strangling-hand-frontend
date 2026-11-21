import { useEffect, useState } from 'react'
import { Box, Card, CardContent, Typography, Switch, TextField, Button, Alert, Skeleton, CircularProgress } from '@mui/material'
import { notifyApi, apiError, type NotifySettings } from '../../../api'

type Flag = 'node_alerts' | 'share_alerts' | 'problem_reports' | 'block_emails'

/** Какие письма уходят сами и кому из админов. */
export default function AutoEmails() {
  const [s, setS] = useState<NotifySettings | null>(null)
  const [emails, setEmails] = useState('')
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    notifyApi.settings().then(({ data }) => { setS(data); setEmails(data.admin_emails.join(', ')) })
      .catch((e) => setError(apiError(e, 'Не удалось загрузить')))
  }, [])

  const toggle = (key: Flag, v: boolean) => {
    setS((p) => (p ? { ...p, [key]: v, auto: p.auto.map((a) => (a.key === key ? { ...a, enabled: v } : a)) } : p))
    setSaved(false)
  }

  const save = async () => {
    if (!s) return
    setSaving(true); setError('')
    try {
      const { data } = await notifyApi.setSettings({
        admin_emails: emails.split(/[,\s;]+/).map((e) => e.trim()).filter(Boolean),
        node_alerts: s.node_alerts, share_alerts: s.share_alerts, problem_reports: s.problem_reports, block_emails: s.block_emails,
      })
      setS(data); setEmails(data.admin_emails.join(', ')); setSaved(true)
    } catch (e) {
      setError(apiError(e, 'Не удалось сохранить'))
    } finally {
      setSaving(false)
    }
  }

  if (error && !s) return <Alert severity="error">{error}</Alert>
  if (!s) return <Skeleton variant="rounded" height={280} sx={{ borderRadius: 4 }} />

  return (
    <Card>
      <CardContent sx={{ p: 2.25, display: 'flex', flexDirection: 'column', gap: 1 }}>
        {error && <Alert severity="error">{error}</Alert>}
        {saved && <Alert severity="success">Сохранено</Alert>}
        <Typography variant="subtitle1" fontWeight={700} color="#042C53">Автоматические письма</Typography>
        {s.auto.map((a) => (
          <Box key={a.key} sx={{ display: 'flex', alignItems: 'center', gap: 1, borderTop: '1px solid #E6F1FB', py: 0.5 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="body2" color="#042C53">{a.title}</Typography>
              <Typography variant="caption" color="text.secondary">→ {a.to}</Typography>
            </Box>
            <Switch checked={a.enabled} onChange={(e) => toggle(a.key as Flag, e.target.checked)} inputProps={{ 'aria-label': a.title }} />
          </Box>
        ))}
        <TextField label="Кому писать «тебе»" value={emails} onChange={(e) => { setEmails(e.target.value); setSaved(false) }}
          fullWidth placeholder={s.effective_admin_emails.join(', ')} sx={{ mt: 1.5 }}
          helperText={`Через запятую. Пусто — ${s.effective_admin_emails.join(', ') || 'адреса администраторов'}.`} />
        <Button variant="contained" onClick={save} disabled={saving} sx={{ borderRadius: 2.5, mt: 1 }}>
          {saving ? <CircularProgress size={18} color="inherit" /> : 'Сохранить'}
        </Button>
      </CardContent>
    </Card>
  )
}
