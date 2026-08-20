import {
  targetAudienceToWire,
  EMPTY_TARGET_AUDIENCE,
  emptyOptionalSection,
  defaultImportantLinks,
  DEFAULT_RESULT_LINKS,
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

// Result's `sections` JSONField is unused by the backend contract (always `{}` on write for other
// post types) -- we repurpose it to persist the Type/Next stat icons client-side-only, since the
// Result model has no dedicated icon columns (unlike LatestExam.qualification_icon).
export interface ResultSections {
  type_icon: string
  next_icon: string
}

export interface WhatsNextPoint {
  id: string
  text: string
}

export interface WhatsNextValue {
  enabled: boolean
  heading: string
  subheading_enabled: boolean
  subheading: string
  points: WhatsNextPoint[]
}

export interface ResultNoteValue {
  enabled: boolean
  text: string
}

export interface ResultFormValues {
  targetAudience: TargetAudienceValue

  card_heading: string
  commission_name: string
  title: string
  commission_name_hero: string
  title_hero: string

  declared_on: string
  result_type_text: string
  result_type_icon: string | null
  next_stage_text: string
  next_stage_icon: string | null

  result_status_text: string
  result_note: ResultNoteValue

  cutoff_marks: OptionalSectionValue
  whats_next: WhatsNextValue

  promo_ads: PromoAdItem[]
  /** custom_content_boxes[0] is pinned as "Additional Information" (Part G); the rest are freeform (Part H, max 5 total). */
  custom_content_boxes: (OptionalSectionValue & { id: string })[]
  important_links: ImportantLinkItem[]
}

export function emptyResultForm(): ResultFormValues {
  return {
    targetAudience: EMPTY_TARGET_AUDIENCE,

    card_heading: '',
    commission_name: '',
    title: '',
    commission_name_hero: '',
    title_hero: '',

    declared_on: '',
    result_type_text: '',
    result_type_icon: null,
    next_stage_text: '',
    next_stage_icon: null,

    result_status_text: '',
    result_note: { enabled: false, text: '' },

    cutoff_marks: { ...emptyOptionalSection('table'), enabled: true, heading: 'Official Cut-off Marks' },
    whats_next: { enabled: true, heading: "What's Next?", subheading_enabled: false, subheading: '', points: [] },

    promo_ads: [],
    custom_content_boxes: [
      { ...emptyOptionalSection('bullets'), id: crypto.randomUUID(), enabled: true, heading: 'Additional Information' },
    ],
    important_links: defaultImportantLinks(DEFAULT_RESULT_LINKS),
  }
}

export { CARD_HEADING_MAX, COMMISSION_NAME_MAX, TITLE_MAX, COMMISSION_NAME_HERO_MAX, TITLE_HERO_MAX }

export const RESULT_TYPE_TEXT_MAX = 15
export const NEXT_STAGE_TEXT_MAX = 11
export const RESULT_STATUS_TEXT_MAX = 20
export const RESULT_NOTE_MAX = 255

/** Mirrors ResultSerializer's required `declared_on_full_text` -- auto-derived from the date so
 * admins never have to type a redundant long-form date by hand. */
export function formatDeclaredOnFullText(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
}

// --- Validation --------------------------------------------------------------------------

export type ResultErrorKey = 'audience' | 'audienceState' | 'cardDetails' | 'vitalStats' | 'hero' | 'resultStatus'

export function validateResultForm(values: ResultFormValues): Partial<Record<ResultErrorKey, string>> {
  const errors: Partial<Record<ResultErrorKey, string>> = {}

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

  if (!values.declared_on.trim() || !values.result_type_text.trim() || !values.next_stage_text.trim()) {
    errors.vitalStats = 'Result date, type, and next stage are all required.'
  }

  if (!values.commission_name_hero.trim() || !values.title_hero.trim()) {
    errors.hero = 'Commission name and title are required for the hero banner.'
  }

  if (!values.result_status_text.trim()) {
    errors.resultStatus = 'Result status is required.'
  }

  return errors
}

// --- Wire serialization --------------------------------------------------------------------

export function resultToWirePayload(values: ResultFormValues) {
  const sections: ResultSections = {
    type_icon: values.result_type_icon ?? '',
    next_icon: values.next_stage_icon ?? '',
  }

  return {
    group: 'all_updates' as const,
    card_heading: values.card_heading,
    commission_name: values.commission_name,
    title: values.title,
    commission_name_hero: values.commission_name_hero,
    title_hero: values.title_hero,
    sections,
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
    ...targetAudienceToWire(values.targetAudience),
    declared_on: values.declared_on || null,
    declared_on_full_text: formatDeclaredOnFullText(values.declared_on),
    result_type_text: values.result_type_text,
    next_stage_text: values.next_stage_text,
    result_status_text: values.result_status_text,
    result_note: values.result_note.enabled ? values.result_note.text : '',
    cutoff_marks: values.cutoff_marks,
    whats_next: {
      enabled: values.whats_next.enabled,
      heading: values.whats_next.heading,
      subheading: values.whats_next.subheading_enabled ? values.whats_next.subheading : '',
      points: values.whats_next.points.map(({ text }) => ({ text })),
    },
  }
}

export type ResultWirePayload = ReturnType<typeof resultToWirePayload> & { id: number }

export function resultFromWirePayload(wire: ResultWirePayload): ResultFormValues {
  const selectedKeys: TargetAudienceValue['selectedKeys'] = []
  if (wire.targets_top) selectedKeys.push('top')
  if (wire.targets_state) selectedKeys.push('state')
  for (const tagId of wire.tags) selectedKeys.push(`tag:${tagId}`)

  const sections = (wire.sections as Partial<ResultSections> | undefined) ?? {}
  const whatsNext = wire.whats_next as { enabled?: boolean; heading?: string; subheading?: string; points?: { text: string }[] }

  return {
    targetAudience: { selectedKeys, stateIds: wire.target_states },

    card_heading: wire.card_heading,
    commission_name: wire.commission_name,
    title: wire.title,
    commission_name_hero: wire.commission_name_hero,
    title_hero: wire.title_hero,

    declared_on: wire.declared_on ?? '',
    result_type_text: wire.result_type_text,
    result_type_icon: sections.type_icon || null,
    next_stage_text: wire.next_stage_text,
    next_stage_icon: sections.next_icon || null,

    result_status_text: wire.result_status_text,
    result_note: { enabled: !!wire.result_note.trim(), text: wire.result_note },

    cutoff_marks: (wire.cutoff_marks as OptionalSectionValue) ?? emptyOptionalSection('table'),
    whats_next: {
      enabled: whatsNext?.enabled ?? false,
      heading: whatsNext?.heading ?? '',
      subheading_enabled: !!whatsNext?.subheading?.trim(),
      subheading: whatsNext?.subheading ?? '',
      points: (whatsNext?.points ?? []).map((p) => ({ id: crypto.randomUUID(), text: p.text })),
    },

    promo_ads: wire.promo_ads.map((ad) => ({ id: crypto.randomUUID(), ...ad, state: ad.state ?? null })),
    custom_content_boxes:
      wire.custom_content_boxes.length > 0
        ? wire.custom_content_boxes.map((box) => ({ id: crypto.randomUUID(), ...(box as OptionalSectionValue) }))
        : [{ ...emptyOptionalSection('bullets'), id: crypto.randomUUID(), enabled: true, heading: 'Additional Information' }],
    important_links: wire.important_links.map((link, i) => ({
      id: crypto.randomUUID(),
      key: link.is_default ? ((['download-result', 'download-cutoff-pdf', 'official-website'][i] as ImportantLinkItem['key']) ?? 'custom') : 'custom',
      ...link,
    })),
  }
}
