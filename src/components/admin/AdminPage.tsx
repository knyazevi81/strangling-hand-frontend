import React, { useEffect, useState, useCallback, useMemo } from 'react'
import {
  Box, Typography, Tabs, Tab, Alert,
  Skeleton, Card, CardContent, Badge, InputAdornment, TextField, Chip,
} from '@mui/material'
import { People, HourglassEmpty, BarChart, Block, Search, Close } from '@mui/icons-material'
import { useSearchParams } from 'react-router-dom'
import { IconButton } from '@mui/material'
import { usersApi, blocksApi, routesApi, type User, type BlockedUser, type UserActivity } from '../../api'
import UserCard from './UserCard'
import TrafficDashboard from './traffic/TrafficDashboard'

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return value === index ? <Box pt={2}>{children}</Box> : null
}

type Filter = 'all' | 'online' | 'inactive' | 'custom'
const WEEK = 7 * 24 * 3600 * 1000
const ACTIVITY_MS = 30_000

/** Сводка «Онлайн: 3» с разбивкой по странам. */
function OnlineSummary({ online }: { online: UserActivity[] }) {
  const byCountry = new Map<string, number>()
  online.forEach((a) => { const k = a.exit_label ?? 'Авто'; byCountry.set(k, (byCountry.get(k) ?? 0) + 1) })
  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ p: 1.75, display: 'flex', alignItems: 'center', gap: 1.25, '&:last-child': { pb: 1.75 } }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: online.length ? '#1B7F4A' : '#A8B8CC', flexShrink: 0 }} />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} color="#042C53">Онлайн: {online.length}</Typography>
          <Typography variant="caption" color="text.secondary">
            {online.length ? [...byCountry].map(([k, n]) => `${k} ${n}`).join(' · ') : 'сейчас никто не подключён'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  )
}

export default function AdminPage() {
  const [tab, setTab] = useState(0)
  const [params, setParams] = useSearchParams()
  const filter = (['all', 'online', 'inactive', 'custom'].includes(params.get('filter') ?? '') ? params.get('filter') : 'all') as Filter
  const setFilter = (f: Filter) => setParams(f === 'all' ? {} : { filter: f }, { replace: true })
  const [query, setQuery] = useState('')
  const [activity, setActivity] = useState<Record<string, UserActivity>>({})
  const [activeUsers, setActiveUsers] = useState<User[]>([])
  const [pendingUsers, setPendingUsers] = useState<User[]>([])
  const [blocks, setBlocks] = useState<Record<string, BlockedUser>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [allRes, pendingRes, blocksRes] = await Promise.all([
        usersApi.getAll(),
        usersApi.getPending(),
        blocksApi.list().catch(() => ({ data: { users: [] as BlockedUser[] } })),
      ])
      setBlocks(Object.fromEntries(blocksRes.data.users.map((b) => [b.user_id, b])))
      const pending = pendingRes.data.users
      const pendingIds = new Set(pending.map((u) => u.id))
      const active = allRes.data.users.filter(
        (u) => u.is_active && !u.is_superuser && !pendingIds.has(u.id)
      )
      setActiveUsers(active)
      setPendingUsers(pending)
    } catch {
      setError('Не удалось загрузить пользователей')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const pull = () => routesApi.activity()
      .then(({ data }) => setActivity(Object.fromEntries(data.users.map((a) => [a.user_id, a]))))
      .catch(() => {})
    pull()
    const t = setInterval(pull, ACTIVITY_MS)
    return () => clearInterval(t)
  }, [])

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    const now = Date.now()
    return activeUsers
      .filter((u) => !blocks[u.id])
      .filter((u) => !q || u.email.toLowerCase().includes(q))
      .filter((u) => {
        const a = activity[u.id]
        if (filter === 'online') return !!a?.online
        if (filter === 'custom') return !!a?.custom_routes
        if (filter === 'inactive') return !a?.last_active_at || now - new Date(a.last_active_at).getTime() > WEEK
        return true
      })
      .sort((x, y) => {
        const ax = activity[x.id], ay = activity[y.id]
        if (!!ax?.online !== !!ay?.online) return ax?.online ? -1 : 1
        const tx = ax?.last_active_at ? new Date(ax.last_active_at).getTime() : 0
        const ty = ay?.last_active_at ? new Date(ay.last_active_at).getTime() : 0
        return ty - tx
      })
  }, [activeUsers, blocks, activity, query, filter])

  const onlineList = Object.values(activity).filter((a) => a.online)
  const counts = useMemo(() => {
    const now = Date.now()
    const list = activeUsers.filter((u) => !blocks[u.id])
    return {
      all: list.length,
      online: list.filter((u) => activity[u.id]?.online).length,
      inactive: list.filter((u) => { const a = activity[u.id]; return !a?.last_active_at || now - new Date(a.last_active_at).getTime() > WEEK }).length,
      custom: list.filter((u) => activity[u.id]?.custom_routes).length,
    }
  }, [activeUsers, blocks, activity])

  const handleActivated = () => load()

  const SkeletonCard = () => (
    <Card sx={{ mb: 1.5 }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Skeleton variant="circular" width={40} height={40} />
          <Box sx={{ flex: 1 }}>
            <Skeleton width="60%" height={16} sx={{ mb: 0.5 }} />
            <Skeleton width="30%" height={12} />
          </Box>
        </Box>
      </CardContent>
    </Card>
  )

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={700}>
            Друзья
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {counts.all} {counts.online ? `· ${counts.online} сейчас онлайн` : '· доступы, трафик и блокировки'}
          </Typography>
        </Box>
      </Box>

      {error && <Alert severity="error" sx={{ borderRadius: 3, mb: 2 }}>{error}</Alert>}

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        variant="scrollable"
        scrollButtons={false}
        sx={{
          mb: 0,
          '& .MuiTabs-indicator': { borderRadius: 2 },
          '& .MuiTabs-root': { minHeight: 44 },
        }}
      >
        <Tab
          icon={
            <Badge badgeContent={activeUsers.filter((u) => !blocks[u.id]).length} color="primary" max={99}>
              <People fontSize="small" />
            </Badge>
          }
          iconPosition="start"
          label="Активные"
          sx={{ minHeight: 44, gap: 1 }}
        />
        <Tab
          icon={
            <Badge badgeContent={pendingUsers.length} color="warning" max={99}>
              <HourglassEmpty fontSize="small" />
            </Badge>
          }
          iconPosition="start"
          label="Заявки"
          sx={{ minHeight: 44, gap: 1 }}
        />
        <Tab icon={<Badge badgeContent={Object.keys(blocks).length} color="error" max={99}><Block fontSize="small" /></Badge>}
          iconPosition="start" label="Заблокированы" sx={{ minHeight: 44, gap: 1 }} />
        <Tab icon={<BarChart fontSize="small" />} iconPosition="start" label="Трафик" sx={{ minHeight: 44, gap: 1 }} />
      </Tabs>

      {/* Active users */}
      <TabPanel value={tab} index={0}>
        <OnlineSummary online={onlineList} />
        <TextField fullWidth size="small" placeholder="Поиск по почте" value={query} onChange={(e) => setQuery(e.target.value)}
          inputProps={{ 'aria-label': 'Поиск по почте' }} sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { background: '#fff', borderRadius: 3 } }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><Search sx={{ color: '#185FA5' }} /></InputAdornment>,
            endAdornment: query ? (
              <InputAdornment position="end">
                <IconButton size="small" aria-label="Очистить поиск" onClick={() => setQuery('')}><Close sx={{ fontSize: 16 }} /></IconButton>
              </InputAdornment>
            ) : undefined,
          }} />
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2 }}>
          {([['all', 'Все'], ['online', 'Онлайн'], ['inactive', 'Неактивны'], ['custom', 'Свои маршруты']] as [Filter, string][]).map(([f, label]) => (
            <Chip key={f} label={`${label} · ${counts[f]}`} onClick={() => setFilter(f)} aria-pressed={filter === f}
              sx={{
                height: 36, borderRadius: 2.5, fontWeight: filter === f ? 600 : 400,
                background: filter === f ? '#185FA5' : '#fff', color: filter === f ? '#fff' : '#185FA5',
                border: filter === f ? 0 : '1px solid #B5D4F4', '&:hover': { background: filter === f ? '#124C86' : '#F5F9FF' },
              }} />
          ))}
        </Box>
        {(query || filter !== 'all') && !loading && (
          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
            Найдено: {visible.length}{query ? ` по «${query.trim()}»` : ''}
          </Typography>
        )}
        {loading && [1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        {!loading && activeUsers.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <People sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Нет активных пользователей
            </Typography>
          </Box>
        )}
        {!loading && activeUsers.length > 0 && visible.length === 0 && (
          <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>Никого не нашлось</Typography>
        )}
        {visible.map((u) => (
          <UserCard key={u.id} user={u} block={blocks[u.id]} onBlockChanged={load} activity={activity[u.id]} query={query} />
        ))}
      </TabPanel>

      {/* Pending users */}
      <TabPanel value={tab} index={1}>
        {loading && [1, 2].map((i) => <SkeletonCard key={i} />)}
        {!loading && pendingUsers.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <HourglassEmpty sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Нет ожидающих заявок
            </Typography>
          </Box>
        )}
        {pendingUsers.map((u) => (
          <UserCard key={u.id} user={u} pending onActivated={handleActivated} />
        ))}
      </TabPanel>

      <TabPanel value={tab} index={2}>
        {!loading && activeUsers.filter((u) => blocks[u.id]).length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <Block sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
            <Typography variant="body2" color="text.secondary">Никто не заблокирован</Typography>
          </Box>
        )}
        {activeUsers.filter((u) => blocks[u.id]).map((u) => (
          <UserCard key={u.id} user={u} block={blocks[u.id]} onBlockChanged={load} />
        ))}
      </TabPanel>

      <TabPanel value={tab} index={3}>
        <TrafficDashboard />
      </TabPanel>
    </Box>
  )
}
