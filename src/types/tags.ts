export type TagSection = 'latest_exam' | 'admit_card' | 'result' | 'upcoming_exam' | 'tracked_alert'

export const TAG_SECTIONS: { value: TagSection; label: string }[] = [
  { value: 'latest_exam', label: 'Latest Exams' },
  { value: 'admit_card', label: 'Admit Card' },
  { value: 'result', label: 'Result' },
  { value: 'upcoming_exam', label: 'Upcoming Exams' },
  { value: 'tracked_alert', label: 'Tracked Alerts' },
]

export type OrderedTagKind = 'top' | 'state' | 'tag'

export interface OrderedTag {
  kind: OrderedTagKind
  id: number | null
  label: string
}

export interface CustomTag {
  id: number
  section: TagSection
  name: string
  is_visible: boolean
  rank: number
  created_at: string
  post_count: number
}

export interface PscMapping {
  id: number
  state: number
  commission_name: string
  display_for_admin: string
  display_for_user: string
}
