import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import clsx from 'clsx'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { SegmentedToggle } from '@/components/ui/SegmentedToggle'
import { IconPicker } from '@/components/ui/IconPicker'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TargetAudienceTagsField } from '@/components/posts/TargetAudienceTagsField'
import { PersonalizedTargetingField } from '@/components/posts/PersonalizedTargetingField'
import { OptionalSectionEditor } from '@/components/posts/OptionalSectionEditor'
import { ImportantLinksEditor } from '@/components/posts/ImportantLinksEditor'
import { PromoAdsCarouselEditor } from '@/components/posts/PromoAdsCarouselEditor'
import { LivePreviewPanel } from '@/components/posts/LivePreviewPanel'
import { PostWiseDetailsModal } from '@/routes/posts/latest-exam/PostWiseDetailsModal'
import { useToast } from '@/context/ToastContext'
import { ApiError } from '@/lib/apiClient'
import { useCreatePost, usePostDetail, useUpdatePost } from '@/hooks/usePostForm'
import {
  customDateRow,
  emptyLatestExamForm,
  latestExamFromWirePayload,
  latestExamToWirePayload,
  validateLatestExamForm,
  CARD_HEADING_MAX,
  COMMISSION_NAME_MAX,
  TITLE_MAX,
  COMMISSION_NAME_HERO_MAX,
  TITLE_HERO_MAX,
  APPLY_BY_TEXT_MAX,
  VACANCIES_TEXT_MAX,
  QUALIFICATION_TEXT_MAX,
  type ImportantDateRow,
  type LatestExamErrorKey,
  type LatestExamFormValues,
  type LatestExamWirePayload,
  type StatBox,
} from '@/types/posts/latestExam'
import { emptyOptionalSection } from '@/types/postCommon'

interface LatestExamFormPageProps {
  variant: 'all-updates' | 'personalized'
}

export function LatestExamFormPage({ variant }: LatestExamFormPageProps) {
  const { id } = useParams<{ id: string }>()
  const postId = id ? Number(id) : null
  const isEdit = postId !== null
  const navigate = useNavigate()
  const { showToast } = useToast()

  const { data: existing, isLoading } = usePostDetail<LatestExamWirePayload>('latest-exams', postId)
  const createPost = useCreatePost('latest-exams')
  const updatePost = useUpdatePost('latest-exams')

  const [values, setValues] = useState<LatestExamFormValues>(() => emptyLatestExamForm(variant))
  const [errors, setErrors] = useState<Partial<Record<LatestExamErrorKey, string>>>({})
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [postWiseModalOpen, setPostWiseModalOpen] = useState(false)

  useEffect(() => {
    if (existing) setValues(latestExamFromWirePayload(existing))
  }, [existing])

  const sectionRefs = useRef<Partial<Record<LatestExamErrorKey, HTMLDivElement | null>>>({})
  const setSectionRef = (key: LatestExamErrorKey) => (el: HTMLDivElement | null) => {
    sectionRefs.current[key] = el
  }

  const update = <K extends keyof LatestExamFormValues>(key: K, value: LatestExamFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const updateImportantDate = (rowId: string, patch: Partial<ImportantDateRow>) => {
    setValues((prev) => ({
      ...prev,
      important_dates: prev.important_dates.map((d) => (d.id === rowId ? { ...d, ...patch } : d)),
    }))
  }
  const addCustomDateRow = () => {
    setValues((prev) => ({ ...prev, important_dates: [...prev.important_dates, customDateRow()] }))
  }
  const removeCustomDateRow = (rowId: string) => {
    setValues((prev) => ({ ...prev, important_dates: prev.important_dates.filter((d) => d.id !== rowId) }))
  }

  const addCustomContent = () => {
    if (values.custom_content_boxes.length >= 5) return
    setValues((prev) => ({
      ...prev,
      custom_content_boxes: [...prev.custom_content_boxes, { ...emptyOptionalSection('bullets'), id: crypto.randomUUID() }],
    }))
  }
  const removeCustomContent = (boxId: string) => {
    setValues((prev) => ({ ...prev, custom_content_boxes: prev.custom_content_boxes.filter((c) => c.id !== boxId) }))
  }

  const anyStatIsTable = [values.quick_overview.fee, values.quick_overview.age, values.quick_overview.totalPosts].some(
    (s) => s.mode === 'table',
  )

  const handlePublishClick = () => {
    const nextErrors = validateLatestExamForm(values)
    setErrors(nextErrors)
    const firstErrorKey = (Object.keys(nextErrors) as LatestExamErrorKey[])[0]
    if (firstErrorKey) {
      sectionRefs.current[firstErrorKey]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      showToast('Please fix the highlighted fields before publishing.', 'error')
      return
    }
    setConfirmOpen(true)
  }

  const handleConfirmPublish = () => {
    setConfirmOpen(false)
    const payload = latestExamToWirePayload(values)
    const onSuccess = () => {
      showToast(isEdit ? 'Post updated.' : 'Post published.', 'success')
      navigate(variant === 'all-updates' ? '/all-updates/latest-exam' : '/personalized/latest-exam')
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
      <AppShell title="Post Latest Exam" showBack>
        <p className="py-8 text-center text-sm text-body-subtle">Loading post...</p>
      </AppShell>
    )
  }

  return (
    <AppShell title={isEdit ? 'Edit Latest Exam' : 'Post Latest Exam'} showBack>
      <div className="space-y-5">
        <div ref={setSectionRef('audience')}>
          <Card>
            {variant === 'all-updates' ? (
              <TargetAudienceTagsField
                section="latest_exam"
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
          <CardDetailsSection values={values} update={update} error={errors.cardDetails} />
        </div>

        <div ref={setSectionRef('applyBy')}>
          <ApplyBySection values={values} update={update} error={errors.applyBy} />
        </div>

        <div ref={setSectionRef('vacancies')}>
          <VacanciesQualificationSection values={values} update={update} error={errors.vacancies ?? errors.qualification} />
        </div>

        <div ref={setSectionRef('importantDates')}>
          <ImportantDatesSection
            values={values}
            onUpdateRow={updateImportantDate}
            onAddRow={addCustomDateRow}
            onRemoveRow={removeCustomDateRow}
            error={errors.importantDates}
          />
        </div>

        <div>
          <HeroFieldsSection values={values} update={update} />
          <LivePreviewPanel title="Card" defaultOpen>
            <CardLivePreview values={values} />
          </LivePreviewPanel>
        </div>

        <QuickStatsSection values={values} update={update} stacked={anyStatIsTable} />

        <VacancyDetailsSection values={values} update={update} />

        <Card interactive onClick={() => setPostWiseModalOpen(true)}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-heading">Post-Wise Details</p>
              <p className="text-xs text-body-subtle">
                STATUS: {values.post_wise_details.length} POST{values.post_wise_details.length === 1 ? '' : 'S'} CONFIGURED
              </p>
            </div>
          </div>
        </Card>

        <OptionalSectionEditor
          title="Eligibility Criteria"
          allowedModes={['table', 'bullets', 'text']}
          value={values.eligibility}
          onChange={(v) => update('eligibility', v)}
        />

        <PromoAdsCarouselEditor value={values.promo_ads} onChange={(v) => update('promo_ads', v)} />

        <OptionalSectionEditor
          title="Exam Pattern"
          allowedModes={['table', 'bullets', 'text']}
          value={values.exam_pattern}
          onChange={(v) => update('exam_pattern', v)}
        />

        <OptionalSectionEditor
          title="Physical Eligibility"
          allowedModes={['table', 'bullets', 'text']}
          value={values.physical_eligibility}
          onChange={(v) => update('physical_eligibility', v)}
        />

        <OptionalSectionEditor
          title="Mode of Selection"
          allowedModes={['bullets']}
          value={values.mode_of_selection}
          onChange={(v) => update('mode_of_selection', v)}
        />

        <OptionalSectionEditor
          title="Additional Information"
          allowedModes={['bullets']}
          value={values.additional_information}
          onChange={(v) => update('additional_information', v)}
        />

        <div className="space-y-3">
          {values.custom_content_boxes.map((box, index) => (
            <OptionalSectionEditor
              key={box.id}
              title={box.heading || `Custom Content ${index + 1}`}
              allowedModes={['table', 'bullets', 'text']}
              value={box}
              onChange={(v) => {
                setValues((prev) => ({
                  ...prev,
                  custom_content_boxes: prev.custom_content_boxes.map((c) => (c.id === box.id ? { ...v, id: box.id } : c)),
                }))
              }}
            />
          ))}
          {values.custom_content_boxes.length > 0 && (
            <button
              type="button"
              onClick={() => removeCustomContent(values.custom_content_boxes[values.custom_content_boxes.length - 1].id)}
              className="text-xs text-body-subtle hover:text-error"
            >
              Remove last custom content box
            </button>
          )}
          {values.custom_content_boxes.length < 5 && (
            <button
              type="button"
              onClick={addCustomContent}
              className="w-full rounded-xl border border-dashed border-input-border py-2.5 text-sm font-medium text-body-subtle hover:border-primary-border-accent hover:text-primary"
            >
              + Add Custom Content Box ({values.custom_content_boxes.length}/5)
            </button>
          )}
        </div>

        <ImportantLinksEditor value={values.important_links} onChange={(v) => update('important_links', v)} />

        <button
          type="button"
          onClick={handlePublishClick}
          disabled={createPost.isPending || updatePost.isPending}
          className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          {isEdit ? 'Save Changes' : 'Publish'}
        </button>
      </div>

      {postWiseModalOpen && (
        <PostWiseDetailsModal
          value={values.post_wise_details}
          onChange={(v) => update('post_wise_details', v)}
          onClose={() => setPostWiseModalOpen(false)}
        />
      )}

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

// --- Card Details ------------------------------------------------------------------------

function CardDetailsSection({
  values,
  update,
  error,
}: {
  values: LatestExamFormValues
  update: <K extends keyof LatestExamFormValues>(key: K, value: LatestExamFormValues[K]) => void
  error?: string
}) {
  return (
    <Card className={clsx(error && 'border-error')}>
      <h2 className="mb-4 text-base font-semibold text-heading">Card Details</h2>

      <FieldWithCounter label="Heading" value={values.card_heading} maxLength={CARD_HEADING_MAX} onChange={(v) => update('card_heading', v)} />
      <FieldWithCounter label="Commission" value={values.commission_name} maxLength={COMMISSION_NAME_MAX} onChange={(v) => update('commission_name', v)} />
      <FieldWithCounter label="Title" value={values.title} maxLength={TITLE_MAX} onChange={(v) => update('title', v)} />

      {error && <p className="text-xs text-error">{error}</p>}
    </Card>
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

// --- Apply By ------------------------------------------------------------------------------

function ApplyBySection({
  values,
  update,
  error,
}: {
  values: LatestExamFormValues
  update: <K extends keyof LatestExamFormValues>(key: K, value: LatestExamFormValues[K]) => void
  error?: string
}) {
  return (
    <Card className={clsx(error && 'border-error')}>
      <h2 className="mb-3 text-base font-semibold text-heading">Apply By</h2>
      <SegmentedToggle
        options={[
          { value: 'select_date', label: 'Select Date' },
          { value: 'custom_text', label: 'Custom Text' },
        ]}
        value={values.apply_by_mode}
        onChange={(mode) => update('apply_by_mode', mode)}
        className="mb-3"
      />
      {values.apply_by_mode === 'select_date' ? (
        <input
          type="date"
          value={values.apply_by_date}
          onChange={(e) => update('apply_by_date', e.target.value)}
          className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      ) : (
        <>
          <input
            type="text"
            value={values.apply_by_text}
            maxLength={APPLY_BY_TEXT_MAX}
            onChange={(e) => update('apply_by_text', e.target.value)}
            placeholder="e.g. Ongoing"
            className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <p className="mt-1 text-right text-xs text-body-subtle">
            {values.apply_by_text.length}/{APPLY_BY_TEXT_MAX}
          </p>
        </>
      )}
      {values.apply_by_mode === 'custom_text' && (
        <p className="mt-1.5 text-xs text-body-subtle">Only "Select Date" drives the urgency indicator.</p>
      )}
      {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
    </Card>
  )
}

// --- Vacancies + Qualification ------------------------------------------------------------

function VacanciesQualificationSection({
  values,
  update,
  error,
}: {
  values: LatestExamFormValues
  update: <K extends keyof LatestExamFormValues>(key: K, value: LatestExamFormValues[K]) => void
  error?: string
}) {
  return (
    <Card className={clsx(error && 'border-error')}>
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
      {error && <p className="mt-1.5 text-xs text-error">{error}</p>}
    </Card>
  )
}

// --- Important Dates -------------------------------------------------------------------

function ImportantDatesSection({
  values,
  onUpdateRow,
  onAddRow,
  onRemoveRow,
  error,
}: {
  values: LatestExamFormValues
  onUpdateRow: (rowId: string, patch: Partial<ImportantDateRow>) => void
  onAddRow: () => void
  onRemoveRow: (rowId: string) => void
  error?: string
}) {
  return (
    <Card className={clsx(error && 'border-error')}>
      <h2 className="mb-4 text-base font-semibold text-heading">Important Dates</h2>
      <div className="space-y-3">
        {values.important_dates.map((row) => (
          <div key={row.id} className="flex items-center gap-2">
            {row.removable ? (
              <input
                type="text"
                value={row.label}
                onChange={(e) => onUpdateRow(row.id, { label: e.target.value })}
                placeholder="Label"
                className="w-36 shrink-0 rounded-lg border border-input-border px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
              />
            ) : (
              <span className={clsx('w-36 shrink-0 text-sm font-medium', row.is_critical ? 'text-error' : 'text-body')}>
                {row.label}
              </span>
            )}

            <button
              type="button"
              onClick={() => onUpdateRow(row.id, { mode: row.mode === 'date' ? 'text' : 'date', value: '' })}
              className="shrink-0 rounded-lg border border-input-border px-2 py-1.5 text-xs font-medium text-body-subtle hover:bg-page"
            >
              {row.mode === 'date' ? 'Date' : 'Text'}
            </button>

            {row.mode === 'date' ? (
              <input
                type="date"
                value={row.value}
                onChange={(e) => onUpdateRow(row.id, { value: e.target.value })}
                className="flex-1 rounded-lg border border-input-border px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
              />
            ) : (
              <input
                type="text"
                value={row.value}
                onChange={(e) => onUpdateRow(row.id, { value: e.target.value })}
                className="flex-1 rounded-lg border border-input-border px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
              />
            )}

            {row.removable && (
              <button
                type="button"
                onClick={() => onRemoveRow(row.id)}
                aria-label="Remove date row"
                className="text-xs text-body-subtle hover:text-error"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      </div>
      <button type="button" onClick={onAddRow} className="mt-3 text-sm font-medium text-primary hover:underline">
        + Add Custom Date Row
      </button>
      {error && <p className="mt-2 text-xs text-error">{error}</p>}
    </Card>
  )
}

// --- Card Live Preview -----------------------------------------------------------------

function CardLivePreview({ values }: { values: LatestExamFormValues }) {
  return (
    <div className="mx-auto max-w-xs overflow-hidden rounded-2xl border border-border shadow-sm">
      <div className="p-3">
        <p className="text-sm font-semibold text-heading">{values.card_heading || 'Card heading'}</p>
        <p className="text-xs text-body-subtle">{values.commission_name || 'Commission'}</p>
        <p className="mt-1 text-xs text-body">{values.title || 'Card title'}</p>
        {values.apply_by_mode === 'select_date' && values.apply_by_date && (
          <p className="mt-2 text-xs font-medium text-error">Apply by {values.apply_by_date}</p>
        )}
        {values.apply_by_mode === 'custom_text' && values.apply_by_text && (
          <p className="mt-2 text-xs font-medium text-body-subtle">{values.apply_by_text}</p>
        )}
        <div className="mt-3 border-t border-border pt-2">
          <p className="text-xs font-semibold text-heading">{values.commission_name_hero || 'Commission Name (Hero)'}</p>
          <p className="text-xs text-body-subtle">{values.title_hero || 'Title (Hero)'}</p>
        </div>
      </div>
    </div>
  )
}

// --- Hero Fields -------------------------------------------------------------------------

function HeroFieldsSection({
  values,
  update,
}: {
  values: LatestExamFormValues
  update: <K extends keyof LatestExamFormValues>(key: K, value: LatestExamFormValues[K]) => void
}) {
  return (
    <Card>
      <h2 className="mb-1 text-base font-semibold text-heading">Hero Banner Fields</h2>
      <p className="mb-4 text-xs text-body-subtle">Larger-format heading shown on the exam's detail page.</p>

      <FieldWithCounter
        label="Commission Name (Hero)"
        value={values.commission_name_hero}
        maxLength={COMMISSION_NAME_HERO_MAX}
        onChange={(v) => update('commission_name_hero', v)}
      />
      <FieldWithCounter label="Title (Hero)" value={values.title_hero} maxLength={TITLE_HERO_MAX} onChange={(v) => update('title_hero', v)} />
    </Card>
  )
}

// --- Quick Overview Stats ------------------------------------------------------------------

function QuickStatsSection({
  values,
  update,
  stacked,
}: {
  values: LatestExamFormValues
  update: <K extends keyof LatestExamFormValues>(key: K, value: LatestExamFormValues[K]) => void
  stacked: boolean
}) {
  const setStat = (key: keyof LatestExamFormValues['quick_overview'], stat: StatBox) => {
    update('quick_overview', { ...values.quick_overview, [key]: stat })
  }

  return (
    <Card>
      <h2 className="mb-1 text-base font-semibold text-heading">Quick Overview Stats</h2>
      <p className="mb-4 text-xs text-body-subtle">
        Layout switches to full-width stacked automatically if any stat uses Table mode.
      </p>
      <div className={stacked ? 'space-y-4' : 'grid grid-cols-3 gap-3'}>
        <StatBoxEditor label="Fee" value={values.quick_overview.fee} onChange={(v) => setStat('fee', v)} />
        <StatBoxEditor label="Age" value={values.quick_overview.age} onChange={(v) => setStat('age', v)} />
        <StatBoxEditor label="Total Posts" value={values.quick_overview.totalPosts} onChange={(v) => setStat('totalPosts', v)} />
      </div>
    </Card>
  )
}

function StatBoxEditor({ label, value, onChange }: { label: string; value: StatBox; onChange: (value: StatBox) => void }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-semibold text-body-subtle">{label}</span>
        <SegmentedToggle
          options={[
            { value: 'text', label: 'Text' },
            { value: 'table', label: 'Table' },
          ]}
          value={value.mode}
          onChange={(mode) => onChange({ ...value, mode })}
        />
      </div>
      {value.mode === 'text' ? (
        <input
          type="text"
          value={value.value}
          onChange={(e) => onChange({ ...value, value: e.target.value })}
          className="w-full rounded-lg border border-input-border px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
        />
      ) : (
        <p className="rounded-lg border border-dashed border-input-border px-2 py-1.5 text-center text-xs text-body-subtle">
          Table builder — coming soon
        </p>
      )}
    </div>
  )
}

// --- Vacancy Details (table-only per VacancyDetailsSerializer) --------------------------

function VacancyDetailsSection({
  values,
  update,
}: {
  values: LatestExamFormValues
  update: <K extends keyof LatestExamFormValues>(key: K, value: LatestExamFormValues[K]) => void
}) {
  const vd = values.vacancy_details
  const setVd = (patch: Partial<LatestExamFormValues['vacancy_details']>) => update('vacancy_details', { ...vd, ...patch })

  if (!vd.enabled) {
    return (
      <Card className="flex items-center justify-between">
        <span className="text-sm font-semibold text-heading">Vacancy Details</span>
        <button type="button" onClick={() => setVd({ enabled: true })} className="text-sm font-medium text-primary hover:underline">
          Enable
        </button>
      </Card>
    )
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-semibold text-heading">Vacancy Details</span>
        <button type="button" onClick={() => setVd({ enabled: false })} className="text-xs text-body-subtle hover:text-error">
          Disable
        </button>
      </div>
      <label className="mb-1.5 block text-sm font-medium text-body">Heading</label>
      <input
        type="text"
        value={vd.heading}
        onChange={(e) => setVd({ heading: e.target.value })}
        className="mb-4 w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
      <label className="mb-1.5 block text-sm font-medium text-body">Subheading</label>
      <input
        type="text"
        value={vd.subheading}
        onChange={(e) => setVd({ subheading: e.target.value })}
        className="mb-4 w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
      <p className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-input-border py-8 text-center text-sm text-body-subtle">
        Table builder — coming soon
      </p>
    </Card>
  )
}
