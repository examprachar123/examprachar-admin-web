export interface OfficialSource {
  id: number
  name: string
  url: string
  host: string
  abbr: string
  color: string
  is_active: boolean
  created_at: string
}

export type PublicOfficialSource = Pick<OfficialSource, 'id' | 'name' | 'url' | 'host' | 'abbr' | 'color'>

export interface OfficialSourceInput {
  name: string
  url: string
  abbr: string
  color: string
  is_active: boolean
}
