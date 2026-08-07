export type QualificationStructure = 'two_level' | 'one_level' | 'none'

export interface QualificationLevel {
  id: number
  name: string
  structure: QualificationStructure
  order: number
}

/** Cosmetic copy overrides for specific levels, keyed by QualificationLevel.name. */
export const LEVEL_COPY_OVERRIDES: Record<string, { flatListLabel?: string; itemLabel?: string }> = {
  ITI: { flatListLabel: 'Manage Trades', itemLabel: 'trade' },
}

export interface QualificationParent {
  id: number
  level: number
  name: string
  created_at: string
  child_count: number
}

export interface QualificationChild {
  id: number
  parent: number
  name: string
  order: number
}

export interface QualificationOption {
  id: number
  level: number
  name: string
  order: number
}

export type MoveDirection = 'up' | 'down'
