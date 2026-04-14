import React, { useEffect } from 'react'
import {
  Box, BottomNavigation, BottomNavigationAction,
  CircularProgress, Typography, IconButton,
  Menu, MenuItem, Divider,
} from '@mui/material'
import {
  Wifi, AdminPanelSettings, Logout, AccountCircle,
  Notifications, WifiFind, Article,
} from '@mui/icons-material'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/auth'
import ClientPage from './client/ClientPage'
import FreeVpnPage from './client/FreeVpnPage'
import AdminPage from './admin/AdminPage'
import NotificationsPage from './admin/NotificationsPage'
import ArticlesPage from './articles/ArticlesPage'
import ArticleView from './articles/ArticleView'
import ArticleEditor from './articles/ArticleEditor'
import LoginPage from '../pages/LoginPage'

function ProtectedLayout() {
  const user = useAuthStore((s) => s.user)
  const initialized = useAuthStore((s) => s.initialized)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const location = useLocation()
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null)

  const getNavValue = () => {
    const p = location.pathname
    if (p.startsWith('/notifications')) return user?.is_superuser ? 4 : -1
    if (p.startsWith('/admin')) return user?.is_superuser ? 3 : -1
    if (p.startsWith('/articles')) return 2
    if (p.startsWith('/free-vpn')) return 1
    return 0
  }
  const navValue = getNavValue()

  if (!initialized) return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0F4FF' }}>
      <CircularProgress sx={{ color: '#185FA5' }} />
    </Box>
  )
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />

  const handleLogout = () => { logout(); navigate('/login') }

  const handleNav = (_: any, v: number) => {
    if (user.is_superuser) {
      const routes = ['/', '/free-vpn', '/articles', '/admin', '/notifications']
      navigate(routes[v] ?? '/')
    } else {
      navigate(v === 0 ? '/' : v === 1 ? '/free-vpn' : '/articles')
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F0F4FF' }}>
      {/* Top bar */}
      <Box sx={{
        position: 'sticky', top: 0, zIndex: 100,
        px: 2, pt: 1.5, pb: 1.25,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'rgba(240,244,255,0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid #E6F1FB',
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box sx={{
            width: 30, height: 30, borderRadius: 1.5,
            background: '#185FA5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Box sx={{ width: 12, height: 8, border: '2px solid white', borderRadius: '2px' }} />
          </Box>
          <Typography variant="subtitle1" fontWeight={700} color="#042C53" letterSpacing={0.2}>
            Savebit
          </Typography>
        </Box>

        <IconButton size="small" onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{ border: '1px solid #E6F1FB', borderRadius: 2, px: 1.25, gap: 0.75, background: '#fff' }}
        >
          <AccountCircle sx={{ fontSize: 18, color: '#378ADD' }} />
          <Typography variant="caption" color="#378ADD" sx={{
            maxWidth: 110, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {user.email.split('@')[0]}
          </Typography>
        </IconButton>

        <Menu anchorEl={anchorEl} open={!!anchorEl} onClose={() => setAnchorEl(null)}
          PaperProps={{ sx: { background: '#fff', border: '1px solid #E6F1FB', borderRadius: 3, mt: 1, minWidth: 210 } }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="caption" color="text.secondary">Вы вошли как</Typography>
            <Typography variant="body2" fontWeight={600} color="#042C53" sx={{ wordBreak: 'break-all' }}>
              {user.email}
            </Typography>
          </Box>
          <Divider />
          <MenuItem onClick={handleLogout}
            sx={{ color: '#C0392B', gap: 1.5, py: 1.5, '&:hover': { background: '#FEF0F0' } }}
          >
            <Logout fontSize="small" />
            <Typography variant="body2">Выйти</Typography>
          </MenuItem>
        </Menu>
      </Box>

      {/* Content */}
      <Box sx={{ flex: 1, px: 2, pt: 2, pb: 10, maxWidth: 560, mx: 'auto', width: '100%' }}>
        <Routes>
          <Route path="/" element={<ClientPage />} />
          <Route path="/free-vpn" element={<FreeVpnPage />} />
          <Route path="/articles" element={<ArticlesPage />} />
          <Route path="/articles/:id" element={<ArticleView />} />
          {user.is_superuser && <Route path="/articles/:id/edit" element={<ArticleEditor />} />}
          {user.is_superuser && <Route path="/admin" element={<AdminPage />} />}
          {user.is_superuser && <Route path="/notifications" element={<NotificationsPage />} />}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Box>

      {/* Bottom nav */}
      <Box sx={{ position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100 }}>
        <BottomNavigation value={navValue} onChange={handleNav}>
          <BottomNavigationAction label="Ключи" icon={<Wifi />} />
          <BottomNavigationAction label="Банк VPN" icon={<WifiFind />} />
          <BottomNavigationAction label="Статьи" icon={<Article />} />
          {user.is_superuser && <BottomNavigationAction label="Пользователи" icon={<AdminPanelSettings />} />}
          {user.is_superuser && <BottomNavigationAction label="Рассылка" icon={<Notifications />} />}
        </BottomNavigation>
      </Box>
    </Box>
  )
}

export default function App() {
  const init = useAuthStore((s) => s.init)
  const initialized = useAuthStore((s) => s.initialized)

  useEffect(() => { init() }, [init])

  if (!initialized) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F0F4FF' }}>
        <CircularProgress sx={{ color: '#185FA5' }} />
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
