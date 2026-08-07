import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import clsx from 'clsx'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Icon } from '@/components/ui/Icon'
import { TargetAudienceTagsField } from '@/components/posts/TargetAudienceTagsField'
import { useToast } from '@/context/ToastContext'
import { ApiError } from '@/lib/apiClient'
import { useCreatePost, usePostDetail, useUpdatePost } from '@/hooks/usePostForm'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { faTrashCan } from '@fortawesome/free-regular-svg-icons'
import {
  resultFromWirePayload,
  resultToWirePayload,
  emptyResultForm,
  validateResultForm,
  CARD_HEADING_MAX,
  COMMISSION_NAME_MAX,
  TITLE_MAX,
  COMMISSION_NAME_HERO_MAX,
  TITLE_HERO_MAX,
  type ResultErrorKey,
  type ResultFormValues,
  type ResultWirePayload,
} from '@/types/posts/result'

export function ResultFormPage() {
  const { id } = useParams<{ id: string }>()
  const postId = id ? Number(id) : null
  const isEdit = postId !== null
  const navigate = useNavigate()
  const { showToast } = useToast()

  const { data: existing, isLoading } = usePostDetail<ResultWirePayload>('results', postId)
  const createPost = useCreatePost('results')
  const updatePost = useUpdatePost('results')

  const [values, setValues] = useState<ResultFormValues>(emptyResultForm)
  const [errors, setErrors] = useState<Partial<Record<ResultErrorKey, string>>>({})
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (existing) setValues(resultFromWirePayload(existing))
  }, [existing])

  const sectionRefs = useRef<Partial<Record<ResultErrorKey, HTMLDivElement | null>>>({})
  const setSectionRef = (key: ResultErrorKey) => (el: HTMLDivElement | null) => {
    sectionRefs.current[key] = el
  }

  const update = <K extends keyof ResultFormValues>(key: K, value: ResultFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const handlePublishClick = () => {
    const nextErrors = validateResultForm(values)
    setErrors(nextErrors)
    const firstErrorKey = (Object.keys(nextErrors) as ResultErrorKey[])[0]
    if (firstErrorKey) {
      sectionRefs.current[firstErrorKey]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      showToast('Please fix the highlighted fields before publishing.', 'error')
      return
    }
    setConfirmOpen(true)
  }

  const handleConfirmPublish = () => {
    setConfirmOpen(false)
    const payload = resultToWirePayload(values)
    const onSuccess = () => {
      showToast(isEdit ? 'Post updated.' : 'Post published.', 'success')
      navigate('/all-updates/result')
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
      <AppShell title="Result" showBack>
        <p className="py-8 text-center text-sm text-body-subtle">Loading post...</p>
      </AppShell>
    )
  }

  return (
    <AppShell title={isEdit ? 'Edit Result' : 'Post Result'} showBack>
      <div className="space-y-5">
        <div ref={setSectionRef('audience')}>
          <Card>
            <TargetAudienceTagsField
              section="result"
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

        <div ref={setSectionRef('declaredOn')}>
          <Card className={clsx(errors.declaredOn && 'border-error')}>
            <h2 className="mb-3 text-base font-semibold text-heading">Result Details</h2>
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-body">
                Declared On <span className="text-error">*</span>
              </label>
              <input
                type="date"
                value={values.declared_on}
                onChange={(e) => update('declared_on', e.target.value)}
                className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
              {errors.declaredOn && <p className="mt-1.5 text-xs text-error">{errors.declaredOn}</p>}
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-body">Declared On (Full Text)</label>
              <input
                type="text"
                value={values.declared_on_full_text}
                onChange={(e) => update('declared_on_full_text', e.target.value)}
                placeholder="e.g. 20 July 2026"
                className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-body">Result Type</label>
              <input
                type="text"
                value={values.result_type_text}
                onChange={(e) => update('result_type_text', e.target.value)}
                placeholder="e.g. Final Result"
                className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-body">Result Status</label>
              <input
                type="text"
                value={values.result_status_text}
                onChange={(e) => update('result_status_text', e.target.value)}
                placeholder="e.g. Declared"
                className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </Card>
        </div>

        <WhatsNextEditor value={values.whats_next} onChange={(v) => update('whats_next', v)} />

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

function WhatsNextEditor({
  value,
  onChange,
}: {
  value: ResultFormValues['whats_next']
  onChange: (value: ResultFormValues['whats_next']) => void
}) {
  const addPoint = () => {
    onChange({ ...value, points: [...value.points, { id: crypto.randomUUID(), text: '' }] })
  }
  const updatePoint = (id: string, text: string) => {
    onChange({ ...value, points: value.points.map((p) => (p.id === id ? { ...p, text } : p)) })
  }
  const removePoint = (id: string) => {
    onChange({ ...value, points: value.points.filter((p) => p.id !== id) })
  }

  return (
    <Card>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-base font-semibold text-heading">What's Next</h2>
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
                <input
                  type="text"
                  value={point.text}
                  onChange={(e) => updatePoint(point.id, e.target.value)}
                  placeholder="Next step text"
                  className="flex-1 rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removePoint(point.id)}
                  aria-label="Remove point"
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
            Add Point
          </button>
        </>
      )}
    </Card>
  )
}
