import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import clsx from 'clsx'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { SearchInput } from '@/components/ui/SearchInput'
import { IconPicker } from '@/components/ui/IconPicker'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Icon } from '@/components/ui/Icon'
import { faFileAlt } from '@fortawesome/free-solid-svg-icons'
import { useToast } from '@/context/ToastContext'
import { ApiError } from '@/lib/apiClient'
import {
  useCreatePost,
  useLatestExamParentOptions,
  usePostDetail,
  useUpdatePost,
} from '@/hooks/usePostForm'
import type { PostGroup, PostSummary } from '@/types/posts'
import {
  trackedAlertFromWirePayload,
  trackedAlertToWirePayload,
  emptyTrackedAlertForm,
  validateTrackedAlertForm,
  CARD_HEADING_MAX,
  COMMISSION_NAME_MAX,
  TITLE_MAX,
  COMMISSION_NAME_HERO_MAX,
  TITLE_HERO_MAX,
  type ParentOption,
  type TrackedAlertErrorKey,
  type TrackedAlertFormValues,
  type TrackedAlertWirePayload,
} from '@/types/posts/trackedAlert'

interface TrackedAlertFormPageProps {
  variant: 'all-updates' | 'personalized'
}

export function TrackedAlertFormPage({ variant }: TrackedAlertFormPageProps) {
  const { id } = useParams<{ id: string }>()
  const postId = id ? Number(id) : null
  const isEdit = postId !== null
  const navigate = useNavigate()
  const { showToast } = useToast()
  const group: PostGroup = variant === 'all-updates' ? 'all_updates' : 'personalized'

  const { data: existing, isLoading } = usePostDetail<TrackedAlertWirePayload>('tracked-alerts', postId)
  const createPost = useCreatePost('tracked-alerts')
  const updatePost = useUpdatePost('tracked-alerts')

  const [values, setValues] = useState<TrackedAlertFormValues>(emptyTrackedAlertForm)
  const [errors, setErrors] = useState<Partial<Record<TrackedAlertErrorKey, string>>>({})
  const [confirmOpen, setConfirmOpen] = useState(false)

  useEffect(() => {
    if (existing) setValues(trackedAlertFromWirePayload(existing))
  }, [existing])

  // The tracked-alert record only stores the parent's id, not its heading/commission/title —
  // fetch the parent post once to display something more useful than a bare id when editing.
  const { data: parentDetail } = usePostDetail<PostSummary>(
    'latest-exams',
    values.parent && !values.parent.card_heading ? values.parent.id : null,
  )
  useEffect(() => {
    if (parentDetail && values.parent && !values.parent.card_heading) {
      setValues((prev) => (prev.parent ? { ...prev, parent: { ...prev.parent, ...parentDetail } } : prev))
    }
  }, [parentDetail, values.parent])

  const sectionRefs = useRef<Partial<Record<TrackedAlertErrorKey, HTMLDivElement | null>>>({})
  const setSectionRef = (key: TrackedAlertErrorKey) => (el: HTMLDivElement | null) => {
    sectionRefs.current[key] = el
  }

  const update = <K extends keyof TrackedAlertFormValues>(key: K, value: TrackedAlertFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const handlePublishClick = () => {
    const nextErrors = validateTrackedAlertForm(values)
    setErrors(nextErrors)
    const firstErrorKey = (Object.keys(nextErrors) as TrackedAlertErrorKey[])[0]
    if (firstErrorKey) {
      sectionRefs.current[firstErrorKey]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      showToast('Please fix the highlighted fields before publishing.', 'error')
      return
    }
    setConfirmOpen(true)
  }

  const handleConfirmPublish = () => {
    setConfirmOpen(false)
    const payload = trackedAlertToWirePayload(values)
    const onSuccess = () => {
      showToast(isEdit ? 'Alert updated.' : 'Alert published.', 'success')
      navigate('/tracked-alerts')
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
      <AppShell title="Tracked Alert" showBack>
        <p className="py-8 text-center text-sm text-body-subtle">Loading alert...</p>
      </AppShell>
    )
  }

  return (
    <AppShell title={isEdit ? 'Edit Tracked Alert' : 'Post Tracked Alert'} showBack>
      <div className="space-y-5">
        <div ref={setSectionRef('parent')}>
          <ParentPickerField
            group={group}
            value={values.parent}
            onChange={(parent) => update('parent', parent)}
            error={errors.parent}
          />
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

        <div ref={setSectionRef('dateValue')}>
          <Card className={clsx(errors.dateValue && 'border-error')}>
            <h2 className="mb-3 text-base font-semibold text-heading">Alert Date</h2>
            <input
              type="date"
              value={values.date_value}
              onChange={(e) => update('date_value', e.target.value)}
              className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            {errors.dateValue && <p className="mt-1.5 text-xs text-error">{errors.dateValue}</p>}
          </Card>
        </div>

        <Card>
          <h2 className="mb-4 text-base font-semibold text-heading">Type &amp; Action</h2>
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-body">Type</label>
            <div className="flex gap-2">
              <IconPicker value={values.type_icon} onChange={(icon) => update('type_icon', icon)} label="Type icon" />
              <input
                type="text"
                value={values.type_text}
                onChange={(e) => update('type_text', e.target.value)}
                placeholder="e.g. Admit Card"
                className="flex-1 rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="mb-1.5 block text-sm font-medium text-body">Action</label>
            <div className="flex gap-2">
              <IconPicker value={values.action_icon} onChange={(icon) => update('action_icon', icon)} label="Action icon" />
              <input
                type="text"
                value={values.action_text}
                onChange={(e) => update('action_text', e.target.value)}
                placeholder="e.g. Download"
                className="flex-1 rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-body">Update Status</label>
            <input
              type="text"
              value={values.update_status_text}
              onChange={(e) => update('update_status_text', e.target.value)}
              placeholder="e.g. Released"
              className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </Card>

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
        title={isEdit ? 'Save changes?' : 'Publish this alert?'}
        description={isEdit ? 'Changes will be visible immediately.' : 'It will appear under its parent post.'}
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

function ParentPickerField({
  group,
  value,
  onChange,
  error,
}: {
  group: PostGroup
  value: ParentOption | null
  onChange: (parent: ParentOption | null) => void
  error?: string
}) {
  const [search, setSearch] = useState('')
  const { data: options = [], isLoading } = useLatestExamParentOptions(group, search)

  return (
    <Card className={clsx(error && 'border-error')}>
      <h2 className="mb-1 text-base font-semibold text-heading">
        Parent Post <span className="text-error">*</span>
      </h2>
      <p className="mb-3 text-xs text-body-subtle">
        This alert inherits its audience entirely from the Latest Exam post you pick here.
      </p>

      {value ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-primary-border-accent bg-primary-gradient-from p-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-heading">{value.card_heading || `Post #${value.id}`}</p>
            <p className="truncate text-xs text-body-subtle">
              {value.commission_name} {value.title && `· ${value.title}`}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="shrink-0 rounded-lg border border-input-border bg-white px-3 py-1.5 text-xs font-medium text-body hover:bg-page"
          >
            Change
          </button>
        </div>
      ) : (
        <>
          <SearchInput value={search} onChange={setSearch} placeholder="Search Latest Exam posts..." className="mb-3" />

          {isLoading && <p className="py-4 text-center text-sm text-body-subtle">Loading...</p>}

          {!isLoading && options.length === 0 && (
            <div className="flex flex-col items-center py-8 text-center">
              <Icon icon={faFileAlt} className="mb-2 text-2xl text-border" />
              <p className="text-sm text-body-subtle">No published Latest Exam posts found.</p>
            </div>
          )}

          <ul className="max-h-64 divide-y divide-border overflow-y-auto">
            {options.map((post) => (
              <li key={post.id}>
                <button
                  type="button"
                  onClick={() =>
                    onChange({
                      id: post.id,
                      card_heading: post.card_heading,
                      commission_name: post.commission_name,
                      title: post.title,
                    })
                  }
                  className="w-full py-2.5 text-left hover:text-primary"
                >
                  <p className="truncate text-sm font-medium text-body">{post.card_heading}</p>
                  <p className="truncate text-xs text-body-subtle">
                    {post.commission_name} &middot; {post.title}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </>
      )}

      {error && <p className="mt-2 text-xs text-error">{error}</p>}
    </Card>
  )
}
