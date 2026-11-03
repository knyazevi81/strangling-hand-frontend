import React, { useEffect, useState } from 'react'
import {
  Box, Card, CardContent, TextField, Button, Typography,
  Alert, CircularProgress, InputAdornment, IconButton,
} from '@mui/material'
import { Visibility, VisibilityOff, ArrowBack } from '@mui/icons-material'
import { useLocation, useNavigate } from 'react-router-dom'
import { authApi } from '../api'
import { parseError } from './LoginPage'

const RESEND_SECONDS = 60

type Step = 'email' | 'reset'

export default function ForgotPasswordPage() {
  const navigate = useNavigate()
  const initialEmail = (useLocation().state as { email?: string } | null)?.email ?? ''

  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState(initialEmail)
  const [code, setCode] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendIn, setResendIn] = useState(0)

  useEffect(() => {
    if (resendIn <= 0) return
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [resendIn])

  const sendCode = async () => {
    setError('')
    setLoading(true)
    try {
      const { data } = await authApi.requestPasswordReset(email)
      setInfo(data.message)
      setStep('reset')
      setResendIn(RESEND_SECONDS)
    } catch (err: any) {
      setError(parseError(err))
    } finally {
      setLoading(false)
    }
  }

  const handleRequest = (e: React.FormEvent) => {
    e.preventDefault()
    sendCode()
  }

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== password2) {
      setError('Пароли не совпадают')
      return
    }
    setLoading(true)
    try {
      await authApi.confirmPasswordReset(email, code, password)
      navigate('/login', {
        replace: true,
        state: { email, message: 'Пароль изменён. Войдите с новым паролем.' },
      })
    } catch (err: any) {
      setError(parseError(err))
      setLoading(false)
    }
  }

  const passwordAdornment = {
    endAdornment: (
      <InputAdornment position="end">
        <IconButton onClick={() => setShowPass(!showPass)} edge="end" size="small">
          {showPass ? <VisibilityOff /> : <Visibility />}
        </IconButton>
      </InputAdornment>
    ),
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
          <Typography variant="h5" fontWeight={700} color="#042C53">Восстановление пароля</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5}>
            {step === 'email'
              ? 'Отправим код подтверждения на вашу почту'
              : 'Введите код из письма и новый пароль'}
          </Typography>
        </Box>

        <Card>
          <CardContent sx={{ p: 0 }}>
            {step === 'email' ? (
              <Box component="form" onSubmit={handleRequest}
                sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}
              >
                {error && <Alert severity="error">{error}</Alert>}

                <TextField label="Email" type="email" value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required fullWidth autoFocus autoComplete="email" autoCapitalize="none"
                />

                <Button type="submit" variant="contained" size="large"
                  disabled={loading} fullWidth sx={{ py: 1.4 }}
                >
                  {loading ? <CircularProgress size={20} color="inherit" /> : 'Получить код'}
                </Button>
              </Box>
            ) : (
              <Box component="form" onSubmit={handleConfirm}
                sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}
              >
                {error && <Alert severity="error">{error}</Alert>}
                {!error && info && <Alert severity="info">{info}</Alert>}

                <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-all' }}>
                  Почта: <b>{email}</b>{' '}
                  <Typography component="span" variant="body2" color="#378ADD"
                    sx={{ cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                    onClick={() => { setStep('email'); setError(''); setCode('') }}
                  >
                    изменить
                  </Typography>
                </Typography>

                <TextField label="Код из письма" value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required fullWidth autoFocus autoComplete="one-time-code"
                  inputProps={{
                    inputMode: 'numeric', pattern: '\\d{6}', maxLength: 6,
                    style: { letterSpacing: 8, fontSize: 20, textAlign: 'center', fontFamily: 'monospace' },
                  }}
                />

                <TextField
                  label="Новый пароль" type={showPass ? 'text' : 'password'}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  required fullWidth autoComplete="new-password"
                  inputProps={{ minLength: 8, maxLength: 128 }}
                  InputProps={passwordAdornment}
                />

                <TextField
                  label="Повторите пароль" type={showPass ? 'text' : 'password'}
                  value={password2} onChange={(e) => setPassword2(e.target.value)}
                  required fullWidth autoComplete="new-password"
                  error={!!password2 && password !== password2}
                  helperText={password2 && password !== password2 ? 'Пароли не совпадают' : 'Минимум 8 символов'}
                />

                <Button type="submit" variant="contained" size="large"
                  disabled={loading || code.length !== 6} fullWidth sx={{ py: 1.4 }}
                >
                  {loading ? <CircularProgress size={20} color="inherit" /> : 'Сменить пароль'}
                </Button>

                <Button variant="text" size="small" disabled={loading || resendIn > 0} onClick={sendCode}>
                  {resendIn > 0 ? `Отправить код повторно через ${resendIn} с` : 'Отправить код повторно'}
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>

        <Button startIcon={<ArrowBack />} onClick={() => navigate('/login')}
          sx={{ mt: 2, color: '#378ADD' }} fullWidth
        >
          Вернуться ко входу
        </Button>
      </Box>
    </Box>
  )
}
