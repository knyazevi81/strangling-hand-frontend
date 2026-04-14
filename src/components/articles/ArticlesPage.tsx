import React, { useEffect, useState, useCallback, useRef } from 'react'
import {
  Box, Typography, TextField, InputAdornment,
  Skeleton, Card, CardContent, Button, Alert,
  Chip,
} from '@mui/material'
import { Search, Add, Article } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { articlesApi, ArticleListItem } from '../../api/articles'
import { useAuthStore } from '../../store/auth'
import ArticleCard from './ArticleCard'
import { getTagColor } from './utils'

export default function ArticlesPage() {
  const [articles, setArticles] = useState<ArticleListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [activeTag, setActiveTag] = useState<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const user = useAuthStore((s) => s.user)
  const navigate = useNavigate()
  const isAdmin = user?.is_superuser ?? false

  const fetchArticles = useCallback(async (q: string, tag: string | null) => {
    setLoading(true)
    setError('')
    try {
      const { data } = await articlesApi.getList(q || undefined, tag || undefined)
      setArticles(data)
    } catch {
      setError('Не удалось загрузить статьи')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchArticles('', null) }, [fetchArticles])

  const handleSearch = (value: string) => {
    setSearch(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchArticles(value, activeTag), 400)
  }

  const handleTagClick = (tag: string) => {
    const next = activeTag === tag ? null : tag
    setActiveTag(next)
    fetchArticles(search, next)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить статью?')) return
    try {
      await articlesApi.delete(id)
      setArticles((prev) => prev.filter((a) => a.id !== id))
    } catch {
      alert('Ошибка при удалении')
    }
  }

  const handleCreate = async () => {
    try {
      const { data } = await articlesApi.createDraft()
      navigate(`/articles/${data.id}/edit`)
    } catch {
      alert('Не удалось создать статью')
    }
  }

  // Collect all unique tags from loaded articles
  const allTags = Array.from(new Set(articles.flatMap((a) => a.tags)))

  // Admin stats
  const published = articles.filter((a) => a.status === 'published').length
  const drafts = articles.filter((a) => a.status === 'draft').length
  const totalLikes = articles.reduce((s, a) => s + a.likes_count, 0)

  return (
    <Box sx={{ pb: 2 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box>
          <Typography variant="h5">Статьи</Typography>
          <Typography variant="body2" color="text.secondary" mt={0.3}>
            {loading ? '...' : `${articles.length} статей`}
          </Typography>
        </Box>
        {isAdmin && (
          <Button variant="contained" size="small" startIcon={<Add />}
            onClick={handleCreate}
            sx={{ borderRadius: 2.5, px: 2 }}
          >
            Написать
          </Button>
        )}
      </Box>

      {/* Search */}
      <TextField
        fullWidth placeholder="Поиск..." value={search}
        onChange={(e) => handleSearch(e.target.value)}
        size="small"
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search sx={{ fontSize: 18, color: '#B5D4F4' }} />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 1.5 }}
      />

      {/* Tag filter pills */}
      {allTags.length > 0 && (
        <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2 }}>
          {allTags.map((tag) => {
            const c = getTagColor(tag)
            const active = activeTag === tag
            return (
              <Chip key={tag} label={`#${tag}`} size="small"
                onClick={() => handleTagClick(tag)}
                sx={{
                  fontSize: '0.68rem', height: 24, fontWeight: 500,
                  cursor: 'pointer',
                  background: active ? c.color : c.bg,
                  color: active ? '#fff' : c.color,
                  border: `1px solid ${c.border}`,
                  transition: 'all 0.2s',
                }}
              />
            )
          })}
        </Box>
      )}

      {/* Admin stats */}
      {isAdmin && !loading && (
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          {[
            { label: 'опубликовано', value: published, bg: '#E6F1FB', color: '#185FA5' },
            { label: 'черновиков', value: drafts, bg: '#F1EFE8', color: '#888' },
            { label: 'лайков', value: totalLikes, bg: '#E6F1FB', color: '#185FA5' },
          ].map((s) => (
            <Box key={s.label} sx={{
              flex: 1, background: s.bg, borderRadius: 2,
              py: 1, textAlign: 'center',
            }}>
              <Typography fontWeight={600} color={s.color} fontSize={18}>{s.value}</Typography>
              <Typography variant="caption" color={s.color} sx={{ opacity: 0.8 }}>{s.label}</Typography>
            </Box>
          ))}
        </Box>
      )}

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {/* Skeletons */}
      {loading && [1, 2, 3].map((i) => (
        <Card key={i} sx={{ mb: 1.5, border: '1px solid #E6F1FB' }}>
          <CardContent sx={{ p: 2 }}>
            <Skeleton width="70%" height={20} sx={{ mb: 0.75 }} />
            <Skeleton width="30%" height={14} sx={{ mb: 1 }} />
            <Skeleton width="90%" height={14} sx={{ mb: 0.5 }} />
            <Skeleton width="60%" height={14} />
          </CardContent>
        </Card>
      ))}

      {/* Empty state */}
      {!loading && articles.length === 0 && !error && (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 5 }}>
            <Article sx={{ fontSize: 48, color: '#B5D4F4', mb: 1.5 }} />
            <Typography variant="subtitle1" color="#185FA5" fontWeight={500}>
              {search || activeTag ? 'Ничего не найдено' : 'Статей пока нет'}
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Article cards */}
      {articles.map((a) => (
        <ArticleCard
          key={a.id} article={a}
          isAdmin={isAdmin}
          onDelete={handleDelete}
        />
      ))}
    </Box>
  )
}
