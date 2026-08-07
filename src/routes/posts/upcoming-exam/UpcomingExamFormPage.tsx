import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import clsx from 'clsx'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { IconPicker } from '@/components/ui/IconPicker'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TargetAudienceTagsField } from '@/components/posts/TargetAudienceTagsField'
import { PersonalizedTargetingField } from '@/components/posts/PersonalizedTargetingField'
import { useToast } from '@/context/ToastContext'
import { ApiError } from '@/lib/apiClient'
import { useCreatePost, usePostDetail, useUpdatePost } from '@/hooks/usePostForm'
import {
  upcomingExamFromWirePayload,
  upcomingExamToWirePayload,
  emptyUpcomingExamForm,
  validateUpcomingExamForm,
  CARD_HEADING_MAX,
  COMMISSION_NAME_MAX,
  TITLE_MAX,
  COMMISSION_NAME_HERO_MAX,
  TITLE_HERO_MAX,
  QUALIFICATION_TEXT_MAX,
  VACANCIES_TEXT_MAX,
  type UpcomingExamErrorKey,
  type UpcomingExamFormValues,
  type UpcomingExamWirePayload,
} from '@/types/posts/upcomingExam'

interface UpcomingExamFormPageProps {
  variant: 'all-updates' | 'personalized'
}

export function UpcomingExamFormPage({ variant }: UpcomingExamFormPageProps) {
  const { id } = useParams<{ id: string }>()
  const postId = id ? Number(id) : null
  const isEdit = postId !== null
  const navigate = useNavigate()
  const { showToast } = useToast()

  const { data: existing, isLoading } = usePostDetail<UpcomingExamWirePayload>('upcoming-exams', postId)
  const createPost = useCreatePost('upcoming-exams')
  const updatePost = useUpdatePost('upcoming-exams')

  const [values, setValues] = useState<UpcomingExamFormValues>(() => emptyUpcomingExamForm(variant))
  const [errors, setErrors] = useState<Partial<Record<UpcomingExamErrorKey, string>>>({})
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (existing) setValues(upcomingExamFromWirePayload(existing))
  }, [existing])

  const sectionRefs = useRef<Partial<Record<UpcomingExamErrorKey, HTMLDivElement | null>>>({})
  const setSectionRef = (key: UpcomingExamErrorKey) => (el: HTMLDivElement | null) => {
    sectionRefs.current[key] = el
  }

  const update = <K extends keyof UpcomingExamFormValues>(key: K, value: UpcomingExamFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const handlePublishClick = () => {
    const nextErrors = validateUpcomingExamForm(values)
    setErrors(nextErrors)
    const firstErrorKey = (Object.keys(nextErrors) as UpcomingExamErrorKey[])[0]
    if (firstErrorKey) {
      sectionRefs.current[firstErrorKey]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      showToast('Please fix the highlighted fields before publishing.', 'error')
      return
    }
    setConfirmOpen(true)
  }

  const handleConfirmPublish = () => {
    setConfirmOpen(false)
    const payload = upcomingExamToWirePayload(values)
    const onSuccess = () => {
      showToast(isEdit ? 'Post updated.' : 'Post published.', 'success')
      navigate(variant === 'all-updates' ? '/all-updates/upcoming-exam' : '/personalized/upcoming-exam')
    }
    const onError = (err: unknown) =>
      showToast(err instanceof ApiError ? err.message : 'Could not publish. Please try again.', 'error')

    if (isEdit && postId !== null) {
      updatePost.mutate({ id: postId, payload }, { onSuccess, onError })
    } else {
      createPost.mutate(payload, { onSuccess, onError })
    }
  }

  if (isEdit && isLoading) {
    return (
      <AppShell title="Upcoming Exam" showBack>
        <p className="py-8 text-center text-sm text-body-subtle">Loading post...</p>
      </AppShell>
    )
  }

  return (
    <AppShell title={isEdit ? 'Edit Upcoming Exam' : 'Post Upcoming Exam'} showBack>
      <div className="space-y-5">
        <div ref={setSectionRef('audience')}>
          <Card>
            {variant === 'all-updates' ? (
              <TargetAudienceTagsField
                section="upcoming_exam"
                value={values.targetAudience}
                onChange={(v) => update('targetAudience', v)}
                error={errors.audience ?? errors.audienceState}
              />
            ) : (
              <PersonalizedTargetingField
                value={values.personalizedTargeting}
                onChange={(v) => update('personalizedTargeting', v)}
              />
            )}
          </Card>
        </div>

        <div ref={setSectionRef('cardDetails')}>
          <Card className={clsx(errors.cardDetails && 'border-error')}>
            <h2 className="mb-4 text-base font-semibold text-heading">Card Details</h2>
            <TextFieldWithCounter label="Heading" value={values.card_heading} maxLength={CARD_HEADING_MAX} onChange={(v) => update('card_heading', v)} />
            <TextFieldWithCounter label="Commission" value={values.commission_name} maxLength={COMMISSION_NAME_MAX} onChange={(v) => update('commission_name', v)} />
            <TextFieldWithCounter label="Title" value={values.title} maxLength={TITLE_MAX} onChange={(v) => update('title', v)} />
            {errors.cardDetails && <p className="text-xs text-error">{errors.cardDetails}</p>}
          </Card>
        </div>

        <Card>
          <h2 className="mb-4 text-base font-semibold text-heading">Hero Fields</h2>
          <TextFieldWithCounter label="Commission (Hero)" value={values.commission_name_hero} maxLength={COMMISSION_NAME_HERO_MAX} onChange={(v) => update('commission_name_hero', v)} required={false} />
          <TextFieldWithCounter label="Title (Hero)" value={values.title_hero} maxLength={TITLE_HERO_MAX} onChange={(v) => update('title_hero', v)} required={false} />
        </Card>

        <Card>
          <h2 className="mb-4 text-base font-semibold text-heading">Expected Timing</h2>
          <label className="mb-1.5 block text-sm font-medium text-body">Expected Text</label>
          <input
            type="text"
            value={values.expected_text}
            onChange={(e) => update('expected_text', e.target.value)}
            placeholder="e.g. Mid 2026"
            className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </Card>

        <div ref={setSectionRef('vacancies')}>
          <Card className={clsx((errors.vacancies || errors.qualification) && 'border-error')}>
            <h2 className="mb-4 text-base font-semibold text-heading">Vacancies &amp; Qualification</h2>
            <label className="mb-1.5 block text-sm font-medium text-body">
              Vacancies <span className="text-error">*</span>
            </label>
            <input
              type="text"
              value={values.vacancies_text}
              maxLength={VACANCIES_TEXT_MAX}
              onChange={(e) => update('vacancies_text', e.target.value)}
              className="mb-1 w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <p className="mb-4 text-right text-xs text-body-subtle">
              {values.vacancies_text.length}/{VACANCIES_TEXT_MAX}
            </p>

            <label className="mb-1.5 block text-sm font-medium text-body">
              Qualification <span className="text-error">*</span>
            </label>
            <div className="flex gap-2">
              <IconPicker value={values.qualification_icon} onChange={(icon) => update('qualification_icon', icon)} label="Qualification icon" />
              <div className="flex-1">
                <input
                  type="text"
                  value={values.qualification_text}
                  maxLength={QUALIFICATION_TEXT_MAX}
                  onChange={(e) => update('qualification_text', e.target.value)}
                  className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
                <p className="mt-1 text-right text-xs text-body-subtle">
                  {values.qualification_text.length}/{QUALIFICATION_TEXT_MAX}
                </p>
              </div>
            </div>
            {(errors.vacancies || errors.qualification) && (
              <p className="mt-1.5 text-xs text-error">{errors.vacancies ?? errors.qualification}</p>
            )}
          </Card>
        </div>

        <button
          type="button"
          onClick={handlePublishClick}
          disabled={createPost.isPending || updatePost.isPending}
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {isEdit ? 'Save Changes' : 'Publish'}
        </button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title={isEdit ? 'Save changes?' : 'Publish this post?'}
        description={isEdit ? 'Changes will be visible immediately.' : 'It will appear in the feed.'}
        confirmLabel={isEdit ? 'Save Changes' : 'Publish'}
        onConfirm={handleConfirmPublish}
        onCancel={() => setConfirmOpen(false)}
      />
    </AppShell>
  )
}

function TextFieldWithCounter({
  label,
  value,
  maxLength,
  onChange,
  required = true,
}: {
  label: string
  value: string
  maxLength: number
  onChange: (value: string) => void
  required?: boolean
}) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-sm font-medium text-body">
        {label} {required && <span className="text-error">*</span>}
      </label>
      <input
        type="text"
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
      <p className="mt-1 text-right text-xs text-body-subtle">
        {value.length}/{maxLength}
      </p>
    </div>
  )
}
