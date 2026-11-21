import React, { useEffect, useState } from 'react'
import {
  Box, Typography, Card, CardContent, TextField, Button,
  CircularProgress, Alert, Divider, Tab, Tabs,
  Autocomplete, Chip,
} from '@mui/material'
import { Send, PeopleAlt, Person, NotificationsActive } from '@mui/icons-material'
import GroupSend from './notify/GroupSend'
import AutoEmails from './notify/AutoEmails'
import { usersApi, type User } from '../../api'
import { useAuthStore } from '../../store/auth'

function TabPanel({ children, value, index }: { children: React.ReactNode; value: number; index: number }) {
  return value === index ? <Box pt={2}>{children}</Box> : null
}

export default function NotificationsPage() {
  const [tab, setTab] = useState(0)
  const currentUser = useAuthStore((s) => s.user)

  // Конкретному пользователю
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [userSubject, setUserSubject] = useState('')
  const [userMessage, setUserMessage] = useState('')
  const [userLoading, setUserLoading] = useState(false)
  const [userResult, setUserResult] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    usersApi.getAll().then(({ data }) => {
      setUsers(data.users.filter((u) => !u.is_superuser && u.is_active))
    })
  }, [])

  const handleSendUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUser) return
    setUserLoading(true)
    setUserResult(null)
    try {
      await usersApi.notifyUser(selectedUser.id, userSubject, userMessage)
      setUserResult({ type: 'success', text: `Отправлено на ${selectedUser.email}` })
      setUserSubject('')
      setUserMessage('')
      setSelectedUser(null)
    } catch {
      setUserResult({ type: 'error', text: 'Ошибка при отправке' })
    } finally {
      setUserLoading(false)
    }
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5">Рассылка</Typography>
        <Typography variant="body2" color="text.secondary" mt={0.3}>
          Письма друзьям и автоматические уведомления
        </Typography>
      </Box>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons={false} sx={{ mb: 0 }}>
        <Tab icon={<PeopleAlt fontSize="small" />} iconPosition="start" label="Группам" sx={{ minHeight: 44 }} />
        <Tab icon={<Person fontSize="small" />} iconPosition="start" label="Конкретному" sx={{ minHeight: 44 }} />
        <Tab icon={<NotificationsActive fontSize="small" />} iconPosition="start" label="Автописьма" sx={{ minHeight: 44 }} />
      </Tabs>

      <TabPanel value={tab} index={0}>
        <GroupSend />
      </TabPanel>

      {/* Конкретному пользователю */}
      <TabPanel value={tab} index={1}>
        <Card>
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Person sx={{ color: '#185FA5', fontSize: 20 }} />
              <Typography variant="subtitle1" fontWeight={600} color="#042C53">
                Уведомление конкретному пользователю
              </Typography>
            </Box>

            <Box component="form" onSubmit={handleSendUser} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {userResult && <Alert severity={userResult.type}>{userResult.text}</Alert>}
              <Autocomplete
                options={users}
                getOptionLabel={(u) => u.email}
                value={selectedUser}
                onChange={(_, v) => setSelectedUser(v)}
                renderInput={(params) => (
                  <TextField {...params} label="Пользователь" required placeholder="Выберите пользователя" />
                )}
                renderOption={(props, u) => (
                  <Box component="li" {...props} key={u.id}>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>{u.email}</Typography>
                    </Box>
                  </Box>
                )}
                noOptionsText="Нет пользователей"
              />
              <TextField
                label="Тема письма" value={userSubject}
                onChange={(e) => setUserSubject(e.target.value)}
                required fullWidth placeholder="Тема..."
              />
              <TextField
                label="Сообщение" value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                required fullWidth multiline minRows={4} maxRows={10}
                placeholder="Текст письма..."
              />
              <Button type="submit" variant="contained" disabled={userLoading || !selectedUser}
                startIcon={userLoading ? <CircularProgress size={16} color="inherit" /> : <Send />}
                sx={{ alignSelf: 'flex-end', px: 3 }}
              >
                Отправить
              </Button>
            </Box>
          </CardContent>
        </Card>
      </TabPanel>

      <TabPanel value={tab} index={2}>
        <AutoEmails />
      </TabPanel>
    </Box>
  )
}
