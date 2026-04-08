import React, { useState } from 'react'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Tab, Tabs, Alert, CircularProgress, InputAdornment, IconButton,
} from '@mui/material'
import { Visibility, VisibilityOff, WifiTethering } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import { authApi } from '../api'

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
      const msg = err?.response?.data?.result?.error || err?.response?.data?.detail || 'Ошибка входа'
      setError(msg)
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
      setSuccess('Заявка отправлена. Ожидайте активации аккаунта администратором.')
      setTab(0)
    } catch (err: any) {
      const msg = err?.response?.data?.result?.error || err?.response?.data?.detail || 'Ошибка регистрации'
      setError(typeof msg === 'string' ? msg : JSON.stringify(msg))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        px: 2,
        background: 'radial-gradient(ellipse at 50% 0%, rgba(0,229,255,0.08) 0%, transparent 70%)',
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Box
            sx={{
              width: 72, height: 72,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00e5ff22, #7c4dff22)',
              border: '1px solid rgba(0,229,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              mx: 'auto', mb: 2,
              boxShadow: '0 0 40px rgba(0,229,255,0.15)',
            }}
          >
            <WifiTethering sx={{ fontSize: 36, color: '#00e5ff' }} />
          </Box>
          <Typography variant="h5" fontWeight={700} letterSpacing={1}>
            VPN Access
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            Защищённый доступ к сети
          </Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: 0 }}>
            <Tabs
              value={tab}
              onChange={(_, v) => { setTab(v); setError(''); setSuccess('') }}
              variant="fullWidth"
              sx={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
            >
              <Tab label="Войти" />
              <Tab label="Регистрация" />
            </Tabs>

            <Box
              component="form"
              onSubmit={tab === 0 ? handleLogin : handleRegister}
              sx={{ p: 3, display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              {error && <Alert severity="error" sx={{ borderRadius: 3 }}>{error}</Alert>}
              {success && <Alert severity="success" sx={{ borderRadius: 3 }}>{success}</Alert>}

              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                fullWidth
                autoComplete="email"
                autoCapitalize="none"
              />

              <TextField
                label="Пароль"
                type={showPass ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                fullWidth
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
                  После регистрации аккаунт будет активирован администратором
                </Typography>
              )}

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                fullWidth
                sx={{ mt: 1, py: 1.5 }}
              >
                {loading
                  ? <CircularProgress size={22} color="inherit" />
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
