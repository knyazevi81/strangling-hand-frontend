import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Box, Typography, Card, CardContent, Button, IconButton, Tabs, Tab, Alert, Skeleton, CircularProgress } from '@mui/material'
import { ArrowBack } from '@mui/icons-material'
import { usersApi, blocksApi, apiError, blockUntilText, type BlockedUser, type User } from '../../../api'
import { UserTrafficPanel } from '../traffic/UserTrafficDialog'
import { UserAccessPanel } from '../access/UserAccessDialog'
import BlockDialog from '../blocks/BlockDialog'
import UserIpsPanel from './UserIpsPanel'
import DomainsPanel from './DomainsPanel'
import UserRoutesPanel from '../../routes/UserRoutesPanel'

const TABS = [
  { id: 'traffic', label: 'Трафик' }, { id: 'ips', label: 'IP' }, { id: 'domains', label: 'Домены' }, { id: 'routes', label: 'Маршруты' },
  { id: 'access', label: 'Доступ' },
]

/** Карточка друга: трафик, IP, домены, доступ к выходам, блокировка. */
export default function UserPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab = TABS.some((t) => t.id === params.get('tab')) ? params.get('tab')! : 'traffic'
  const [user, setUser] = useState<User | null>(null)
  const [block, setBlock] = useState<BlockedUser | undefined>()
  const [error, setError] = useState('')
  const [blockOpen, setBlockOpen] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    try {
      const [users, blocks] = await Promise.all([usersApi.getAll(), blocksApi.list()])
      const u = users.data.users.find((x) => x.id === id)
      if (!u) { setError('Пользователь не найден'); return }
      setUser(u)
      setBlock(blocks.data.users.find((b) => b.user_id === id))
    } catch (e) {
      setError(apiError(e, 'Не удалось загрузить'))
    }
  }, [id])

  useEffect(() => { load() }, [load])

  const unblock = async () => {
    setBusy(true)
    try { await blocksApi.unblock(id); await load() } finally { setBusy(false) }
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton aria-label="Назад к пользователям" onClick={() => navigate('/admin')}
          sx={{ border: '1px solid #E6F1FB', borderRadius: 2.5, background: '#fff' }}>
          <ArrowBack sx={{ fontSize: 18, color: '#185FA5' }} />
        </IconButton>
        <Typography variant="body2" color="text.secondary">Друзья</Typography>
      </Box>

      {error && <Alert severity="error">{error}</Alert>}
      {!user && !error && <Skeleton variant="rounded" height={140} sx={{ borderRadius: 4 }} />}

      {user && (
        <>
          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5, '&:last-child': { pb: 2 } }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{
                  width: 48, height: 48, borderRadius: '50%', background: block ? '#FDECEA' : '#185FA5',
                  color: block ? '#A3261A' : '#fff', fontWeight: 700, fontSize: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>{user.email[0].toUpperCase()}</Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h6" fontWeight={700} noWrap>{user.email}</Typography>
                  <Typography variant="caption" color={block ? '#A3261A' : 'text.secondary'}>
                    {block ? `VPN заблокирован ${blockUntilText(block.until)}${block.reason ? ` · «${block.reason}»` : ''}`
                      : user.is_active ? 'активен' : 'ждёт активации'}
                  </Typography>
                </Box>
              </Box>
              {block ? (
                <Button variant="outlined" onClick={unblock} disabled={busy} sx={{ borderRadius: 2.5 }}>
                  {busy ? <CircularProgress size={18} /> : 'Разблокировать'}
                </Button>
              ) : (
                <Button variant="outlined" onClick={() => setBlockOpen(true)}
                  sx={{ borderRadius: 2.5, color: '#A3261A', borderColor: '#F3B4AC', background: '#FDECEA', '&:hover': { borderColor: '#A3261A', background: '#FBDAD5' } }}>
                  Заблокировать VPN
                </Button>
              )}
            </CardContent>
          </Card>

          <Tabs value={tab} onChange={(_, v) => setParams({ tab: v }, { replace: true })} variant="scrollable" scrollButtons={false}
            sx={{ mb: 2, background: '#fff', border: '1px solid #B5D4F4', borderRadius: 3, minHeight: 44,
              '& .MuiTab-root': { minHeight: 44, minWidth: 0, px: 1.5, flex: '1 0 auto', fontWeight: 600, textTransform: 'none' } }}>
            {TABS.map((t) => <Tab key={t.id} value={t.id} label={t.label} />)}
          </Tabs>

          <Card>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              {tab === 'traffic' && <UserTrafficPanel userId={id} />}
              {tab === 'ips' && <UserIpsPanel userId={id} />}
              {tab === 'domains' && <DomainsPanel userId={id} />}
              {tab === 'routes' && <UserRoutesPanel userId={id} />}
              {tab === 'access' && (
                <>
                  <Typography variant="subtitle1" fontWeight={700} color="#042C53" mb={1}>Через какие выходы ходит</Typography>
                  <UserAccessPanel userId={id} />
                </>
              )}
            </CardContent>
          </Card>

          <BlockDialog open={blockOpen} userId={id} email={user.email} onClose={() => setBlockOpen(false)}
            onDone={() => { setBlockOpen(false); load() }} />
        </>
      )}
    </Box>
  )
}
