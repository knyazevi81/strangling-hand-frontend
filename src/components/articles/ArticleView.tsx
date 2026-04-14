import React, { useEffect, useState } from 'react'
import {
  Box, Typography, Chip, IconButton, Button,
  CircularProgress, Alert, Skeleton, Tooltip,
} from '@mui/material'
import {
  ArrowBack, Favorite, FavoriteBorder, Edit,
  Visibility, VisibilityOff,
} from '@mui/icons-material'
import { useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { articlesApi, ArticleDetail, Comment } from '../../api/articles'
import { useAuthStore } from '../../store/auth'
import { getTagColor, formatDate } from './utils'
import CommentsSection from './CommentsSection'

const API_BASE = (import.meta as any).env?.VITE_API_BASE || ''

export default function ArticleView() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const isAdmin = user?.is_superuser ?? false

  const [article, setArticle] = useState<ArticleDetail | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [likeLoading, setLikeLoading] = useState(false)
  const [statusLoading, setStatusLoading] = useState(false)

  useEffect(() => {
    if (!id) return
    Promise.all([
      articlesApi.getDetail(id),
      articlesApi.getComments(id),
    ]).then(([artRes, comRes]) => {
      setArticle(artRes.data)
      setComments(comRes.data)
    }).catch(() => {
      setError('Не удалось загрузить статью')
    }).finally(() => setLoading(false))
  }, [id])

  const handleLike = async () => {
    if (!article || likeLoading) return
    setLikeLoading(true)
    try {
      const { data } = await articlesApi.toggleLike(article.id)
      setArticle((prev) => prev ? { ...prev, user_liked: data.liked, likes_count: data.likes_count } : prev)
    } finally {
      setLikeLoading(false)
    }
  }

  const handleStatusToggle = async () => {
    if (!article) return
    const nextStatus = article.status === 'published' ? 'hidden' : 'published'
    setStatusLoading(true)
    try {
      await articlesApi.update(article.id, { status: nextStatus })
      setArticle((prev) => prev ? { ...prev, status: nextStatus } : prev)
    } finally {
      setStatusLoading(false)
    }
  }

  if (loading) return (
    <Box sx={{ pb: 2 }}>
      <Skeleton width={200} height={40} sx={{ mb: 2 }} />
      <Skeleton width="100%" height={24} sx={{ mb: 1 }} />
      <Skeleton width="80%" height={24} sx={{ mb: 1 }} />
      <Skeleton width="90%" height={24} />
    </Box>
  )

  if (error) return (
    <Box sx={{ pb: 2 }}>
      <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>
    </Box>
  )

  if (!article) return null

  return (
    <Box sx={{ pb: 2 }}>
      {/* Back + actions */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton size="small" onClick={() => navigate('/articles')}
          sx={{ border: '1px solid #E6F1FB', borderRadius: 2, background: '#fff' }}>
          <ArrowBack sx={{ fontSize: 18, color: '#185FA5' }} />
        </IconButton>
        <Box sx={{ flex: 1 }} />
        {isAdmin && (
          <>
            <Tooltip title="Редактировать">
              <IconButton size="small" onClick={() => navigate(`/articles/${article.id}/edit`)}
                sx={{ border: '1px solid #E6F1FB', borderRadius: 2, background: '#fff' }}>
                <Edit sx={{ fontSize: 18, color: '#185FA5' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title={article.status === 'published' ? 'Скрыть' : 'Опубликовать'}>
              <IconButton size="small" onClick={handleStatusToggle} disabled={statusLoading}
                sx={{ border: '1px solid #E6F1FB', borderRadius: 2, background: '#fff' }}>
                {statusLoading
                  ? <CircularProgress size={16} />
                  : article.status === 'published'
                  ? <VisibilityOff sx={{ fontSize: 18, color: '#888' }} />
                  : <Visibility sx={{ fontSize: 18, color: '#185FA5' }} />
                }
              </IconButton>
            </Tooltip>
          </>
        )}
      </Box>

      {/* Title */}
      <Typography variant="h5" fontWeight={700} color="#042C53" sx={{ mb: 1, lineHeight: 1.3 }}>
        {article.title || 'Без заголовка'}
      </Typography>

      {/* Meta */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, flexWrap: 'wrap' }}>
        <Typography variant="caption" color="#B5D4F4">{formatDate(article.created_at)}</Typography>
        {article.tags.map((tag) => {
          const c = getTagColor(tag)
          return (
            <Chip key={tag} label={`#${tag}`} size="small" sx={{
              fontSize: '0.65rem', height: 20, fontWeight: 500,
              background: c.bg, color: c.color, border: `1px solid ${c.border}`,
            }} />
          )
        })}
      </Box>

      {/* Content */}
      <Box sx={{
        '& h1,& h2,& h3,& h4': { color: '#042C53', fontFamily: '"Outfit", sans-serif', mt: 2.5, mb: 1 },
        '& h1': { fontSize: '1.5rem', fontWeight: 700 },
        '& h2': { fontSize: '1.25rem', fontWeight: 600 },
        '& h3': { fontSize: '1.1rem', fontWeight: 600 },
        '& p': { color: '#185FA5', lineHeight: 1.75, mb: 1.5, fontSize: '0.95rem' },
        '& strong': { color: '#042C53' },
        '& a': { color: '#185FA5', textDecoration: 'underline' },
        '& code': {
          fontFamily: 'monospace', fontSize: '0.82rem',
          background: '#E6F1FB', color: '#042C53',
          px: 0.75, py: 0.25, borderRadius: 1,
        },
        '& pre': {
          background: '#F0F4FF', border: '1px solid #E6F1FB',
          borderRadius: 2, p: 2, overflowX: 'auto', mb: 1.5,
        },
        '& pre code': { background: 'none', p: 0 },
        '& blockquote': {
          borderLeft: '3px solid #185FA5', pl: 2,
          color: '#378ADD', fontStyle: 'italic', my: 1.5,
        },
        '& ul,& ol': { pl: 2.5, mb: 1.5, color: '#185FA5' },
        '& li': { mb: 0.5 },
        '& img': { maxWidth: '100%', borderRadius: 2, my: 1.5 },
        '& table': { width: '100%', borderCollapse: 'collapse', mb: 1.5 },
        '& th,& td': {
          border: '1px solid #E6F1FB', p: 1,
          fontSize: '0.85rem', color: '#042C53',
        },
        '& th': { background: '#F0F4FF', fontWeight: 600 },
        '& hr': { border: 'none', borderTop: '1px solid #E6F1FB', my: 2 },
      }}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            img: ({ src, alt }) => {
              const finalSrc = src?.startsWith('/api/') ? `${API_BASE}${src}` : src
              return <img src={finalSrc} alt={alt} style={{ maxWidth: '100%', borderRadius: 8 }} />
            },
          }}
        >
          {article.content || '*Статья пустая*'}
        </ReactMarkdown>
      </Box>

      {/* Like button */}
      <Box sx={{
        display: 'flex', alignItems: 'center', gap: 1, mt: 2, pt: 2,
        borderTop: '1px solid #E6F1FB',
      }}>
        <IconButton onClick={handleLike} disabled={likeLoading}
          sx={{
            border: `1px solid ${article.user_liked ? '#E53935' : '#E6F1FB'}`,
            borderRadius: 2, background: article.user_liked ? '#FEF0F0' : '#fff',
            transition: 'all 0.2s',
          }}>
          {article.user_liked
            ? <Favorite sx={{ fontSize: 18, color: '#E53935' }} />
            : <FavoriteBorder sx={{ fontSize: 18, color: '#B5D4F4' }} />
          }
        </IconButton>
        <Typography variant="body2" color={article.user_liked ? '#E53935' : 'text.secondary'} fontWeight={500}>
          {article.likes_count}
        </Typography>
      </Box>

      {/* Comments */}
      <CommentsSection
        articleId={article.id}
        comments={comments}
        onCommentsChange={setComments}
      />
    </Box>
  )
}
