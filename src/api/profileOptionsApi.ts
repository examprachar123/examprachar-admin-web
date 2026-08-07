import { apiClient } from '@/lib/apiClient'
import type {
  MoveDirection,
  QualificationChild,
  QualificationLevel,
  QualificationOption,
  QualificationParent,
} from '@/types/profileOptions'

export interface ConfirmRequired {
  confirm_required: true
  child_count: number
}

export const qualificationLevelsApi = {
  list: () => apiClient.getAllPages<QualificationLevel>('/admin/config/qualification-levels/'),
}

export const qualificationParentsApi = {
  list: (levelId: number) =>
    apiClient.getAllPages<QualificationParent>(`/admin/config/qualification-parents/?level=${levelId}`),
  create: (levelId: number, name: string) =>
    apiClient.post<QualificationParent>('/admin/config/qualification-parents/', { level: levelId, name }),
  remove: (id: number) =>
    apiClient.delete<ConfirmRequired>(`/admin/config/qualification-parents/${id}/`),
  removeConfirmed: (id: number) =>
    apiClient.delete<void>(`/admin/config/qualification-parents/${id}/?confirm=true`),
}

export const qualificationChildrenApi = {
  list: (parentId: number) =>
    apiClient.getAllPages<QualificationChild>(`/admin/config/qualification-children/?parent=${parentId}`),
  create: (parentId: number, name: string, order: number) =>
    apiClient.post<QualificationChild>('/admin/config/qualification-children/', {
      parent: parentId,
      name,
      order,
    }),
  remove: (id: number) => apiClient.delete<void>(`/admin/config/qualification-children/${id}/`),
  move: (id: number, direction: MoveDirection) =>
    apiClient.post<QualificationChild>(`/admin/config/qualification-children/${id}/move/`, { direction }),
}

export const qualificationOptionsApi = {
  list: (levelId: number) =>
    apiClient.getAllPages<QualificationOption>(`/admin/config/qualification-options/?level=${levelId}`),
  create: (levelId: number, name: string, order: number) =>
    apiClient.post<QualificationOption>('/admin/config/qualification-options/', {
      level: levelId,
      name,
      order,
    }),
  remove: (id: number) => apiClient.delete<void>(`/admin/config/qualification-options/${id}/`),
  move: (id: number, direction: MoveDirection) =>
    apiClient.post<QualificationOption>(`/admin/config/qualification-options/${id}/move/`, { direction }),
}
