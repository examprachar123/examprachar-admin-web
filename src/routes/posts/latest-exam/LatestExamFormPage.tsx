import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import clsx from 'clsx'
import {
  faBell,
  faBolt,
  faCalendarAlt,
  faCheckCircle,
  faChevronRight,
  faCoins,
  faExclamationTriangle,
  faExternalLinkAlt,
  faEyeSlash,
  faFolderPlus,
  faGraduationCap,
  faIdCard,
  faImage,
  faInfoCircle,
  faLayerGroup,
  faListAlt,
  faPlus,
  faPuzzlePiece,
  faRunning,
  faShareFromSquare,
  faSitemap,
  faTags,
  faTasks,
  faUserClock,
  faUsers,
} from '@fortawesome/free-solid-svg-icons'
import { faTrashCan } from '@fortawesome/free-regular-svg-icons'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { SegmentedToggle } from '@/components/ui/SegmentedToggle'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'
import { EditableHeading } from '@/components/ui/EditableHeading'
import { IconPicker } from '@/components/ui/IconPicker'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TargetAudienceTagsField } from '@/components/posts/TargetAudienceTagsField'
import { PersonalizedTargetingField } from '@/components/posts/PersonalizedTargetingField'
import { OptionalSectionEditor } from '@/components/posts/OptionalSectionEditor'
import { OptionalSectionLivePreview } from '@/components/posts/OptionalSectionLivePreview'
import { ImportantLinksEditor } from '@/components/posts/ImportantLinksEditor'
import { ImportantLinksLivePreview } from '@/components/posts/ImportantLinksLivePreview'
import { PromoAdsCarouselEditor } from '@/components/posts/PromoAdsCarouselEditor'
import { PromoAdsLivePreview } from '@/components/posts/PromoAdsLivePreview'
import { LivePreviewPanel } from '@/components/posts/LivePreviewPanel'
import { SectionCard } from '@/components/posts/SectionCard'
import { TableEditor } from '@/components/posts/TableEditor'
import { TableContentPreview } from '@/components/posts/TableContentPreview'
import { PostWiseDetailsModal } from '@/routes/posts/latest-exam/PostWiseDetailsModal'
import { useToast } from '@/context/ToastContext'
import { ApiError } from '@/lib/apiClient'
import { getIconByName } from '@/lib/iconLibrary'
import { useCreatePost, usePostDetail, useUpdatePost } from '@/hooks/usePostForm'
import {
  customDateRow,
  emptyLatestExamForm,
  latestExamFromWirePayload,
  latestExamToWirePayload,
  sendableImportantLinks,
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
  type StatBoxPair,
} from '@/types/posts/latestExam'
import { emptyOptionalSection, emptyTableContent } from '@/types/postCommon'

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
  /** Which state group (null = Common) the Promo Ad Banner editor/preview are currently scoped to. */
  const [promoAdActiveState, setPromoAdActiveState] = useState<number | null>(null)
  /** Every message from the last failed publish/save, shown verbatim so nothing the server rejects is silently dropped. */
  const [backendErrors, setBackendErrors] = useState<string[]>([])
  /** Keyed by ImportantLinkItem.id — the one backend field error we can pinpoint per-row. */
  const [importantLinksRowErrors, setImportantLinksRowErrors] = useState<Record<string, string>>({})

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
    setBackendErrors([])
    setImportantLinksRowErrors({})
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
    const onError = (err: unknown) => {
      if (!(err instanceof ApiError)) {
        showToast('Could not publish. Please try again.', 'error')
        return
      }

      setBackendErrors(err.fieldMessages)

      const importantLinksErrors = err.fieldErrors?.important_links
      if (Array.isArray(importantLinksErrors)) {
        // Backend errors are indexed against the *sent* list (blank rows are dropped before sending —
        // see sendableImportantLinks), so rebuild that exact same list to match rows back by id.
        const sentLinks = sendableImportantLinks(values.important_links)
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

      const qualificationIconErrors = err.fieldErrors?.qualification_icon
      if (Array.isArray(qualificationIconErrors) && typeof qualificationIconErrors[0] === 'string') {
        setErrors((prev) => ({ ...prev, qualification: qualificationIconErrors[0] as string }))
        sectionRefs.current.vacancies?.scrollIntoView({ behavior: 'smooth', block: 'center' })
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
      <AppShell title="Post Latest Exam" showBack>
        <p className="py-8 text-center text-sm text-body-subtle">Loading post...</p>
      </AppShell>
    )
  }

  return (
    <AppShell title={isEdit ? 'Edit Latest Exam' : 'Post Latest Exam'} showBack>
      <div className="space-y-5">
        <div ref={setSectionRef('audience')}>
          <SectionCard icon={faTags} title="Target Audience Tags">
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
          </SectionCard>
        </div>

        <div ref={setSectionRef('cardDetails')}>
          <CardDetailsSection values={values} update={update} error={errors.cardDetails} />
        </div>

        <VitalStatsSection
          values={values}
          update={update}
          applyByRef={setSectionRef('applyBy')}
          vacanciesRef={setSectionRef('vacancies')}
          applyByError={errors.applyBy}
          vacanciesError={errors.vacancies ?? errors.qualification}
        />

        <LivePreviewPanel title="Card" defaultOpen>
          <CardLivePreview values={values} />
        </LivePreviewPanel>

        <div ref={setSectionRef('hero')}>
          <HeroFieldsSection values={values} update={update} error={errors.hero} />
        </div>

        <LivePreviewPanel title="Hero Banner">
          <HeroBannerLivePreview values={values} />
        </LivePreviewPanel>

        <div ref={setSectionRef('importantDates')}>
          <ImportantDatesSection
            values={values}
            onUpdateRow={updateImportantDate}
            onAddRow={addCustomDateRow}
            onRemoveRow={removeCustomDateRow}
            error={errors.importantDates}
          />
        </div>

        <LivePreviewPanel title="Important Dates">
          <ImportantDatesLivePreview values={values} />
        </LivePreviewPanel>

        <QuickStatsSection values={values} update={update} stacked={anyStatIsTable} />

        <LivePreviewPanel title="Quick Overview">
          <QuickOverviewLivePreview values={values} />
        </LivePreviewPanel>

        <VacancyDetailsSection values={values} update={update} />

        <LivePreviewPanel title="Vacancy Details">
          <VacancyDetailsLivePreview values={values} />
        </LivePreviewPanel>

        <SectionCard icon={faFolderPlus} title="Post-Wise Details">
          <button
            type="button"
            onClick={() => setPostWiseModalOpen(true)}
            className="flex w-full items-center justify-between gap-3 rounded-2xl border border-primary-border-accent bg-primary-gradient-from p-4 text-left shadow-sm transition-transform active:scale-[0.98]"
          >
            <div className="flex items-center gap-3.5">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                <Icon icon={faLayerGroup} className="text-sm" />
              </span>
              <div>
                <p className="text-sm font-bold leading-tight text-heading">Configure Post-Wise Details</p>
                <p className="text-xs font-semibold text-primary/80">Manage classification and distribution</p>
              </div>
            </div>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm">
              <Icon icon={faChevronRight} className="text-xs" />
            </span>
          </button>
          <div className="mt-3 flex justify-end">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-page px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wide text-body-subtle">
              <span className="h-1.5 w-1.5 rounded-full bg-body-subtle" />
              Status: {values.post_wise_details.length} Post{values.post_wise_details.length === 1 ? '' : 's'} Configured
            </span>
          </div>
        </SectionCard>

        <OptionalSectionEditor
          icon={faCheckCircle}
          title="Eligibility Criteria"
          allowedModes={['table', 'bullets', 'text']}
          value={values.eligibility}
          onChange={(v) => update('eligibility', v)}
        />

        <LivePreviewPanel title="Eligibility Criteria">
          <OptionalSectionLivePreview value={values.eligibility} />
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

        <OptionalSectionEditor
          icon={faTasks}
          title="Exam Pattern"
          allowedModes={['table', 'bullets', 'text']}
          value={values.exam_pattern}
          onChange={(v) => update('exam_pattern', v)}
        />

        <LivePreviewPanel title="Exam Pattern">
          <OptionalSectionLivePreview value={values.exam_pattern} />
        </LivePreviewPanel>

        <OptionalSectionEditor
          icon={faRunning}
          title="Physical Eligibility"
          allowedModes={['table', 'bullets', 'text']}
          value={values.physical_eligibility}
          onChange={(v) => update('physical_eligibility', v)}
        />

        <LivePreviewPanel title="Physical Eligibility">
          <OptionalSectionLivePreview value={values.physical_eligibility} />
        </LivePreviewPanel>

        <OptionalSectionEditor
          icon={faSitemap}
          title="Mode of Selection"
          allowedModes={['table', 'bullets', 'text']}
          value={values.mode_of_selection}
          onChange={(v) => update('mode_of_selection', v)}
        />

        <LivePreviewPanel title="Mode of Selection">
          <OptionalSectionLivePreview value={values.mode_of_selection} />
        </LivePreviewPanel>

        <OptionalSectionEditor
          icon={faInfoCircle}
          title="Additional Information"
          allowedModes={['table', 'bullets', 'text']}
          value={values.additional_information}
          onChange={(v) => update('additional_information', v)}
        />

        <LivePreviewPanel title="Additional Information">
          <OptionalSectionLivePreview value={values.additional_information} />
        </LivePreviewPanel>

        <div className="space-y-3">
          {values.custom_content_boxes.map((box, index) => (
            <div key={box.id} className="space-y-3">
              <OptionalSectionEditor
                icon={faPuzzlePiece}
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
              <LivePreviewPanel title={box.heading || `Custom Content ${index + 1}`}>
                <OptionalSectionLivePreview value={box} />
              </LivePreviewPanel>
            </div>
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

        <ImportantLinksEditor
          value={values.important_links}
          onChange={(v) => update('important_links', v)}
          rowErrors={importantLinksRowErrors}
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
    <SectionCard icon={faIdCard} title="Feed Card Details" error={!!error}>
      <FieldWithCounter label="Heading" value={values.card_heading} maxLength={CARD_HEADING_MAX} onChange={(v) => update('card_heading', v)} />
      <FieldWithCounter label="Commission" value={values.commission_name} maxLength={COMMISSION_NAME_MAX} onChange={(v) => update('commission_name', v)} />
      <FieldWithCounter label="Title" value={values.title} maxLength={TITLE_MAX} onChange={(v) => update('title', v)} />

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

// --- Vital Stats (Apply By + Vacancies + Qualification) -------------------------------------

function VitalStatsSection({
  values,
  update,
  applyByRef,
  vacanciesRef,
  applyByError,
  vacanciesError,
}: {
  values: LatestExamFormValues
  update: <K extends keyof LatestExamFormValues>(key: K, value: LatestExamFormValues[K]) => void
  applyByRef: (el: HTMLDivElement | null) => void
  vacanciesRef: (el: HTMLDivElement | null) => void
  applyByError?: string
  vacanciesError?: string
}) {
  return (
    <SectionCard icon={faBolt} title="Vital Stats (Footer)" error={!!applyByError || !!vacanciesError}>
      <div ref={applyByRef}>
        <label className="mb-1.5 block text-sm font-medium text-body">Apply By</label>
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
        {applyByError && <p className="mt-1.5 text-xs text-error">{applyByError}</p>}
      </div>

      <div ref={vacanciesRef} className="mt-5 border-t border-slate-100 pt-5">
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
        {vacanciesError && <p className="mt-1.5 text-xs text-error">{vacanciesError}</p>}
      </div>
    </SectionCard>
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
    <SectionCard icon={faCalendarAlt} title="Important Dates" error={!!error}>
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
    </SectionCard>
  )
}

// --- Important Dates Live Preview -----------------------------------------------------

function formatImportantDateValue(row: ImportantDateRow): string {
  if (row.mode !== 'date' || !row.value) return row.value
  return new Date(`${row.value}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function ImportantDatesLivePreview({ values }: { values: LatestExamFormValues }) {
  const rows = values.important_dates.filter((row) => row.label.trim() && row.value.trim())

  return (
    <div className="mx-auto max-w-xs overflow-hidden rounded-2xl border-2 border-primary-border-accent bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center gap-2">
        <Icon icon={faCalendarAlt} className="text-primary" />
        <span className="text-base font-bold text-heading">Important Dates</span>
      </div>

      <div className="space-y-3">
        {rows.length === 0 && <p className="text-sm text-body-subtle">Add dates to preview them here.</p>}
        {rows.map((row) => (
          <div key={row.id} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-body-subtle">{row.label}:</span>
            <span className={clsx('font-bold', row.is_critical ? 'text-error' : 'text-heading')}>{formatImportantDateValue(row)}</span>
          </div>
        ))}
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-medium text-amber-800">
        <Icon icon={faExclamationTriangle} className="mt-0.5 shrink-0 text-amber-500" />
        <span>Candidates are advised to confirm dates from the official website / Notification.</span>
      </div>
    </div>
  )
}

// --- Card Live Preview -----------------------------------------------------------------

function CardLivePreview({ values }: { values: LatestExamFormValues }) {
  const applyByLabel =
    values.apply_by_mode === 'select_date'
      ? values.apply_by_date
        ? new Date(`${values.apply_by_date}T00:00:00`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
        : ''
      : values.apply_by_text

  const qualificationIcon = getIconByName(values.qualification_icon) ?? faGraduationCap

  return (
    <div className="relative mx-auto max-w-xs overflow-hidden rounded-2xl border-[1.5px] border-primary bg-white p-4 shadow-sm">
      <span className="absolute left-2 top-2 z-10 rounded bg-primary-gradient-from px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
        New
      </span>

      <div className="relative mb-3 flex h-[4.8rem] items-center justify-center rounded-xl border border-page bg-gradient-to-br from-white to-slate-100 px-8">
        <span className="line-clamp-2 text-center text-lg font-extrabold leading-tight tracking-tight text-heading">
          {values.card_heading || 'HEADING'}
        </span>
        <span className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-border bg-white text-body-subtle shadow-sm">
          <Icon icon={faBell} className="text-xs" />
        </span>
      </div>

      <p className="text-xs font-semibold text-body-subtle">{values.commission_name || 'Commission name'}</p>
      <p className="mt-0.5 text-base font-bold leading-snug text-heading">{values.title || 'Exam title'}</p>

      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2 text-sm text-body">
          <Icon icon={faCalendarAlt} className="w-4 text-primary" />
          <span>Apply by: {applyByLabel || '—'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-body">
          <Icon icon={faUsers} className="w-4 text-primary" />
          <span>{values.vacancies_text || 'Vacancies'}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-body">
          <div className="flex items-center gap-2">
            <Icon icon={qualificationIcon} className="w-4 text-primary" />
            <span>{values.qualification_text || 'Qualification'}</span>
          </div>
          <Icon icon={faShareFromSquare} className="text-body-subtle" />
        </div>
      </div>

      <button type="button" disabled className="mt-4 w-full rounded-xl bg-primary py-3 text-sm font-semibold text-white disabled:opacity-100">
        View Details
      </button>
    </div>
  )
}

// --- Hero Fields -------------------------------------------------------------------------

function HeroFieldsSection({
  values,
  update,
  error,
}: {
  values: LatestExamFormValues
  update: <K extends keyof LatestExamFormValues>(key: K, value: LatestExamFormValues[K]) => void
  error?: string
}) {
  return (
    <SectionCard icon={faImage} title="Hero Banner Fields" error={!!error}>
      <p className="-mt-3 mb-4 text-xs text-body-subtle">Larger-format heading shown on the exam's detail page.</p>

      <FieldWithCounter
        label="Commission Name (Hero)"
        value={values.commission_name_hero}
        maxLength={COMMISSION_NAME_HERO_MAX}
        onChange={(v) => update('commission_name_hero', v)}
      />
      <FieldWithCounter label="Title (Hero)" value={values.title_hero} maxLength={TITLE_HERO_MAX} onChange={(v) => update('title_hero', v)} />

      {error && <p className="text-xs text-error">{error}</p>}
    </SectionCard>
  )
}

// --- Hero Banner Live Preview ------------------------------------------------------------

function HeroBannerLivePreview({ values }: { values: LatestExamFormValues }) {
  return (
    <div className="relative mx-auto w-full max-w-xs overflow-hidden rounded-2xl bg-gradient-to-br from-[#5b54fa] to-primary p-5 shadow-[0_8px_24px_rgba(79,70,229,0.25)]">
      <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/15 blur-xl" />
      <div className="relative z-10">
        <p className="mb-1.5 text-sm font-bold leading-tight text-white">{values.commission_name_hero || 'Commission Name'}</p>
        <h1 className="mb-5 text-xl font-extrabold leading-snug tracking-tight text-white">{values.title_hero || 'Exam Title Appears Here'}</h1>
        <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-white py-2.5 text-sm font-bold text-primary shadow-sm">
          <Icon icon={faBell} className="text-sm" />
          Track this Exam
        </div>
      </div>
    </div>
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
    <SectionCard icon={faLayerGroup} title="Quick Overview Stats">
      <p className="-mt-3 mb-4 text-xs text-body-subtle">
        Layout switches to full-width stacked automatically if any stat uses Table mode.
      </p>
      <div className={stacked ? 'space-y-4' : 'grid grid-cols-3 gap-3'}>
        <StatBoxEditor label="Fee" value={values.quick_overview.fee} onChange={(v) => setStat('fee', v)} />
        <StatBoxEditor label="Age" value={values.quick_overview.age} onChange={(v) => setStat('age', v)} />
        <StatBoxEditor label="Total Posts" value={values.quick_overview.totalPosts} onChange={(v) => setStat('totalPosts', v)} />
      </div>
    </SectionCard>
  )
}

function StatBoxEditor({ label, value, onChange }: { label: string; value: StatBox; onChange: (value: StatBox) => void }) {
  const addPair = () => {
    onChange({ ...value, pairs: [...value.pairs, { id: crypto.randomUUID(), label: '', value: '' }] })
  }
  const updatePair = (id: string, patch: Partial<StatBoxPair>) => {
    onChange({ ...value, pairs: value.pairs.map((p) => (p.id === id ? { ...p, ...patch } : p)) })
  }
  const removePair = (id: string) => {
    onChange({ ...value, pairs: value.pairs.filter((p) => p.id !== id) })
  }

  return (
    <div className="min-w-0 rounded-lg border border-border p-3">
      <div className="mb-2 space-y-1.5">
        <span className="block text-xs font-semibold text-body-subtle">{label}</span>
        <SegmentedToggle
          options={[
            { value: 'pairs', label: 'Pairs' },
            { value: 'text', label: 'Text' },
            { value: 'table', label: 'Table' },
          ]}
          value={value.mode}
          onChange={(mode) => onChange({ ...value, mode })}
          className="gap-0.5 p-0.5"
          optionClassName="px-1.5 py-1.5 text-xs"
        />
      </div>

      {value.mode === 'pairs' && (
        <div className="space-y-1.5">
          {value.pairs.map((pair) => (
            <div key={pair.id} className="flex min-w-0 items-center gap-1.5">
              <input
                type="text"
                value={pair.label}
                onChange={(e) => updatePair(pair.id, { label: e.target.value })}
                placeholder="Label"
                className="w-0 min-w-0 flex-1 rounded-md border border-input-border px-2 py-1 text-xs focus:border-primary focus:outline-none"
              />
              <input
                type="text"
                value={pair.value}
                onChange={(e) => updatePair(pair.id, { value: e.target.value })}
                placeholder="Value"
                className="w-0 min-w-0 flex-1 rounded-md border border-input-border px-2 py-1 text-xs focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => removePair(pair.id)}
                aria-label="Remove row"
                className="shrink-0 text-body-subtle hover:text-error"
              >
                <Icon icon={faTrashCan} className="text-xs" />
              </button>
            </div>
          ))}
          <button type="button" onClick={addPair} className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
            <Icon icon={faPlus} className="text-xs" />
            Add Row
          </button>
        </div>
      )}

      {value.mode === 'text' && (
        <div className="space-y-1.5">
          <input
            type="text"
            value={value.title}
            onChange={(e) => onChange({ ...value, title: e.target.value })}
            placeholder="Title"
            className="w-full rounded-lg border border-input-border px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
          />
          <input
            type="text"
            value={value.subtitle}
            onChange={(e) => onChange({ ...value, subtitle: e.target.value })}
            placeholder="Subtitle (optional)"
            className="w-full rounded-lg border border-input-border px-2 py-1.5 text-sm focus:border-primary focus:outline-none"
          />
        </div>
      )}

      {value.mode === 'table' && <TableEditor value={value.table ?? emptyTableContent()} onChange={(table) => onChange({ ...value, table })} />}

      <div className="mt-3 flex items-center justify-between border-t border-border pt-2.5">
        <span className="text-xs font-medium text-body-subtle">Full Width</span>
        <ToggleSwitch checked={value.fullWidth} onChange={(fullWidth) => onChange({ ...value, fullWidth })} label={`${label} full width`} />
      </div>
    </div>
  )
}

// --- Quick Overview Live Preview ----------------------------------------------------------

const QUICK_STAT_DISPLAY: Record<keyof LatestExamFormValues['quick_overview'], { label: string; icon: typeof faCoins }> = {
  fee: { label: 'Application Fee', icon: faCoins },
  age: { label: 'Age Limit', icon: faUserClock },
  totalPosts: { label: 'Total Posts', icon: faUsers },
}

function QuickOverviewLivePreview({ values }: { values: LatestExamFormValues }) {
  const boxes = (['fee', 'age', 'totalPosts'] as const).map((key) => ({ key, box: values.quick_overview[key] }))

  return (
    <div className="mx-auto flex max-w-xs flex-wrap gap-3">
      {boxes.map(({ key, box }) => (
        <QuickStatCard key={key} statKey={key} box={box} />
      ))}
    </div>
  )
}

function QuickStatCard({ statKey, box }: { statKey: keyof LatestExamFormValues['quick_overview']; box: StatBox }) {
  const { label, icon } = QUICK_STAT_DISPLAY[statKey]

  return (
    <div
      className={clsx(
        'rounded-2xl border-2 border-primary-border-accent bg-white p-4 shadow-sm',
        box.fullWidth ? 'w-full' : 'w-[calc(50%-0.375rem)]',
      )}
    >
      <div className="mb-3 flex flex-col items-center text-center">
        <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary-gradient-from text-primary">
          <Icon icon={icon} className="text-base" />
        </span>
        <span className="text-sm font-bold text-heading">{label}</span>
      </div>

      {box.mode === 'text' && (
        <div className="text-center">
          <p className="text-base font-bold text-primary">{box.title || 'Value'}</p>
          {box.subtitle.trim() && <p className="mt-0.5 text-xs text-body-subtle">{box.subtitle}</p>}
        </div>
      )}

      {box.mode === 'pairs' && (
        <div className="space-y-1.5">
          {box.pairs.length === 0 && <p className="text-center text-xs text-body-subtle">Add rows to preview them here.</p>}
          {box.pairs.map((pair) => (
            <div key={pair.id} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-body-subtle">{pair.label || 'Label'}:</span>
              <span className="font-bold text-heading">{pair.value || '—'}</span>
            </div>
          ))}
        </div>
      )}

      {box.mode === 'table' && <TableContentPreview table={box.table} />}
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

  const setEnabled = (enabled: boolean) => {
    setVd({ enabled, heading: enabled && !vd.heading.trim() ? 'Vacancy Details' : vd.heading })
  }

  return (
    <SectionCard
      icon={faListAlt}
      title="Vacancy Details"
      badge={<ToggleSwitch checked={vd.enabled} onChange={setEnabled} label={vd.enabled ? 'Disable Vacancy Details' : 'Enable Vacancy Details'} />}
    >
      {!vd.enabled ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-page py-8 text-center">
          <Icon icon={faExternalLinkAlt} className="text-xl text-body-subtle" />
          <p className="text-sm font-bold text-heading">Post-Wise Details Door Active</p>
        </div>
      ) : (
        <>
          <EditableHeading value={vd.heading} fallback="Vacancy Details" onChange={(heading) => setVd({ heading })} />
          <label className="mb-1.5 block text-sm font-medium text-body">Subheading</label>
          <input
            type="text"
            value={vd.subheading}
            onChange={(e) => setVd({ subheading: e.target.value })}
            className="mb-4 w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <TableEditor value={vd.table ?? emptyTableContent()} onChange={(table) => setVd({ table })} />
        </>
      )}
    </SectionCard>
  )
}

// --- Vacancy Details Live Preview ---------------------------------------------------------

function VacancyDetailsLivePreview({ values }: { values: LatestExamFormValues }) {
  const vd = values.vacancy_details

  if (!vd.enabled) {
    if (values.post_wise_details.length === 0) {
      return (
        <div className="mx-auto flex h-24 w-full max-w-xs flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-border bg-white text-center">
          <Icon icon={faEyeSlash} className="text-lg text-body-subtle" />
          <span className="text-xs font-bold text-body-subtle">Section Hidden</span>
        </div>
      )
    }
    return (
      <div className="mx-auto flex w-full max-w-xs items-center justify-between gap-3 rounded-2xl border border-primary-border-accent bg-primary-gradient-from p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-primary shadow-sm">
            <Icon icon={faLayerGroup} className="text-sm" />
          </span>
          <div>
            <p className="text-sm font-bold leading-tight text-heading">View Post-Wise Details</p>
            <p className="text-xs font-semibold text-primary/80">View detailed classification...</p>
          </div>
        </div>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-primary shadow-sm">
          <Icon icon={faChevronRight} className="text-xs" />
        </span>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-xs rounded-2xl border border-border bg-white p-4 shadow-sm">
      <h3 className="mb-1 text-base font-bold text-heading">{vd.heading || 'Vacancy Details'}</h3>
      {vd.subheading.trim() && <p className="mb-3 text-xs font-bold text-body-subtle">{vd.subheading}</p>}
      <TableContentPreview table={vd.table} />
    </div>
  )
}
