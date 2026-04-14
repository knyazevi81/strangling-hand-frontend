import React, { useState } from 'react'
import {
  Box, Typography, TextField, Button, CircularProgress,
  Divider, IconButton, Tooltip, Alert,
} from '@mui/material'
import { Delete, ChatBubbleOutline } from '@mui/icons-material'
import { Comment, articlesApi } from '../../api/articles'
import { useAuthStore } from '../../store/auth'
import { formatDate } from './utils'

interface Props {
  articleId: string
  comments: Comment[]
  onCommentsChange: (comments: Comment[]) => void
}

export default function CommentsSection({ articleId, comments, onCommentsChange }: Props) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.is_superuser ?? false

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!text.trim()) return
    setLoading(true)
    setError('')
    try {
      const { data } = await articlesApi.addComment(articleId, text.trim())
      onCommentsChange([...comments, data])
      setText('')
    } catch {
      setError('Не удалось отправить комментарий')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (commentId: string) => {
    try {
      await articlesApi.deleteComment(commentId)
      onCommentsChange(comments.filter((c) => c.id !== commentId))
    } catch {
      alert('Ошибка при удалении')
    }
  }

  return (
    <Box sx={{ mt: 3 }}>
      <Divider sx={{ mb: 2 }} />

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <ChatBubbleOutline sx={{ fontSize: 18, color: '#185FA5' }} />
        <Typography variant="subtitle1" fontWeight={600} color="#042C53">
          Комментарии {comments.length > 0 && `(${comments.length})`}
        </Typography>
      </Box>

      {/* Comments list */}
      {comments.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, fontStyle: 'italic' }}>
          Будьте первым кто оставит комментарий
        </Typography>
      )}

      {comments.map((c) => (
        <Box key={c.id} sx={{
          mb: 1.5, p: 1.5,
          background: '#F8FAFF',
          border: '1px solid #E6F1FB',
          borderRadius: 2.5,
          position: 'relative',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.75 }}>
            <Box>
              <Typography variant="caption" fontWeight={600} color="#185FA5">
                {c.display_name}
              </Typography>
              {isAdmin && c.email && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  · {c.email}
                </Typography>
              )}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="caption" color="#B5D4F4">
                {formatDate(c.created_at)}
              </Typography>
              {(isAdmin || c.user_id === user?.id) && (
                <Tooltip title="Удалить">
                  <IconButton size="small" onClick={() => handleDelete(c.id)}
                    sx={{ p: 0.25, color: '#C0392B', opacity: 0.6, '&:hover': { opacity: 1 } }}>
                    <Delete sx={{ fontSize: 14 }} />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          </Box>
          <Typography variant="body2" color="#042C53" sx={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
            {c.text}
          </Typography>
        </Box>
      ))}

      {/* Add comment form */}
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
        {error && <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>{error}</Alert>}
        <TextField
          fullWidth multiline minRows={2} maxRows={6}
          placeholder="Написать комментарий..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          size="small"
          sx={{ mb: 1 }}
        />
        <Button
          type="submit" variant="contained" size="small"
          disabled={loading || !text.trim()}
          sx={{ borderRadius: 2.5 }}
        >
          {loading ? <CircularProgress size={16} color="inherit" /> : 'Отправить'}
        </Button>
      </Box>
    </Box>
  )
}
