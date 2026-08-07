import {
  targetAudienceToWire,
  personalizedTargetingToWire,
  EMPTY_TARGET_AUDIENCE,
  EMPTY_PERSONALIZED_TARGETING,
  type PersonalizedTargetingValue,
  type TargetAudienceValue,
} from '@/types/postCommon'
import {
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

// Upcoming Exam is documented only via a trimmed (personalized) request example, but its
// Dashboard tile exists for both All Updates and Personalized (like Latest Exam), so both
// targeting modes are implemented here the same way. core_stats / prediction_analysis /
// previous_year_data / expected_vacancy_split are freeform JSON with "no schema specified in
// the source spec" per the doc — same as Latest Exam's `sections` field, they're intentionally
// left out of this form rather than guessing a shape, and are never sent (server-side default).

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

export type UpcomingExamErrorKey = 'audience' | 'audienceState' | 'cardDetails' | 'vacancies' | 'qualification'

export function validateUpcomingExamForm(
  values: UpcomingExamFormValues,
): Partial<Record<UpcomingExamErrorKey, string>> {
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

  if (!values.vacancies_text.trim()) {
    errors.vacancies = 'Vacancies is required.'
  }

  if (!values.qualification_text.trim()) {
    errors.qualification = 'Qualification is required.'
  }

  return errors
}

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
    ...audience,
    ...personalized,
    expected_text: values.expected_text,
    vacancies_text: values.vacancies_text,
    qualification_icon: values.qualification_icon ?? '',
    qualification_text: values.qualification_text,
  }
}

export type UpcomingExamWirePayload = ReturnType<typeof upcomingExamToWirePayload> & { id: number }

export function upcomingExamFromWirePayload(wire: UpcomingExamWirePayload): UpcomingExamFormValues {
  const variant: 'all-updates' | 'personalized' = wire.group === 'personalized' ? 'personalized' : 'all-updates'

  const selectedKeys: TargetAudienceValue['selectedKeys'] = []
  if (wire.targets_top) selectedKeys.push('top')
  if (wire.targets_state) selectedKeys.push('state')
  for (const tagId of wire.tags) selectedKeys.push(`tag:${tagId}`)

  return {
    variant,
    targetAudience: { selectedKeys, stateIds: wire.target_states },
    personalizedTargeting: {
      region:
        wire.target_region === 'all_india' || !wire.target_region ? 'all-india' : { stateId: Number(wire.target_region) },
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
  }
}
