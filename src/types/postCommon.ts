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

// --- Table content — a full grid supporting spreadsheet-style cell merging. Every
// (row, col) position holds either the merge's anchor cell (top-left; carries the text and
// its rowSpan/colSpan) or a covered marker pointing back at its anchor's position. ---------

export interface TableAnchorCell {
  kind: 'anchor'
  text: string
  rowSpan: number
  colSpan: number
}

export interface TableCoveredCell {
  kind: 'covered'
  ownerRow: number
  ownerCol: number
}

export type TableGridCell = TableAnchorCell | TableCoveredCell

export interface TableContent {
  rows: TableGridCell[][]
}

export function emptyTableCell(): TableAnchorCell {
  return { kind: 'anchor', text: '', rowSpan: 1, colSpan: 1 }
}

export function emptyTableContent(): TableContent {
  return { rows: [] }
}

function cloneTable(content: TableContent): TableContent {
  return { rows: content.rows.map((row) => row.map((cell) => ({ ...cell }))) }
}

export function tableColumnCount(content: TableContent): number {
  return content.rows[0]?.length ?? 0
}

export function resolveTableAnchor(content: TableContent, row: number, col: number): { row: number; col: number } {
  const cell = content.rows[row][col]
  return cell.kind === 'anchor' ? { row, col } : { row: cell.ownerRow, col: cell.ownerCol }
}

export function addTableRow(content: TableContent): TableContent {
  const next = cloneTable(content)
  const cols = tableColumnCount(content) || 1
  next.rows.push(Array.from({ length: cols }, () => emptyTableCell()))
  return next
}

export function addTableColumn(content: TableContent): TableContent {
  const next = cloneTable(content)
  if (next.rows.length === 0) {
    next.rows.push([emptyTableCell()])
    return next
  }
  for (const row of next.rows) row.push(emptyTableCell())
  return next
}

export function removeTableRow(content: TableContent, r: number): TableContent {
  const next = cloneTable(content)
  const cols = next.rows[r]?.length ?? 0
  if (cols === 0) return next

  // Promote anchors in row r that span downward, so their remaining span survives the row's removal.
  for (let c = 0; c < cols; c++) {
    const cell = next.rows[r][c]
    if (cell.kind === 'anchor' && cell.rowSpan > 1) {
      next.rows[r + 1][c] = { kind: 'anchor', text: cell.text, rowSpan: cell.rowSpan - 1, colSpan: cell.colSpan }
      for (let cc = c + 1; cc < c + cell.colSpan; cc++) {
        next.rows[r + 1][cc] = { kind: 'covered', ownerRow: r + 1, ownerCol: c }
      }
      for (let rr = r + 2; rr < r + cell.rowSpan; rr++) {
        for (let cc = c; cc < c + cell.colSpan; cc++) {
          const covered = next.rows[rr][cc]
          if (covered.kind === 'covered' && covered.ownerRow === r && covered.ownerCol === c) {
            next.rows[rr][cc] = { kind: 'covered', ownerRow: r + 1, ownerCol: c }
          }
        }
      }
    }
  }

  // Shrink anchors above whose span reached into row r.
  for (let c = 0; c < cols; c++) {
    const cell = next.rows[r][c]
    if (cell.kind === 'covered' && cell.ownerRow < r) {
      const owner = next.rows[cell.ownerRow][cell.ownerCol] as TableAnchorCell
      owner.rowSpan -= 1
    }
  }

  next.rows.splice(r, 1)

  // Every remaining ownerRow reference that pointed below the removed row shifts up by one.
  for (const row of next.rows) {
    for (let c = 0; c < row.length; c++) {
      const cell = row[c]
      if (cell.kind === 'covered' && cell.ownerRow > r) {
        row[c] = { ...cell, ownerRow: cell.ownerRow - 1 }
      }
    }
  }

  return next
}

export function removeTableColumn(content: TableContent, c: number): TableContent {
  const next = cloneTable(content)
  const rows = next.rows.length

  for (let r = 0; r < rows; r++) {
    const cell = next.rows[r][c]
    if (cell.kind === 'anchor' && cell.colSpan > 1) {
      next.rows[r][c + 1] = { kind: 'anchor', text: cell.text, rowSpan: cell.rowSpan, colSpan: cell.colSpan - 1 }
      for (let rr = r + 1; rr < r + cell.rowSpan; rr++) {
        next.rows[rr][c + 1] = { kind: 'covered', ownerRow: r, ownerCol: c + 1 }
      }
      for (let cc = c + 2; cc < c + cell.colSpan; cc++) {
        for (let rr = r; rr < r + cell.rowSpan; rr++) {
          const covered = next.rows[rr][cc]
          if (covered.kind === 'covered' && covered.ownerRow === r && covered.ownerCol === c) {
            next.rows[rr][cc] = { kind: 'covered', ownerRow: r, ownerCol: c + 1 }
          }
        }
      }
    }
  }

  for (let r = 0; r < rows; r++) {
    const cell = next.rows[r][c]
    if (cell.kind === 'covered' && cell.ownerCol < c) {
      const owner = next.rows[cell.ownerRow][cell.ownerCol] as TableAnchorCell
      owner.colSpan -= 1
    }
  }

  for (const row of next.rows) row.splice(c, 1)

  for (const row of next.rows) {
    for (let cc = 0; cc < row.length; cc++) {
      const cell = row[cc]
      if (cell.kind === 'covered' && cell.ownerCol > c) {
        row[cc] = { ...cell, ownerCol: cell.ownerCol - 1 }
      }
    }
  }

  return next
}

export function updateTableCellText(content: TableContent, r: number, c: number, text: string): TableContent {
  const next = cloneTable(content)
  const cell = next.rows[r][c]
  if (cell.kind === 'anchor') next.rows[r][c] = { ...cell, text }
  return next
}

/** Merges the rectangle, snapping outward to fully include any span it partially overlaps. */
export function mergeTableCells(content: TableContent, r1: number, c1: number, r2: number, c2: number): TableContent {
  const next = cloneTable(content)
  let [minR, maxR] = [Math.min(r1, r2), Math.max(r1, r2)]
  let [minC, maxC] = [Math.min(c1, c2), Math.max(c1, c2)]

  let changed = true
  while (changed) {
    changed = false
    for (let r = minR; r <= maxR; r++) {
      for (let c = minC; c <= maxC; c++) {
        const cell = next.rows[r][c]
        const anchorPos = cell.kind === 'anchor' ? { row: r, col: c } : { row: cell.ownerRow, col: cell.ownerCol }
        const anchor = next.rows[anchorPos.row][anchorPos.col] as TableAnchorCell
        const endR = anchorPos.row + anchor.rowSpan - 1
        const endC = anchorPos.col + anchor.colSpan - 1
        if (anchorPos.row < minR) { minR = anchorPos.row; changed = true }
        if (anchorPos.col < minC) { minC = anchorPos.col; changed = true }
        if (endR > maxR) { maxR = endR; changed = true }
        if (endC > maxC) { maxC = endC; changed = true }
      }
    }
  }

  const texts: string[] = []
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      const cell = next.rows[r][c]
      if (cell.kind === 'anchor' && cell.text.trim()) texts.push(cell.text.trim())
    }
  }

  next.rows[minR][minC] = { kind: 'anchor', text: texts.join(' '), rowSpan: maxR - minR + 1, colSpan: maxC - minC + 1 }
  for (let r = minR; r <= maxR; r++) {
    for (let c = minC; c <= maxC; c++) {
      if (r === minR && c === minC) continue
      next.rows[r][c] = { kind: 'covered', ownerRow: minR, ownerCol: minC }
    }
  }

  return next
}

export function unmergeTableCell(content: TableContent, r: number, c: number): TableContent {
  const next = cloneTable(content)
  const anchor = next.rows[r][c]
  if (anchor.kind !== 'anchor') return next
  const { rowSpan, colSpan, text } = anchor
  for (let rr = r; rr < r + rowSpan; rr++) {
    for (let cc = c; cc < c + colSpan; cc++) {
      next.rows[rr][cc] = emptyTableCell()
    }
  }
  next.rows[r][c] = { ...next.rows[r][c], text } as TableAnchorCell
  return next
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

// --- Important Links --------------------------------------------------------------------
// Matches ImportantLinkSerializer: {label, is_default, source_mode, url, pdf_url, order}.
// `id`/`key` below are client-only (React keys + tracking which default is missing).

export type ImportantLinkSourceMode = 'url' | 'pdf'
export type ImportantLinkKey =
  | 'apply-online'
  | 'download-notification'
  | 'official-website'
  | 'download-admit-card'
  | 'view-exam-status'
  | 'download-result'
  | 'download-cutoff-pdf'
  | 'download-answer-key'
  | 'raise-objection'
  | 'custom'

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

export const DEFAULT_ADMIT_CARD_LINKS: Omit<ImportantLinkItem, 'id' | 'order'>[] = [
  { key: 'download-admit-card', label: 'Download Admit Card', is_default: true, source_mode: 'url', url: '', pdf_url: '' },
  { key: 'view-exam-status', label: 'View Exam City / Status', is_default: true, source_mode: 'url', url: '', pdf_url: '' },
  { key: 'official-website', label: 'Official Website', is_default: true, source_mode: 'url', url: '', pdf_url: '' },
]

export const DEFAULT_RESULT_LINKS: Omit<ImportantLinkItem, 'id' | 'order'>[] = [
  { key: 'download-result', label: 'Download Result', is_default: true, source_mode: 'url', url: '', pdf_url: '' },
  { key: 'download-cutoff-pdf', label: 'Download Cut-off PDF', is_default: true, source_mode: 'url', url: '', pdf_url: '' },
  { key: 'official-website', label: 'Official Website', is_default: true, source_mode: 'url', url: '', pdf_url: '' },
]

export const DEFAULT_TRACKED_ALERT_LINKS: Omit<ImportantLinkItem, 'id' | 'order'>[] = [
  { key: 'download-answer-key', label: 'Download Answer Key', is_default: true, source_mode: 'url', url: '', pdf_url: '' },
  { key: 'raise-objection', label: 'Raise Objection', is_default: true, source_mode: 'url', url: '', pdf_url: '' },
  { key: 'official-website', label: 'Official Website', is_default: true, source_mode: 'url', url: '', pdf_url: '' },
]

export function defaultImportantLinks(templates: Omit<ImportantLinkItem, 'id' | 'order'>[] = DEFAULT_IMPORTANT_LINKS): ImportantLinkItem[] {
  return templates.map((l, order) => ({ ...l, id: crypto.randomUUID(), order }))
}

// --- Promo Ads Carousel ------------------------------------------------------------------
// Matches PromoAdSerializer: {image_url, redirect_url, internal_label, is_active, order, state}.

export interface PromoAdItem {
  id: string
  image_url: string
  redirect_url: string
  internal_label: string
  is_active: boolean
  order: number
  /** State id this ad targets, or null for all states. */
  state: number | null
}

export const MAX_PROMO_ADS = 5

// --- Target Audience field props ---------------------------------------------------------

export interface TargetAudienceFieldProps {
  section: TagSection
  value: TargetAudienceValue
  onChange: (value: TargetAudienceValue) => void
  error?: string
}
