import { useState, type ReactNode } from 'react'
import { Box, ButtonBase, Drawer, IconButton, Typography } from '@mui/material'
import {
  Wifi, People, Dns, GridView, AltRoute, WifiFind, Article, Notifications, Public, Close, Logout, ChevronRight,
} from '@mui/icons-material'
import { useLocation, useNavigate } from 'react-router-dom'

type Item = { key: string; label: string; icon: ReactNode; to?: string; match: (p: string) => boolean }

/** Куда ведёт «Ещё» у админа: то, чем пользуешься редко. */
const MORE_PATHS = ['/notifications', '/admin/privacy', '/admin/routing', '/free-vpn', '/articles', '/routes']
const isMore = (p: string) => MORE_PATHS.some((m) => p.startsWith(m))

const FRIEND: Item[] = [
  { key: 'vpn', label: 'VPN', icon: <Wifi />, to: '/', match: (p) => p === '/' },
  { key: 'routes', label: 'Маршруты', icon: <AltRoute />, to: '/routes', match: (p) => p.startsWith('/routes') },
  { key: 'bank', label: 'Банк', icon: <WifiFind />, to: '/free-vpn', match: (p) => p.startsWith('/free-vpn') },
  { key: 'articles', label: 'Статьи', icon: <Article />, to: '/articles', match: (p) => p.startsWith('/articles') },
]

const ADMIN: Item[] = [
  { key: 'vpn', label: 'VPN', icon: <Wifi />, to: '/', match: (p) => p === '/' },
  { key: 'friends', label: 'Друзья', icon: <People />, to: '/admin',
    match: (p) => p.startsWith('/admin') && !isMore(p) },
  { key: 'nodes', label: 'Узлы', icon: <Dns />, to: '/nodes', match: (p) => p.startsWith('/nodes') },
  { key: 'more', label: 'Ещё', icon: <GridView />, match: isMore },
]

function Tile({ icon, title, hint, onClick, wide, tint = '#E6F1FB', color = '#185FA5' }: {
  icon: ReactNode; title: string; hint: string; onClick: () => void; wide?: boolean; tint?: string; color?: string
}) {
  return (
    <ButtonBase onClick={onClick} sx={{
      gridColumn: wide ? 'span 2' : undefined, justifyContent: 'flex-start', textAlign: 'left',
      border: '1px solid #E6F1FB', background: '#F8FAFE', borderRadius: 4, p: 1.5,
      display: 'flex', flexDirection: wide ? 'row' : 'column', alignItems: wide ? 'center' : 'flex-start',
      gap: wide ? 1.5 : 1, minHeight: wide ? 64 : 92,
    }}>
      <Box sx={{
        width: 36, height: 36, borderRadius: 2.5, background: tint, color, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center', '& svg': { fontSize: 20 },
      }}>{icon}</Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography variant="body2" fontWeight={600} color="#042C53">{title}</Typography>
        <Typography variant="caption" color="#4A6A93">{hint}</Typography>
      </Box>
      {wide && <ChevronRight sx={{ color: '#4A6A93' }} />}
    </ButtonBase>
  )
}

/** Плавающий тулбар: у друга 4 пункта, у админа 4, и редкое — в «Ещё». */
export default function BottomBar({ admin, onLogout }: { admin: boolean; onLogout: () => void }) {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [moreOpen, setMoreOpen] = useState(false)
  const items = admin ? ADMIN : FRIEND
  const go = (to: string) => { setMoreOpen(false); navigate(to) }

  return (
    <>
      <Box component="nav" aria-label="Главное меню" sx={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1300, px: 1.5,
        pb: 'calc(14px + env(safe-area-inset-bottom))', pt: 1, pointerEvents: 'none',
      }}>
        <Box sx={{
          maxWidth: 536, mx: 'auto', display: 'flex', gap: 0.25, p: 0.75, pointerEvents: 'auto',
          background: '#fff', border: '1px solid #DCE8F6', borderRadius: '22px',
          boxShadow: '0 6px 20px rgba(4,44,83,0.10)',
        }}>
          {items.map((it) => {
            const on = it.key === 'more' ? (moreOpen || it.match(pathname)) : (!moreOpen && it.match(pathname))
            return (
              <ButtonBase key={it.key} aria-current={on ? 'page' : undefined}
                onClick={() => (it.to ? go(it.to) : setMoreOpen((v) => !v))}
                sx={{
                  flex: 1, minHeight: 52, borderRadius: 4, flexDirection: 'column', gap: 0.4,
                  background: on ? '#E6F1FB' : 'transparent', transition: 'background .15s',
                  '& svg': { fontSize: 22, color: on ? '#185FA5' : '#6F8FB5' },
                }}>
                {it.icon}
                <Typography sx={{ fontSize: 11, lineHeight: 1, fontWeight: on ? 600 : 500, color: on ? '#185FA5' : '#4A6A93' }}>
                  {it.label}
                </Typography>
              </ButtonBase>
            )
          })}
        </Box>
      </Box>

      {admin && (
        <Drawer anchor="bottom" open={moreOpen} onClose={() => setMoreOpen(false)}
          PaperProps={{ sx: {
            left: 12, right: 12, bottom: 'calc(96px + env(safe-area-inset-bottom))', mx: 'auto', maxWidth: 536,
            borderRadius: '22px', p: 1.75, boxShadow: '0 10px 30px rgba(4,44,83,0.22)',
          } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={700} color="#042C53">Ещё</Typography>
            <IconButton aria-label="Закрыть" onClick={() => setMoreOpen(false)}
              sx={{ background: '#F0F4FF', borderRadius: 3, width: 40, height: 40 }}>
              <Close sx={{ fontSize: 18, color: '#185FA5' }} />
            </IconButton>
          </Box>
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
            <Tile wide icon={<AltRoute />} title="Маршруты по умолчанию" hint="страны в подписке, российские сайты"
              onClick={() => go('/admin/routing')} tint="#E8F5E9" color="#155D37" />
            <Tile icon={<Notifications />} title="Рассылка" hint="группы и автописьма" onClick={() => go('/notifications')} />
            <Tile icon={<Public />} title="IP и домены" hint="сбор данных, сроки" onClick={() => go('/admin/privacy')} />
            <Tile icon={<WifiFind />} title="Банк VPN" hint="старые ключи" onClick={() => go('/free-vpn')} />
            <Tile icon={<Article />} title="Статьи" hint="инструкции для друзей" onClick={() => go('/articles')} />
          </Box>
          <Box sx={{ borderTop: '1px solid #E6F1FB', mt: 1.5 }}>
            <ButtonBase onClick={() => go('/routes')} sx={{ width: '100%', justifyContent: 'flex-start', gap: 1.25, minHeight: 48 }}>
              <AltRoute sx={{ fontSize: 18, color: '#4A6A93' }} />
              <Typography variant="body2" color="#042C53" sx={{ flex: 1, textAlign: 'left' }}>Мои маршруты</Typography>
            </ButtonBase>
            <ButtonBase onClick={() => { setMoreOpen(false); onLogout() }}
              sx={{ width: '100%', justifyContent: 'flex-start', gap: 1.25, minHeight: 48 }}>
              <Logout sx={{ fontSize: 18, color: '#A3261A' }} />
              <Typography variant="body2" color="#A3261A">Выйти</Typography>
            </ButtonBase>
          </Box>
        </Drawer>
      )}
    </>
  )
}
