export type PostGroup = 'all_updates' | 'personalized'
export type PostResource = 'latest-exams' | 'admit-cards' | 'results' | 'upcoming-exams' | 'tracked-alerts'

export interface PostSummary {
  id: number
  card_heading: string
  commission_name: string
  title: string
  group: PostGroup
  published_at: string | null
  is_urgent?: boolean
  parent?: number
}

export interface ConfirmRequiredDelete {
  confirm_required: true
  tracked_alert_count: number
}
