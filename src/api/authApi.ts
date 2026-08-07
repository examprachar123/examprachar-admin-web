import { apiClient } from '@/lib/apiClient'

export interface AdminProfile {
  id: number
  username: string
  name: string
  email: string | null
  phone_number: string | null
  user_type: string
  is_admin_verified: boolean
}

export const authApi = {
  me: () => apiClient.get<AdminProfile>('/admin/auth/me/'),
}
