import { useState } from 'react'
import {
  Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert, Typography, Box, IconButton, Tooltip,
} from '@mui/material'
import { ContentCopy, Check } from '@mui/icons-material'
import { API_BASE_URL, type NodeKeyResponse } from '../../../api'
import { copyText } from '../../vpn/utils'

function CopyBlock({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block" mb={0.5}>{label}</Typography>
      <Box sx={{
        display: 'flex', alignItems: 'flex-start', gap: 1, p: 1.25, borderRadius: 2,
        background: '#042C53', color: '#E6F1FB',
      }}>
        <Typography component="code" sx={{
          flex: 1, fontFamily: 'monospace', fontSize: '0.72rem', wordBreak: 'break-all', lineHeight: 1.5,
        }}>
          {value}
        </Typography>
        <Tooltip title={copied ? 'Скопировано' : 'Скопировать'}>
          <IconButton size="small" onClick={async () => {
            await copyText(value); setCopied(true); setTimeout(() => setCopied(false), 2000)
          }} sx={{ color: copied ? '#A5D6A7' : '#B5D4F4', p: 0.5 }}>
            {copied ? <Check fontSize="small" /> : <ContentCopy fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  )
}

/** Ключ узла показывается один раз: после создания узла или перевыпуска ключа. */
export default function NodeKeyDialog({
  data, rotated, onClose,
}: { data: NodeKeyResponse | null; rotated: boolean; onClose: () => void }) {
  if (!data) return null
  const oneLiner = `${data.install_command} -s -- --key ${data.key} --api ${API_BASE_URL} --yes`

  return (
    <Dialog open onClose={onClose} fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        {rotated ? `Новый ключ для ${data.node.name}` : `Узел ${data.node.name} создан`}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
        <Alert severity="warning">
          Ключ показывается один раз. Скопируй его сейчас: потом можно будет только выпустить новый.
        </Alert>
        <CopyBlock label="Ключ узла" value={data.key} />
        {rotated ? (
          <>
            <Typography variant="body2">
              Старый ключ уже не работает. Узел продолжает работать на последнем конфиге, но обновляться
              не будет, пока не заменишь ключ на сервере:
            </Typography>
            <CopyBlock label="На сервере узла" value={data.install_command} />
          </>
        ) : (
          <>
            <Typography variant="body2">
              Зайди на сервер по SSH и запусти установку. Скрипт спросит ключ и домен API
              (по умолчанию {API_BASE_URL.replace('https://', '')}).
            </Typography>
            <CopyBlock label="Установка (спросит ключ)" value={data.install_command} />
            <CopyBlock label="Или сразу с ключом, без вопросов" value={oneLiner} />
            <Typography variant="caption" color="text.secondary">
              Через минуту после установки узел появится здесь со статусом «онлайн».
            </Typography>
          </>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} variant="contained" fullWidth>Готово, ключ сохранил</Button>
      </DialogActions>
    </Dialog>
  )
}
