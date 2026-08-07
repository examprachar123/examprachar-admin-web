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

// Admit Card is documented only via a trimmed request example (no exhaustive field table like
// Latest Exam's) — this implements exactly what the doc shows, plus exam_date_end/exam_date_text
// as the necessary companions to exam_date_mode's 'range'/'custom_text' options (directly implied
// by the doc's urgency rule: "range → 7 days before start through end date").

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

  status_text: string
  mode_text: string

  important_instructions: {
    enabled: boolean
    heading: string
    points: InstructionPoint[]
  }
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
    status_text: '',
    mode_text: '',
    important_instructions: { enabled: false, heading: '', points: [] },
  }
}

export { CARD_HEADING_MAX, COMMISSION_NAME_MAX, TITLE_MAX, COMMISSION_NAME_HERO_MAX, TITLE_HERO_MAX }

export type AdmitCardErrorKey = 'audience' | 'audienceState' | 'cardDetails' | 'examDate'

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

  return errors
}

export function admitCardToWirePayload(values: AdmitCardFormValues) {
  return {
    group: 'all_updates' as const,
    card_heading: values.card_heading,
    commission_name: values.commission_name,
    title: values.title,
    commission_name_hero: values.commission_name_hero,
    title_hero: values.title_hero,
    ...targetAudienceToWire(values.targetAudience),
    exam_date_mode: values.exam_date_mode,
    exam_date_start: values.exam_date_mode !== 'custom_text' ? values.exam_date_start || null : null,
    exam_date_end: values.exam_date_mode === 'range' ? values.exam_date_end || null : null,
    exam_date_text: values.exam_date_mode === 'custom_text' ? values.exam_date_text : '',
    status_text: values.status_text,
    mode_text: values.mode_text,
    important_instructions: {
      enabled: values.important_instructions.enabled,
      heading: values.important_instructions.heading,
      points: values.important_instructions.points.map(({ marker, text }) => ({ marker, text })),
    },
  }
}

export type AdmitCardWirePayload = ReturnType<typeof admitCardToWirePayload> & { id: number }

export function admitCardFromWirePayload(wire: AdmitCardWirePayload): AdmitCardFormValues {
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
    exam_date_mode: wire.exam_date_mode,
    exam_date_start: wire.exam_date_start ?? '',
    exam_date_end: wire.exam_date_end ?? '',
    exam_date_text: wire.exam_date_text ?? '',
    status_text: wire.status_text,
    mode_text: wire.mode_text,
    important_instructions: {
      enabled: wire.important_instructions.enabled,
      heading: wire.important_instructions.heading,
      points: wire.important_instructions.points.map((p) => ({ id: crypto.randomUUID(), ...p })),
    },
  }
}
