import { Box, Typography } from '@mui/material'
import type { VpnConnection } from '../../api'
import { timeAgo } from './utils'

const IN_CASE: Record<string, string> = {
  'Германия': 'Германии', 'Финляндия': 'Финляндии', 'Нидерланды': 'Нидерландов', 'Швеция': 'Швеции',
  'Польша': 'Польши', 'Эстония': 'Эстонии', 'Латвия': 'Латвии', 'Литва': 'Литвы', 'Казахстан': 'Казахстана',
  'Турция': 'Турции', 'США': 'США', 'Великобритания': 'Великобритании', 'Франция': 'Франции',
  'Армения': 'Армении', 'Грузия': 'Грузии',
}

const PROFILE: Record<VpnConnection['profile'], string> = {
  auto: 'профиль «Авто»', country: 'профиль страны', direct: 'напрямую, без входа',
}

/** «Сайты видят вас из Финляндии»: куда сейчас выходит трафик друга. */
export default function ConnectionCard({ c }: { c: VpnConnection }) {
  if (!c.label) return null
  const where = IN_CASE[c.label] ?? c.label
  return (
    <Box sx={{ background: '#185FA5', color: '#fff', borderRadius: 4, p: 2, mb: 2, display: 'flex', flexDirection: 'column', gap: 1.25 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, fontSize: 13, color: '#D6E7FA' }}>
        <Box sx={{ width: 8, height: 8, borderRadius: '50%', background: c.online ? '#7FE0A8' : '#9DB0C8' }} />
        {c.online ? `Подключено · ${PROFILE[c.profile]}` : `Последний раз ${timeAgo(c.last_active_at)} · ${PROFILE[c.profile]}`}
      </Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box sx={{
          width: 46, height: 46, borderRadius: 3, background: 'rgba(255,255,255,0.16)', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16,
        }}>{(c.country || c.label).slice(0, 2).toUpperCase()}</Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: 13, color: '#D6E7FA' }}>{c.online ? 'Сайты видят вас из' : 'Сайты видели вас из'}</Typography>
          <Typography sx={{ fontSize: 22, fontWeight: 700, lineHeight: 1.2 }}>{where}</Typography>
          {c.ip && <Typography sx={{ fontSize: 12, fontFamily: 'monospace', color: '#D6E7FA' }}>{c.ip}</Typography>}
        </Box>
      </Box>
      <Box sx={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 0.75, fontSize: 12, color: '#D6E7FA',
        borderTop: '1px solid rgba(255,255,255,0.2)', pt: 1.25,
      }}>
        <span>Вы</span><span aria-hidden="true">→</span>
        {c.via && <><span>{c.via} (вход)</span><span aria-hidden="true">→</span></>}
        <Box component="span" sx={{ fontWeight: 600, color: '#fff' }}>{c.label}</Box>
        <span aria-hidden="true">→</span><span>интернет</span>
      </Box>
    </Box>
  )
}
