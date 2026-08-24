import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import clsx from 'clsx'
import {
  faArrowDown,
  faArrowUp,
  faBolt,
  faChartLine,
  faExclamationTriangle,
  faHistory,
  faIdCard,
  faImage,
  faInfoCircle,
  faLayerGroup,
  faPuzzlePiece,
  faTable,
  faTags,
  faUsers,
} from '@fortawesome/free-solid-svg-icons'
import { faTrashCan } from '@fortawesome/free-regular-svg-icons'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'
import { IconPicker } from '@/components/ui/IconPicker'
import { SegmentedToggle } from '@/components/ui/SegmentedToggle'
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
import { useToast } from '@/context/ToastContext'
import { ApiError } from '@/lib/apiClient'
import { getIconByName } from '@/lib/iconLibrary'
import { renderRichText } from '@/lib/richText'
import { useCreatePost, usePostDetail, useUpdatePost } from '@/hooks/usePostForm'
import {
  emptyUpcomingExamForm,
  upcomingExamFromWirePayload,
  upcomingExamToWirePayload,
  validateUpcomingExamForm,
  customPrevYearRow,
  emptyPrevYearCutoff,
  emptyPrevYearEntry,
  CARD_HEADING_MAX,
  COMMISSION_NAME_MAX,
  TITLE_MAX,
  COMMISSION_NAME_HERO_MAX,
  TITLE_HERO_MAX,
  QUALIFICATION_TEXT_MAX,
  VACANCIES_TEXT_MAX,
  EXPECTED_TEXT_MAX,
  CORE_STAT_VALUE_MAX,
  CORE_STAT_VACANCY_VALUE_MAX,
  PREDICTION_HEADING_MAX,
  PREDICTION_NOTIFICATION_MAX,
  type CoreStatsValue,
  type PredictionAnalysisValue,
  type PrevYearCutoff,
  type PrevYearEntry,
  type UpcomingExamErrorKey,
  type UpcomingExamFormValues,
  type UpcomingExamWirePayload,
} from '@/types/posts/upcomingExam'
import { DEFAULT_UPCOMING_EXAM_LINKS, emptyOptionalSection, emptyTableContent, type OptionalSectionValue } from '@/types/postCommon'

const MAX_CUSTOM_BOXES = 5

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
  const [promoAdActiveState, setPromoAdActiveState] = useState<number | null>(null)
  const [backendErrors, setBackendErrors] = useState<string[]>([])
  const [importantLinksRowErrors, setImportantLinksRowErrors] = useState<Record<string, string>>({})

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
    setBackendErrors([])
    setImportantLinksRowErrors({})
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
      <AppShell title="Upcoming Exam" showBack>
        <p className="py-8 text-center text-sm text-body-subtle">Loading post...</p>
      </AppShell>
    )
  }

  const detailedInfoBox = values.custom_content_boxes[0]
  const customBoxes = values.custom_content_boxes.slice(1)

  return (
    <AppShell title={isEdit ? 'Edit Upcoming Exam' : 'Post Upcoming Exam'} showBack>
      <div className="space-y-5">
        <div ref={setSectionRef('audience')}>
          <SectionCard icon={faTags} title="Target Audience Tags">
            {variant === 'all-updates' ? (
              <TargetAudienceTagsField
                section="upcoming_exam"
                value={values.targetAudience}
                onChange={(v) => update('targetAudience', v)}
                error={errors.audience ?? errors.audienceState}
              />
            ) : (
              <PersonalizedTargetingField value={values.personalizedTargeting} onChange={(v) => update('personalizedTargeting', v)} />
            )}
          </SectionCard>
        </div>

        <div ref={setSectionRef('cardDetails')}>
          <CardDetailsSection values={values} update={update} error={errors.cardDetails} />
        </div>

        <div ref={setSectionRef('vitalStats')}>
          <VitalStatsSection values={values} update={update} error={errors.vitalStats} />
        </div>

        <LivePreviewPanel title="Card" defaultOpen>
          <CardLivePreview values={values} />
        </LivePreviewPanel>

        <div ref={setSectionRef('hero')}>
          <HeroFieldsSection values={values} update={update} error={errors.hero} />
        </div>

        <CoreStatsSection values={values} update={update} />

        <LivePreviewPanel title="Hero + Core Stats">
          <HeroCoreStatsLivePreview values={values} />
        </LivePreviewPanel>

        <div ref={setSectionRef('predictionAnalysis')}>
          <PredictionAnalysisSection values={values} update={update} error={errors.predictionAnalysis} />
        </div>

        <LivePreviewPanel title="Prediction Analysis">
          <PredictionAnalysisLivePreview value={values.prediction_analysis} />
        </LivePreviewPanel>

        <PreviousYearDataSection values={values} setValues={setValues} />

        <LivePreviewPanel title="Prev Year Data">
          <PreviousYearDataLivePreview years={values.previous_year_data} />
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

        {detailedInfoBox && (
          <>
            <OptionalSectionEditor
              icon={faInfoCircle}
              title="Part G: Detailed Info"
              allowedModes={['bullets']}
              value={detailedInfoBox}
              onChange={(v) =>
                setValues((prev) => ({
                  ...prev,
                  custom_content_boxes: prev.custom_content_boxes.map((b) => (b.id === detailedInfoBox.id ? { ...v, id: b.id } : b)),
                }))
              }
            />
            <LivePreviewPanel title="Detailed Info">
              <OptionalSectionLivePreview value={detailedInfoBox} />
            </LivePreviewPanel>
          </>
        )}

        <OptionalSectionEditor
          icon={faTable}
          title="Part H: Vacancy Split"
          allowedModes={['table']}
          value={values.expected_vacancy_split}
          onChange={(v) => update('expected_vacancy_split', v)}
        />

        <LivePreviewPanel title="Vacancy Split">
          <OptionalSectionLivePreview value={values.expected_vacancy_split} />
        </LivePreviewPanel>

        <CustomBoxesSection values={values} setValues={setValues} boxes={customBoxes} />

        <LivePreviewPanel title="Custom Content">
          {customBoxes.length === 0 ? (
            <p className="text-center text-xs font-bold text-body-subtle">No Custom Content</p>
          ) : (
            <div className="space-y-4">
              {customBoxes.map((box) => (
                <OptionalSectionLivePreview key={box.id} value={box} />
              ))}
            </div>
          )}
        </LivePreviewPanel>

        <ImportantLinksEditor
          value={values.important_links}
          onChange={(v) => update('important_links', v)}
          rowErrors={importantLinksRowErrors}
          defaultLinks={DEFAULT_UPCOMING_EXAM_LINKS}
        />

        <LivePreviewPanel title="Resources">
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
        title={isEdit ? 'Save changes?' : 'Publish this post?'}
        description={isEdit ? 'Changes will be visible immediately.' : 'It will appear in the feed.'}
        confirmLabel={isEdit ? 'Save Changes' : 'Publish'}
        onConfirm={handleConfirmPublish}
        onCancel={() => setConfirmOpen(false)}
      />
    </AppShell>
  )
}

// --- Part A: Card Details ------------------------------------------------------------------

function CardDetailsSection({
  values,
  update,
  error,
}: {
  values: UpcomingExamFormValues
  update: <K extends keyof UpcomingExamFormValues>(key: K, value: UpcomingExamFormValues[K]) => void
  error?: string
}) {
  return (
    <SectionCard icon={faIdCard} title="Part A: Card Details" error={!!error}>
      <FieldWithCounter label="Card Heading" value={values.card_heading} maxLength={CARD_HEADING_MAX} onChange={(v) => update('card_heading', v)} />
      <FieldWithCounter
        label="Commission Name"
        value={values.commission_name}
        maxLength={COMMISSION_NAME_MAX}
        onChange={(v) => update('commission_name', v)}
      />
      <FieldWithCounter label="Exam Title" value={values.title} maxLength={TITLE_MAX} onChange={(v) => update('title', v)} />
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

// --- Vital Stats (Expected Date + Vacancies + Qualification) -------------------------------

function VitalStatsSection({
  values,
  update,
  error,
}: {
  values: UpcomingExamFormValues
  update: <K extends keyof UpcomingExamFormValues>(key: K, value: UpcomingExamFormValues[K]) => void
  error?: string
}) {
  return (
    <SectionCard icon={faBolt} title="Vital Stats (Footer)" error={!!error}>
      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-medium text-body">
          Expected Date <span className="text-error">*</span>
        </label>
        <input
          type="text"
          value={values.expected_text}
          maxLength={EXPECTED_TEXT_MAX}
          placeholder="e.g. Mid 2026"
          onChange={(e) => update('expected_text', e.target.value)}
          className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <p className="mt-1 text-right text-xs text-body-subtle">
          {values.expected_text.length}/{EXPECTED_TEXT_MAX}
        </p>
      </div>

      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-medium text-body">
          Vacancies <span className="text-error">*</span>
        </label>
        <input
          type="text"
          value={values.vacancies_text}
          maxLength={VACANCIES_TEXT_MAX}
          placeholder="e.g. 15,000+ Posts"
          onChange={(e) => update('vacancies_text', e.target.value)}
          className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <p className="mt-1 text-right text-xs text-body-subtle">
          {values.vacancies_text.length}/{VACANCIES_TEXT_MAX}
        </p>
      </div>

      <div>
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
              placeholder="e.g. Bachelor's Deg."
              onChange={(e) => update('qualification_text', e.target.value)}
              className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <p className="mt-1 text-right text-xs text-body-subtle">
              {values.qualification_text.length}/{QUALIFICATION_TEXT_MAX}
            </p>
          </div>
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-error">{error}</p>}
    </SectionCard>
  )
}

// --- Card Live Preview -----------------------------------------------------------------

function CardLivePreview({ values }: { values: UpcomingExamFormValues }) {
  const qualIcon = getIconByName(values.qualification_icon) ?? getIconByName('graduation-cap')

  return (
    <div className="relative mx-auto w-[190px] overflow-hidden rounded-2xl border-[1.5px] border-primary bg-white p-4 shadow-sm">
      <span className="absolute left-2 top-2 z-10 rounded bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold text-indigo-600">UPCOMING</span>

      <div className="relative mb-3 flex h-[4.8rem] items-center justify-center rounded-xl border border-page bg-gradient-to-br from-white to-slate-100 px-8">
        <span className="line-clamp-2 text-center text-lg font-extrabold leading-tight tracking-tight text-heading">
          {values.card_heading || 'HEADING'}
        </span>
      </div>

      <p className="text-[10px] font-bold text-slate-600">{values.commission_name || 'Commission Name'}</p>
      <p className="mt-1 text-[13px] font-bold leading-snug text-heading">{values.title || 'Exam Title Appears Here'}</p>

      <div className="mt-3 space-y-1.5 text-[11px] font-semibold text-heading">
        <div className="flex items-center gap-1.5">
          <Icon icon={faBolt} className="w-3.5 text-primary" />
          Expected: {values.expected_text || 'Date'}
        </div>
        <div className="flex items-center gap-1.5">
          <Icon icon={faUsers} className="w-3.5 text-primary" />
          {values.vacancies_text || 'Vacancies'}
        </div>
        <div className="flex items-center gap-1.5">
          {qualIcon && <Icon icon={qualIcon} className="w-3.5 text-primary" />}
          {values.qualification_text || 'Qualification'}
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
  values: UpcomingExamFormValues
  update: <K extends keyof UpcomingExamFormValues>(key: K, value: UpcomingExamFormValues[K]) => void
  error?: string
}) {
  return (
    <SectionCard icon={faImage} title="Part B: Exam Details (Hero)" error={!!error}>
      <FieldWithCounter
        label="Commission Name (Hero)"
        value={values.commission_name_hero}
        maxLength={COMMISSION_NAME_HERO_MAX}
        onChange={(v) => update('commission_name_hero', v)}
      />
      <FieldWithCounter label="Exam Title (Hero)" value={values.title_hero} maxLength={TITLE_HERO_MAX} onChange={(v) => update('title_hero', v)} />
      {error && <p className="text-xs text-error">{error}</p>}
    </SectionCard>
  )
}

// --- Part C: Core Stats (Qualification / Age Limit / Expected Vacancy) ----------------------

function CoreStatsSection({
  values,
  update,
}: {
  values: UpcomingExamFormValues
  update: <K extends keyof UpcomingExamFormValues>(key: K, value: UpcomingExamFormValues[K]) => void
}) {
  const cs = values.core_stats
  const setCs = (patch: Partial<CoreStatsValue>) => update('core_stats', { ...cs, ...patch })

  return (
    <SectionCard icon={faLayerGroup} title="Part C: Core Stats">
      <div className="mb-4 rounded-xl border border-border bg-page p-4">
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-body">
          Box 1: Qualification <span className="text-error">*</span>
        </h4>
        <div className="mb-3">
          <label className="mb-1.5 block text-xs font-medium text-body-subtle">Heading</label>
          <input
            type="text"
            value={cs.qualification.heading}
            onChange={(e) => setCs({ qualification: { ...cs.qualification, heading: e.target.value } })}
            className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <IconPicker
            value={cs.qualification.icon}
            onChange={(icon) => setCs({ qualification: { ...cs.qualification, icon } })}
            label="Qualification stat icon"
          />
          <input
            type="text"
            value={cs.qualification.value}
            maxLength={CORE_STAT_VALUE_MAX}
            placeholder="e.g. Bachelor's Degree"
            onChange={(e) => setCs({ qualification: { ...cs.qualification, value: e.target.value } })}
            className="flex-1 rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <p className="mt-1 text-right text-xs text-body-subtle">
          {cs.qualification.value.length}/{CORE_STAT_VALUE_MAX}
        </p>
      </div>

      <div className="mb-4 rounded-xl border border-border bg-page p-4">
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-body">
          Box 2: Age Limit <span className="text-error">*</span>
        </h4>
        <div className="mb-3">
          <label className="mb-1.5 block text-xs font-medium text-body-subtle">Heading</label>
          <input
            type="text"
            value={cs.age.heading}
            onChange={(e) => setCs({ age: { ...cs.age, heading: e.target.value } })}
            className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          <IconPicker value={cs.age.icon} onChange={(icon) => setCs({ age: { ...cs.age, icon } })} label="Age limit stat icon" />
          <input
            type="text"
            value={cs.age.value}
            maxLength={CORE_STAT_VALUE_MAX}
            placeholder="e.g. 18 - 32 Yrs"
            onChange={(e) => setCs({ age: { ...cs.age, value: e.target.value } })}
            className="flex-1 rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        <p className="mt-1 text-right text-xs text-body-subtle">
          {cs.age.value.length}/{CORE_STAT_VALUE_MAX}
        </p>
      </div>

      <div className="rounded-xl border border-border bg-page p-4">
        <h4 className="mb-3 text-xs font-bold uppercase tracking-wide text-body">
          Box 3: Expected Vacancy <span className="text-error">*</span>
        </h4>
        <label className="mb-1.5 block text-xs font-medium text-body-subtle">Value (Icon &amp; Heading Fixed)</label>
        <input
          type="text"
          value={cs.vacancy.value}
          maxLength={CORE_STAT_VACANCY_VALUE_MAX}
          placeholder="e.g. 15,000+ Posts"
          onChange={(e) => setCs({ vacancy: { value: e.target.value } })}
          className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <p className="mt-1 text-right text-xs text-body-subtle">
          {cs.vacancy.value.length}/{CORE_STAT_VACANCY_VALUE_MAX}
        </p>
      </div>
    </SectionCard>
  )
}

// --- Hero + Core Stats Live Preview ---------------------------------------------------------

function HeroCoreStatsLivePreview({ values }: { values: UpcomingExamFormValues }) {
  const cs = values.core_stats
  const qualIcon = getIconByName(cs.qualification.icon) ?? getIconByName('graduation-cap')
  const ageIcon = getIconByName(cs.age.icon) ?? getIconByName('user-clock')

  return (
    <div className="mx-auto w-full max-w-xs space-y-5">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#5b54fa] to-primary p-5 shadow-[0_8px_24px_rgba(79,70,229,0.25)]">
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/15 blur-xl" />
        <div className="relative z-10">
          <p className="mb-1.5 text-sm font-bold leading-tight text-white">{values.commission_name_hero || 'Commission Name'}</p>
          <h1 className="text-xl font-extrabold leading-snug tracking-tight text-white">{values.title_hero || 'Exam Title Appears Here'}</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center rounded-2xl border border-border bg-white p-4 text-center shadow-sm">
          <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary-gradient-from text-primary">
            {qualIcon && <Icon icon={qualIcon} />}
          </span>
          <h4 className="mb-1 text-xs font-bold text-body">{cs.qualification.heading || 'Qualification'}</h4>
          <span className="text-sm font-extrabold leading-tight text-primary">{cs.qualification.value || 'Value'}</span>
        </div>
        <div className="flex flex-col items-center rounded-2xl border border-border bg-white p-4 text-center shadow-sm">
          <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary-gradient-from text-primary">
            {ageIcon && <Icon icon={ageIcon} />}
          </span>
          <h4 className="mb-1 text-xs font-bold text-body">{cs.age.heading || 'Age Limit'}</h4>
          <span className="text-sm font-extrabold leading-tight text-primary">{cs.age.value || 'Value'}</span>
        </div>
      </div>

      <div className="flex flex-col items-center rounded-2xl border border-border bg-white p-6 text-center shadow-sm">
        <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-gradient-from text-primary">
          <Icon icon={faUsers} className="text-xl" />
        </span>
        <h4 className="text-sm font-bold text-body">Expected Vacancy</h4>
        <p className="mt-0.5 text-2xl font-extrabold text-primary">{cs.vacancy.value || 'Posts'}</p>
        <div className="mt-5 flex w-full items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-left">
          <Icon icon={faExclamationTriangle} className="mt-0.5 shrink-0 text-amber-500" />
          <p className="text-xs font-semibold leading-snug text-amber-800">Predictive vacancy figures based on past trends; subject to official changes.</p>
        </div>
      </div>
    </div>
  )
}

// --- Part D: Prediction Analysis ------------------------------------------------------------

function PredictionAnalysisSection({
  values,
  update,
  error,
}: {
  values: UpcomingExamFormValues
  update: <K extends keyof UpcomingExamFormValues>(key: K, value: UpcomingExamFormValues[K]) => void
  error?: string
}) {
  const pa = values.prediction_analysis
  const setPa = (patch: Partial<PredictionAnalysisValue>) => update('prediction_analysis', { ...pa, ...patch })

  return (
    <SectionCard icon={faChartLine} title="Part D: Prediction Analysis" error={!!error}>
      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-medium text-body">
          Heading <span className="text-error">*</span>
        </label>
        <input
          type="text"
          value={pa.heading}
          maxLength={PREDICTION_HEADING_MAX}
          onChange={(e) => setPa({ heading: e.target.value })}
          className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-medium text-body">
          Expected Notification <span className="text-error">*</span>
        </label>
        <input
          type="text"
          value={pa.expected_notification}
          maxLength={PREDICTION_NOTIFICATION_MAX}
          placeholder="e.g. September 2026"
          onChange={(e) => setPa({ expected_notification: e.target.value })}
          className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      <div className="mb-4 flex items-center justify-between rounded-xl border border-border bg-page p-4">
        <h4 className="text-sm font-bold text-heading">Typical Exam Timeline</h4>
        <ToggleSwitch checked={pa.timeline_enabled} onChange={(timeline_enabled) => setPa({ timeline_enabled })} label="Toggle timeline" />
      </div>

      {pa.timeline_enabled && (
        <div className="mb-4 rounded-xl border border-border bg-page p-4">
          <div className="mb-3">
            <label className="mb-1.5 block text-xs font-medium text-body-subtle">Timeline Heading</label>
            <input
              type="text"
              value={pa.timeline_heading}
              onChange={(e) => setPa({ timeline_heading: e.target.value })}
              className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-xs font-medium text-body-subtle">Description</span>
              <span className="text-[10px] font-bold text-body-subtle">*bold* _red_ supported</span>
            </div>
            <textarea
              value={pa.timeline_description}
              rows={3}
              placeholder="e.g. The Tier 1 exam is usually conducted *2-3 months* after notification."
              onChange={(e) => setPa({ timeline_description: e.target.value })}
              className="w-full resize-none rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
          </div>
        </div>
      )}

      <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3 opacity-70">
        <Icon icon={faInfoCircle} className="mt-0.5 shrink-0 text-amber-500" />
        <p className="text-xs font-semibold leading-snug text-amber-800">
          Auto message: "These are predictive dates based on past trends and are subject to change."
        </p>
      </div>

      {error && <p className="mt-2 text-xs text-error">{error}</p>}
    </SectionCard>
  )
}

function PredictionAnalysisLivePreview({ value }: { value: PredictionAnalysisValue }) {
  return (
    <div className="mx-auto w-full max-w-xs rounded-2xl border border-border bg-white p-4 shadow-sm">
      <h3 className="mb-4 text-base font-extrabold text-heading">{value.heading || 'Prediction Analysis'}</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between rounded-xl border border-border bg-page p-3">
          <span className="text-sm font-semibold text-body">Expected Notification:</span>
          <span className="text-sm font-bold text-primary">{value.expected_notification || 'Value'}</span>
        </div>
        {value.timeline_enabled && (
          <div className="rounded-xl border border-border bg-page p-3">
            <p className="mb-2 text-sm font-semibold text-body">{value.timeline_heading || 'Typical Exam Timeline:'}</p>
            <p className="text-sm font-semibold leading-relaxed text-heading">{renderRichText(value.timeline_description || 'Timeline desc')}</p>
          </div>
        )}
        <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <Icon icon={faInfoCircle} className="mt-0.5 shrink-0 text-amber-500" />
          <p className="text-xs font-semibold leading-snug text-amber-800">These are predictive dates based on past trends and are subject to change.</p>
        </div>
      </div>
    </div>
  )
}

// --- Part E: Previous Year Data -------------------------------------------------------------

function PreviousYearDataSection({
  values,
  setValues,
}: {
  values: UpcomingExamFormValues
  setValues: (updater: (prev: UpcomingExamFormValues) => UpcomingExamFormValues) => void
}) {
  const years = values.previous_year_data

  const addYear = () => setValues((prev) => ({ ...prev, previous_year_data: [...prev.previous_year_data, emptyPrevYearEntry()] }))
  const removeYear = (yearId: string) =>
    setValues((prev) => ({ ...prev, previous_year_data: prev.previous_year_data.filter((y) => y.id !== yearId) }))
  const updateYearHeading = (yearId: string, heading: string) =>
    setValues((prev) => ({ ...prev, previous_year_data: prev.previous_year_data.map((y) => (y.id === yearId ? { ...y, heading } : y)) }))

  const addRow = (yearId: string) =>
    setValues((prev) => ({
      ...prev,
      previous_year_data: prev.previous_year_data.map((y) => (y.id === yearId ? { ...y, rows: [...y.rows, customPrevYearRow()] } : y)),
    }))
  const removeRow = (yearId: string, rowId: string) =>
    setValues((prev) => ({
      ...prev,
      previous_year_data: prev.previous_year_data.map((y) => (y.id === yearId ? { ...y, rows: y.rows.filter((r) => r.id !== rowId) } : y)),
    }))
  const updateRow = (yearId: string, rowId: string, patch: { label?: string; value?: string }) =>
    setValues((prev) => ({
      ...prev,
      previous_year_data: prev.previous_year_data.map((y) =>
        y.id === yearId ? { ...y, rows: y.rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)) } : y,
      ),
    }))

  const addCutoff = (yearId: string) =>
    setValues((prev) => ({
      ...prev,
      previous_year_data: prev.previous_year_data.map((y) => (y.id === yearId ? { ...y, cutoffs: [...y.cutoffs, emptyPrevYearCutoff()] } : y)),
    }))
  const removeCutoff = (yearId: string, cutoffId: string) =>
    setValues((prev) => ({
      ...prev,
      previous_year_data: prev.previous_year_data.map((y) =>
        y.id === yearId ? { ...y, cutoffs: y.cutoffs.filter((c) => c.id !== cutoffId) } : y,
      ),
    }))
  const updateCutoff = (yearId: string, cutoffId: string, patch: Partial<PrevYearCutoff>) =>
    setValues((prev) => ({
      ...prev,
      previous_year_data: prev.previous_year_data.map((y) =>
        y.id === yearId ? { ...y, cutoffs: y.cutoffs.map((c) => (c.id === cutoffId ? { ...c, ...patch } : c)) } : y,
      ),
    }))

  return (
    <SectionCard icon={faHistory} title="Part E: Previous Year Data">
      <div className="space-y-4">
        {years.map((year) => (
          <div key={year.id} className="rounded-2xl border border-border bg-page p-4">
            <div className="mb-3 flex items-center justify-between gap-2 border-b border-border pb-3">
              <input
                type="text"
                value={year.heading}
                onChange={(e) => updateYearHeading(year.id, e.target.value)}
                className="flex-1 rounded-lg border border-input-border bg-white px-3 py-1.5 text-sm font-bold focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={() => removeYear(year.id)}
                aria-label={`Remove ${year.heading || 'year'}`}
                className="shrink-0 rounded-lg bg-white p-2 text-body-subtle shadow-sm hover:text-error"
              >
                <Icon icon={faTrashCan} className="text-xs" />
              </button>
            </div>

            <div className="mb-4 rounded-xl border border-border bg-white p-3">
              {year.rows.map((row) => (
                <div key={row.id} className="mb-2 flex items-center gap-2">
                  {row.removable ? (
                    <input
                      type="text"
                      value={row.label}
                      onChange={(e) => updateRow(year.id, row.id, { label: e.target.value })}
                      className="w-1/3 rounded-lg border border-input-border px-2 py-1.5 text-xs focus:border-primary focus:outline-none"
                    />
                  ) : (
                    <span className="w-1/3 text-xs font-bold text-body">{row.label}</span>
                  )}
                  <input
                    type="text"
                    value={row.value}
                    placeholder="Value..."
                    onChange={(e) => updateRow(year.id, row.id, { value: e.target.value })}
                    className="flex-1 rounded-lg border border-input-border px-2 py-1.5 text-xs focus:border-primary focus:outline-none"
                  />
                  {row.removable && (
                    <button
                      type="button"
                      onClick={() => removeRow(year.id, row.id)}
                      aria-label="Remove row"
                      className="shrink-0 text-body-subtle hover:text-error"
                    >
                      <Icon icon={faTrashCan} className="text-xs" />
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => addRow(year.id)} className="mt-1 text-xs font-bold text-primary hover:underline">
                + Add Custom Label
              </button>
            </div>

            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-body-subtle">Previous Cut-Off Blocks</p>
            <div className="space-y-3">
              {year.cutoffs.map((cutoff) => (
                <PrevYearCutoffEditor
                  key={cutoff.id}
                  cutoff={cutoff}
                  onChange={(patch) => updateCutoff(year.id, cutoff.id, patch)}
                  onRemove={() => removeCutoff(year.id, cutoff.id)}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => addCutoff(year.id)}
              className="mt-3 w-full rounded-xl border border-dashed border-input-border py-2 text-xs font-bold text-primary hover:border-primary-border-accent"
            >
              + Add Cut-Off Block
            </button>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={addYear}
        className="mt-4 w-full rounded-xl border border-dashed border-input-border py-2.5 text-sm font-medium text-body-subtle hover:border-primary-border-accent hover:text-primary"
      >
        + Add Previous Year Data
      </button>
    </SectionCard>
  )
}

function PrevYearCutoffEditor({
  cutoff,
  onChange,
  onRemove,
}: {
  cutoff: PrevYearCutoff
  onChange: (patch: Partial<PrevYearCutoff>) => void
  onRemove: () => void
}) {
  return (
    <div className="rounded-xl border border-border bg-white p-3">
      <div className="mb-3 flex items-center gap-2">
        <input
          type="text"
          value={cutoff.heading}
          onChange={(e) => onChange({ heading: e.target.value })}
          className="flex-1 rounded-lg border border-input-border px-2 py-1.5 text-sm font-bold focus:border-primary focus:outline-none"
        />
        <button type="button" onClick={onRemove} aria-label="Remove cut-off block" className="shrink-0 text-body-subtle hover:text-error">
          <Icon icon={faTrashCan} className="text-xs" />
        </button>
      </div>
      <SegmentedToggle
        options={[
          { value: 'table', label: 'Table' },
          { value: 'bullets', label: 'Bullets' },
          { value: 'text', label: 'Text' },
        ]}
        value={cutoff.mode}
        onChange={(mode) => onChange({ mode })}
        className="mb-3 gap-0.5 p-0.5"
        optionClassName="px-2 py-1.5 text-xs"
      />
      {cutoff.mode === 'table' && <TableEditor value={cutoff.table ?? emptyTableContent()} onChange={(table) => onChange({ table })} />}
      {cutoff.mode === 'bullets' && <CutoffBulletsEditor bullets={cutoff.bullets} onChange={(bullets) => onChange({ bullets })} />}
      {cutoff.mode === 'text' && (
        <textarea
          value={cutoff.text}
          rows={3}
          onChange={(e) => onChange({ text: e.target.value })}
          className="w-full resize-none rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      )}
    </div>
  )
}

function CutoffBulletsEditor({ bullets, onChange }: { bullets: string[]; onChange: (bullets: string[]) => void }) {
  const update = (index: number, text: string) => onChange(bullets.map((b, i) => (i === index ? text : b)))
  const remove = (index: number) => onChange(bullets.filter((_, i) => i !== index))
  const add = () => onChange([...bullets, ''])

  return (
    <div>
      <div className="space-y-1.5">
        {bullets.map((b, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <input
              type="text"
              value={b}
              onChange={(e) => update(i, e.target.value)}
              className="flex-1 rounded-lg border border-input-border px-2 py-1.5 text-xs focus:border-primary focus:outline-none"
            />
            <button type="button" onClick={() => remove(i)} aria-label="Remove point" className="text-body-subtle hover:text-error">
              <Icon icon={faTrashCan} className="text-xs" />
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={add} className="mt-1.5 text-xs font-bold text-primary hover:underline">
        + Add Point
      </button>
    </div>
  )
}

function PreviousYearDataLivePreview({ years }: { years: PrevYearEntry[] }) {
  if (years.length === 0) return <p className="text-center text-xs font-bold text-body-subtle">No Previous Year Data</p>

  return (
    <div className="mx-auto w-full max-w-xs space-y-4">
      {years.map((year) => (
        <div key={year.id} className="rounded-2xl border border-border bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-base font-extrabold text-heading">{year.heading || 'Previous Year Data'}</h3>
          <div className="mb-2">
            {year.rows
              .filter((r) => r.label.trim())
              .map((r) => (
                <div key={r.id} className="mb-2 flex justify-between gap-2 text-sm">
                  <span className="font-semibold text-body">{r.label}</span>
                  <span className="text-right font-bold text-heading">{r.value || '-'}</span>
                </div>
              ))}
          </div>
          {year.cutoffs.map((cutoff) => {
            const bullets = cutoff.bullets.filter((b) => b.trim())
            return (
              <div key={cutoff.id} className="mt-4 border-t border-border pt-4">
                <p className="mb-3 text-sm font-extrabold text-heading">{cutoff.heading}</p>
                {cutoff.mode === 'table' && <TableContentPreview table={cutoff.table} />}
                {cutoff.mode === 'bullets' && (
                  <ul className="list-disc space-y-2 pl-4 text-sm font-medium text-body marker:text-body-subtle">
                    {bullets.length === 0 ? <li className="italic text-body-subtle">Add points...</li> : bullets.map((b, i) => <li key={i}>{b}</li>)}
                  </ul>
                )}
                {cutoff.mode === 'text' &&
                  (cutoff.text.trim() ? (
                    <p className="whitespace-pre-wrap text-sm font-medium text-body">{cutoff.text}</p>
                  ) : (
                    <p className="text-sm italic text-body-subtle">Add text content to preview...</p>
                  ))}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// --- Part I: Custom Boxes -------------------------------------------------------------------

function CustomBoxesSection({
  values,
  setValues,
  boxes,
}: {
  values: UpcomingExamFormValues
  setValues: (updater: (prev: UpcomingExamFormValues) => UpcomingExamFormValues) => void
  boxes: (OptionalSectionValue & { id: string })[]
}) {
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
      const full = [...prev.custom_content_boxes]
      const a = index + 1
      const b = target + 1
      ;[full[a], full[b]] = [full[b], full[a]]
      return { ...prev, custom_content_boxes: full }
    })
  }
  const addBox = () => {
    if (values.custom_content_boxes.length >= MAX_CUSTOM_BOXES) return
    setValues((prev) => ({
      ...prev,
      custom_content_boxes: [...prev.custom_content_boxes, { ...emptyOptionalSection('text'), id: crypto.randomUUID(), enabled: true }],
    }))
  }

  const atLimit = values.custom_content_boxes.length >= MAX_CUSTOM_BOXES

  return (
    <SectionCard icon={faPuzzlePiece} title="Part I: Custom Boxes">
      <p className="-mt-3 mb-4 text-xs text-body-subtle">Add up to {MAX_CUSTOM_BOXES} custom content sections.</p>
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
