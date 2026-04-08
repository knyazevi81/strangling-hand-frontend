import React, { useEffect } from 'react'
import {
  Box, BottomNavigation, BottomNavigationAction,
  CircularProgress, Typography, Avatar, IconButton,
  Menu, MenuItem, Divider,
} from '@mui/material'
import {
  VpnKey, AdminPanelSettings, Logout, AccountCircle,
} from '@mui/icons-material'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import ClientPage from './client/ClientPage'
import AdminPage from './admin/AdminPage'
import LoginPage from '../pages/LoginPage'

function ProtectedLayout() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const location = useLocation()
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)

  const navValue = location.pathname.startsWith('/admin') ? 1 : 0

  if (!user) return <Navigate to="/login" replace />

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'radial-gradient(ellipse at 50% -20%, rgba(0,229,255,0.05) 0%, transparent 60%)',
      }}
    >
      {/* Top bar */}
      <Box
        sx={{
          position: 'sticky', top: 0, zIndex: 100,
          px: 2, pt: 2, pb: 1.5,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'rgba(8,8,16,0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.05)',
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box
            sx={{
              width: 32, height: 32,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #00e5ff33, #7c4dff33)',
              border: '1px solid rgba(0,229,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <VpnKey sx={{ fontSize: 16, color: '#00e5ff' }} />
          </Box>
          <Typography variant="subtitle1" fontWeight={700} letterSpacing={0.5}>
            VPN Access
          </Typography>
        </Box>

        <IconButton
          size="small"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 2,
            px: 1,
            gap: 1,
          }}
        >
          <AccountCircle sx={{ fontSize: 20, color: 'text.secondary' }} />
          <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.email.split('@')[0]}
          </Typography>
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={!!anchorEl}
          onClose={() => setAnchorEl(null)}
          PaperProps={{
            sx: {
              background: '#0f0f1a',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 3,
              mt: 1,
              minWidth: 200,
            },
          }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="caption" color="text.secondary">Вы вошли как</Typography>
            <Typography variant="body2" fontWeight={600} sx={{ wordBreak: 'break-all' }}>
              {user.email}
            </Typography>
          </Box>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.07)' }} />
          <MenuItem
            onClick={handleLogout}
            sx={{ color: 'error.main', gap: 1.5, py: 1.5, '&:hover': { background: 'rgba(255,23,68,0.08)' } }}
          >
            <Logout fontSize="small" />
            <Typography variant="body2">Выйти</Typography>
          </MenuItem>
        </Menu>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, px: 2, pt: 2, pb: user.is_superuser ? 10 : 2, maxWidth: 600, mx: 'auto', width: '100%' }}>
        <Routes>
          <Route path="/" element={<ClientPage />} />
          {user.is_superuser && <Route path="/admin" element={<AdminPage />} />}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>

      {/* Bottom nav (only for superuser) */}
      {user.is_superuser && (
        <Box
          sx={{
            position: 'fixed', bottom: 0, left: 0, right: 0,
            zIndex: 100,
          }}
        >
          <BottomNavigation
            value={navValue}
            onChange={(_, v) => navigate(v === 0 ? '/' : '/admin')}
          >
            <BottomNavigationAction
              label="Мои ключи"
              icon={<VpnKey />}
            />
            <BottomNavigationAction
              label="Пользователи"
              icon={<AdminPanelSettings />}
            />
          </BottomNavigation>
        </Box>
      )}
    </Box>
  )
}

export default function App() {
  const init = useAuthStore((s) => s.init)
  const initialized = useAuthStore((s) => s.initialized)

  useEffect(() => { init() }, [init])

  if (!initialized) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: '#00e5ff' }} />
      </Box>
    )
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={<ProtectedLayout />} />
    </Routes>
  )
}
