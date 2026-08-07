import {
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

// Tracked Alert has no targeting of its own — "audience is 100% inherited from parent" per the
// doc, and any `group` sent in the request body is server-ignored (force-set from parent.group).
// So this form is just the parent picker + the same card/hero fields every post type has, plus
// Tracked-Alert-specific status fields. The doc's only documented date_mode value is "single" —
// unlike Admit Card, there's no urgency-rule description here implying "range"/"custom_text"
// companions, so only single-date is implemented rather than guessing at undocumented modes.

export interface ParentOption {
  id: number
  card_heading: string
  commission_name: string
  title: string
}

export interface TrackedAlertFormValues {
  parent: ParentOption | null

  card_heading: string
  commission_name: string
  title: string
  commission_name_hero: string
  title_hero: string

  date_value: string
  type_icon: string | null
  type_text: string
  action_icon: string | null
  action_text: string
  update_status_text: string
}

export function emptyTrackedAlertForm(): TrackedAlertFormValues {
  return {
    parent: null,
    card_heading: '',
    commission_name: '',
    title: '',
    commission_name_hero: '',
    title_hero: '',
    date_value: '',
    type_icon: null,
    type_text: '',
    action_icon: null,
    action_text: '',
    update_status_text: '',
  }
}

export { CARD_HEADING_MAX, COMMISSION_NAME_MAX, TITLE_MAX, COMMISSION_NAME_HERO_MAX, TITLE_HERO_MAX }

export type TrackedAlertErrorKey = 'parent' | 'cardDetails' | 'dateValue'

export function validateTrackedAlertForm(
  values: TrackedAlertFormValues,
): Partial<Record<TrackedAlertErrorKey, string>> {
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

  if (!values.date_value.trim()) {
    errors.dateValue = 'Select the alert date.'
  }

  return errors
}

export function trackedAlertToWirePayload(values: TrackedAlertFormValues) {
  return {
    parent: values.parent?.id ?? null,
    card_heading: values.card_heading,
    commission_name: values.commission_name,
    title: values.title,
    commission_name_hero: values.commission_name_hero,
    title_hero: values.title_hero,
    date_mode: 'single' as const,
    date_value: values.date_value,
    type_icon: values.type_icon ?? '',
    type_text: values.type_text,
    action_icon: values.action_icon ?? '',
    action_text: values.action_text,
    update_status_text: values.update_status_text,
  }
}

export type TrackedAlertWirePayload = ReturnType<typeof trackedAlertToWirePayload> & {
  id: number
  group: 'all_updates' | 'personalized'
}

export function trackedAlertFromWirePayload(wire: TrackedAlertWirePayload): TrackedAlertFormValues {
  return {
    parent: wire.parent
      ? { id: wire.parent, card_heading: '', commission_name: '', title: '' }
      : null,
    card_heading: wire.card_heading,
    commission_name: wire.commission_name,
    title: wire.title,
    commission_name_hero: wire.commission_name_hero,
    title_hero: wire.title_hero,
    date_value: wire.date_value,
    type_icon: wire.type_icon || null,
    type_text: wire.type_text,
    action_icon: wire.action_icon || null,
    action_text: wire.action_text,
    update_status_text: wire.update_status_text,
  }
}
