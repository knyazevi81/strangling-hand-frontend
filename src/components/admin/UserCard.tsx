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

interface Props {
  user: User
  pending?: boolean
  onActivated?: () => void
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

export default function UserCard({ user, pending, onActivated }: Props) {
  const [open, setOpen] = useState(false)
  const [subs, setSubs] = useState<Subscribe[]>([])
  const [loadingSubs, setLoadingSubs] = useState(false)
  const [activating, setActivating] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editSub, setEditSub] = useState<Subscribe | null>(null)

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
                flexShrink: 0,
              }}
            >
              <Person sx={{ fontSize: 20, color: pending ? 'warning.main' : 'primary.main' }} />
            </Box>

            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="body2"
                fontWeight={600}
                sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {user.email}
              </Typography>
              {!pending && (
                <Typography variant="caption" color="text.secondary">
                  {subs.length > 0 ? `${subs.length} подключений` : 'Нет подключений'}
                </Typography>
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
    </>
  )
}
