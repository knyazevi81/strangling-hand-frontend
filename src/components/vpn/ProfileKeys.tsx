import { useState } from 'react'
import { Box, Typography, IconButton, Tooltip, Collapse, Chip, Button } from '@mui/material'
import { ContentCopy, Check, QrCode2, ExpandMore, ExpandLess, Key } from '@mui/icons-material'
import { QRCodeSVG } from 'qrcode.react'
import type { ProfileLink } from '../../api'
import { copyText, shortProfile } from './utils'

function KeyRow({ link }: { link: ProfileLink }) {
  const [copied, setCopied] = useState(false)
  const [qr, setQr] = useState(false)
  const hy2 = link.protocol === 'hysteria2'
  const vless = link.protocol === 'vless'
  return (
    <Box sx={{ py: 1, borderTop: '1px solid #E6F1FB' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} color="#042C53" noWrap>{shortProfile(link.name)}</Typography>
          {hy2 && (
            <Typography variant="caption" color="text.secondary" display="block">
              На случай серьезных блокировок или звонков UDP
            </Typography>
          )}
          {vless && (
            <Typography variant="caption" color="text.secondary" display="block">
              Базовый мощщщный протокол
            </Typography>
          )}
        </Box>
        <Chip size="small" label={link.protocol} sx={{ height: 20, fontSize: '0.62rem', background: '#F0F4FF', color: '#042C53' }} />
        <Tooltip title="QR-код">
          <IconButton size="small" onClick={() => setQr((v) => !v)}
            sx={{ border: '1px solid #B5D4F4', borderRadius: 2, background: qr ? '#E6F1FB' : '#fff' }}>
            <QrCode2 sx={{ fontSize: 16, color: '#185FA5' }} />
          </IconButton>
        </Tooltip>
        <Tooltip title={copied ? 'Скопировано' : 'Скопировать ключ'}>
          <IconButton size="small" onClick={async () => {
            await copyText(link.url); setCopied(true); setTimeout(() => setCopied(false), 2000)
          }} sx={{ border: `1px solid ${copied ? '#A5D6A7' : '#B5D4F4'}`, borderRadius: 2, background: copied ? '#E8F5E9' : '#fff' }}>
            {copied ? <Check sx={{ fontSize: 16, color: '#1B7F4A' }} /> : <ContentCopy sx={{ fontSize: 16, color: '#185FA5' }} />}
          </IconButton>
        </Tooltip>
      </Box>
      <Collapse in={qr} unmountOnExit>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1.5 }}>
          <Box sx={{ p: 1.25, background: '#fff', borderRadius: 3, border: '1px solid #E6F1FB' }}>
            <QRCodeSVG value={link.url} size={210} fgColor="#042C53" level="L" />
          </Box>
        </Box>
      </Collapse>
    </Box>
  )
}

/** Отдельные ключи для v2rayNG, Hiddify, Streisand и других клиентов, если подписку добавить не получается. */
export default function ProfileKeys({ links }: { links: ProfileLink[] }) {
  const [open, setOpen] = useState(false)
  if (!links.length) return null
  return (
    <Box sx={{ mt: 1.5 }}>
      <Button size="small" onClick={() => setOpen((v) => !v)} startIcon={<Key sx={{ fontSize: '16px !important' }} />}
        endIcon={open ? <ExpandLess /> : <ExpandMore />} sx={{ px: 0.5, fontSize: '0.75rem' }}>
        Ключи по отдельности (v2rayNG и др.)
      </Button>
      <Collapse in={open}>
        <Typography variant="caption" color="text.secondary" display="block" sx={{ my: 1 }}>
          Ссылку-подписку выше понимают и v2rayNG, и Hiddify: «+» → «Подписка». Если клиент подписки
          не умеет, скопируй ключ и в приложении выбери «Импорт из буфера обмена». Отдельные ключи сами не
          обновляются: если сервер сменится, их надо будет скопировать заново.
        </Typography>
        {links.map((l) => <KeyRow key={l.url} link={l} />)}
      </Collapse>
    </Box>
  )
}
