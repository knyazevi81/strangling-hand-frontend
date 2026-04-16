import React, { useState } from 'react'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Tab, Tabs, Alert, CircularProgress, InputAdornment, IconButton,
} from '@mui/material'
import { Visibility, VisibilityOff } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { authApi } from '../api'

const parseError = (err: any): string => {
  const data = err?.response?.data
  if (!data) return 'Ошибка соединения'
  if (data?.result?.error) return data.result.error
  const detail = data?.detail
  if (!detail) return 'Неизвестная ошибка'
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail.map((e: any) => {
      const field = e.loc?.slice(-1)[0] || ''
      return field ? `${field}: ${e.msg}` : e.msg
    }).join(', ')
  }
  return 'Ошибка'
}

export default function LoginPage() {
  const [tab, setTab] = useState(0)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)

  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      setError(parseError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await authApi.register(email, password)
      setSuccess('Заявка отправлена. Ожидайте активации аккаунта.')
      setTab(0)
    } catch (err: any) {
      setError(parseError(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box sx={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', px: 2, background: '#F0F4FF',
    }}>
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Box sx={{
            width: 56, height: 56, borderRadius: 3,
            background: '#185FA5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 1.5,
          }}>
            <Box sx={{ width: 22, height: 14, border: '2.5px solid white', borderRadius: '4px' }} />
          </Box>
          <Typography variant="h5" fontWeight={700} color="#042C53">Savebit</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Управление подключениями
          </Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: 0 }}>
            <Tabs value={tab} onChange={(_, v) => { setTab(v); setError(''); setSuccess('') }}
              variant="fullWidth"
              sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
            >
              <Tab label="Войти" />
              <Tab label="Регистрация" />
            </Tabs>

            <Box component="form" onSubmit={tab === 0 ? handleLogin : handleRegister}
              sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              {error && <Alert severity="error">{error}</Alert>}
              {success && <Alert severity="success">{success}</Alert>}

              <TextField label="Email" type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                required fullWidth autoComplete="email" autoCapitalize="none"
              />

              <TextField
                label="Пароль" type={showPass ? 'text' : 'password'}
                value={password} onChange={(e) => setPassword(e.target.value)}
                required fullWidth
                autoComplete={tab === 0 ? 'current-password' : 'new-password'}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPass(!showPass)} edge="end" size="small">
                        {showPass ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              {tab === 1 && (
                <Typography variant="caption" color="text.secondary" textAlign="center">
                  Минимум 8 символов. После регистрации аккаунт активирует администратор.
                </Typography>
              )}

              <Button type="submit" variant="contained" size="large"
                disabled={loading} fullWidth sx={{ py: 1.4 }}
              >
                {loading
                  ? <CircularProgress size={20} color="inherit" />
                  : tab === 0 ? 'Войти' : 'Подать заявку'
                }
              </Button>
            </Box>
          </CardContent>
        </Card>
      </Box>
    </Box>
  )
}
