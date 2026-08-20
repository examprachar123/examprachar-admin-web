import {
  targetAudienceToWire,
  EMPTY_TARGET_AUDIENCE,
  emptyOptionalSection,
  defaultImportantLinks,
  DEFAULT_ADMIT_CARD_LINKS,
  type TargetAudienceValue,
  type OptionalSectionValue,
  type ImportantLinkItem,
  type PromoAdItem,
} from '@/types/postCommon'
import {
  sendableImportantLinks,
  CARD_HEADING_MAX,
  COMMISSION_NAME_MAX,
  TITLE_MAX,
  COMMISSION_NAME_HERO_MAX,
  TITLE_HERO_MAX,
  cardHeadingExceedsLines,
  commissionNameExceedsLines,
  titleExceedsLines,
  crossFieldExceedsLines,
} from '@/types/posts/latestExam'

// Admit Card is documented only via a trimmed request example (no exhaustive field table like
// Latest Exam's) — this implements exactly what the doc shows, plus exam_date_end/exam_date_text
// as the necessary companions to exam_date_mode's 'range'/'custom_text' options (directly implied
// by the doc's urgency rule: "range → 7 days before start through end date").
//
// Status/Mode icons have no dedicated backend column — matching the same trick Result uses for
// its Type/Next icons, they're persisted through the already-accepted `sections` JSONField
// instead of guessing at new top-level field names the backend may reject.

export interface AdmitCardSections {
  status_icon: string
  mode_icon: string
}

export interface InstructionPoint {
  id: string
  marker: 'tick' | 'dot' | 'warning'
  text: string
}

export interface AdmitCardFormValues {
  targetAudience: TargetAudienceValue

  card_heading: string
  commission_name: string
  title: string
  commission_name_hero: string
  title_hero: string

  exam_date_mode: 'single' | 'range' | 'custom_text'
  exam_date_start: string
  exam_date_end: string
  exam_date_text: string
  /** Optional note shown under the detail-page Exam Date card. */
  exam_date_instructions_enabled: boolean
  exam_date_instructions_text: string

  status_text: string
  status_icon: string | null
  mode_text: string
  mode_icon: string | null

  important_instructions: {
    enabled: boolean
    heading: string
    subheading_enabled: boolean
    subheading: string
    points: InstructionPoint[]
  }

  promo_ads: PromoAdItem[]
  important_links: ImportantLinkItem[]
  custom_content_boxes: (OptionalSectionValue & { id: string })[]
  additional_information: OptionalSectionValue
}

export function emptyAdmitCardForm(): AdmitCardFormValues {
  return {
    targetAudience: EMPTY_TARGET_AUDIENCE,
    card_heading: '',
    commission_name: '',
    title: '',
    commission_name_hero: '',
    title_hero: '',
    exam_date_mode: 'single',
    exam_date_start: '',
    exam_date_end: '',
    exam_date_text: '',
    exam_date_instructions_enabled: false,
    exam_date_instructions_text: '',
    status_text: '',
    status_icon: null,
    mode_text: '',
    mode_icon: null,
    important_instructions: { enabled: false, heading: '', subheading_enabled: false, subheading: '', points: [] },
    promo_ads: [],
    important_links: defaultImportantLinks(DEFAULT_ADMIT_CARD_LINKS),
    custom_content_boxes: [],
    additional_information: emptyOptionalSection('bullets'),
  }
}

export { CARD_HEADING_MAX, COMMISSION_NAME_MAX, TITLE_MAX, COMMISSION_NAME_HERO_MAX, TITLE_HERO_MAX }

export type AdmitCardErrorKey = 'audience' | 'audienceState' | 'cardDetails' | 'examDate' | 'status' | 'mode'

export function validateAdmitCardForm(values: AdmitCardFormValues): Partial<Record<AdmitCardErrorKey, string>> {
  const errors: Partial<Record<AdmitCardErrorKey, string>> = {}

  if (values.targetAudience.selectedKeys.length === 0) {
    errors.audience = 'Select at least one target audience tag.'
  } else if (
    values.targetAudience.selectedKeys.includes('state') &&
    values.targetAudience.stateIds.length === 0
  ) {
    errors.audienceState = 'Select at least one state.'
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

  if (values.exam_date_mode === 'single' && !values.exam_date_start.trim()) {
    errors.examDate = 'Select the exam date.'
  } else if (values.exam_date_mode === 'range' && (!values.exam_date_start.trim() || !values.exam_date_end.trim())) {
    errors.examDate = 'Select both a start and end date.'
  } else if (values.exam_date_mode === 'custom_text' && !values.exam_date_text.trim()) {
    errors.examDate = 'Enter exam date text.'
  }

  if (!values.status_text.trim()) {
    errors.status = 'Status is required.'
  }

  if (!values.mode_text.trim()) {
    errors.mode = 'Mode is required.'
  }

  return errors
}

export function admitCardToWirePayload(values: AdmitCardFormValues) {
  const sections: AdmitCardSections = {
    status_icon: values.status_icon ?? '',
    mode_icon: values.mode_icon ?? '',
  }

  return {
    group: 'all_updates' as const,
    card_heading: values.card_heading,
    commission_name: values.commission_name,
    title: values.title,
    commission_name_hero: values.commission_name_hero,
    title_hero: values.title_hero,
    sections,
    ...targetAudienceToWire(values.targetAudience),
    exam_date_mode: values.exam_date_mode,
    exam_date_start: values.exam_date_mode !== 'custom_text' ? values.exam_date_start || null : null,
    exam_date_end: values.exam_date_mode === 'range' ? values.exam_date_end || null : null,
    exam_date_text: values.exam_date_mode === 'custom_text' ? values.exam_date_text : '',
    exam_date_instructions_enabled: values.exam_date_instructions_enabled,
    exam_date_instructions_text: values.exam_date_instructions_enabled ? values.exam_date_instructions_text : '',
    status_text: values.status_text,
    mode_text: values.mode_text,
    important_instructions: {
      enabled: values.important_instructions.enabled,
      heading: values.important_instructions.heading,
      subheading_enabled: values.important_instructions.subheading_enabled,
      subheading: values.important_instructions.subheading_enabled ? values.important_instructions.subheading : '',
      points: values.important_instructions.points.map(({ marker, text }) => ({ marker, text })),
    },
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
    additional_information: values.additional_information,
  }
}

export type AdmitCardWirePayload = ReturnType<typeof admitCardToWirePayload> & { id: number }

export function admitCardFromWirePayload(wire: AdmitCardWirePayload): AdmitCardFormValues {
  const selectedKeys: TargetAudienceValue['selectedKeys'] = []
  if (wire.targets_top) selectedKeys.push('top')
  if (wire.targets_state) selectedKeys.push('state')
  for (const tagId of wire.tags) selectedKeys.push(`tag:${tagId}`)

  const sections = (wire.sections as Partial<AdmitCardSections> | undefined) ?? {}
  const instructions = wire.important_instructions as {
    enabled?: boolean
    heading?: string
    subheading_enabled?: boolean
    subheading?: string
    points?: { marker: InstructionPoint['marker']; text: string }[]
  }

  return {
    targetAudience: { selectedKeys, stateIds: wire.target_states },
    card_heading: wire.card_heading,
    commission_name: wire.commission_name,
    title: wire.title,
    commission_name_hero: wire.commission_name_hero,
    title_hero: wire.title_hero,

    exam_date_mode: wire.exam_date_mode,
    exam_date_start: wire.exam_date_start ?? '',
    exam_date_end: wire.exam_date_end ?? '',
    exam_date_text: wire.exam_date_text ?? '',
    exam_date_instructions_enabled: wire.exam_date_instructions_enabled ?? false,
    exam_date_instructions_text: wire.exam_date_instructions_text ?? '',

    status_text: wire.status_text,
    status_icon: sections.status_icon || null,
    mode_text: wire.mode_text,
    mode_icon: sections.mode_icon || null,

    important_instructions: {
      enabled: instructions?.enabled ?? false,
      heading: instructions?.heading ?? '',
      subheading_enabled: instructions?.subheading_enabled ?? false,
      subheading: instructions?.subheading ?? '',
      points: (instructions?.points ?? []).map((p) => ({ id: crypto.randomUUID(), ...p })),
    },

    promo_ads: wire.promo_ads.map((ad) => ({ id: crypto.randomUUID(), ...ad, state: ad.state ?? null })),
    additional_information: (wire.additional_information as OptionalSectionValue) ?? emptyOptionalSection('bullets'),
    custom_content_boxes: wire.custom_content_boxes.map((box) => ({ id: crypto.randomUUID(), ...box })),
    important_links: wire.important_links.map((link, i) => ({
      id: crypto.randomUUID(),
      key: link.is_default
        ? (DEFAULT_ADMIT_CARD_LINKS[i]?.key ?? 'custom')
        : 'custom',
      ...link,
    })),
  }
}
