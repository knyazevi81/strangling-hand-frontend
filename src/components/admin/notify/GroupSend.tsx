import { useEffect, useState } from 'react'
import {
  Box, Card, CardContent, Typography, TextField, Button, Alert, CircularProgress, ButtonBase, Collapse,
  Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions,
} from '@mui/material'
import { Send } from '@mui/icons-material'
import { notifyApi, apiError, type NotifyGroup, type NotifyGroupItem } from '../../../api'

const TEMPLATES = [
  {
    title: 'Переезд на подписку', subject: 'Переезд на подписку Savebit',
    message: 'Привет! Старые ключи скоро отключим. Зайди на net.savebit.ru → «Мой VPN» → «Добавить в Happ». '
      + 'Если Happ нет — там же есть ключи для v2rayNG.',
  },
  {
    title: 'Плановые работы', subject: 'Плановые работы',
    message: 'Привет! Сегодня с 23:00 до 23:30 по Москве перезапускаем серверы, VPN может пропадать на пару минут.',
  },
  {
    title: 'Новый сервер', subject: 'Добавили новый сервер',
    message: 'Привет! Добавили новый сервер. Ничего делать не нужно: Happ сам обновит подписку. '
      + 'Если не появился — потяни список профилей вниз.',
  },
]

function Pill({ selected, children, onClick }: { selected: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <ButtonBase onClick={onClick} aria-pressed={selected} sx={{
      borderRadius: 2, px: 1.25, py: 0.75, minHeight: 36, fontSize: '0.78rem', fontWeight: 600,
      border: `1px solid ${selected ? '#185FA5' : '#B5D4F4'}`, background: selected ? '#185FA5' : '#fff',
      color: selected ? '#fff' : '#185FA5',
    }}>{children}</ButtonBase>
  )
}

export default function GroupSend() {
  const [groups, setGroups] = useState<NotifyGroupItem[]>([])
  const [group, setGroup] = useState<NotifyGroup>('all')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [showList, setShowList] = useState(false)
  const [confirm, setConfirm] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    notifyApi.groups().then(({ data }) => setGroups(data)).catch((e) => setResult({ type: 'error', text: apiError(e, 'Не удалось загрузить группы') }))
  }, [])

  const current = groups.find((g) => g.id === group)
  const count = current?.count ?? 0

  const send = async () => {
    setSending(true); setResult(null)
    try {
      const { data } = await notifyApi.sendGroup(group, subject.trim(), message.trim())
      setResult({ type: 'success', text: `Отправлено ${data.sent_to} друзьям` })
      setSubject(''); setMessage(''); setConfirm(false)
    } catch (e) {
      setResult({ type: 'error', text: apiError(e, 'Ошибка при отправке') })
    } finally {
      setSending(false)
    }
  }

  return (
    <Card>
      <CardContent sx={{ p: 2.25, display: 'flex', flexDirection: 'column', gap: 2 }}>
        {result && <Alert severity={result.type}>{result.text}</Alert>}

        <Box>
          <Typography variant="body2" fontWeight={600} mb={0.75}>Шаблон</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {TEMPLATES.map((t) => (
              <Pill key={t.title} selected={subject === t.subject} onClick={() => { setSubject(t.subject); setMessage(t.message) }}>{t.title}</Pill>
            ))}
          </Box>
        </Box>

        <TextField label="Тема письма" value={subject} onChange={(e) => setSubject(e.target.value)} required fullWidth
          placeholder="Например: Плановые работы" inputProps={{ maxLength: 200 }} />
        <TextField label="Сообщение" value={message} onChange={(e) => setMessage(e.target.value)} required fullWidth
          multiline minRows={4} maxRows={12} placeholder="Текст письма..." inputProps={{ maxLength: 10000 }} />

        <Box>
          <Typography variant="body2" fontWeight={600} mb={0.75}>Кому</Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {groups.map((g) => (
              <Pill key={g.id} selected={group === g.id} onClick={() => { setGroup(g.id); setShowList(false) }}>
                {g.title} · {g.count}
              </Pill>
            ))}
          </Box>
          {current && current.count > 0 && (
            <Button size="small" onClick={() => setShowList((v) => !v)} sx={{ mt: 0.5, px: 0.5 }}>
              {showList ? 'Скрыть список' : 'Кто получит'}
            </Button>
          )}
          <Collapse in={showList}>
            <Typography variant="caption" color="#1E5A9A" display="block" sx={{ background: '#F0F4FF', borderRadius: 2, p: 1.25 }}>
              {current?.emails.join(', ')}
            </Typography>
          </Collapse>
          <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
            «Не добавили подписку» — Happ ни разу не забирал их ссылку. «Не пользовались» — нет трафика 7 дней. Каждый получит отдельное письмо.
          </Typography>
        </Box>

        <Button variant="contained" startIcon={<Send />} disabled={!subject.trim() || !message.trim() || count === 0}
          onClick={() => setConfirm(true)} sx={{ borderRadius: 2.5, py: 1.25 }}>
          {count === 0 ? 'В группе никого нет' : `Отправить ${count} ${count === 1 ? 'другу' : 'друзьям'}`}
        </Button>
      </CardContent>

      <Dialog open={confirm} onClose={() => !sending && setConfirm(false)} fullWidth>
        <DialogTitle>Отправить письмо?</DialogTitle>
        <DialogContent>
          <DialogContentText>«{subject}» уйдёт группе «{current?.title}»: {count} писем.</DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setConfirm(false)} variant="outlined" sx={{ flex: 1 }} disabled={sending}>Отмена</Button>
          <Button onClick={send} variant="contained" sx={{ flex: 1 }} disabled={sending}>
            {sending ? <CircularProgress size={18} color="inherit" /> : 'Отправить'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  )
}
