import React, { useEffect, useState } from 'react'
import {
  Box, Typography, Card, CardContent, IconButton, Chip,
  Collapse, CircularProgress, Divider, Button, Tooltip,
} from '@mui/material'
import {
  ExpandMore, ExpandLess, Add, Edit, Delete,
  Person, CheckCircle, HourglassEmpty, ContentCopy, Check,
} from '@mui/icons-material'
import { usersApi, subscribesApi, type User, type Subscribe } from '../../api'
import SubscribeDialog from './SubscribeDialog'
import UserAccessDialog from './access/UserAccessDialog'
import BlockDialog from './blocks/BlockDialog'
import { blocksApi, blockUntilText, type BlockedUser, type UserActivity } from '../../api'
import { timeAgo } from '../vpn/utils'
import { useNavigate } from 'react-router-dom'

interface Props {
  user: User
  pending?: boolean
  onActivated?: () => void
  block?: BlockedUser
  onBlockChanged?: () => void
  activity?: UserActivity
  query?: string
}

/** Почта с подсвеченным совпадением поиска. */
function Highlight({ text, query }: { text: string; query?: string }) {
  const q = (query ?? '').trim().toLowerCase()
  const i = q ? text.toLowerCase().indexOf(q) : -1
  if (i < 0) return <>{text}</>
  return (
    <>
      {text.slice(0, i)}
      <Box component="mark" sx={{ background: '#FFE7A3', color: 'inherit', borderRadius: 0.5, px: 0.15 }}>{text.slice(i, i + q.length)}</Box>
      {text.slice(i + q.length)}
    </>
  )
}

function activityText(a: UserActivity): string {
  const where = a.exit_label ? `${a.exit_label}${a.profile === 'auto' ? ' (Авто)' : a.profile === 'direct' ? ' напрямую' : ''}` : ''
  const isp = [a.org, a.city].filter(Boolean).join(', ')
  const parts = a.online ? ['онлайн', where, isp] : [a.last_active_at ? `был ${timeAgo(a.last_active_at)}` : 'ещё не подключался']
  return parts.filter(Boolean).join(' · ')
}

function SubRow({ sub, onEdit, onDelete }: {
  sub: Subscribe
  onEdit: (s: Subscribe) => void
  onDelete: (id: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(sub.payload)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await subscribesApi.delete(sub.id)
      onDelete(sub.id)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Box
      sx={{
        display: 'flex', alignItems: 'center', gap: 1,
        py: 1.5, px: 1,
        borderRadius: 3,
        '&:hover': { background: 'rgba(255,255,255,0.03)' },
      }}
    >
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={sub.ip}
            size="small"
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.68rem',
              background: 'rgba(0,229,255,0.08)',
              color: '#00e5ff',
              height: 24,
            }}
          />
          <Chip
            label={`:${sub.port}`}
            size="small"
            sx={{
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: '0.68rem',
              background: 'rgba(124,77,255,0.08)',
              color: '#b47cff',
              height: 24,
            }}
          />
        </Box>
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            display: 'block', mt: 0.5,
            fontFamily: '"JetBrains Mono", monospace',
            fontSize: '0.62rem',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {sub.payload}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
        <Tooltip title={copied ? 'Скопировано' : 'Копировать payload'}>
          <IconButton size="small" onClick={handleCopy} sx={{ color: copied ? 'success.main' : 'text.secondary' }}>
            {copied ? <Check fontSize="small" /> : <ContentCopy fontSize="small" />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Редактировать">
          <IconButton size="small" onClick={() => onEdit(sub)} sx={{ color: 'text.secondary' }}>
            <Edit fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="Удалить">
          <IconButton size="small" onClick={handleDelete} disabled={deleting} sx={{ color: 'error.main' }}>
            {deleting ? <CircularProgress size={14} /> : <Delete fontSize="small" />}
          </IconButton>
        </Tooltip>
      </Box>
    </Box>
  )
}

export default function UserCard({ user, pending, onActivated, block, onBlockChanged, activity, query }: Props) {
  const [open, setOpen] = useState(false)
  const [subs, setSubs] = useState<Subscribe[]>([])
  const [loadingSubs, setLoadingSubs] = useState(false)
  const [activating, setActivating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editSub, setEditSub] = useState<Subscribe | null>(null)
  const [accessOpen, setAccessOpen] = useState(false)
  const [blockOpen, setBlockOpen] = useState(false)
  const navigate = useNavigate()
  const [unblocking, setUnblocking] = useState(false)

  const handleUnblock = async () => {
    setUnblocking(true)
    try { await blocksApi.unblock(user.id); onBlockChanged?.() } finally { setUnblocking(false) }
  }

  const loadSubs = async () => {
    setLoadingSubs(true)
    try {
      const { data } = await subscribesApi.getByUser(user.id)
      setSubs(data.subscribes)
    } finally {
      setLoadingSubs(false)
    }
  }

  const handleExpand = () => {
    if (!open && !pending) loadSubs()
    setOpen(!open)
  }

  const handleActivate = async () => {
    setActivating(true)
    try {
      await usersApi.activate(user.id)
      onActivated?.()
    } finally {
      setActivating(false)
    }
  }

  const handleEdit = (sub: Subscribe) => {
    setEditSub(sub)
    setDialogOpen(true)
  }

  const handleDelete = (id: string) => {
    setSubs((prev) => prev.filter((s) => s.id !== id))
  }

  const handleDialogSuccess = () => {
    setEditSub(null)
    loadSubs()
  }

  return (
    <>
      <Card sx={{ mb: 1.5 }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          {/* Header row */}
          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: pending ? 'default' : 'pointer' }}
            onClick={!pending ? handleExpand : undefined}
          >
            <Box
              sx={{
                width: 40, height: 40, borderRadius: '50%',
                background: pending
                  ? 'rgba(255,145,0,0.1)'
                  : 'rgba(0,229,255,0.1)',
                border: `1px solid ${pending ? 'rgba(255,145,0,0.25)' : 'rgba(0,229,255,0.2)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0, position: 'relative',
              }}
            >
              <Person sx={{ fontSize: 20, color: pending ? 'warning.main' : 'primary.main' }} />
              {activity?.online && (
                <Box aria-label="онлайн" sx={{
                  position: 'absolute', right: -1, bottom: -1, width: 12, height: 12, borderRadius: '50%',
                  background: '#1B7F4A', border: '2px solid #fff',
                }} />
              )}
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                <Highlight text={user.email} query={query} />
              </Typography>
              {!pending && block && (
                <Typography variant="caption" color="#A3261A" display="block">
                  VPN заблокирован {blockUntilText(block.until)}{block.reason ? ` · «${block.reason}»` : ''}
                </Typography>
              )}
              {!pending && !block && activity && (
                <Typography variant="caption" display="block" noWrap
                  sx={{ color: activity.online ? '#155D37' : 'text.secondary', fontWeight: activity.online ? 600 : 400 }}>
                  {activityText(activity)}
                </Typography>
              )}
              {!pending && !block && !activity && (
                <Typography variant="caption" color="text.secondary">
                  {subs.length > 0 ? `${subs.length} подключений` : 'Нет подключений'}
                </Typography>
              )}
              {!pending && activity && (activity.custom_routes || activity.devices > 1) && (
                <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                  {activity.devices > 1 && (
                    <Chip size="small" label={`${activity.devices} устройства`} sx={{ height: 20, fontSize: '0.65rem', background: '#F0F4FF', color: '#1E5A9A' }} />
                  )}
                  {activity.custom_routes && (
                    <Chip size="small" label="свои маршруты" sx={{ height: 20, fontSize: '0.65rem', background: '#E8F5E9', color: '#155D37' }} />
                  )}
                </Box>
              )}
            </Box>

            {pending ? (
              <Button
                size="small"
                variant="contained"
                color="success"
                onClick={handleActivate}
                disabled={activating}
                startIcon={activating ? <CircularProgress size={14} /> : <CheckCircle />}
                sx={{ flexShrink: 0, borderRadius: 10, px: 2, fontSize: '0.78rem' }}
              >
                Активировать
              </Button>
            ) : (
              <IconButton size="small" sx={{ color: 'text.secondary', flexShrink: 0 }}>
                {open ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            )}
          </Box>

          {/* Expand — subscribes */}
          {!pending && (
            <Collapse in={open}>
              <Divider sx={{ my: 1.5, borderColor: 'rgba(255,255,255,0.06)' }} />

              <Button size="small" variant="contained" fullWidth onClick={() => navigate(`/admin/users/${user.id}`)}
                sx={{ mb: 1, borderRadius: 3 }}>
                Трафик, IP, домены, маршруты, доступ
              </Button>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <Button size="small" variant="outlined" onClick={() => setAccessOpen(true)} sx={{ flex: 1, borderRadius: 3 }}>
                  Доступ к выходам
                </Button>
                {block ? (
                  <Button size="small" variant="outlined" onClick={handleUnblock} disabled={unblocking} sx={{ flex: 1, borderRadius: 3 }}>
                    {unblocking ? <CircularProgress size={14} /> : 'Разблокировать'}
                  </Button>
                ) : (
                  <Button size="small" variant="outlined" color="error" onClick={() => setBlockOpen(true)} sx={{ flex: 1, borderRadius: 3 }}>
                    Заблокировать VPN
                  </Button>
                )}
              </Box>

              <Button
                size="small"
                startIcon={<Add />}
                variant="outlined"
                fullWidth
                onClick={() => { setEditSub(null); setDialogOpen(true) }}
                sx={{ mb: 1.5, borderRadius: 3, borderStyle: 'dashed' }}
              >
                Добавить подключение
              </Button>

              {loadingSubs && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              )}

              {!loadingSubs && subs.length === 0 && (
                <Typography variant="caption" color="text.secondary" display="block" textAlign="center" py={1}>
                  Нет подключений
                </Typography>
              )}

              {subs.map((sub) => (
                <SubRow
                  key={sub.id}
                  sub={sub}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </Collapse>
          )}
        </CardContent>
      </Card>

      <SubscribeDialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setEditSub(null) }}
        onSuccess={handleDialogSuccess}
        userId={user.id}
        editSub={editSub}
      />

      <UserAccessDialog userId={user.id} email={user.email} open={accessOpen} onClose={() => setAccessOpen(false)} />
      <BlockDialog open={blockOpen} userId={user.id} email={user.email} onClose={() => setBlockOpen(false)}
        onDone={() => { setBlockOpen(false); onBlockChanged?.() }} />
    </>
  )
}
