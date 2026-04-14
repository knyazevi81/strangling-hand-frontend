import React from 'react'
import {
  Box, Typography, Chip, Card, CardActionArea,
  CardContent, IconButton, Tooltip,
} from '@mui/material'
import { Edit, Delete, FavoriteBorder, ChatBubbleOutline } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { ArticleListItem } from '../../api/articles'
import { getTagColor, formatDate } from './utils'

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  published: { label: 'Опубликовано', color: '#3B6D11', bg: '#EAF3DE' },
  draft:     { label: 'Черновик',     color: '#888780', bg: '#F1EFE8' },
  hidden:    { label: 'Скрыто',       color: '#993C1D', bg: '#FAECE7' },
}

interface Props {
  article: ArticleListItem
  isAdmin: boolean
  onDelete?: (id: string) => void
}

export default function ArticleCard({ article, isAdmin, onDelete }: Props) {
  const navigate = useNavigate()
  const isDraft = article.status !== 'published'
  const statusInfo = STATUS_LABELS[article.status]

  return (
    <Card
      sx={{
        mb: 1.5,
        border: isDraft && isAdmin ? '1.5px dashed #D3D1C7' : '1px solid #B5D4F4',
        background: isDraft && isAdmin ? '#FAFAF8' : '#fff',
        opacity: isDraft && isAdmin ? 0.85 : 1,
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: '0 2px 12px rgba(24,95,165,0.1)' },
      }}
    >
      <CardActionArea onClick={() => navigate(`/articles/${article.id}`)} sx={{ borderRadius: 'inherit' }}>
        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
          {/* Top row */}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 0.5 }}>
            <Typography variant="subtitle1" fontWeight={600} color="#042C53"
              sx={{ lineHeight: 1.3, flex: 1 }}
            >
              {article.title || <span style={{ color: '#B5D4F4', fontStyle: 'italic' }}>Без заголовка</span>}
            </Typography>
            <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
              {article.is_new && !isDraft && (
                <Chip label="Новое" size="small" sx={{
                  fontSize: '0.65rem', height: 20, fontWeight: 600,
                  background: '#E6F1FB', color: '#185FA5', border: '1px solid #B5D4F4',
                }} />
              )}
              {isAdmin && (
                <Chip label={statusInfo.label} size="small" sx={{
                  fontSize: '0.65rem', height: 20, fontWeight: 500,
                  background: statusInfo.bg, color: statusInfo.color,
                }} />
              )}
            </Box>
          </Box>

          {/* Date */}
          <Typography variant="caption" color="#B5D4F4" display="block" mb={0.75}>
            {formatDate(article.created_at)}
          </Typography>

          {/* Preview */}
          {article.preview ? (
            <Typography variant="body2" color="#888" sx={{
              lineHeight: 1.5, mb: 1.25,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}>
              {article.preview}
            </Typography>
          ) : (
            <Typography variant="body2" color="#D3D1C7" sx={{ mb: 1.25, fontStyle: 'italic' }}>
              Статья ещё не написана...
            </Typography>
          )}

          {/* Tags + counters */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
            {article.tags.map((tag) => {
              const c = getTagColor(tag)
              return (
                <Chip key={tag} label={`#${tag}`} size="small" sx={{
                  fontSize: '0.65rem', height: 20, fontWeight: 500,
                  background: c.bg, color: c.color,
                  border: `1px solid ${c.border}`,
                }} />
              )
            })}
            <Box sx={{ ml: 'auto', display: 'flex', gap: 1, alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                <FavoriteBorder sx={{ fontSize: 13, color: '#B5D4F4' }} />
                <Typography variant="caption" color="#B5D4F4">{article.likes_count}</Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
                <ChatBubbleOutline sx={{ fontSize: 13, color: '#B5D4F4' }} />
                <Typography variant="caption" color="#B5D4F4">{article.comments_count}</Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </CardActionArea>

      {/* Admin actions */}
      {isAdmin && (
        <Box
          sx={{
            display: 'flex', gap: 0.5, px: 1.5, pb: 1.5, pt: 0,
            borderTop: '1px solid #F0F4FF',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <Tooltip title="Редактировать">
            <IconButton size="small" onClick={() => navigate(`/articles/${article.id}/edit`)}
              sx={{ color: '#185FA5', '&:hover': { background: '#E6F1FB' } }}>
              <Edit fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Удалить">
            <IconButton size="small" onClick={() => onDelete?.(article.id)}
              sx={{ color: '#C0392B', '&:hover': { background: '#FEF0F0' } }}>
              <Delete fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      )}
    </Card>
  )
}
