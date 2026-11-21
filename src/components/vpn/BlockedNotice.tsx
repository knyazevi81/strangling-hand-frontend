import { Box, Card, CardContent, Typography, Button } from '@mui/material'
import { Lock } from '@mui/icons-material'
import { blockUntilText, type VpnBlock } from '../../api'

/** Что видит друг, когда его VPN приостановлен. */
export default function BlockedNotice({ block }: { block: VpnBlock }) {
  return (
    <Card sx={{ mb: 2, borderColor: '#F3B4AC' }}>
      <CardContent sx={{ p: 2.25, display: 'flex', flexDirection: 'column', gap: 1.5, '&:last-child': { pb: 2.25 } }}>
        <Box sx={{ width: 48, height: 48, borderRadius: 3.5, background: '#FDECEA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Lock sx={{ color: '#A3261A' }} />
        </Box>
        <Box>
          <Typography variant="h6" fontWeight={700}>Доступ к VPN приостановлен</Typography>
          <Typography variant="body2" color="#1E5A9A" mt={0.5} sx={{ lineHeight: 1.5 }}>
            {block.until
              ? <>Срок: <b style={{ color: '#042C53' }}>{blockUntilText(block.until)}</b>. Потом всё заработает само.
                  {block.reset_on_unblock ? ' Ключи обновятся: подписку в Happ нужно будет добавить заново.' : ' Подписку в Happ трогать не нужно.'}</>
              : 'Доступ вернёт администратор.'}
          </Typography>
        </Box>
        {block.reason && (
          <Box sx={{ background: '#F0F4FF', borderRadius: 2.5, p: 1.5 }}>
            <Typography variant="caption" color="text.secondary">Причина от администратора</Typography>
            <Typography variant="body2" color="#042C53">{block.reason}</Typography>
          </Box>
        )}
        <Button variant="contained" href="mailto:admin@savebit.ru" sx={{ borderRadius: 2.5 }}>Написать администратору</Button>
      </CardContent>
    </Card>
  )
}
