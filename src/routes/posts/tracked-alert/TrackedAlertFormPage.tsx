import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import clsx from 'clsx'
import {
  faArrowDown,
  faArrowUp,
  faBolt,
  faCalendarCheck,
  faFileAlt,
  faIdCard,
  faImage,
  faLayerGroup,
  faPuzzlePiece,
} from '@fortawesome/free-solid-svg-icons'
import { faTrashCan } from '@fortawesome/free-regular-svg-icons'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { IconPicker } from '@/components/ui/IconPicker'
import { SearchInput } from '@/components/ui/SearchInput'
import { SegmentedToggle } from '@/components/ui/SegmentedToggle'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { OptionalSectionEditor } from '@/components/posts/OptionalSectionEditor'
import { OptionalSectionLivePreview } from '@/components/posts/OptionalSectionLivePreview'
import { ImportantLinksEditor } from '@/components/posts/ImportantLinksEditor'
import { ImportantLinksLivePreview } from '@/components/posts/ImportantLinksLivePreview'
import { PromoAdsCarouselEditor } from '@/components/posts/PromoAdsCarouselEditor'
import { PromoAdsLivePreview } from '@/components/posts/PromoAdsLivePreview'
import { LivePreviewPanel } from '@/components/posts/LivePreviewPanel'
import { SectionCard } from '@/components/posts/SectionCard'
import { useToast } from '@/context/ToastContext'
import { ApiError } from '@/lib/apiClient'
import { getIconByName } from '@/lib/iconLibrary'
import { useCreatePost, useLatestExamParentOptions, usePostDetail, useUpdatePost } from '@/hooks/usePostForm'
import type { PostGroup, PostSummary } from '@/types/posts'
import {
  emptyTrackedAlertForm,
  trackedAlertFromWirePayload,
  trackedAlertToWirePayload,
  validateTrackedAlertForm,
  computeDateValue,
  CARD_HEADING_MAX,
  COMMISSION_NAME_MAX,
  TITLE_MAX,
  COMMISSION_NAME_HERO_MAX,
  TITLE_HERO_MAX,
  TYPE_TEXT_MAX,
  ACTION_TEXT_MAX,
  UPDATE_STATUS_TEXT_MAX,
  RELEASED_ON_TEXT_MAX,
  type ParentOption,
  type TrackedAlertErrorKey,
  type TrackedAlertFormValues,
  type TrackedAlertWirePayload,
} from '@/types/posts/trackedAlert'
import { DEFAULT_TRACKED_ALERT_LINKS, emptyOptionalSection, type OptionalSectionValue } from '@/types/postCommon'

const MAX_CUSTOM_BOXES = 5

function formatShortDate(dateStr: string): string {
  if (!dateStr) return 'DD MMM'
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

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
  const [promoAdActiveState, setPromoAdActiveState] = useState<number | null>(null)
  const [backendErrors, setBackendErrors] = useState<string[]>([])
  const [importantLinksRowErrors, setImportantLinksRowErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (existing) setValues(trackedAlertFromWirePayload(existing))
  }, [existing])

  // The tracked-alert record only stores the parent's id, not its heading/commission/title --
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
    setBackendErrors([])
    setImportantLinksRowErrors({})
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
    const onError = (err: unknown) => {
      if (!(err instanceof ApiError)) {
        showToast('Could not publish. Please try again.', 'error')
        return
      }

      setBackendErrors(err.fieldMessages)

      const importantLinksErrors = err.fieldErrors?.important_links
      if (Array.isArray(importantLinksErrors)) {
        const sentLinks = [...values.important_links]
          .filter((link) => (link.source_mode === 'url' ? link.url.trim() : link.pdf_url.trim()))
          .sort((a, b) => a.order - b.order)
        const nextRowErrors: Record<string, string> = {}
        importantLinksErrors.forEach((row, i) => {
          const link = sentLinks[i]
          if (!link || !row || typeof row !== 'object') return
          const firstMessage = Object.values(row as Record<string, unknown>)[0]
          if (Array.isArray(firstMessage) && typeof firstMessage[0] === 'string') {
            nextRowErrors[link.id] = firstMessage[0]
          }
        })
        setImportantLinksRowErrors(nextRowErrors)
      }

      showToast(
        err.fieldMessages.length > 1 ? `${err.fieldMessages[0]} (+${err.fieldMessages.length - 1} more — see details below)` : err.message,
        'error',
      )
    }

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
          <ParentPickerField group={group} value={values.parent} onChange={(parent) => update('parent', parent)} error={errors.parent} />
        </div>

        <div ref={setSectionRef('cardDetails')}>
          <CardDetailsSection values={values} update={update} error={errors.cardDetails} />
        </div>

        <div ref={setSectionRef('dateValue')}>
          <DateSection values={values} update={update} error={errors.dateValue} />
        </div>

        <LivePreviewPanel title="Card" defaultOpen>
          <CardLivePreview values={values} />
        </LivePreviewPanel>

        <div ref={setSectionRef('hero')}>
          <HeroFieldsSection values={values} update={update} error={errors.hero} />
        </div>

        <div ref={setSectionRef('typeAction')}>
          <TypeActionSection values={values} update={update} error={errors.typeAction} />
        </div>

        <div ref={setSectionRef('updateStatus')}>
          <UpdateStatusSection values={values} update={update} error={errors.updateStatus} />
        </div>

        <LivePreviewPanel title="Hero + Update Stats">
          <HeroUpdateStatsLivePreview values={values} />
        </LivePreviewPanel>

        <OptionalSectionEditor
          icon={faFileAlt}
          title="Part D: Official Update Summary"
          allowedModes={['table', 'bullets', 'text']}
          value={values.official_update_summary}
          onChange={(v) => update('official_update_summary', v)}
        />

        <LivePreviewPanel title="Official Update Summary">
          <OptionalSectionLivePreview value={values.official_update_summary} />
        </LivePreviewPanel>

        <PromoAdsCarouselEditor
          value={values.promo_ads}
          onChange={(v) => update('promo_ads', v)}
          activeState={promoAdActiveState}
          onActiveStateChange={setPromoAdActiveState}
        />

        <LivePreviewPanel title="Promo Ads">
          <PromoAdsLivePreview value={values.promo_ads} activeState={promoAdActiveState} />
        </LivePreviewPanel>

        <CustomBoxesSection values={values} setValues={setValues} />

        <LivePreviewPanel title="Custom Content">
          {values.custom_content_boxes.length === 0 ? (
            <p className="text-center text-xs font-bold text-body-subtle">No Custom Content</p>
          ) : (
            <div className="space-y-4">
              {values.custom_content_boxes.map((box) => (
                <OptionalSectionLivePreview key={box.id} value={box} />
              ))}
            </div>
          )}
        </LivePreviewPanel>

        <ImportantLinksEditor
          value={values.important_links}
          onChange={(v) => update('important_links', v)}
          rowErrors={importantLinksRowErrors}
          defaultLinks={DEFAULT_TRACKED_ALERT_LINKS}
        />

        <LivePreviewPanel title="Important Links">
          <ImportantLinksLivePreview value={values.important_links} />
        </LivePreviewPanel>

        {backendErrors.length > 0 && (
          <Card className="border-error bg-error/5">
            <p className="mb-2 text-sm font-semibold text-error">
              The server rejected this {isEdit ? 'update' : 'post'} — please fix the following:
            </p>
            <ul className="list-disc space-y-1 pl-5 text-xs text-error">
              {backendErrors.map((message, i) => (
                <li key={i}>{message}</li>
              ))}
            </ul>
          </Card>
        )}

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

// --- Parent Picker (stands in for the mockup's Target Audience Tags -- Tracked Alert has no
// tags/targeting of its own; its audience is entirely inherited from the parent Latest Exam). ---

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
    <SectionCard icon={faLayerGroup} title="Parent Post" error={!!error}>
      <p className="-mt-3 mb-4 text-xs text-body-subtle">This alert inherits its audience entirely from the Latest Exam post you pick here.</p>

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
          {!isLoading && options.length === 0 && <p className="py-6 text-center text-sm text-body-subtle">No published Latest Exam posts found.</p>}
          <ul className="max-h-64 divide-y divide-border overflow-y-auto">
            {options.map((post) => (
              <li key={post.id}>
                <button
                  type="button"
                  onClick={() => onChange({ id: post.id, card_heading: post.card_heading, commission_name: post.commission_name, title: post.title })}
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
    </SectionCard>
  )
}

// --- Part A: Card Details ------------------------------------------------------------------

function CardDetailsSection({
  values,
  update,
  error,
}: {
  values: TrackedAlertFormValues
  update: <K extends keyof TrackedAlertFormValues>(key: K, value: TrackedAlertFormValues[K]) => void
  error?: string
}) {
  return (
    <SectionCard icon={faIdCard} title="Part A: Card Details" error={!!error}>
      <FieldWithCounter label="Card Heading" value={values.card_heading} maxLength={CARD_HEADING_MAX} onChange={(v) => update('card_heading', v)} />
      <FieldWithCounter
        label="Exam Name"
        value={values.commission_name}
        maxLength={COMMISSION_NAME_MAX}
        onChange={(v) => update('commission_name', v)}
      />
      <FieldWithCounter label="Update Title" value={values.title} maxLength={TITLE_MAX} onChange={(v) => update('title', v)} />
      {error && <p className="text-xs text-error">{error}</p>}
    </SectionCard>
  )
}

function FieldWithCounter({
  label,
  value,
  maxLength,
  onChange,
}: {
  label: string
  value: string
  maxLength: number
  onChange: (value: string) => void
}) {
  return (
    <div className="mb-4">
      <label className="mb-1.5 block text-sm font-medium text-body">
        {label} <span className="text-error">*</span>
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

// --- Feed Card Stats (date_mode) ------------------------------------------------------------

function DateSection({
  values,
  update,
  error,
}: {
  values: TrackedAlertFormValues
  update: <K extends keyof TrackedAlertFormValues>(key: K, value: TrackedAlertFormValues[K]) => void
  error?: string
}) {
  return (
    <SectionCard icon={faBolt} title="Feed Card Stats" error={!!error}>
      <label className="mb-1.5 block text-sm font-medium text-body">
        Date <span className="text-error">*</span>
      </label>
      <SegmentedToggle
        options={[
          { value: 'single', label: 'Single Date' },
          { value: 'range', label: 'Date Range' },
          { value: 'custom_text', label: 'Custom Text' },
        ]}
        value={values.date_mode}
        onChange={(date_mode) => update('date_mode', date_mode)}
        className="mb-3"
      />

      {values.date_mode === 'single' && (
        <input
          type="date"
          value={values.date_single}
          onChange={(e) => update('date_single', e.target.value)}
          className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      )}

      {values.date_mode === 'range' && (
        <>
          <div className="flex gap-2">
            <input
              type="date"
              value={values.date_range_start}
              onChange={(e) => update('date_range_start', e.target.value)}
              className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <input
              type="date"
              value={values.date_range_end}
              onChange={(e) => update('date_range_end', e.target.value)}
              className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          {values.date_value_existing && !values.date_range_start && (
            <p className="mt-1.5 text-xs text-body-subtle">Current value: {values.date_value_existing} — pick both dates again to change it.</p>
          )}
        </>
      )}

      {values.date_mode === 'custom_text' && (
        <>
          <input
            type="text"
            value={values.date_custom_text}
            maxLength={15}
            placeholder="e.g. To Be Notified"
            onChange={(e) => update('date_custom_text', e.target.value)}
            className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <p className="mt-1 text-right text-xs text-body-subtle">{values.date_custom_text.length}/15 characters</p>
        </>
      )}

      {error && <p className="mt-2 text-xs text-error">{error}</p>}
    </SectionCard>
  )
}

// --- Card Live Preview -----------------------------------------------------------------

function CardLivePreview({ values }: { values: TrackedAlertFormValues }) {
  const typeIcon = getIconByName(values.type_icon) ?? getIconByName('file-signature')
  const actionIcon = getIconByName(values.action_icon) ?? getIconByName('link')
  const dateLabel = values.date_mode === 'single' ? formatShortDate(values.date_single) : computeDateValue(values) || 'DD MMM'

  return (
    <div className="relative mx-auto w-[190px] overflow-hidden rounded-2xl border-[1.5px] border-primary bg-white p-4 shadow-sm">
      <span className="absolute left-2 top-2 z-10 rounded bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold text-indigo-600">NEW</span>

      <div className="relative mb-3 flex h-[4.8rem] items-center justify-center rounded-xl border border-page bg-gradient-to-br from-white to-slate-100 px-4">
        <span className="line-clamp-2 text-center text-lg font-extrabold leading-tight tracking-tight text-heading">
          {values.card_heading || 'HEADING'}
        </span>
      </div>

      <p className="text-[11px] font-bold text-slate-600">{values.commission_name || 'Exam Name Appears Here'}</p>
      <p className="mt-1 text-[14px] font-extrabold leading-snug text-heading">{values.title || 'Update Title Appears Here'}</p>

      <div className="mt-3 space-y-1.5 text-[11px] font-semibold text-heading">
        <div className="flex items-center gap-1.5">
          <Icon icon={faCalendarCheck} className="w-3.5 text-primary" />
          Date: {dateLabel}
        </div>
        <div className="flex items-center gap-1.5">
          {typeIcon && <Icon icon={typeIcon} className="w-3.5 text-primary" />}
          Type: {values.type_text || 'Type'}
        </div>
        <div className="flex items-center gap-1.5">
          {actionIcon && <Icon icon={actionIcon} className="w-3.5 text-primary" />}
          Action: {values.action_text || 'Action'}
        </div>
      </div>

      <button type="button" disabled className="mt-3 w-full rounded-xl bg-primary py-2.5 text-xs font-bold text-white disabled:opacity-100">
        View Details
      </button>
    </div>
  )
}

// --- Part B: Hero Fields -------------------------------------------------------------------

function HeroFieldsSection({
  values,
  update,
  error,
}: {
  values: TrackedAlertFormValues
  update: <K extends keyof TrackedAlertFormValues>(key: K, value: TrackedAlertFormValues[K]) => void
  error?: string
}) {
  return (
    <SectionCard icon={faImage} title="Part B: Hero Banner" error={!!error}>
      <FieldWithCounter
        label="Commission Name (Hero)"
        value={values.commission_name_hero}
        maxLength={COMMISSION_NAME_HERO_MAX}
        onChange={(v) => update('commission_name_hero', v)}
      />
      <FieldWithCounter label="Update Title (Hero)" value={values.title_hero} maxLength={TITLE_HERO_MAX} onChange={(v) => update('title_hero', v)} />
      {error && <p className="text-xs text-error">{error}</p>}
    </SectionCard>
  )
}

// --- Part C: Type / Action / Update Status ---------------------------------------------------

function TypeActionSection({
  values,
  update,
  error,
}: {
  values: TrackedAlertFormValues
  update: <K extends keyof TrackedAlertFormValues>(key: K, value: TrackedAlertFormValues[K]) => void
  error?: string
}) {
  return (
    <SectionCard icon={faLayerGroup} title="Part C: Update Stats Block" error={!!error}>
      <div className="mb-4 rounded-xl border border-border bg-page p-4">
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-body">
          Box 1: Type <span className="text-error">*</span>
        </h4>
        <div className="flex gap-2">
          <IconPicker value={values.type_icon} onChange={(icon) => update('type_icon', icon)} label="Type icon" />
          <div className="flex-1">
            <input
              type="text"
              value={values.type_text}
              maxLength={TYPE_TEXT_MAX}
              placeholder="e.g. Answer Key"
              onChange={(e) => update('type_text', e.target.value)}
              className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>
        <p className="mt-1 text-right text-xs text-body-subtle">
          {values.type_text.length}/{TYPE_TEXT_MAX}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-page p-4">
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-body">
          Box 2: Action <span className="text-error">*</span>
        </h4>
        <div className="flex gap-2">
          <IconPicker value={values.action_icon} onChange={(icon) => update('action_icon', icon)} label="Action icon" />
          <div className="flex-1">
            <input
              type="text"
              value={values.action_text}
              maxLength={ACTION_TEXT_MAX}
              placeholder="e.g. Download"
              onChange={(e) => update('action_text', e.target.value)}
              className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>
        <p className="mt-1 text-right text-xs text-body-subtle">
          {values.action_text.length}/{ACTION_TEXT_MAX}
        </p>
      </div>

      {error && <p className="mt-2 text-xs text-error">{error}</p>}
    </SectionCard>
  )
}

function UpdateStatusSection({
  values,
  update,
  error,
}: {
  values: TrackedAlertFormValues
  update: <K extends keyof TrackedAlertFormValues>(key: K, value: TrackedAlertFormValues[K]) => void
  error?: string
}) {
  return (
    <SectionCard icon={faBolt} title="Box 3: Update Status" error={!!error}>
      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-medium text-body">
          Update Status <span className="text-error">*</span>
        </label>
        <input
          type="text"
          value={values.update_status_text}
          maxLength={UPDATE_STATUS_TEXT_MAX}
          placeholder="e.g. Available Now"
          onChange={(e) => update('update_status_text', e.target.value)}
          className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <p className="mt-1 text-right text-xs text-body-subtle">
          {values.update_status_text.length}/{UPDATE_STATUS_TEXT_MAX}
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-body">Released On (Free Text)</label>
        <input
          type="text"
          value={values.released_on_text}
          maxLength={RELEASED_ON_TEXT_MAX}
          placeholder="e.g. 03 Oct 2025"
          onChange={(e) => update('released_on_text', e.target.value)}
          className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <p className="mt-1 text-right text-xs text-body-subtle">
          {values.released_on_text.length}/{RELEASED_ON_TEXT_MAX}
        </p>
      </div>

      {error && <p className="mt-2 text-xs text-error">{error}</p>}
    </SectionCard>
  )
}

// --- Hero + Update Stats Live Preview -------------------------------------------------------

function HeroUpdateStatsLivePreview({ values }: { values: TrackedAlertFormValues }) {
  const typeIcon = getIconByName(values.type_icon) ?? getIconByName('file-signature')
  const actionIcon = getIconByName(values.action_icon) ?? getIconByName('link')

  return (
    <div className="mx-auto w-full max-w-xs space-y-5">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#5b54fa] to-primary p-5 shadow-[0_8px_24px_rgba(79,70,229,0.25)]">
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/15 blur-xl" />
        <div className="relative z-10">
          <p className="mb-1.5 text-sm font-bold leading-tight text-white">{values.commission_name_hero || 'Commission Name'}</p>
          <h1 className="text-xl font-extrabold leading-snug tracking-tight text-white">{values.title_hero || 'Update Title Appears Here'}</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center rounded-2xl border border-border bg-white p-4 text-center shadow-sm">
          <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary-gradient-from text-primary">
            {typeIcon && <Icon icon={typeIcon} className="text-base" />}
          </span>
          <h4 className="text-xs font-bold text-body">Type</h4>
          <span className="text-sm font-extrabold leading-tight text-heading">{values.type_text || 'Value'}</span>
        </div>
        <div className="flex flex-col items-center rounded-2xl border border-border bg-white p-4 text-center shadow-sm">
          <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary-gradient-from text-primary">
            {actionIcon && <Icon icon={actionIcon} className="text-base" />}
          </span>
          <h4 className="text-xs font-bold text-body">Action</h4>
          <span className="text-sm font-extrabold leading-tight text-heading">{values.action_text || 'Value'}</span>
        </div>
      </div>

      <div className="flex flex-col items-center rounded-2xl border border-border bg-white p-6 text-center shadow-sm">
        <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary-gradient-from text-primary">
          <Icon icon={faBolt} className="text-base" />
        </span>
        <h4 className="text-sm font-bold text-body">Update Status</h4>
        <p className="mt-0.5 text-xl font-extrabold text-primary">{values.update_status_text || 'Available Now'}</p>
        <p className="mt-2 text-xs font-bold text-body-subtle">
          Released on: <span className="font-extrabold text-heading">{values.released_on_text || 'DD MMM YYYY'}</span>
        </p>
      </div>
    </div>
  )
}

// --- Part F: Custom Boxes -------------------------------------------------------------------

function CustomBoxesSection({
  values,
  setValues,
}: {
  values: TrackedAlertFormValues
  setValues: (updater: (prev: TrackedAlertFormValues) => TrackedAlertFormValues) => void
}) {
  const boxes = values.custom_content_boxes

  const updateBox = (boxId: string, next: OptionalSectionValue) => {
    setValues((prev) => ({ ...prev, custom_content_boxes: prev.custom_content_boxes.map((b) => (b.id === boxId ? { ...next, id: boxId } : b)) }))
  }
  const removeBox = (boxId: string) => {
    setValues((prev) => ({ ...prev, custom_content_boxes: prev.custom_content_boxes.filter((b) => b.id !== boxId) }))
  }
  const moveBox = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= boxes.length) return
    setValues((prev) => {
      const next = [...prev.custom_content_boxes]
      ;[next[index], next[target]] = [next[target], next[index]]
      return { ...prev, custom_content_boxes: next }
    })
  }
  const addBox = () => {
    if (boxes.length >= MAX_CUSTOM_BOXES) return
    setValues((prev) => ({
      ...prev,
      custom_content_boxes: [...prev.custom_content_boxes, { ...emptyOptionalSection('text'), id: crypto.randomUUID(), enabled: true }],
    }))
  }

  const atLimit = boxes.length >= MAX_CUSTOM_BOXES

  return (
    <SectionCard icon={faPuzzlePiece} title="Part F: Custom Boxes">
      <p className="-mt-3 mb-4 text-xs text-body-subtle">
        Add up to {MAX_CUSTOM_BOXES} custom content sections for flexible information (e.g. Objection Details, Important Dates).
      </p>
      <div className="space-y-3">
        {boxes.map((box, idx) => (
          <OptionalSectionEditor
            key={box.id}
            icon={faPuzzlePiece}
            title={`Box #${idx + 1}`}
            allowedModes={['text', 'bullets', 'table']}
            value={box}
            onChange={(v) => updateBox(box.id, v)}
            extraControls={
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => moveBox(idx, -1)}
                  disabled={idx === 0}
                  aria-label="Move up"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-body-subtle hover:bg-page disabled:opacity-30"
                >
                  <Icon icon={faArrowUp} className="text-xs" />
                </button>
                <button
                  type="button"
                  onClick={() => moveBox(idx, 1)}
                  disabled={idx === boxes.length - 1}
                  aria-label="Move down"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-body-subtle hover:bg-page disabled:opacity-30"
                >
                  <Icon icon={faArrowDown} className="text-xs" />
                </button>
                <button
                  type="button"
                  onClick={() => removeBox(box.id)}
                  aria-label={`Remove Box #${idx + 1}`}
                  className="ml-1 text-body-subtle hover:text-error"
                >
                  <Icon icon={faTrashCan} className="text-xs" />
                </button>
              </div>
            }
          />
        ))}
      </div>
      <button
        type="button"
        onClick={addBox}
        disabled={atLimit}
        className={clsx(
          'mt-3 w-full rounded-xl border border-dashed border-input-border py-2.5 text-sm font-medium text-body-subtle hover:border-primary-border-accent hover:text-primary',
          atLimit && 'cursor-not-allowed opacity-50',
        )}
      >
        {atLimit ? `Max ${MAX_CUSTOM_BOXES} reached` : '+ Add Custom Box'}
      </button>
    </SectionCard>
  )
}
