import React, { useState, useEffect } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, CircularProgress, Alert, Box, Typography,
} from '@mui/material'
import { subscribesApi, type Subscribe } from '../../api'

interface Props {
  open: boolean
  onClose: () => void
  onSuccess: () => void
  userId: string
  editSub?: Subscribe | null
}

const DEFAULT_TEMPLATE =
  'vless://60975a6b-8eb9-413a-b555-7a9e024083d8@{ip}:{port}?security=reality&sni=max.ru&fp=chrome&pbk=7jQJYJL6CuVXCyUsMHLxrAKLvyNs6OPEuWcKNYyltk8&sid=c66fc3a3&spx=/&type=tcp&flow=xtls-rprx-vision&encryption=none#rkn-pidarasi-leo-wl'

export default function SubscribeDialog({ open, onClose, onSuccess, userId, editSub }: Props) {
  const [ip, setIp] = useState('')
  const [port, setPort] = useState('')
  const [template, setTemplate] = useState(DEFAULT_TEMPLATE)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const isEdit = !!editSub

  useEffect(() => {
    if (editSub) {
      setIp(editSub.ip)
      setPort(editSub.port)
      // payload в базе — шаблон, но мы получаем уже с подставленными значениями
      // восстановим шаблон обратно
      setTemplate(editSub.payload
        .replace(editSub.ip, '{ip}')
        .replace(editSub.port, '{port}'))
    } else {
      setIp('')
      setPort('')
      setTemplate(DEFAULT_TEMPLATE)
    }
    setError('')
  }, [editSub, open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (isEdit && editSub) {
        await subscribesApi.update(editSub.id, {
          ip: ip || undefined,
          port: port || undefined,
          payload_template: template || undefined,
        })
      } else {
        await subscribesApi.create({
          user_id: userId,
          ip,
          port,
          payload_template: template,
        })
      }
      onSuccess()
      onClose()
    } catch (err: any) {
      const msg = err?.response?.data?.result?.error || err?.response?.data?.detail || 'Ошибка'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        {isEdit ? 'Редактировать подписку' : 'Добавить подключение'}
      </DialogTitle>

      <Box component="form" onSubmit={handleSubmit}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          {error && <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="IP адрес"
              value={ip}
              onChange={(e) => setIp(e.target.value)}
              required={!isEdit}
              fullWidth
              placeholder="185.23.11.4"
              inputProps={{ style: { fontFamily: '"JetBrains Mono", monospace' } }}
            />
            <TextField
              label="Порт"
              value={port}
              onChange={(e) => setPort(e.target.value)}
              required={!isEdit}
              sx={{ width: 110, flexShrink: 0 }}
              placeholder="443"
              inputProps={{ style: { fontFamily: '"JetBrains Mono", monospace' } }}
            />
          </Box>

          <TextField
            label="Payload шаблон"
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
            required={!isEdit}
            fullWidth
            multiline
            minRows={3}
            maxRows={6}
            placeholder="vless://uuid@{ip}:{port}?..."
            inputProps={{ style: { fontFamily: '"JetBrains Mono", monospace', fontSize: '0.72rem' } }}
            helperText="Используй {ip} и {port} — они заменятся автоматически"
          />

          {ip && port && (
            <Box sx={{
              background: 'rgba(0,229,255,0.05)',
              border: '1px solid rgba(0,229,255,0.15)',
              borderRadius: 3, p: 1.5,
            }}>
              <Typography variant="caption" color="primary.main" display="block" mb={0.5}>
                Предпросмотр:
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  fontFamily: '"JetBrains Mono", monospace',
                  color: 'text.secondary',
                  wordBreak: 'break-all',
                  fontSize: '0.65rem',
                }}
              >
                {template.replace('{ip}', ip).replace('{port}', port)}
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={onClose} disabled={loading} variant="outlined" sx={{ flex: 1 }}>
            Отмена
          </Button>
          <Button type="submit" variant="contained" disabled={loading} sx={{ flex: 1 }}>
            {loading ? <CircularProgress size={20} color="inherit" /> : isEdit ? 'Сохранить' : 'Добавить'}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  )
}
