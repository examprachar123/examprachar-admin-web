import {
  targetAudienceToWire,
  personalizedTargetingToWire,
  EMPTY_TARGET_AUDIENCE,
  EMPTY_PERSONALIZED_TARGETING,
  emptyOptionalSection,
  defaultImportantLinks,
  DEFAULT_UPCOMING_EXAM_LINKS,
  type PersonalizedTargetingValue,
  type TargetAudienceValue,
  type OptionalSectionValue,
  type ImportantLinkItem,
  type PromoAdItem,
  type TableContent,
} from '@/types/postCommon'
import {
  sendableImportantLinks,
  CARD_HEADING_MAX,
  COMMISSION_NAME_MAX,
  TITLE_MAX,
  COMMISSION_NAME_HERO_MAX,
  TITLE_HERO_MAX,
  QUALIFICATION_TEXT_MAX,
  VACANCIES_TEXT_MAX,
  cardHeadingExceedsLines,
  commissionNameExceedsLines,
  titleExceedsLines,
  crossFieldExceedsLines,
} from '@/types/posts/latestExam'

// core_stats / prediction_analysis / previous_year_data / expected_vacancy_split are freeform
// JSON on the backend (no nested serializer, no schema) -- the shapes below are this form's own
// convention for them, sourced from the admin mockup rather than any documented contract, same
// as Result's cutoff_marks and TrackedAlert's official_update_summary.

// --- Part C: Core Stats (Qualification / Age Limit / Expected Vacancy) -----------------------

export interface CoreStatBox {
  heading: string
  icon: string | null
  value: string
}

export interface CoreStatsValue {
  qualification: CoreStatBox
  age: CoreStatBox
  vacancy: { value: string }
}

function emptyCoreStats(): CoreStatsValue {
  return {
    qualification: { heading: 'Qualification', icon: null, value: '' },
    age: { heading: 'Age Limit', icon: null, value: '' },
    vacancy: { value: '' },
  }
}

// --- Part D: Prediction Analysis --------------------------------------------------------------

export interface PredictionAnalysisValue {
  heading: string
  expected_notification: string
  timeline_enabled: boolean
  timeline_heading: string
  timeline_description: string
}

function emptyPredictionAnalysis(): PredictionAnalysisValue {
  return {
    heading: 'Prediction Analysis',
    expected_notification: '',
    timeline_enabled: true,
    timeline_heading: 'Typical Exam Timeline:',
    timeline_description: '',
  }
}

// --- Part E: Previous Year Data (repeatable years, each with fixed+custom rows and repeatable
// cut-off blocks) ------------------------------------------------------------------------------

export type PrevYearCutoffMode = 'table' | 'bullets' | 'text'

export interface PrevYearCutoff {
  id: string
  heading: string
  mode: PrevYearCutoffMode
  text: string
  bullets: string[]
  table: TableContent | null
}

export interface PrevYearRow {
  id: string
  label: string
  value: string
  removable: boolean
}

export interface PrevYearEntry {
  id: string
  heading: string
  rows: PrevYearRow[]
  cutoffs: PrevYearCutoff[]
}

function fixedRow(label: string): PrevYearRow {
  return { id: crypto.randomUUID(), label, value: '', removable: false }
}

export function customPrevYearRow(): PrevYearRow {
  return { id: crypto.randomUUID(), label: 'Custom Label:', value: '', removable: true }
}

export function emptyPrevYearCutoff(): PrevYearCutoff {
  return { id: crypto.randomUUID(), heading: 'Previous Cut-Off', mode: 'table', text: '', bullets: [], table: null }
}

export function emptyPrevYearEntry(): PrevYearEntry {
  return {
    id: crypto.randomUUID(),
    heading: 'Previous Year Data',
    rows: [fixedRow('Previous Notification Date:'), fixedRow('Previous Exam Date:')],
    cutoffs: [emptyPrevYearCutoff()],
  }
}

// --- Full form model ---------------------------------------------------------------------

export interface UpcomingExamFormValues {
  variant: 'all-updates' | 'personalized'
  targetAudience: TargetAudienceValue
  personalizedTargeting: PersonalizedTargetingValue

  card_heading: string
  commission_name: string
  title: string
  commission_name_hero: string
  title_hero: string

  expected_text: string
  vacancies_text: string
  qualification_icon: string | null
  qualification_text: string

  core_stats: CoreStatsValue
  prediction_analysis: PredictionAnalysisValue
  previous_year_data: PrevYearEntry[]
  expected_vacancy_split: OptionalSectionValue

  promo_ads: PromoAdItem[]
  /** custom_content_boxes[0] is pinned as "Detailed Information" (Part G); the rest are freeform (Part I, max 5 total). */
  custom_content_boxes: (OptionalSectionValue & { id: string })[]
  important_links: ImportantLinkItem[]
}

export function emptyUpcomingExamForm(variant: 'all-updates' | 'personalized'): UpcomingExamFormValues {
  return {
    variant,
    targetAudience: EMPTY_TARGET_AUDIENCE,
    personalizedTargeting: EMPTY_PERSONALIZED_TARGETING,

    card_heading: '',
    commission_name: '',
    title: '',
    commission_name_hero: '',
    title_hero: '',

    expected_text: '',
    vacancies_text: '',
    qualification_icon: null,
    qualification_text: '',

    core_stats: emptyCoreStats(),
    prediction_analysis: emptyPredictionAnalysis(),
    previous_year_data: [],
    expected_vacancy_split: { ...emptyOptionalSection('table'), enabled: true, heading: 'Expected Vacancy Split' },

    promo_ads: [],
    custom_content_boxes: [
      { ...emptyOptionalSection('bullets'), id: crypto.randomUUID(), enabled: true, heading: 'Detailed Information' },
    ],
    important_links: defaultImportantLinks(DEFAULT_UPCOMING_EXAM_LINKS),
  }
}

export {
  CARD_HEADING_MAX,
  COMMISSION_NAME_MAX,
  TITLE_MAX,
  COMMISSION_NAME_HERO_MAX,
  TITLE_HERO_MAX,
  QUALIFICATION_TEXT_MAX,
  VACANCIES_TEXT_MAX,
}

export const EXPECTED_TEXT_MAX = 11
export const CORE_STAT_VALUE_MAX = 25
export const CORE_STAT_VACANCY_VALUE_MAX = 20
export const PREDICTION_HEADING_MAX = 30
export const PREDICTION_NOTIFICATION_MAX = 20

// --- Validation --------------------------------------------------------------------------
// Part C (Core Stats) shows required markers in the mockup but its own publish check never
// actually enforces them (core_stats has no backend schema to enforce against) -- mirrored here.

export type UpcomingExamErrorKey =
  | 'audience'
  | 'audienceState'
  | 'cardDetails'
  | 'vitalStats'
  | 'hero'
  | 'predictionAnalysis'

export function validateUpcomingExamForm(values: UpcomingExamFormValues): Partial<Record<UpcomingExamErrorKey, string>> {
  const errors: Partial<Record<UpcomingExamErrorKey, string>> = {}

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
    errors.cardDetails = 'Heading is too long.'
  } else if (commissionNameExceedsLines(values.commission_name)) {
    errors.cardDetails = 'Commission is too long.'
  } else if (titleExceedsLines(values.title)) {
    errors.cardDetails = 'Title is too long.'
  } else if (crossFieldExceedsLines(values.commission_name, values.title)) {
    errors.cardDetails = 'Commission and title combined exceed the 3-line display limit.'
  }

  if (!values.expected_text.trim() || !values.vacancies_text.trim() || !values.qualification_text.trim()) {
    errors.vitalStats = 'Expected date, vacancies, and qualification are all required.'
  }

  if (!values.commission_name_hero.trim() || !values.title_hero.trim()) {
    errors.hero = 'Commission name and title are required for the hero banner.'
  }

  if (!values.prediction_analysis.heading.trim() || !values.prediction_analysis.expected_notification.trim()) {
    errors.predictionAnalysis = 'Heading and Expected Notification are both required.'
  }

  return errors
}

// --- Wire serialization --------------------------------------------------------------------

export function upcomingExamToWirePayload(values: UpcomingExamFormValues) {
  const audience =
    values.variant === 'all-updates'
      ? targetAudienceToWire(values.targetAudience)
      : { tags: [], targets_top: false, targets_state: false, target_states: [] }
  const personalized =
    values.variant === 'personalized'
      ? personalizedTargetingToWire(values.personalizedTargeting)
      : { target_region: '', target_gender: 'all' as const, qualification_targets: [] }

  return {
    group: values.variant === 'all-updates' ? ('all_updates' as const) : ('personalized' as const),
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
    expected_text: values.expected_text,
    vacancies_text: values.vacancies_text,
    qualification_icon: values.qualification_icon ?? '',
    qualification_text: values.qualification_text,
    core_stats: values.core_stats,
    prediction_analysis: values.prediction_analysis,
    previous_year_data: values.previous_year_data.map(({ id: _id, rows, cutoffs, ...entry }) => ({
      ...entry,
      rows: rows.map(({ id: _rid, ...row }) => row),
      cutoffs: cutoffs.map(({ id: _cid, ...cutoff }) => cutoff),
    })),
    expected_vacancy_split: values.expected_vacancy_split,
  }
}

export type UpcomingExamWirePayload = ReturnType<typeof upcomingExamToWirePayload> & { id: number }

export function upcomingExamFromWirePayload(wire: UpcomingExamWirePayload): UpcomingExamFormValues {
  const variant: 'all-updates' | 'personalized' = wire.group === 'personalized' ? 'personalized' : 'all-updates'

  const selectedKeys: TargetAudienceValue['selectedKeys'] = []
  if (wire.targets_top) selectedKeys.push('top')
  if (wire.targets_state) selectedKeys.push('state')
  for (const tagId of wire.tags) selectedKeys.push(`tag:${tagId}`)

  const coreStats = wire.core_stats as Partial<CoreStatsValue> | undefined
  const predictionAnalysis = wire.prediction_analysis as Partial<PredictionAnalysisValue> | undefined
  const previousYearData = wire.previous_year_data as (Partial<PrevYearEntry> & { rows?: Partial<PrevYearRow>[]; cutoffs?: Partial<PrevYearCutoff>[] })[]

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

    expected_text: wire.expected_text,
    vacancies_text: wire.vacancies_text,
    qualification_icon: wire.qualification_icon || null,
    qualification_text: wire.qualification_text,

    core_stats: {
      qualification: { heading: 'Qualification', icon: null, value: '', ...coreStats?.qualification },
      age: { heading: 'Age Limit', icon: null, value: '', ...coreStats?.age },
      vacancy: { value: '', ...coreStats?.vacancy },
    },
    prediction_analysis: { ...emptyPredictionAnalysis(), ...predictionAnalysis },
    previous_year_data: (previousYearData ?? []).map((entry) => ({
      id: crypto.randomUUID(),
      heading: entry.heading ?? '',
      rows: (entry.rows ?? []).map((row) => ({ id: crypto.randomUUID(), label: row.label ?? '', value: row.value ?? '', removable: row.removable ?? true })),
      cutoffs: (entry.cutoffs ?? []).map((cutoff) => ({
        id: crypto.randomUUID(),
        heading: cutoff.heading ?? '',
        mode: cutoff.mode ?? 'table',
        text: cutoff.text ?? '',
        bullets: cutoff.bullets ?? [],
        table: cutoff.table ?? null,
      })),
    })),
    expected_vacancy_split: (wire.expected_vacancy_split as OptionalSectionValue) ?? emptyOptionalSection('table'),

    promo_ads: wire.promo_ads.map((ad) => ({ id: crypto.randomUUID(), ...ad, state: ad.state ?? null })),
    custom_content_boxes:
      wire.custom_content_boxes.length > 0
        ? wire.custom_content_boxes.map((box) => ({ id: crypto.randomUUID(), ...(box as OptionalSectionValue) }))
        : [{ ...emptyOptionalSection('bullets'), id: crypto.randomUUID(), enabled: true, heading: 'Detailed Information' }],
    important_links: wire.important_links.map((link, i) => ({
      id: crypto.randomUUID(),
      key: link.is_default ? ((['view-previous-notification', 'official-website'][i] as ImportantLinkItem['key']) ?? 'custom') : 'custom',
      ...link,
    })),
  }
}
