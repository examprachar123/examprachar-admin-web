import { apiClient } from '@/lib/apiClient'
import type { CustomTag, OrderedTag, PscMapping, TagSection } from '@/types/tags'

export interface DeleteTagResult {
  deleted: true
  post_count: number
}

export const tagsApi = {
  orderedOptions: (section: TagSection) =>
    apiClient.get<OrderedTag[]>(`/admin/config/tags/ordered-options/?section=${section}`),
  customList: (section: TagSection) =>
    apiClient.getAllPages<CustomTag>(`/admin/config/tags/?section=${section}`),
  createCustom: (section: TagSection, name: string, rank: number) =>
    apiClient.post<CustomTag>('/admin/config/tags/', { section, name, is_visible: true, rank }),
  updateCustom: (id: number, patch: Partial<Pick<CustomTag, 'name' | 'is_visible'>>) =>
    apiClient.patch<CustomTag>(`/admin/config/tags/${id}/`, patch),
  reorderCustom: (id: number, newRank: number) =>
    apiClient.post<CustomTag>(`/admin/config/tags/${id}/reorder/`, { new_rank: newRank }),
  deleteCustom: (id: number) => apiClient.delete<DeleteTagResult>(`/admin/config/tags/${id}/`),

  listPscMappings: (stateId: number) =>
    apiClient.getAllPages<PscMapping>(`/admin/config/psc-mappings/?state=${stateId}`),
  createPscMapping: (stateId: number, commissionName: string) =>
    apiClient.post<PscMapping>('/admin/config/psc-mappings/', {
      state: stateId,
      commission_name: commissionName,
    }),
  updatePscMapping: (id: number, commissionName: string) =>
    apiClient.patch<PscMapping>(`/admin/config/psc-mappings/${id}/`, { commission_name: commissionName }),
}
