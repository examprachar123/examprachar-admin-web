import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  faArrowDown,
  faArrowUp,
  faBolt,
  faCalendarCheck,
  faChartBar,
  faCheckCircle,
  faChevronCircleRight,
  faEyeSlash,
  faForward,
  faIdCard,
  faImage,
  faInfoCircle,
  faPuzzlePiece,
  faTags,
} from '@fortawesome/free-solid-svg-icons'
import { faTrashCan } from '@fortawesome/free-regular-svg-icons'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'
import { IconPicker } from '@/components/ui/IconPicker'
import { EditableHeading } from '@/components/ui/EditableHeading'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TargetAudienceTagsField } from '@/components/posts/TargetAudienceTagsField'
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
import { useCreatePost, usePostDetail, useUpdatePost } from '@/hooks/usePostForm'
import {
  emptyResultForm,
  resultFromWirePayload,
  resultToWirePayload,
  validateResultForm,
  CARD_HEADING_MAX,
  COMMISSION_NAME_MAX,
  TITLE_MAX,
  COMMISSION_NAME_HERO_MAX,
  TITLE_HERO_MAX,
  RESULT_TYPE_TEXT_MAX,
  NEXT_STAGE_TEXT_MAX,
  RESULT_STATUS_TEXT_MAX,
  RESULT_NOTE_MAX,
  type ResultErrorKey,
  type ResultFormValues,
  type ResultWirePayload,
  type WhatsNextValue,
} from '@/types/posts/result'
import { DEFAULT_RESULT_LINKS, emptyOptionalSection, type OptionalSectionValue } from '@/types/postCommon'

const MAX_CUSTOM_BOXES = 5

function formatShortDate(dateStr: string): string {
  if (!dateStr) return 'DD MMM'
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}

function formatLongDate(dateStr: string): string {
  if (!dateStr) return 'DD MMM YYYY'
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

/** Renders *bold* and _red_ inline markup — the only formatting What's Next points support. */
function renderRichText(text: string): ReactNode[] {
  const parts: ReactNode[] = []
  const regex = /\*(.+?)\*|_(.+?)_/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0
  while ((match = regex.exec(text))) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index))
    if (match[1] !== undefined) {
      parts.push(
        <span key={key++} className="font-extrabold text-heading">
          {match[1]}
        </span>,
      )
    } else {
      parts.push(
        <span key={key++} className="font-extrabold text-error">
          {match[2]}
        </span>,
      )
    }
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}

function SectionHiddenPlaceholder() {
  return (
    <div className="mx-auto flex h-24 w-full max-w-xs flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-border bg-white text-center">
      <Icon icon={faEyeSlash} className="text-lg text-body-subtle" />
      <span className="text-xs font-bold text-body-subtle">Section Hidden</span>
    </div>
  )
}

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
  const [promoAdActiveState, setPromoAdActiveState] = useState<number | null>(null)
  const [backendErrors, setBackendErrors] = useState<string[]>([])
  const [importantLinksRowErrors, setImportantLinksRowErrors] = useState<Record<string, string>>({})

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
    setBackendErrors([])
    setImportantLinksRowErrors({})
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

  const updateCustomBox = (boxId: string, next: OptionalSectionValue) => {
    setValues((prev) => ({
      ...prev,
      custom_content_boxes: prev.custom_content_boxes.map((b) => (b.id === boxId ? { ...next, id: boxId } : b)),
    }))
  }

  if (isEdit && isLoading) {
    return (
      <AppShell title="Result" showBack>
        <p className="py-8 text-center text-sm text-body-subtle">Loading post...</p>
      </AppShell>
    )
  }

  const additionalInfoBox = values.custom_content_boxes[0]
  const customBoxes = values.custom_content_boxes.slice(1)

  return (
    <AppShell title={isEdit ? 'Edit Result' : 'Post Result'} showBack>
      <div className="space-y-5">
        <div ref={setSectionRef('audience')}>
          <SectionCard icon={faTags} title="Target Audience Tags">
            <TargetAudienceTagsField
              section="result"
              value={values.targetAudience}
              onChange={(v) => update('targetAudience', v)}
              error={errors.audience ?? errors.audienceState}
            />
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

        <div ref={setSectionRef('resultStatus')}>
          <ResultStatusSection values={values} update={update} error={errors.resultStatus} />
        </div>

        <LivePreviewPanel title="Hero + Result Stats">
          <HeroResultLivePreview values={values} />
        </LivePreviewPanel>

        <OptionalSectionEditor
          icon={faChartBar}
          title="Part D: Cut-off Marks"
          allowedModes={['table', 'bullets', 'text']}
          value={values.cutoff_marks}
          onChange={(v) => update('cutoff_marks', v)}
        />

        <LivePreviewPanel title="Cut-off Marks">
          <OptionalSectionLivePreview value={values.cutoff_marks} />
        </LivePreviewPanel>

        <WhatsNextSection values={values} update={update} />

        <LivePreviewPanel title="What's Next">
          <WhatsNextLivePreview value={values.whats_next} />
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

        {additionalInfoBox && (
          <>
            <OptionalSectionEditor
              icon={faInfoCircle}
              title="Part G: Additional Info"
              allowedModes={['bullets']}
              value={additionalInfoBox}
              onChange={(v) => updateCustomBox(additionalInfoBox.id, v)}
            />
            <LivePreviewPanel title="Additional Info">
              <OptionalSectionLivePreview value={additionalInfoBox} />
            </LivePreviewPanel>
          </>
        )}

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
          defaultLinks={DEFAULT_RESULT_LINKS}
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
  values: ResultFormValues
  update: <K extends keyof ResultFormValues>(key: K, value: ResultFormValues[K]) => void
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

// --- Vital Stats (Result Date + Type + Next) -----------------------------------------------

function VitalStatsSection({
  values,
  update,
  error,
}: {
  values: ResultFormValues
  update: <K extends keyof ResultFormValues>(key: K, value: ResultFormValues[K]) => void
  error?: string
}) {
  return (
    <SectionCard icon={faBolt} title="Vital Stats (Footer)" error={!!error}>
      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-medium text-body">
          Result Date <span className="text-error">*</span>
        </label>
        <input
          type="date"
          value={values.declared_on}
          onChange={(e) => update('declared_on', e.target.value)}
          className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      </div>

      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-medium text-body">
          Type <span className="text-error">*</span>
        </label>
        <div className="flex gap-2">
          <IconPicker value={values.result_type_icon} onChange={(icon) => update('result_type_icon', icon)} label="Type icon" />
          <div className="flex-1">
            <input
              type="text"
              value={values.result_type_text}
              maxLength={RESULT_TYPE_TEXT_MAX}
              placeholder="Final Result"
              onChange={(e) => update('result_type_text', e.target.value)}
              className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <p className="mt-1 text-right text-xs text-body-subtle">
              {values.result_type_text.length}/{RESULT_TYPE_TEXT_MAX}
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-body">
          Next <span className="text-error">*</span>
        </label>
        <div className="flex gap-2">
          <IconPicker value={values.next_stage_icon} onChange={(icon) => update('next_stage_icon', icon)} label="Next icon" />
          <div className="flex-1">
            <input
              type="text"
              value={values.next_stage_text}
              maxLength={NEXT_STAGE_TEXT_MAX}
              placeholder="Tier 2 Exam"
              onChange={(e) => update('next_stage_text', e.target.value)}
              className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <p className="mt-1 text-right text-xs text-body-subtle">
              {values.next_stage_text.length}/{NEXT_STAGE_TEXT_MAX}
            </p>
          </div>
        </div>
      </div>

      {error && <p className="mt-2 text-xs text-error">{error}</p>}
    </SectionCard>
  )
}

// --- Card Live Preview -----------------------------------------------------------------

function CardLivePreview({ values }: { values: ResultFormValues }) {
  const typeIcon = getIconByName(values.result_type_icon) ?? getIconByName('list-ol')
  const nextIcon = getIconByName(values.next_stage_icon) ?? getIconByName('forward')

  return (
    <div className="relative mx-auto w-[190px] overflow-hidden rounded-2xl border-[1.5px] border-primary bg-white p-4 shadow-sm">
      <span className="absolute left-2 top-2 z-10 rounded bg-emerald-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-600">
        Out Now
      </span>

      <div className="relative mb-3 flex h-[4.8rem] items-center justify-center rounded-xl border border-page bg-gradient-to-br from-white to-slate-100 px-4">
        <span className="line-clamp-2 text-center text-lg font-extrabold leading-tight tracking-tight text-heading">
          {values.card_heading || 'HEADING'}
        </span>
      </div>

      <p className="text-[10px] font-bold text-slate-600">{values.commission_name || 'Commission Name'}</p>
      <p className="mt-1 text-[13px] font-bold leading-snug text-heading">{values.title || 'Exam Title Appears Here'}</p>

      <div className="mt-3 space-y-1.5 text-[11px] font-semibold text-heading">
        <div className="flex items-center gap-1.5">
          <Icon icon={faCalendarCheck} className="w-3.5 text-primary" />
          Declared: {formatShortDate(values.declared_on)}
        </div>
        <div className="flex items-center gap-1.5">
          {typeIcon && <Icon icon={typeIcon} className="w-3.5 text-primary" />}
          Type: {values.result_type_text || 'Type'}
        </div>
        <div className="flex items-center gap-1.5">
          {nextIcon && <Icon icon={nextIcon} className="w-3.5 text-primary" />}
          Next: {values.next_stage_text || 'Next Step'}
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
  values: ResultFormValues
  update: <K extends keyof ResultFormValues>(key: K, value: ResultFormValues[K]) => void
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

// --- Part C: Result Block -------------------------------------------------------------------

function ResultStatusSection({
  values,
  update,
  error,
}: {
  values: ResultFormValues
  update: <K extends keyof ResultFormValues>(key: K, value: ResultFormValues[K]) => void
  error?: string
}) {
  return (
    <SectionCard icon={faCalendarCheck} title="Part C: Result Block" error={!!error}>
      <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-border bg-page p-3.5 text-xs font-semibold text-body">
        <Icon icon={faInfoCircle} className="mt-0.5 shrink-0 text-primary/70" />
        <p className="leading-relaxed">
          The <span className="font-bold">Type</span>, <span className="font-bold">Next Stage</span>, and{' '}
          <span className="font-bold">Declared On</span> values are pulled automatically from your Part A configuration.
        </p>
      </div>

      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-medium text-body">
          Result Status <span className="text-error">*</span>
        </label>
        <input
          type="text"
          value={values.result_status_text}
          maxLength={RESULT_STATUS_TEXT_MAX}
          placeholder="Declared"
          onChange={(e) => update('result_status_text', e.target.value)}
          className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <p className="mt-1 text-right text-xs text-body-subtle">
          {values.result_status_text.length}/{RESULT_STATUS_TEXT_MAX}
        </p>
      </div>

      <div className="mb-4">
        <label className="mb-1.5 block text-sm font-medium text-body">Declared On</label>
        <div className="w-full rounded-lg border border-input-border bg-page px-3 py-2 text-sm font-semibold text-body-subtle">
          {formatLongDate(values.declared_on)}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-page p-4">
        <div>
          <h4 className="text-sm font-bold text-heading">Result Note</h4>
          <p className="mt-0.5 text-xs text-body-subtle">Optional note about the result.</p>
        </div>
        <ToggleSwitch
          checked={values.result_note.enabled}
          onChange={(enabled) => update('result_note', { ...values.result_note, enabled })}
          label="Toggle result note"
        />
      </div>

      {values.result_note.enabled && (
        <textarea
          value={values.result_note.text}
          maxLength={RESULT_NOTE_MAX}
          rows={3}
          placeholder="e.g. Please check your specific details on the portal..."
          onChange={(e) => update('result_note', { ...values.result_note, text: e.target.value })}
          className="mt-3 w-full resize-none rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
      )}

      {error && <p className="mt-2 text-xs text-error">{error}</p>}
    </SectionCard>
  )
}

// --- Hero + Result Stats Live Preview -------------------------------------------------------

function HeroResultLivePreview({ values }: { values: ResultFormValues }) {
  const typeIcon = getIconByName(values.result_type_icon) ?? getIconByName('list-ol')
  const nextIcon = getIconByName(values.next_stage_icon) ?? getIconByName('forward')

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
          <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary-gradient-from text-primary">
            {typeIcon && <Icon icon={typeIcon} className="text-base" />}
          </span>
          <h4 className="text-xs font-bold text-body">Type</h4>
          <span className="text-sm font-extrabold text-heading">{values.result_type_text || 'Result Type'}</span>
        </div>
        <div className="flex flex-col items-center rounded-2xl border border-border bg-white p-4 text-center shadow-sm">
          <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary-gradient-from text-primary">
            {nextIcon && <Icon icon={nextIcon} className="text-base" />}
          </span>
          <h4 className="text-xs font-bold text-body">Next Stage</h4>
          <span className="text-sm font-extrabold text-heading">{values.next_stage_text || 'Next Step'}</span>
        </div>
      </div>

      <div className="flex flex-col items-center rounded-2xl border border-border bg-white p-6 text-center shadow-sm">
        <span className="mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-primary-gradient-from text-primary">
          <Icon icon={faCheckCircle} className="text-base" />
        </span>
        <h4 className="text-sm font-bold text-body">Result Status</h4>
        <p className="mt-0.5 text-xl font-extrabold text-primary">{values.result_status_text || 'Declared'}</p>
        <p className="mt-2 text-xs font-bold text-body-subtle">
          Declared on: <span className="font-extrabold text-heading">{formatLongDate(values.declared_on)}</span>
        </p>
        {values.result_note.enabled && values.result_note.text.trim() && (
          <p className="mt-3 w-full whitespace-pre-wrap rounded-xl border border-border bg-page p-3 text-left text-xs font-semibold text-body">
            {values.result_note.text}
          </p>
        )}
      </div>
    </div>
  )
}

// --- Part E: What's Next ---------------------------------------------------------------------

function WhatsNextSection({
  values,
  update,
}: {
  values: ResultFormValues
  update: <K extends keyof ResultFormValues>(key: K, value: ResultFormValues[K]) => void
}) {
  const wn = values.whats_next
  const setWn = (patch: Partial<WhatsNextValue>) => update('whats_next', { ...wn, ...patch })
  const setEnabled = (enabled: boolean) => setWn({ enabled, heading: enabled && !wn.heading.trim() ? "What's Next?" : wn.heading })

  const addPoint = () => setWn({ points: [...wn.points, { id: crypto.randomUUID(), text: '' }] })
  const updatePoint = (pointId: string, text: string) => setWn({ points: wn.points.map((p) => (p.id === pointId ? { ...p, text } : p)) })
  const removePoint = (pointId: string) => setWn({ points: wn.points.filter((p) => p.id !== pointId) })

  return (
    <SectionCard
      icon={faForward}
      title="Part E: What's Next?"
      badge={<ToggleSwitch checked={wn.enabled} onChange={setEnabled} label={wn.enabled ? "Disable What's Next" : "Enable What's Next"} />}
    >
      {!wn.enabled ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-page py-8 text-center">
          <Icon icon={faEyeSlash} className="text-xl text-body-subtle" />
          <p className="text-sm font-bold text-heading">Section Hidden</p>
          <p className="text-xs text-body-subtle">This section will not be displayed.</p>
        </div>
      ) : (
        <>
          <EditableHeading value={wn.heading} fallback="What's Next?" maxLength={30} onChange={(heading) => setWn({ heading })} />

          <div className="mb-4">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-medium text-body">Subheading</span>
              <ToggleSwitch
                checked={wn.subheading_enabled}
                onChange={(subheading_enabled) => setWn({ subheading_enabled })}
                label="Toggle subheading"
              />
            </div>
            {wn.subheading_enabled && (
              <input
                type="text"
                value={wn.subheading}
                maxLength={40}
                onChange={(e) => setWn({ subheading: e.target.value })}
                className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            )}
          </div>

          <div className="mb-4 flex items-start gap-2 rounded-xl border border-border bg-page p-3 text-xs font-semibold text-body">
            <Icon icon={faInfoCircle} className="mt-0.5 shrink-0 text-primary/70" />
            <p className="leading-relaxed">
              <span className="font-bold">Pro-Tip:</span> wrap text in <code className="rounded bg-white px-1 py-0.5 border border-border">*asterisks*</code>{' '}
              for <span className="font-bold">Bold</span> and <code className="rounded bg-white px-1 py-0.5 border border-border">_underscores_</code> for{' '}
              <span className="font-bold text-error">Red</span>.
            </p>
          </div>

          <div className="space-y-2">
            {wn.points.map((point) => (
              <div key={point.id} className="flex items-start gap-2 rounded-xl border border-border bg-white p-2 shadow-sm">
                <Icon icon={faChevronCircleRight} className="mt-3 text-primary" />
                <textarea
                  value={point.text}
                  rows={2}
                  placeholder="Enter point..."
                  onChange={(e) => updatePoint(point.id, e.target.value)}
                  className="flex-1 resize-none rounded-lg border-none bg-transparent px-1 py-2 text-sm focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removePoint(point.id)}
                  aria-label="Remove point"
                  className="mt-1.5 shrink-0 text-body-subtle hover:text-error"
                >
                  <Icon icon={faTrashCan} className="text-xs" />
                </button>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addPoint}
            className="mt-3 w-full rounded-xl border border-dashed border-input-border py-2.5 text-sm font-medium text-body-subtle hover:border-primary-border-accent hover:text-primary"
          >
            + Add Point
          </button>
        </>
      )}
    </SectionCard>
  )
}

function WhatsNextLivePreview({ value }: { value: WhatsNextValue }) {
  if (!value.enabled) return <SectionHiddenPlaceholder />

  const points = value.points.filter((p) => p.text.trim())

  return (
    <div className="mx-auto w-full max-w-xs rounded-2xl border border-border bg-white p-4 shadow-sm">
      <h3 className="mb-3 text-base font-extrabold text-heading">{value.heading || "What's Next?"}</h3>
      {value.subheading_enabled && value.subheading.trim() && <h4 className="mb-3 text-sm font-bold text-body">{value.subheading}</h4>}
      <div className="space-y-3">
        {points.length === 0 ? (
          <p className="text-sm italic text-body-subtle">Add points to preview...</p>
        ) : (
          points.map((p) => (
            <div key={p.id} className="flex items-start gap-2.5">
              <Icon icon={faChevronCircleRight} className="mt-0.5 shrink-0 text-primary" />
              <p className="text-sm font-semibold leading-relaxed text-body">{renderRichText(p.text)}</p>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// --- Part H: Custom Boxes -------------------------------------------------------------------

function CustomBoxesSection({
  values,
  setValues,
  boxes,
}: {
  values: ResultFormValues
  setValues: (updater: (prev: ResultFormValues) => ResultFormValues) => void
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
    <SectionCard icon={faPuzzlePiece} title="Part H: Custom Boxes">
      <p className="-mt-3 mb-4 text-xs text-body-subtle">Add up to {MAX_CUSTOM_BOXES} custom content sections for flexible information.</p>
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
        className="mt-3 w-full rounded-xl border border-dashed border-input-border py-2.5 text-sm font-medium text-body-subtle hover:border-primary-border-accent hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
      >
        {atLimit ? `Max ${MAX_CUSTOM_BOXES} reached` : '+ Add Custom Box'}
      </button>
    </SectionCard>
  )
}
