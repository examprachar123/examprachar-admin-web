import { apiClient } from '@/lib/apiClient'
import type { StateItem } from '@/types/states'

export const statesApi = {
  list: () => apiClient.getAllPages<StateItem>('/admin/config/states/'),
  create: (name: string) =>
    apiClient.post<StateItem>('/admin/config/states/', { name, is_active: true }),
  setActive: (id: number, isActive: boolean) =>
    apiClient.patch<StateItem>(`/admin/config/states/${id}/`, { is_active: isActive }),
  rename: (id: number, name: string) =>
    apiClient.patch<StateItem>(`/admin/config/states/${id}/`, { name }),
  remove: (id: number) => apiClient.delete<void>(`/admin/config/states/${id}/`),
}
