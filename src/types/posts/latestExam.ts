import {
  defaultImportantLinks,
  emptyOptionalSection,
  emptyTableContent,
  personalizedTargetingToWire,
  targetAudienceToWire,
  type ImportantLinkItem,
  type OptionalSectionValue,
  type PersonalizedTargetingValue,
  type PromoAdItem,
  type TableContent,
  type TargetAudienceValue,
} from '@/types/postCommon'
import { EMPTY_PERSONALIZED_TARGETING, EMPTY_TARGET_AUDIENCE } from '@/types/postCommon'

// --- Important Dates — matches ImportantDateItemSerializer exactly ---------------------

export interface ImportantDateRow {
  id: string
  label: string
  removable: boolean
  mode: 'date' | 'text'
  value: string
  is_critical: boolean
}

function fixedDateRow(label: string, isCritical: boolean): ImportantDateRow {
  return { id: crypto.randomUUID(), label, removable: false, mode: 'date', value: '', is_critical: isCritical }
}

function customDateRow(): ImportantDateRow {
  return { id: crypto.randomUUID(), label: '', removable: true, mode: 'date', value: '', is_critical: false }
}

// --- Vacancy Details — matches VacancyDetailsSerializer (table-only, no bullets/text) --

export interface VacancyDetailsValue {
  enabled: boolean
  heading: string
  subheading: string
  table: TableContent | null
}

function emptyVacancyDetails(): VacancyDetailsValue {
  return { enabled: false, heading: '', subheading: '', table: null }
}

// --- Post-Wise Details — matches PostWiseDetailSerializer exactly ----------------------

export interface PostWiseEntry {
  id: string
  post_name: string
  education_level: string
  pay_scale: string
  age_limit: { mode: 'single' | 'range' | 'text'; value: string }
  vacancy: { mode: 'number' | 'text'; value: string }
  experience_required: boolean
  post_details: string
  education_details: string
  experience_details: string
  department_info: string
  additional_details: { heading: string; content: string }
  category_wise_vacancy: { label: string; count: number }[]
  /** Client-only UI state for the "Post Details & Eligibility" expander. */
  detailsExpanded: boolean
}

export function emptyPostWiseEntry(): PostWiseEntry {
  return {
    id: crypto.randomUUID(),
    post_name: '',
    education_level: '',
    pay_scale: '',
    age_limit: { mode: 'text', value: '' },
    vacancy: { mode: 'text', value: '' },
    experience_required: false,
    post_details: '',
    education_details: '',
    experience_details: '',
    department_info: '',
    additional_details: { heading: '', content: '' },
    category_wise_vacancy: [],
    detailsExpanded: false,
  }
}

// --- Quick Overview Stats — quick_overview is a freeform JSONField server-side; this is
// our own convention for it (Fee / Age / Total Posts, each independently pairs/text/table). --

export interface StatBoxPair {
  id: string
  label: string
  value: string
}

export type StatBoxMode = 'pairs' | 'text' | 'table'

export interface StatBox {
  mode: StatBoxMode
  title: string
  /** Optional — may be left blank. */
  subtitle: string
  pairs: StatBoxPair[]
  table: TableContent | null
  /** When true, this stat renders as its own full-width row instead of pairing up two-per-row. */
  fullWidth: boolean
}

export function emptyStatBox(): StatBox {
  return { mode: 'text', title: '', subtitle: '', pairs: [], table: null, fullWidth: false }
}

function statBoxToWire(box: StatBox) {
  return {
    mode: box.mode,
    title: box.title,
    subtitle: box.subtitle,
    pairs: box.pairs.map(({ label, value }) => ({ label, value })),
    table: box.table,
    fullWidth: box.fullWidth,
  }
}

/** Accepts both the current StatBox shape and the legacy {mode: 'text'|'table', value|text} shape. */
function normalizeStatBox(raw: unknown): StatBox {
  if (!raw || typeof raw !== 'object') return emptyStatBox()
  const r = raw as Partial<StatBox> & { value?: string; text?: string }
  const mode: StatBoxMode = r.mode === 'pairs' || r.mode === 'table' ? r.mode : 'text'
  return {
    mode,
    title: typeof r.title === 'string' ? r.title : typeof r.text === 'string' ? r.text : typeof r.value === 'string' ? r.value : '',
    subtitle: typeof r.subtitle === 'string' ? r.subtitle : '',
    fullWidth: typeof r.fullWidth === 'boolean' ? r.fullWidth : mode === 'table',
    pairs: Array.isArray(r.pairs) ? r.pairs.map((p) => ({ id: crypto.randomUUID(), label: p.label ?? '', value: p.value ?? '' })) : [],
    table: r.table ?? null,
  }
}

// --- Full form model ---------------------------------------------------------------------

export interface LatestExamFormValues {
  variant: 'all-updates' | 'personalized'
  targetAudience: TargetAudienceValue
  personalizedTargeting: PersonalizedTargetingValue

  card_heading: string
  commission_name: string
  title: string
  commission_name_hero: string
  title_hero: string

  apply_by_mode: 'select_date' | 'custom_text'
  apply_by_date: string
  apply_by_text: string

  vacancies_text: string
  qualification_icon: string | null
  qualification_text: string

  important_dates: ImportantDateRow[]

  quick_overview: { fee: StatBox; age: StatBox; totalPosts: StatBox }

  vacancy_details: VacancyDetailsValue
  post_wise_details: PostWiseEntry[]
  eligibility: OptionalSectionValue
  promo_ads: PromoAdItem[]
  exam_pattern: OptionalSectionValue
  physical_eligibility: OptionalSectionValue
  mode_of_selection: OptionalSectionValue
  additional_information: OptionalSectionValue
  custom_content_boxes: (OptionalSectionValue & { id: string })[]
  important_links: ImportantLinkItem[]
}

export function emptyLatestExamForm(variant: 'all-updates' | 'personalized'): LatestExamFormValues {
  return {
    variant,
    targetAudience: EMPTY_TARGET_AUDIENCE,
    personalizedTargeting: EMPTY_PERSONALIZED_TARGETING,

    card_heading: '',
    commission_name: '',
    title: '',
    commission_name_hero: '',
    title_hero: '',

    apply_by_mode: 'select_date',
    apply_by_date: '',
    apply_by_text: '',

    vacancies_text: '',
    qualification_icon: null,
    qualification_text: '',

    important_dates: [fixedDateRow('Apply Start Date', false), fixedDateRow('Apply Last Date', true)],

    quick_overview: { fee: emptyStatBox(), age: emptyStatBox(), totalPosts: emptyStatBox() },

    vacancy_details: emptyVacancyDetails(),
    post_wise_details: [],
    eligibility: emptyOptionalSection('bullets'),
    promo_ads: [],
    exam_pattern: emptyOptionalSection('bullets'),
    physical_eligibility: emptyOptionalSection('bullets'),
    mode_of_selection: emptyOptionalSection('bullets'),
    additional_information: emptyOptionalSection('bullets'),
    custom_content_boxes: [],
    important_links: defaultImportantLinks(),
  }
}

export { customDateRow, emptyVacancyDetails, emptyTableContent }

// --- Character/line limits — confirmed live from LatestExamSerializer's LineLimitMixin
// and model max_length values (examprachar/posts/models.py + validators.py). ---------------

export const CARD_HEADING_MAX = 25
export const COMMISSION_NAME_MAX = 50
export const TITLE_MAX = 40
export const COMMISSION_NAME_HERO_MAX = 60
export const TITLE_HERO_MAX = 48
export const APPLY_BY_TEXT_MAX = 11
export const VACANCIES_TEXT_MAX = 21
export const QUALIFICATION_TEXT_MAX = 17

const CARD_HEADING_CHARS_PER_LINE = 12
const COMMISSION_NAME_CHARS_PER_LINE = 25
const TITLE_CHARS_PER_LINE = 20
const CARD_HEADING_MAX_LINES = 2
const COMMISSION_NAME_MAX_LINES = 2
const TITLE_MAX_LINES = 2
/** Hard block from CrossFieldLineBlockMixin: commission + title combined must not exceed 3 lines. */
const CROSS_FIELD_MAX_LINES = 3

function lineCount(value: string, charsPerLine: number): number {
  return value ? Math.ceil(value.length / charsPerLine) : 0
}

export function exceedsLineLimit(value: string, charsPerLine: number, maxLines: number): boolean {
  return lineCount(value, charsPerLine) > maxLines
}

export function cardHeadingExceedsLines(value: string): boolean {
  return exceedsLineLimit(value, CARD_HEADING_CHARS_PER_LINE, CARD_HEADING_MAX_LINES)
}

export function commissionNameExceedsLines(value: string): boolean {
  return exceedsLineLimit(value, COMMISSION_NAME_CHARS_PER_LINE, COMMISSION_NAME_MAX_LINES)
}

export function titleExceedsLines(value: string): boolean {
  return exceedsLineLimit(value, TITLE_CHARS_PER_LINE, TITLE_MAX_LINES)
}

/** Mirrors CrossFieldLineBlockMixin.validate() exactly — commission + title only (heading is separate). */
export function crossFieldExceedsLines(commissionName: string, title: string): boolean {
  const commissionLines = lineCount(commissionName, COMMISSION_NAME_CHARS_PER_LINE)
  const titleLines = lineCount(title, TITLE_CHARS_PER_LINE)
  return commissionLines + titleLines > CROSS_FIELD_MAX_LINES
}

// --- Validation --------------------------------------------------------------------------

export type LatestExamErrorKey =
  | 'audience'
  | 'audienceState'
  | 'cardDetails'
  | 'applyBy'
  | 'vacancies'
  | 'qualification'
  | 'importantDates'
  | 'hero'

export function validateLatestExamForm(values: LatestExamFormValues): Partial<Record<LatestExamErrorKey, string>> {
  const errors: Partial<Record<LatestExamErrorKey, string>> = {}

  if (values.variant === 'all-updates') {
    if (values.targetAudience.selectedKeys.length === 0) {
      errors.audience = 'Select at least one target audience tag.'
    } else if (values.targetAudience.selectedKeys.includes('state') && values.targetAudience.stateIds.length === 0) {
      errors.audienceState = 'Select at least one state.'
    }
  }

  if (!values.card_heading.trim() || !values.commission_name.trim() || !values.title.trim()) {
    errors.cardDetails = 'Heading, commission, and title are all required.'
  } else if (cardHeadingExceedsLines(values.card_heading)) {
    errors.cardDetails = `Heading is too long (max ${CARD_HEADING_MAX_LINES} lines at ${CARD_HEADING_CHARS_PER_LINE} chars/line).`
  } else if (commissionNameExceedsLines(values.commission_name)) {
    errors.cardDetails = `Commission is too long (max ${COMMISSION_NAME_MAX_LINES} lines at ${COMMISSION_NAME_CHARS_PER_LINE} chars/line).`
  } else if (titleExceedsLines(values.title)) {
    errors.cardDetails = `Title is too long (max ${TITLE_MAX_LINES} lines at ${TITLE_CHARS_PER_LINE} chars/line).`
  } else if (crossFieldExceedsLines(values.commission_name, values.title)) {
    errors.cardDetails = 'Commission and title combined exceed the 3-line display limit.'
  }

  if (values.apply_by_mode === 'select_date' && !values.apply_by_date.trim()) {
    errors.applyBy = 'Select an apply-by date.'
  } else if (values.apply_by_mode === 'custom_text' && !values.apply_by_text.trim()) {
    errors.applyBy = 'Enter apply-by text.'
  }

  if (!values.vacancies_text.trim()) {
    errors.vacancies = 'Vacancies is required.'
  }

  if (!values.qualification_text.trim()) {
    errors.qualification = 'Qualification is required.'
  }

  if (!values.commission_name_hero.trim() || !values.title_hero.trim()) {
    errors.hero = 'Commission name and title are required for the hero banner.'
  }

  const [applyStart, applyLast] = values.important_dates
  if (!applyStart?.value.trim() || !applyLast?.value.trim()) {
    errors.importantDates = 'Apply Start Date and Apply Last Date are both required.'
  }

  return errors
}

// --- Wire serialization — converts the form's UI-friendly value model into exactly the
// LatestExamSerializer payload shape. ------------------------------------------------------

/**
 * Rows whose active source is still blank (url text, or pdf_url) are dropped rather than sent —
 * the backend rejects them anyway. Exported so the publish error handler can rebuild the exact
 * same list, in the exact same order, to line up per-row backend errors with the right link.
 */
export function sendableImportantLinks(links: ImportantLinkItem[]): ImportantLinkItem[] {
  return [...links]
    .filter((link) => (link.source_mode === 'url' ? link.url.trim() : link.pdf_url.trim()))
    .sort((a, b) => a.order - b.order)
}

export function latestExamToWirePayload(values: LatestExamFormValues) {
  const audience =
    values.variant === 'all-updates'
      ? targetAudienceToWire(values.targetAudience)
      : { tags: [], targets_top: false, targets_state: false, target_states: [] }
  const personalized =
    values.variant === 'personalized'
      ? personalizedTargetingToWire(values.personalizedTargeting)
      : { target_region: '', target_gender: 'all' as const, qualification_targets: [] }

  return {
    group: values.variant === 'all-updates' ? 'all_updates' : 'personalized',
    card_heading: values.card_heading,
    commission_name: values.commission_name,
    title: values.title,
    commission_name_hero: values.commission_name_hero,
    title_hero: values.title_hero,
    sections: {},
    important_links: sendableImportantLinks(values.important_links).map(({ label, is_default, source_mode, url, pdf_url, order }) => ({
      label,
      is_default,
      source_mode,
      url,
      pdf_url,
      order,
    })),
    custom_content_boxes: values.custom_content_boxes.map(({ id: _id, ...box }) => box),
    promo_ads: values.promo_ads
      .sort((a, b) => a.order - b.order)
      .map(({ image_url, redirect_url, internal_label, is_active, order, state }) => ({
        image_url,
        redirect_url,
        internal_label,
        is_active,
        order,
        state,
      })),
    ...audience,
    ...personalized,
    apply_by_mode: values.apply_by_mode,
    apply_by_date: values.apply_by_mode === 'select_date' ? values.apply_by_date : null,
    apply_by_text: values.apply_by_mode === 'custom_text' ? values.apply_by_text : '',
    vacancies_text: values.vacancies_text,
    qualification_icon: values.qualification_icon ?? '',
    qualification_text: values.qualification_text,
    important_dates: values.important_dates.map(({ label, removable, mode, value, is_critical }) => ({
      label,
      removable,
      mode,
      value,
      is_critical,
    })),
    quick_overview: {
      fee: statBoxToWire(values.quick_overview.fee),
      age: statBoxToWire(values.quick_overview.age),
      totalPosts: statBoxToWire(values.quick_overview.totalPosts),
    },
    vacancy_details: values.vacancy_details,
    post_wise_details: values.post_wise_details.map(({ id: _id, detailsExpanded: _de, ...entry }) => entry),
    eligibility: values.eligibility,
    exam_pattern: values.exam_pattern,
    physical_eligibility: values.physical_eligibility,
    mode_of_selection: values.mode_of_selection,
    additional_information: values.additional_information,
  }
}

export type LatestExamWirePayload = ReturnType<typeof latestExamToWirePayload> & { id: number }

/**
 * Reverse of latestExamToWirePayload, for pre-filling the edit form from a GET response.
 * Known gap: qualification_targets round-trips ids fine but not the level/parent/child/option
 * *names* needed for chip display — the level tree hooks aren't available at this pure-function
 * boundary. LatestExamFormPage re-hydrates those names once the qualification data has loaded.
 */
export function latestExamFromWirePayload(wire: LatestExamWirePayload): LatestExamFormValues {
  const variant: 'all-updates' | 'personalized' = wire.group === 'personalized' ? 'personalized' : 'all-updates'

  const selectedKeys: TargetAudienceValue['selectedKeys'] = []
  if (wire.targets_top) selectedKeys.push('top')
  if (wire.targets_state) selectedKeys.push('state')
  for (const tagId of wire.tags) selectedKeys.push(`tag:${tagId}`)

  return {
    variant,
    targetAudience: { selectedKeys, stateIds: wire.target_states },
    personalizedTargeting: {
      region: wire.target_region === 'all_india' || !wire.target_region ? 'all-india' : { stateId: Number(wire.target_region) },
      gender: wire.target_gender,
      qualifications: [],
    },

    card_heading: wire.card_heading,
    commission_name: wire.commission_name,
    title: wire.title,
    commission_name_hero: wire.commission_name_hero,
    title_hero: wire.title_hero,

    apply_by_mode: wire.apply_by_mode,
    apply_by_date: wire.apply_by_date ?? '',
    apply_by_text: wire.apply_by_text,

    vacancies_text: wire.vacancies_text,
    qualification_icon: wire.qualification_icon || null,
    qualification_text: wire.qualification_text,

    important_dates: wire.important_dates.map((d) => ({ id: crypto.randomUUID(), ...d })),

    quick_overview: {
      fee: normalizeStatBox((wire.quick_overview as Record<string, unknown> | undefined)?.fee),
      age: normalizeStatBox((wire.quick_overview as Record<string, unknown> | undefined)?.age),
      totalPosts: normalizeStatBox((wire.quick_overview as Record<string, unknown> | undefined)?.totalPosts),
    },

    vacancy_details: wire.vacancy_details as VacancyDetailsValue,
    post_wise_details: wire.post_wise_details.map((entry) => ({
      id: crypto.randomUUID(),
      detailsExpanded: false,
      ...entry,
    })),
    eligibility: wire.eligibility as OptionalSectionValue,
    promo_ads: wire.promo_ads.map((ad) => ({ id: crypto.randomUUID(), ...ad, state: ad.state ?? null })),
    exam_pattern: wire.exam_pattern as OptionalSectionValue,
    physical_eligibility: wire.physical_eligibility as OptionalSectionValue,
    mode_of_selection: wire.mode_of_selection as OptionalSectionValue,
    additional_information: wire.additional_information as OptionalSectionValue,
    custom_content_boxes: wire.custom_content_boxes.map((box) => ({ id: crypto.randomUUID(), ...box })),
    important_links: wire.important_links.map((link, i) => ({
      id: crypto.randomUUID(),
      key: link.is_default
        ? (['apply-online', 'download-notification', 'official-website'][i] as ImportantLinkItem['key']) ?? 'custom'
        : 'custom',
      ...link,
    })),
  }
}
