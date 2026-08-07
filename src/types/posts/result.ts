import {
  targetAudienceToWire,
  EMPTY_TARGET_AUDIENCE,
  type TargetAudienceValue,
} from '@/types/postCommon'
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

// Result is documented only via a trimmed request example. No is_urgent, no track bell —
// the badge is always the client-side constant "OUT NOW" (not a field on this type).

export interface WhatsNextPoint {
  id: string
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
  result_status_text: string
  declared_on_full_text: string

  whats_next: {
    enabled: boolean
    heading: string
    points: WhatsNextPoint[]
  }
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
    result_status_text: '',
    declared_on_full_text: '',
    whats_next: { enabled: false, heading: '', points: [] },
  }
}

export { CARD_HEADING_MAX, COMMISSION_NAME_MAX, TITLE_MAX, COMMISSION_NAME_HERO_MAX, TITLE_HERO_MAX }

export type ResultErrorKey = 'audience' | 'audienceState' | 'cardDetails' | 'declaredOn'

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

  if (!values.declared_on.trim()) {
    errors.declaredOn = 'Select the declared-on date.'
  }

  return errors
}

export function resultToWirePayload(values: ResultFormValues) {
  return {
    group: 'all_updates' as const,
    card_heading: values.card_heading,
    commission_name: values.commission_name,
    title: values.title,
    commission_name_hero: values.commission_name_hero,
    title_hero: values.title_hero,
    ...targetAudienceToWire(values.targetAudience),
    declared_on: values.declared_on || null,
    result_type_text: values.result_type_text,
    result_status_text: values.result_status_text,
    declared_on_full_text: values.declared_on_full_text,
    whats_next: {
      enabled: values.whats_next.enabled,
      heading: values.whats_next.heading,
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

  return {
    targetAudience: { selectedKeys, stateIds: wire.target_states },
    card_heading: wire.card_heading,
    commission_name: wire.commission_name,
    title: wire.title,
    commission_name_hero: wire.commission_name_hero,
    title_hero: wire.title_hero,
    declared_on: wire.declared_on ?? '',
    result_type_text: wire.result_type_text,
    result_status_text: wire.result_status_text,
    declared_on_full_text: wire.declared_on_full_text,
    whats_next: {
      enabled: wire.whats_next.enabled,
      heading: wire.whats_next.heading,
      points: wire.whats_next.points.map((p) => ({ id: crypto.randomUUID(), ...p })),
    },
  }
}
