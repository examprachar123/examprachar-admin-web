import {
  emptyOptionalSection,
  defaultImportantLinks,
  DEFAULT_TRACKED_ALERT_LINKS,
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

// Tracked Alert has no targeting of its own -- "audience is 100% inherited from parent" per the
// backend docstring, and any `group` sent in the request body is server-ignored (force-set from
// parent.group). So this form is the parent picker + the same card/hero fields every post type
// has, plus Tracked-Alert-specific status fields, Official Update Summary, Promo Ads, Custom
// Boxes and Important Links (all shared/generic BasePost machinery, same as Result/LatestExam).
//
// date_value is a single opaque CharField(max_length=15) covering all three date_mode values --
// unlike AdmitCard there are no separate start/end DateField columns. For 'single' mode we store
// the raw ISO date (round-trips cleanly into <input type="date"> on edit); for 'range' mode we
// have to compress two dates into one 15-char string ("21 Aug-25 Aug"), which can't be decomposed
// back into two date pickers on edit -- the range pickers start blank on edit with the existing
// value shown as read-only context instead of guessing at a reparse.

export interface ParentOption {
  id: number
  card_heading: string
  commission_name: string
  title: string
}

export type TrackedAlertDateMode = 'single' | 'range' | 'custom_text'

export interface TrackedAlertFormValues {
  parent: ParentOption | null

  card_heading: string
  commission_name: string
  title: string
  commission_name_hero: string
  title_hero: string

  date_mode: TrackedAlertDateMode
  date_single: string
  date_range_start: string
  date_range_end: string
  date_custom_text: string
  /** The date_value last known from the server -- shown as read-only context in range mode until the admin re-picks both dates. */
  date_value_existing: string

  type_icon: string | null
  type_text: string
  action_icon: string | null
  action_text: string
  update_status_text: string
  released_on_text: string

  official_update_summary: OptionalSectionValue
  promo_ads: PromoAdItem[]
  custom_content_boxes: (OptionalSectionValue & { id: string })[]
  important_links: ImportantLinkItem[]
}

export function emptyTrackedAlertForm(): TrackedAlertFormValues {
  return {
    parent: null,

    card_heading: '',
    commission_name: '',
    title: '',
    commission_name_hero: '',
    title_hero: '',

    date_mode: 'single',
    date_single: '',
    date_range_start: '',
    date_range_end: '',
    date_custom_text: '',
    date_value_existing: '',

    type_icon: null,
    type_text: '',
    action_icon: null,
    action_text: '',
    update_status_text: '',
    released_on_text: '',

    official_update_summary: { ...emptyOptionalSection('text'), enabled: true, heading: 'Official Update Summary' },
    promo_ads: [],
    custom_content_boxes: [],
    important_links: defaultImportantLinks(DEFAULT_TRACKED_ALERT_LINKS),
  }
}

export { CARD_HEADING_MAX, COMMISSION_NAME_MAX, TITLE_MAX, COMMISSION_NAME_HERO_MAX, TITLE_HERO_MAX }

export const TYPE_TEXT_MAX = 15
export const ACTION_TEXT_MAX = 9
export const UPDATE_STATUS_TEXT_MAX = 20
export const RELEASED_ON_TEXT_MAX = 30
export const DATE_VALUE_MAX = 15

function formatCompactDate(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

/** Derives the single date_value string the backend actually stores, from whichever date_mode UI is active. */
export function computeDateValue(values: TrackedAlertFormValues): string {
  if (values.date_mode === 'custom_text') return values.date_custom_text
  if (values.date_mode === 'single') return values.date_single
  if (values.date_range_start && values.date_range_end) {
    return `${formatCompactDate(values.date_range_start)}-${formatCompactDate(values.date_range_end)}`.slice(0, DATE_VALUE_MAX)
  }
  if (values.date_range_start) return formatCompactDate(values.date_range_start)
  return values.date_value_existing
}

// --- Validation --------------------------------------------------------------------------

export type TrackedAlertErrorKey = 'parent' | 'cardDetails' | 'hero' | 'dateValue' | 'typeAction' | 'updateStatus'

export function validateTrackedAlertForm(values: TrackedAlertFormValues): Partial<Record<TrackedAlertErrorKey, string>> {
  const errors: Partial<Record<TrackedAlertErrorKey, string>> = {}

  if (!values.parent) {
    errors.parent = 'Select the Latest Exam post this alert belongs to.'
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

  if (!values.commission_name_hero.trim() || !values.title_hero.trim()) {
    errors.hero = 'Commission name and title are required for the hero banner.'
  }

  if (values.date_mode === 'single' && !values.date_single.trim()) {
    errors.dateValue = 'Select the alert date.'
  } else if (values.date_mode === 'custom_text' && !values.date_custom_text.trim()) {
    errors.dateValue = 'Enter the alert date text.'
  } else if (values.date_mode === 'range' && !(values.date_range_start.trim() && values.date_range_end.trim())) {
    errors.dateValue = 'Select both a start and end date.'
  }

  if (!values.type_text.trim() || !values.action_text.trim()) {
    errors.typeAction = 'Type and Action values are both required.'
  }

  if (!values.update_status_text.trim()) {
    errors.updateStatus = 'Update Status is required.'
  }

  return errors
}

// --- Wire serialization --------------------------------------------------------------------

export function trackedAlertToWirePayload(values: TrackedAlertFormValues) {
  return {
    parent: values.parent?.id ?? null,
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
    date_mode: values.date_mode,
    date_value: computeDateValue(values),
    type_icon: values.type_icon ?? '',
    type_text: values.type_text,
    action_icon: values.action_icon ?? '',
    action_text: values.action_text,
    update_status_text: values.update_status_text,
    released_on_text: values.released_on_text,
    official_update_summary: values.official_update_summary,
  }
}

export type TrackedAlertWirePayload = ReturnType<typeof trackedAlertToWirePayload> & {
  id: number
  group: 'all_updates' | 'personalized'
}

export function trackedAlertFromWirePayload(wire: TrackedAlertWirePayload): TrackedAlertFormValues {
  return {
    parent: wire.parent ? { id: wire.parent, card_heading: '', commission_name: '', title: '' } : null,

    card_heading: wire.card_heading,
    commission_name: wire.commission_name,
    title: wire.title,
    commission_name_hero: wire.commission_name_hero,
    title_hero: wire.title_hero,

    date_mode: wire.date_mode,
    date_single: wire.date_mode === 'single' ? wire.date_value : '',
    date_range_start: '',
    date_range_end: '',
    date_custom_text: wire.date_mode === 'custom_text' ? wire.date_value : '',
    date_value_existing: wire.date_value,

    type_icon: wire.type_icon || null,
    type_text: wire.type_text,
    action_icon: wire.action_icon || null,
    action_text: wire.action_text,
    update_status_text: wire.update_status_text,
    released_on_text: wire.released_on_text,

    official_update_summary: (wire.official_update_summary as OptionalSectionValue) ?? emptyOptionalSection('text'),
    promo_ads: wire.promo_ads.map((ad) => ({ id: crypto.randomUUID(), ...ad, state: ad.state ?? null })),
    custom_content_boxes: wire.custom_content_boxes.map((box) => ({ id: crypto.randomUUID(), ...(box as OptionalSectionValue) })),
    important_links: wire.important_links.map((link, i) => ({
      id: crypto.randomUUID(),
      key: link.is_default ? ((['download-answer-key', 'raise-objection', 'official-website'][i] as ImportantLinkItem['key']) ?? 'custom') : 'custom',
      ...link,
    })),
  }
}
