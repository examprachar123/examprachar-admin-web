import { apiClient } from '@/lib/apiClient'
import type { OfficialSource, OfficialSourceInput, PublicOfficialSource } from '@/types/officialSources'

export const officialSourcesApi = {
  list: () => apiClient.getAllPages<OfficialSource>('/admin/config/official-sources/?page_size=100'),
  create: (input: OfficialSourceInput) => apiClient.post<OfficialSource>('/admin/config/official-sources/', input),
  update: (id: number, input: Partial<OfficialSourceInput>) =>
    apiClient.patch<OfficialSource>(`/admin/config/official-sources/${id}/`, input),
  remove: (id: number) => apiClient.delete<void>(`/admin/config/official-sources/${id}/`),
  listPublic: () => apiClient.get<PublicOfficialSource[]>('/app/official-sources/'),
}
