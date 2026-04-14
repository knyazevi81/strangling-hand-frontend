import React, { useEffect, useState, useRef, useCallback } from 'react'
import {
  Box, Typography, TextField, IconButton, Button,
  Chip, CircularProgress, Tooltip, Alert, Snackbar,
} from '@mui/material'
import {
  ArrowBack, Visibility, VisibilityOff,
  Save, Publish, Check,
} from '@mui/icons-material'
import { useNavigate, useParams } from 'react-router-dom'
import MDEditor from '@uiw/react-md-editor'
import { articlesApi } from '../../api/articles'
import { useAuthStore } from '../../store/auth'
import { getTagColor } from './utils'

const API_BASE = 'https://api.savebit.ru'

export default function ArticleEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [status, setStatus] = useState('draft')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [snack, setSnack] = useState('')
  const [previewMode, setPreviewMode] = useState<'edit' | 'preview' | 'live'>('live')

  const isDirtyRef = useRef(false)
  const autoSaveRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const editorRef = useRef<HTMLDivElement | null>(null)

  // Load article
  useEffect(() => {
    if (!id) return
    articlesApi.getDetail(id).then(({ data }) => {
      setTitle(data.title)
      setContent(data.content)
      setTags(data.tags)
      setStatus(data.status)
    }).catch(() => setError('Не удалось загрузить статью'))
      .finally(() => setLoading(false))
  }, [id])

  // Autosave every 30s
  useEffect(() => {
    autoSaveRef.current = setInterval(async () => {
      if (!isDirtyRef.current || !id) return
      await doSave()
    }, 30_000)
    return () => { if (autoSaveRef.current) clearInterval(autoSaveRef.current) }
  }, [id, title, content, tags])

  const doSave = useCallback(async (newStatus?: string) => {
    if (!id) return
    setSaving(true)
    try {
      await articlesApi.update(id, {
        title, content, tags,
        status: newStatus ?? status,
      })
      if (newStatus) setStatus(newStatus)
      isDirtyRef.current = false
      const now = new Date()
      setSavedAt(`${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`)
      setSnack(newStatus === 'published' ? 'Статья опубликована!' : newStatus === 'hidden' ? 'Статья скрыта' : '')
    } catch {
      setError('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }, [id, title, content, tags, status])

  const markDirty = () => { isDirtyRef.current = true }

  // Tag input
  const addTag = (raw: string) => {
    const tag = raw.trim().replace(/^#/, '').toLowerCase()
    if (tag && !tags.includes(tag)) {
      setTags((prev) => [...prev, tag])
      markDirty()
    }
    setTagInput('')
  }

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag))
    markDirty()
  }

  // Image upload helper
  const uploadImage = async (file: File): Promise<string | null> => {
    if (!id) return null
    try {
      const { data } = await articlesApi.uploadImage(id, file)
      return `${API_BASE}${data.url}`
    } catch {
      setError('Ошибка загрузки изображения')
      return null
    }
  }

  // Insert text at cursor in MDEditor
  const insertAtCursor = (text: string) => {
    setContent((prev) => prev + '\n' + text + '\n')
    markDirty()
  }

  // Drag & drop on editor area
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith('image/'))
    for (const file of files) {
      const url = await uploadImage(file)
      if (url) insertAtCursor(`![${file.name}](${url})`)
    }
  }

  // Paste image from clipboard
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = Array.from(e.clipboardData.items)
    const imgItem = items.find((i) => i.type.startsWith('image/'))
    if (!imgItem) return
    const file = imgItem.getAsFile()
    if (!file) return
    const url = await uploadImage(file)
    if (url) insertAtCursor(`![изображение](${url})`)
  }

  if (loading) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', pt: 4 }}>
      <CircularProgress sx={{ color: '#185FA5' }} />
    </Box>
  )

  const isMobile = window.innerWidth < 600

  return (
    <Box sx={{ pb: 2 }} onDrop={handleDrop} onDragOver={(e) => e.preventDefault()} onPaste={handlePaste}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <IconButton size="small" onClick={() => navigate('/articles')}
          sx={{ border: '1px solid #E6F1FB', borderRadius: 2, background: '#fff' }}>
          <ArrowBack sx={{ fontSize: 18, color: '#185FA5' }} />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          {savedAt && (
            <Typography variant="caption" color="text.secondary">
              Сохранено в {savedAt}
            </Typography>
          )}
        </Box>
        <Tooltip title="Переключить режим просмотра">
          <IconButton size="small"
            onClick={() => setPreviewMode((p) => p === 'live' ? 'edit' : p === 'edit' ? 'preview' : 'live')}
            sx={{ border: '1px solid #E6F1FB', borderRadius: 2, background: '#fff' }}>
            {previewMode === 'preview'
              ? <Visibility sx={{ fontSize: 18, color: '#185FA5' }} />
              : <VisibilityOff sx={{ fontSize: 18, color: '#888' }} />
            }
          </IconButton>
        </Tooltip>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

      {/* Title */}
      <TextField
        fullWidth placeholder="Заголовок статьи..."
        value={title}
        onChange={(e) => { setTitle(e.target.value); markDirty() }}
        variant="standard"
        InputProps={{
          disableUnderline: false,
          style: { fontSize: '1.4rem', fontWeight: 700, color: '#042C53' },
        }}
        sx={{
          mb: 2,
          '& .MuiInput-underline:before': { borderColor: '#E6F1FB' },
          '& .MuiInput-underline:hover:before': { borderColor: '#185FA5' },
        }}
      />

      {/* Tags */}
      <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', alignItems: 'center', mb: 2 }}>
        {tags.map((tag) => {
          const c = getTagColor(tag)
          return (
            <Chip key={tag} label={`#${tag}`} size="small"
              onDelete={() => removeTag(tag)}
              sx={{
                fontSize: '0.68rem', height: 24, fontWeight: 500,
                background: c.bg, color: c.color, border: `1px solid ${c.border}`,
              }}
            />
          )
        })}
        <TextField
          size="small" placeholder="Добавить тег..."
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ',') {
              e.preventDefault()
              addTag(tagInput)
            }
          }}
          onBlur={() => { if (tagInput.trim()) addTag(tagInput) }}
          sx={{
            width: 140,
            '& .MuiOutlinedInput-root': { height: 24, fontSize: '0.75rem', borderRadius: 10 },
            '& .MuiOutlinedInput-input': { py: 0.5, px: 1.5 },
          }}
        />
      </Box>

      {/* Editor hint */}
      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
        💡 Перетащи картинку в редактор или вставь из буфера (Ctrl+V)
      </Typography>

      {/* MDEditor */}
      <Box data-color-mode="light" ref={editorRef}>
        <MDEditor
          value={content}
          onChange={(val) => { setContent(val || ''); markDirty() }}
          preview={isMobile ? 'edit' : previewMode}
          height={isMobile ? 400 : 500}
          style={{ border: '1px solid #B5D4F4', borderRadius: 12 }}
          visibleDragbar={false}
        />
      </Box>

      {/* Action buttons */}
      <Box sx={{ display: 'flex', gap: 1, mt: 2, flexWrap: 'wrap' }}>
        <Button variant="outlined" size="small" startIcon={saving ? <CircularProgress size={14} /> : <Save />}
          onClick={() => doSave()} disabled={saving} sx={{ borderRadius: 2.5 }}>
          Сохранить черновик
        </Button>

        {status !== 'published' ? (
          <Button variant="contained" size="small" startIcon={<Publish />}
            onClick={() => doSave('published')} disabled={saving}
            sx={{ borderRadius: 2.5 }}>
            Опубликовать
          </Button>
        ) : (
          <Button variant="outlined" size="small" startIcon={<VisibilityOff />}
            onClick={() => doSave('hidden')} disabled={saving}
            sx={{ borderRadius: 2.5, borderColor: '#D3D1C7', color: '#888' }}>
            Скрыть
          </Button>
        )}

        {status === 'published' && (
          <Button variant="outlined" size="small" color="success"
            startIcon={<Check />}
            onClick={() => navigate(`/articles/${id}`)}
            sx={{ borderRadius: 2.5 }}>
            Посмотреть
          </Button>
        )}
      </Box>

      <Snackbar
        open={!!snack} autoHideDuration={3000} onClose={() => setSnack('')}
        message={snack}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      />
    </Box>
  )
}
