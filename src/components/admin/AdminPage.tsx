import React, { useEffect, useState, useCallback } from 'react'
import {
  Box, Typography, Tabs, Tab, Alert,
  Skeleton, Card, CardContent, Badge,
} from '@mui/material'
import { People, HourglassEmpty } from '@mui/icons-material'
import { usersApi, type User } from '../../api'
import UserCard from './UserCard'

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return value === index ? <Box pt={2}>{children}</Box> : null
}

export default function AdminPage() {
  const [tab, setTab] = useState(0)
  const [activeUsers, setActiveUsers] = useState<User[]>([])
  const [pendingUsers, setPendingUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [allRes, pendingRes] = await Promise.all([
        usersApi.getAll(),
        usersApi.getPending(),
      ])
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
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={700}>
          Пользователи
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          Управление доступами и подключениями
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ borderRadius: 3, mb: 2 }}>{error}</Alert>}

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          mb: 0,
          '& .MuiTabs-indicator': { borderRadius: 2 },
          '& .MuiTabs-root': { minHeight: 44 },
        }}
      >
        <Tab
          icon={
            <Badge badgeContent={activeUsers.length} color="primary" max={99}>
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
      </Tabs>

      {/* Active users */}
      <TabPanel value={tab} index={0}>
        {loading && [1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        {!loading && activeUsers.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <People sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.3, mb: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Нет активных пользователей
            </Typography>
          </Box>
        )}
        {activeUsers.map((u) => (
          <UserCard key={u.id} user={u} />
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
    </Box>
  )
}
