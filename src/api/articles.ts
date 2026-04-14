import api from './index'

export interface ArticleListItem {
  id: string
  title: string
  preview: string
  tags: string[]
  status: 'draft' | 'published' | 'hidden'
  created_at: string
  likes_count: number
  comments_count: number
  is_new: boolean
}

export interface ArticleDetail {
  id: string
  title: string
  content: string
  preview: string
  tags: string[]
  status: 'draft' | 'published' | 'hidden'
  author_id: string
  created_at: string
  updated_at: string
  likes_count: number
  comments_count: number
  user_liked: boolean
}

export interface Comment {
  id: string
  article_id: string
  user_id: string
  display_name: string
  email: string | null
  text: string
  created_at: string
}

export const articlesApi = {
  getList: (search?: string, tag?: string) => {
    const params: Record<string, string> = {}
    if (search) params.search = search
    if (tag) params.tag = tag
    return api.get<ArticleListItem[]>('/articles/', { params })
  },

  getDetail: (id: string) =>
    api.get<ArticleDetail>(`/articles/${id}`),

  createDraft: () =>
    api.post<{ id: string; status: string }>('/articles/'),

  update: (id: string, data: {
    title?: string
    content?: string
    tags?: string[]
    status?: string
  }) => api.put(`/articles/${id}`, data),

  delete: (id: string) =>
    api.delete(`/articles/${id}`),

  uploadImage: (articleId: string, file: File) => {
    const form = new FormData()
    form.append('file', file)
    return api.post<{ id: string; url: string }>(
      `/articles/${articleId}/images`, form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
  },

  getImageUrl: (imageId: string) =>
    `/api/v1/images/${imageId}`,

  toggleLike: (id: string) =>
    api.post<{ liked: boolean; likes_count: number }>(`/articles/${id}/like`),

  getComments: (id: string) =>
    api.get<Comment[]>(`/articles/${id}/comments`),

  addComment: (id: string, text: string) =>
    api.post<Comment>(`/articles/${id}/comments`, { text }),

  deleteComment: (commentId: string) =>
    api.delete(`/articles/comments/${commentId}`),
}
