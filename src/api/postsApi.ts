import { apiClient } from '@/lib/apiClient'
import type { ConfirmRequiredDelete, PostGroup, PostResource, PostSummary } from '@/types/posts'

// Confirmed live contract (examprachar/posts app):
// GET    /admin/posts/:resource/?group=&search=&tags=   -> PostSummary[] (paginated, list serializer)
// GET    /admin/posts/:resource/:id/                     -> full post payload (detail serializer)
// POST   /admin/posts/:resource/                          -> create, full payload -> created
// PATCH  /admin/posts/:resource/:id/                      -> update, partial payload -> updated
// DELETE /admin/posts/:resource/:id/                      -> LatestExam only: ConfirmRequiredDelete
//        without ?confirm=true (tracked_alert_count), 204 with ?confirm=true. Other types: plain 204.
// GET    /admin/posts/latest-exams/parent-options/?group=&search=  -> PostSummary[] (Tracked Alert parent picker)
// POST   /admin/posts/uploads/  multipart {file, kind: 'image'|'pdf'} -> { url }

function base(resource: PostResource) {
  return `/admin/posts/${resource}/`
}

export function makePostsApi<TDetail>(resource: PostResource) {
  return {
    list: (params: { group?: PostGroup; search?: string } = {}) => {
      const query = new URLSearchParams()
      if (params.group) query.set('group', params.group)
      if (params.search) query.set('search', params.search)
      const qs = query.toString()
      return apiClient.getAllPages<PostSummary>(`${base(resource)}${qs ? `?${qs}` : ''}`)
    },
    detail: (id: number) => apiClient.get<TDetail>(`${base(resource)}${id}/`),
    create: (payload: unknown) => apiClient.post<TDetail>(base(resource), payload),
    update: (id: number, payload: unknown) => apiClient.patch<TDetail>(`${base(resource)}${id}/`, payload),
    remove: (id: number) => apiClient.delete<ConfirmRequiredDelete | void>(`${base(resource)}${id}/`),
    removeConfirmed: (id: number) => apiClient.delete<void>(`${base(resource)}${id}/?confirm=true`),
  }
}

export const uploadsApi = {
  upload: async (file: File, kind: 'image' | 'pdf'): Promise<string> => {
    const form = new FormData()
    form.append('file', file)
    form.append('kind', kind)
    const res = await apiClient.postForm<{ url: string }>('/admin/posts/uploads/', form)
    return res.url
  },
}

export const latestExamParentOptionsApi = {
  list: (group: PostGroup, search?: string) => {
    const query = new URLSearchParams({ group })
    if (search) query.set('search', search)
    return apiClient.get<PostSummary[]>(`/admin/posts/latest-exams/parent-options/?${query.toString()}`)
  },
}
