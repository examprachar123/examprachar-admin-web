import { apiClient } from '@/lib/apiClient'
import type { BroadcastMessage, BroadcastScope } from '@/types/broadcasts'
import type { TagSection } from '@/types/tags'

export const broadcastsApi = {
  list: (scope: BroadcastScope, section?: TagSection) =>
    apiClient.getAllPages<BroadcastMessage>(
      `/admin/config/broadcasts/?scope=${scope}${section ? `&section=${section}` : ''}`,
    ),
  create: (payload: Omit<BroadcastMessage, 'id' | 'created_at'>) =>
    apiClient.post<BroadcastMessage>('/admin/config/broadcasts/', payload),
  update: (id: number, patch: Partial<Pick<BroadcastMessage, 'text' | 'is_active' | 'order'>>) =>
    apiClient.patch<BroadcastMessage>(`/admin/config/broadcasts/${id}/`, patch),
  remove: (id: number) => apiClient.delete<void>(`/admin/config/broadcasts/${id}/`),
}
