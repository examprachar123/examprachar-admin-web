import type { TagSection } from '@/types/tags'

// --- Target Audience Tags (All Updates post forms) --------------------------------------
// UI-side selection model driven by useOrderedTags(section) (kind: 'top'|'state'|'tag').
// Wire format is separate: { tags: number[], targets_top: bool, targets_state: bool, target_states: number[] }.

export type AudienceTagKey = 'top' | `tag:${number}` | 'state'

export interface TargetAudienceValue {
  selectedKeys: AudienceTagKey[]
  /** Only meaningful when 'state' is among selectedKeys. */
  stateIds: number[]
}

export const EMPTY_TARGET_AUDIENCE: TargetAudienceValue = { selectedKeys: [], stateIds: [] }

export interface TargetAudienceWire {
  tags: number[]
  targets_top: boolean
  targets_state: boolean
  target_states: number[]
}

export function targetAudienceToWire(value: TargetAudienceValue): TargetAudienceWire {
  const tags: number[] = []
  let targets_top = false
  let targets_state = false
  for (const key of value.selectedKeys) {
    if (key === 'top') targets_top = true
    else if (key === 'state') targets_state = true
    else tags.push(Number(key.slice('tag:'.length)))
  }
  return { tags, targets_top, targets_state, target_states: targets_state ? value.stateIds : [] }
}

// --- Personalized Targeting (Personalized Latest Exam / Upcoming Exam) ----------------

export type PersonalizedGender = 'male' | 'female' | 'other' | 'all'

export type QualificationChip =
  | { id: string; levelId: number; levelName: string; mode: 'whole-level' }
  | {
      id: string
      levelId: number
      levelName: string
      mode: 'parent-child'
      parentId: number
      parentName: string
      childId: number | null
      childName: string | null
    }
  | { id: string; levelId: number; levelName: string; mode: 'flat'; optionId: number; optionName: string }

export interface PersonalizedTargetingValue {
  /** Wire format for target_region: a state id as a string, or the literal 'all_india'. */
  region: 'all-india' | { stateId: number }
  gender: PersonalizedGender
  qualifications: QualificationChip[]
}

export const EMPTY_PERSONALIZED_TARGETING: PersonalizedTargetingValue = {
  region: 'all-india',
  gender: 'all',
  qualifications: [],
}

export interface QualificationTargetWire {
  level: number
  parent: number | null
  child: number | null
  option: number | null
}

export function personalizedTargetingToWire(value: PersonalizedTargetingValue): {
  target_region: string
  target_gender: PersonalizedGender
  qualification_targets: QualificationTargetWire[]
} {
  return {
    target_region: value.region === 'all-india' ? 'all_india' : String(value.region.stateId),
    target_gender: value.gender,
    qualification_targets: value.qualifications.map((chip) => {
      if (chip.mode === 'whole-level') return { level: chip.levelId, parent: null, child: null, option: null }
      if (chip.mode === 'parent-child') {
        return { level: chip.levelId, parent: chip.parentId, child: chip.childId, option: null }
      }
      return { level: chip.levelId, parent: null, child: null, option: chip.optionId }
    }),
  }
}

// --- Optional Section Editor (Eligibility Criteria, Exam Pattern, etc.) ---------------
// Matches OptionalSectionSerializer exactly: {enabled, heading, subheading_enabled,
// subheading, content_mode, content: {bullets, text, table}}.

export type SectionContentMode = 'table' | 'bullets' | 'text'

export interface TableContent {
  headers: string[]
  rows: string[][]
}

export interface OptionalSectionValue {
  enabled: boolean
  heading: string
  subheading_enabled: boolean
  subheading: string
  content_mode: SectionContentMode
  content: {
    bullets: string[]
    text: string
    table: TableContent | null
  }
}

export function emptyOptionalSection(defaultMode: SectionContentMode = 'bullets'): OptionalSectionValue {
  return {
    enabled: false,
    heading: '',
    subheading_enabled: false,
    subheading: '',
    content_mode: defaultMode,
    content: { bullets: [], text: '', table: null },
  }
}

export function emptyTableContent(): TableContent {
  return { headers: [], rows: [] }
}

// --- Important Links --------------------------------------------------------------------
// Matches ImportantLinkSerializer: {label, is_default, source_mode, url, pdf_url, order}.
// `id`/`key` below are client-only (React keys + tracking which default is missing).

export type ImportantLinkSourceMode = 'url' | 'pdf'
export type ImportantLinkKey = 'apply-online' | 'download-notification' | 'official-website' | 'custom'

export interface ImportantLinkItem {
  id: string
  key: ImportantLinkKey
  label: string
  is_default: boolean
  source_mode: ImportantLinkSourceMode
  url: string
  pdf_url: string
  order: number
}

export const DEFAULT_IMPORTANT_LINKS: Omit<ImportantLinkItem, 'id' | 'order'>[] = [
  { key: 'apply-online', label: 'Apply Online', is_default: true, source_mode: 'url', url: '', pdf_url: '' },
  {
    key: 'download-notification',
    label: 'Download Notification',
    is_default: true,
    source_mode: 'url',
    url: '',
    pdf_url: '',
  },
  { key: 'official-website', label: 'Official Website', is_default: true, source_mode: 'url', url: '', pdf_url: '' },
]

export function defaultImportantLinks(): ImportantLinkItem[] {
  return DEFAULT_IMPORTANT_LINKS.map((l, order) => ({ ...l, id: crypto.randomUUID(), order }))
}

// --- Promo Ads Carousel ------------------------------------------------------------------
// Matches PromoAdSerializer: {image_url, redirect_url, internal_label, is_active, order}.

export interface PromoAdItem {
  id: string
  image_url: string
  redirect_url: string
  internal_label: string
  is_active: boolean
  order: number
}

export const MAX_PROMO_ADS = 5

// --- Target Audience field props ---------------------------------------------------------

export interface TargetAudienceFieldProps {
  section: TagSection
  value: TargetAudienceValue
  onChange: (value: TargetAudienceValue) => void
  error?: string
}
