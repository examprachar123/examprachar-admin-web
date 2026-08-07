import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import clsx from 'clsx'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { SegmentedToggle } from '@/components/ui/SegmentedToggle'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Icon } from '@/components/ui/Icon'
import { TargetAudienceTagsField } from '@/components/posts/TargetAudienceTagsField'
import { useToast } from '@/context/ToastContext'
import { ApiError } from '@/lib/apiClient'
import { useCreatePost, usePostDetail, useUpdatePost } from '@/hooks/usePostForm'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { faTrashCan } from '@fortawesome/free-regular-svg-icons'
import {
  admitCardFromWirePayload,
  admitCardToWirePayload,
  emptyAdmitCardForm,
  validateAdmitCardForm,
  CARD_HEADING_MAX,
  COMMISSION_NAME_MAX,
  TITLE_MAX,
  COMMISSION_NAME_HERO_MAX,
  TITLE_HERO_MAX,
  type AdmitCardErrorKey,
  type AdmitCardFormValues,
  type AdmitCardWirePayload,
  type InstructionPoint,
} from '@/types/posts/admitCard'

const MARKERS: { value: InstructionPoint['marker']; label: string }[] = [
  { value: 'tick', label: 'Tick' },
  { value: 'dot', label: 'Dot' },
  { value: 'warning', label: 'Warning' },
]

export function AdmitCardFormPage() {
  const { id } = useParams<{ id: string }>()
  const postId = id ? Number(id) : null
  const isEdit = postId !== null
  const navigate = useNavigate()
  const { showToast } = useToast()

  const { data: existing, isLoading } = usePostDetail<AdmitCardWirePayload>('admit-cards', postId)
  const createPost = useCreatePost('admit-cards')
  const updatePost = useUpdatePost('admit-cards')

  const [values, setValues] = useState<AdmitCardFormValues>(emptyAdmitCardForm)
  const [errors, setErrors] = useState<Partial<Record<AdmitCardErrorKey, string>>>({})
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (existing) setValues(admitCardFromWirePayload(existing))
  }, [existing])

  const sectionRefs = useRef<Partial<Record<AdmitCardErrorKey, HTMLDivElement | null>>>({})
  const setSectionRef = (key: AdmitCardErrorKey) => (el: HTMLDivElement | null) => {
    sectionRefs.current[key] = el
  }

  const update = <K extends keyof AdmitCardFormValues>(key: K, value: AdmitCardFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const handlePublishClick = () => {
    const nextErrors = validateAdmitCardForm(values)
    setErrors(nextErrors)
    const firstErrorKey = (Object.keys(nextErrors) as AdmitCardErrorKey[])[0]
    if (firstErrorKey) {
      sectionRefs.current[firstErrorKey]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      showToast('Please fix the highlighted fields before publishing.', 'error')
      return
    }
    setConfirmOpen(true)
  }

  const handleConfirmPublish = () => {
    setConfirmOpen(false)
    const payload = admitCardToWirePayload(values)
    const onSuccess = () => {
      showToast(isEdit ? 'Post updated.' : 'Post published.', 'success')
      navigate('/all-updates/admit-card')
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
      <AppShell title="Admit Card" showBack>
        <p className="py-8 text-center text-sm text-body-subtle">Loading post...</p>
      </AppShell>
    )
  }

  return (
    <AppShell title={isEdit ? 'Edit Admit Card' : 'Post Admit Card'} showBack>
      <div className="space-y-5">
        <div ref={setSectionRef('audience')}>
          <Card>
            <TargetAudienceTagsField
              section="admit_card"
              value={values.targetAudience}
              onChange={(v) => update('targetAudience', v)}
              error={errors.audience ?? errors.audienceState}
            />
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

        <div ref={setSectionRef('examDate')}>
          <Card className={clsx(errors.examDate && 'border-error')}>
            <h2 className="mb-3 text-base font-semibold text-heading">Exam Date</h2>
            <SegmentedToggle
              options={[
                { value: 'single', label: 'Single Date' },
                { value: 'range', label: 'Date Range' },
                { value: 'custom_text', label: 'Custom Text' },
              ]}
              value={values.exam_date_mode}
              onChange={(mode) => update('exam_date_mode', mode)}
              className="mb-3"
            />
            {values.exam_date_mode === 'single' && (
              <input
                type="date"
                value={values.exam_date_start}
                onChange={(e) => update('exam_date_start', e.target.value)}
                className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            )}
            {values.exam_date_mode === 'range' && (
              <div className="flex gap-3">
                <input
                  type="date"
                  value={values.exam_date_start}
                  onChange={(e) => update('exam_date_start', e.target.value)}
                  className="flex-1 rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
                <input
                  type="date"
                  value={values.exam_date_end}
                  onChange={(e) => update('exam_date_end', e.target.value)}
                  className="flex-1 rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>
            )}
            {values.exam_date_mode === 'custom_text' && (
              <input
                type="text"
                value={values.exam_date_text}
                onChange={(e) => update('exam_date_text', e.target.value)}
                placeholder="e.g. To be announced"
                className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            )}
            {values.exam_date_mode === 'custom_text' && (
              <p className="mt-1.5 text-xs text-body-subtle">Custom text is never treated as urgent.</p>
            )}
            {errors.examDate && <p className="mt-1.5 text-xs text-error">{errors.examDate}</p>}
          </Card>
        </div>

        <Card>
          <h2 className="mb-4 text-base font-semibold text-heading">Status</h2>
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-body">Status Text</label>
            <input
              type="text"
              value={values.status_text}
              onChange={(e) => update('status_text', e.target.value)}
              placeholder="e.g. Released"
              className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-body">Mode Text</label>
            <input
              type="text"
              value={values.mode_text}
              onChange={(e) => update('mode_text', e.target.value)}
              placeholder="e.g. Online"
              className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </Card>

        <ImportantInstructionsEditor
          value={values.important_instructions}
          onChange={(v) => update('important_instructions', v)}
        />

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

function ImportantInstructionsEditor({
  value,
  onChange,
}: {
  value: AdmitCardFormValues['important_instructions']
  onChange: (value: AdmitCardFormValues['important_instructions']) => void
}) {
  const addPoint = () => {
    onChange({
      ...value,
      points: [...value.points, { id: crypto.randomUUID(), marker: 'tick', text: '' }],
    })
  }
  const updatePoint = (id: string, patch: Partial<InstructionPoint>) => {
    onChange({ ...value, points: value.points.map((p) => (p.id === id ? { ...p, ...patch } : p)) })
  }
  const removePoint = (id: string) => {
    onChange({ ...value, points: value.points.filter((p) => p.id !== id) })
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-heading">Important Instructions</h2>
        <label className="flex items-center gap-2 text-sm text-body">
          <input
            type="checkbox"
            checked={value.enabled}
            onChange={(e) => onChange({ ...value, enabled: e.target.checked })}
          />
          Enabled
        </label>
      </div>

      {value.enabled && (
        <>
          <input
            type="text"
            value={value.heading}
            onChange={(e) => onChange({ ...value, heading: e.target.value })}
            placeholder="Section heading"
            className="mb-3 w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />

          <div className="space-y-2">
            {value.points.map((point) => (
              <div key={point.id} className="flex items-center gap-2">
                <select
                  value={point.marker}
                  onChange={(e) => updatePoint(point.id, { marker: e.target.value as InstructionPoint['marker'] })}
                  className="rounded-lg border border-input-border px-2 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  {MARKERS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={point.text}
                  onChange={(e) => updatePoint(point.id, { text: e.target.value })}
                  placeholder="Instruction text"
                  className="flex-1 rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removePoint(point.id)}
                  aria-label="Remove instruction"
                  className="shrink-0 text-body-subtle hover:text-error"
                >
                  <Icon icon={faTrashCan} className="text-xs" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addPoint}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-input-border py-2.5 text-sm font-medium text-body-subtle hover:border-primary-border-accent hover:text-primary"
          >
            <Icon icon={faPlus} className="text-xs" />
            Add Instruction
          </button>
        </>
      )}
    </Card>
  )
}
