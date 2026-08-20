import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import clsx from 'clsx'
import {
  faBell,
  faBolt,
  faCalendarCheck,
  faCheckCircle,
  faCircleDot,
  faClipboardList,
  faIdCard,
  faImage,
  faInfoCircle,
  faMagic,
  faPlus,
  faPuzzlePiece,
  faTags,
  faTimesCircle,
} from '@fortawesome/free-solid-svg-icons'
import { faTrashCan } from '@fortawesome/free-regular-svg-icons'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'
import { SegmentedToggle } from '@/components/ui/SegmentedToggle'
import { EditableHeading } from '@/components/ui/EditableHeading'
import { IconPicker } from '@/components/ui/IconPicker'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TargetAudienceTagsField } from '@/components/posts/TargetAudienceTagsField'
import { SectionCard } from '@/components/posts/SectionCard'
import { LivePreviewPanel } from '@/components/posts/LivePreviewPanel'
import { OptionalSectionEditor } from '@/components/posts/OptionalSectionEditor'
import { OptionalSectionLivePreview } from '@/components/posts/OptionalSectionLivePreview'
import { ImportantLinksEditor } from '@/components/posts/ImportantLinksEditor'
import { ImportantLinksLivePreview } from '@/components/posts/ImportantLinksLivePreview'
import { PromoAdsCarouselEditor } from '@/components/posts/PromoAdsCarouselEditor'
import { PromoAdsLivePreview } from '@/components/posts/PromoAdsLivePreview'
import { useToast } from '@/context/ToastContext'
import { ApiError } from '@/lib/apiClient'
import { getIconByName } from '@/lib/iconLibrary'
import { useCreatePost, usePostDetail, useUpdatePost } from '@/hooks/usePostForm'
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
import { DEFAULT_ADMIT_CARD_LINKS, emptyOptionalSection } from '@/types/postCommon'

const MARKERS: { value: InstructionPoint['marker']; label: string }[] = [
  { value: 'tick', label: 'Do' },
  { value: 'dot', label: 'Note' },
  { value: 'warning', label: "Don't" },
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
  const [backendErrors, setBackendErrors] = useState<string[]>([])
  const [importantLinksRowErrors, setImportantLinksRowErrors] = useState<Record<string, string>>({})
  const [promoAdActiveState, setPromoAdActiveState] = useState<number | null>(null)

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

  const handlePublishClick = () => {
    setBackendErrors([])
    setImportantLinksRowErrors({})
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
      <AppShell title="Admit Card" showBack>
        <p className="py-8 text-center text-sm text-body-subtle">Loading post...</p>
      </AppShell>
    )
  }

  return (
    <AppShell title={isEdit ? 'Edit Admit Card' : 'Post Admit Card'} showBack>
      <div className="space-y-5">
        <div ref={setSectionRef('audience')}>
          <SectionCard icon={faTags} title="Target Audience Tags">
            <TargetAudienceTagsField
              section="admit_card"
              value={values.targetAudience}
              onChange={(v) => update('targetAudience', v)}
              error={errors.audience ?? errors.audienceState}
            />
          </SectionCard>
        </div>

        <div ref={setSectionRef('cardDetails')}>
          <CardDetailsSection values={values} update={update} error={errors.cardDetails} />
        </div>

        <VitalStatsSection
          values={values}
          update={update}
          examDateRef={setSectionRef('examDate')}
          statusRef={setSectionRef('status')}
          modeRef={setSectionRef('mode')}
          examDateError={errors.examDate}
          statusError={errors.status}
          modeError={errors.mode}
        />

        <LivePreviewPanel title="Card" defaultOpen>
          <CardLivePreview values={values} />
        </LivePreviewPanel>

        <HeroFieldsSection values={values} update={update} />

        <ExamDateInstructionsSection values={values} update={update} />

        <LivePreviewPanel title="Hero + Exam Date">
          <HeroAndExamDateLivePreview values={values} />
        </LivePreviewPanel>

        <ImportantInstructionsEditor value={values.important_instructions} onChange={(v) => update('important_instructions', v)} />

        <LivePreviewPanel title="Important Instructions">
          <ImportantInstructionsLivePreview value={values.important_instructions} />
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
          icon={faInfoCircle}
          title="Additional Information"
          allowedModes={['bullets']}
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
          defaultLinks={DEFAULT_ADMIT_CARD_LINKS}
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

// --- Card Details ------------------------------------------------------------------------

function CardDetailsSection({
  values,
  update,
  error,
}: {
  values: AdmitCardFormValues
  update: <K extends keyof AdmitCardFormValues>(key: K, value: AdmitCardFormValues[K]) => void
  error?: string
}) {
  return (
    <SectionCard icon={faIdCard} title="Card Details" error={!!error}>
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

// --- Vital Stats (Exam Date + Status + Mode) ------------------------------------------------

function formatDateShort(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
}
function formatDateLong(dateStr: string): string {
  return new Date(`${dateStr}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function examDateLabel(values: AdmitCardFormValues, format: (d: string) => string, fallback: string): string {
  if (values.exam_date_mode === 'custom_text') return values.exam_date_text || fallback
  if (values.exam_date_mode === 'range') {
    if (values.exam_date_start && values.exam_date_end) return `${format(values.exam_date_start)} - ${format(values.exam_date_end)}`
    if (values.exam_date_start) return format(values.exam_date_start)
    return fallback
  }
  return values.exam_date_start ? format(values.exam_date_start) : fallback
}

function VitalStatsSection({
  values,
  update,
  examDateRef,
  statusRef,
  modeRef,
  examDateError,
  statusError,
  modeError,
}: {
  values: AdmitCardFormValues
  update: <K extends keyof AdmitCardFormValues>(key: K, value: AdmitCardFormValues[K]) => void
  examDateRef: (el: HTMLDivElement | null) => void
  statusRef: (el: HTMLDivElement | null) => void
  modeRef: (el: HTMLDivElement | null) => void
  examDateError?: string
  statusError?: string
  modeError?: string
}) {
  return (
    <SectionCard icon={faBolt} title="Vital Stats (Footer)" error={!!examDateError || !!statusError || !!modeError}>
      <div ref={examDateRef}>
        <label className="mb-1.5 block text-sm font-medium text-body">
          Exam Date <span className="text-error">*</span>
        </label>
        <SegmentedToggle
          options={[
            { value: 'single', label: 'Single Date' },
            { value: 'range', label: 'Date Range' },
            { value: 'custom_text', label: 'Custom Text' },
          ]}
          value={values.exam_date_mode}
          onChange={(mode) => update('exam_date_mode', mode)}
          className="mb-3 gap-0.5 p-0.5"
          optionClassName="px-1.5 py-1.5 text-xs"
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
            maxLength={15}
            onChange={(e) => update('exam_date_text', e.target.value)}
            placeholder="e.g. To Be Notified"
            className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        )}
        {examDateError && <p className="mt-1.5 text-xs text-error">{examDateError}</p>}
      </div>

      <div ref={statusRef} className="mt-5 border-t border-slate-100 pt-5">
        <label className="mb-1.5 block text-sm font-medium text-body">
          Status <span className="text-error">*</span>
        </label>
        <span className="mb-1.5 block text-xs text-body-subtle">Current stage (e.g. Out Now)</span>
        <div className="flex gap-2">
          <IconPicker value={values.status_icon} onChange={(icon) => update('status_icon', icon)} label="Status icon" />
          <input
            type="text"
            value={values.status_text}
            onChange={(e) => update('status_text', e.target.value)}
            placeholder="e.g. Released"
            className="flex-1 rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        {statusError && <p className="mt-1.5 text-xs text-error">{statusError}</p>}
      </div>

      <div ref={modeRef} className="mt-5 border-t border-slate-100 pt-5">
        <label className="mb-1.5 block text-sm font-medium text-body">
          Mode <span className="text-error">*</span>
        </label>
        <span className="mb-1.5 block text-xs text-body-subtle">Testing medium (e.g. Online CBT)</span>
        <div className="flex gap-2">
          <IconPicker value={values.mode_icon} onChange={(icon) => update('mode_icon', icon)} label="Mode icon" />
          <input
            type="text"
            value={values.mode_text}
            onChange={(e) => update('mode_text', e.target.value)}
            placeholder="e.g. Online"
            className="flex-1 rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>
        {modeError && <p className="mt-1.5 text-xs text-error">{modeError}</p>}
      </div>
    </SectionCard>
  )
}

// --- Card Live Preview -----------------------------------------------------------------

function CardLivePreview({ values }: { values: AdmitCardFormValues }) {
  const statusIcon = getIconByName(values.status_icon) ?? faBell
  const modeIcon = getIconByName(values.mode_icon) ?? faBell

  return (
    <div className="relative mx-auto max-w-xs overflow-hidden rounded-2xl border-[1.5px] border-primary bg-white p-4 shadow-sm">
      <span className="absolute left-2 top-2 z-10 rounded bg-primary-gradient-from px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-primary">
        New
      </span>

      <div className="mb-3 flex h-[4.8rem] items-center justify-center rounded-xl border border-page bg-gradient-to-br from-white to-slate-100 px-8">
        <span className="line-clamp-2 text-center text-lg font-extrabold leading-tight tracking-tight text-heading">
          {values.card_heading || 'HEADING'}
        </span>
      </div>

      <p className="text-xs font-semibold text-body-subtle">{values.commission_name || 'Commission name'}</p>
      <p className="mt-0.5 text-base font-bold leading-snug text-heading">{values.title || 'Exam title'}</p>

      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2 text-sm text-body">
          <Icon icon={faCalendarCheck} className="w-4 text-primary" />
          <span>Date: {examDateLabel(values, formatDateShort, 'DD MMM')}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-body">
          <Icon icon={statusIcon} className="w-4 text-primary" />
          <span>Status: {values.status_text || 'Status'}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-body">
          <Icon icon={modeIcon} className="w-4 text-primary" />
          <span>Mode: {values.mode_text || 'Mode'}</span>
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
}: {
  values: AdmitCardFormValues
  update: <K extends keyof AdmitCardFormValues>(key: K, value: AdmitCardFormValues[K]) => void
}) {
  return (
    <SectionCard icon={faImage} title="Hero Banner Fields">
      <FieldWithCounter
        label="Commission Name (Hero)"
        value={values.commission_name_hero}
        maxLength={COMMISSION_NAME_HERO_MAX}
        onChange={(v) => update('commission_name_hero', v)}
        required={false}
      />
      <FieldWithCounter
        label="Title (Hero)"
        value={values.title_hero}
        maxLength={TITLE_HERO_MAX}
        onChange={(v) => update('title_hero', v)}
        required={false}
      />
    </SectionCard>
  )
}

// --- Exam Date Instructions ----------------------------------------------------------------

function ExamDateInstructionsSection({
  values,
  update,
}: {
  values: AdmitCardFormValues
  update: <K extends keyof AdmitCardFormValues>(key: K, value: AdmitCardFormValues[K]) => void
}) {
  return (
    <SectionCard icon={faCalendarCheck} title="Exam Date Instructions">
      <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-border bg-page p-3.5 text-xs font-semibold text-body">
        <Icon icon={faInfoCircle} className="mt-0.5 shrink-0 text-primary" />
        <p className="leading-relaxed">
          The <span className="font-bold">Exam Date</span>, <span className="font-bold">Status</span>, and{' '}
          <span className="font-bold">Mode</span> shown on the detail page are pulled automatically from your Vital Stats
          configuration above.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-page p-4">
        <div>
          <h4 className="text-sm font-bold text-heading">Exam Date Instructions</h4>
          <p className="mt-0.5 text-xs text-body-subtle">Optional note about the exam date.</p>
        </div>
        <ToggleSwitch
          checked={values.exam_date_instructions_enabled}
          onChange={(exam_date_instructions_enabled) => update('exam_date_instructions_enabled', exam_date_instructions_enabled)}
          label="Toggle exam date instructions"
        />
      </div>

      {values.exam_date_instructions_enabled && (
        <textarea
          value={values.exam_date_instructions_text}
          onChange={(e) => update('exam_date_instructions_text', e.target.value)}
          rows={3}
          placeholder="e.g. Please check your specific date on the downloaded admit card..."
          className="mt-3 w-full resize-none rounded-lg border border-input-border px-3 py-2 text-sm leading-relaxed focus:border-primary focus:outline-none"
        />
      )}
    </SectionCard>
  )
}

// --- Hero + Exam Date Live Preview ----------------------------------------------------------

function HeroAndExamDateLivePreview({ values }: { values: AdmitCardFormValues }) {
  const statusIcon = getIconByName(values.status_icon) ?? faBell
  const modeIcon = getIconByName(values.mode_icon) ?? faBell

  return (
    <div className="mx-auto flex w-full max-w-xs flex-col gap-4">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#5b54fa] to-primary p-5 shadow-[0_8px_24px_rgba(79,70,229,0.25)]">
        <div className="pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-white/15 blur-xl" />
        <div className="relative z-10">
          <p className="mb-1.5 text-sm font-bold leading-tight text-white">{values.commission_name_hero || 'Commission Name'}</p>
          <h1 className="text-xl font-extrabold leading-snug tracking-tight text-white">{values.title_hero || 'Exam Title Appears Here'}</h1>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-white p-4 text-center shadow-sm">
          <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary-gradient-from text-primary">
            <Icon icon={statusIcon} className="text-base" />
          </span>
          <h4 className="mb-1 text-sm font-bold text-body">Admit Card Status</h4>
          <span className="text-sm font-extrabold text-heading">{values.status_text || 'Status'}</span>
        </div>
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-white p-4 text-center shadow-sm">
          <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary-gradient-from text-primary">
            <Icon icon={modeIcon} className="text-base" />
          </span>
          <h4 className="mb-1 text-sm font-bold text-body">Exam Mode</h4>
          <span className="text-sm font-extrabold text-heading">{values.mode_text || 'Mode'}</span>
        </div>
      </div>

      <div className="flex flex-col items-center rounded-2xl border border-border bg-white p-5 text-center shadow-sm">
        <span className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-primary-gradient-from text-primary">
          <Icon icon={faCalendarCheck} className="text-base" />
        </span>
        <h4 className="mb-1 text-sm font-bold text-body">Exam Date</h4>
        <p className="text-xl font-extrabold leading-tight tracking-tight text-primary">
          {examDateLabel(values, formatDateLong, 'DD MMM YYYY')}
        </p>
        {values.exam_date_instructions_enabled && values.exam_date_instructions_text.trim() && (
          <p className="mt-4 w-full whitespace-pre-wrap rounded-xl border border-border bg-page p-3 text-left text-xs font-semibold leading-relaxed text-body">
            {values.exam_date_instructions_text}
          </p>
        )}
      </div>
    </div>
  )
}

// --- Important Instructions --------------------------------------------------------------

/** Parses `*bold*` and `_red_` inline markup into styled React nodes — never raw HTML, so
 * admin-entered text can't inject markup into the preview. */
function parseInlineMarkup(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const regex = /\*(.+?)\*|_(.+?)_/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let key = 0
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index))
    if (match[1] !== undefined) {
      nodes.push(
        <strong key={key++} className="font-extrabold text-heading">
          {match[1]}
        </strong>,
      )
    } else if (match[2] !== undefined) {
      nodes.push(
        <span key={key++} className="font-extrabold text-error">
          {match[2]}
        </span>,
      )
    }
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))
  return nodes
}

const MARKER_ICON: Record<InstructionPoint['marker'], typeof faCheckCircle> = {
  tick: faCheckCircle,
  dot: faCircleDot,
  warning: faTimesCircle,
}
const MARKER_COLOR: Record<InstructionPoint['marker'], string> = {
  tick: 'text-emerald-500',
  dot: 'text-body-subtle',
  warning: 'text-error',
}

function ImportantInstructionsEditor({
  value,
  onChange,
}: {
  value: AdmitCardFormValues['important_instructions']
  onChange: (value: AdmitCardFormValues['important_instructions']) => void
}) {
  const addPoint = () => {
    onChange({ ...value, points: [...value.points, { id: crypto.randomUUID(), marker: 'tick', text: '' }] })
  }
  const updatePoint = (id: string, patch: Partial<InstructionPoint>) => {
    onChange({ ...value, points: value.points.map((p) => (p.id === id ? { ...p, ...patch } : p)) })
  }
  const removePoint = (id: string) => {
    onChange({ ...value, points: value.points.filter((p) => p.id !== id) })
  }

  return (
    <SectionCard
      icon={faClipboardList}
      title="Important Instructions"
      badge={<ToggleSwitch checked={value.enabled} onChange={(enabled) => onChange({ ...value, enabled })} label="Toggle Important Instructions" />}
    >
      {!value.enabled ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-page py-8 text-center">
          <p className="text-sm font-bold text-heading">Section Hidden</p>
        </div>
      ) : (
        <>
          <EditableHeading value={value.heading} fallback="Important Instructions" onChange={(heading) => onChange({ ...value, heading })} />

          <div className="mb-4">
            <div className="mb-1.5 flex items-center justify-between">
              <span className="text-sm font-medium text-body">Subheading</span>
              <ToggleSwitch
                checked={value.subheading_enabled}
                onChange={(subheading_enabled) => onChange({ ...value, subheading_enabled })}
                label="Toggle subheading"
              />
            </div>
            {value.subheading_enabled && (
              <input
                type="text"
                value={value.subheading}
                onChange={(e) => onChange({ ...value, subheading: e.target.value })}
                className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
              />
            )}
          </div>

          <div className="mb-3 flex items-start gap-2 rounded-xl border border-border bg-page p-3 text-xs font-medium text-body">
            <Icon icon={faMagic} className="mt-0.5 shrink-0 text-primary" />
            <p className="leading-relaxed">
              Wrap text in <code className="rounded border border-border bg-white px-1 py-0.5">*asterisks*</code> for{' '}
              <strong className="font-extrabold">bold</strong> and{' '}
              <code className="rounded border border-border bg-white px-1 py-0.5">_underscores_</code> for{' '}
              <span className="font-extrabold text-error">red</span>.
            </p>
          </div>

          <div className="space-y-2">
            {value.points.map((point) => (
              <div key={point.id} className="flex items-start gap-2 rounded-xl border border-border bg-page p-2">
                <select
                  value={point.marker}
                  onChange={(e) => updatePoint(point.id, { marker: e.target.value as InstructionPoint['marker'] })}
                  className="w-20 shrink-0 rounded-lg border border-input-border bg-white px-2 py-2 text-xs focus:border-primary focus:outline-none"
                >
                  {MARKERS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
                <textarea
                  value={point.text}
                  onChange={(e) => updatePoint(point.id, { text: e.target.value })}
                  rows={2}
                  placeholder="Instruction point..."
                  className="min-h-[44px] flex-1 resize-none rounded-lg border border-input-border bg-white px-2 py-2 text-sm focus:border-primary focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => removePoint(point.id)}
                  aria-label="Remove instruction"
                  className="shrink-0 rounded-lg p-2 text-body-subtle hover:text-error"
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
    </SectionCard>
  )
}

function ImportantInstructionsLivePreview({ value }: { value: AdmitCardFormValues['important_instructions'] }) {
  if (!value.enabled) {
    return (
      <div className="mx-auto flex h-24 w-full max-w-xs flex-col items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-border bg-white text-center">
        <span className="text-xs font-bold text-body-subtle">Section Hidden</span>
      </div>
    )
  }

  const points = value.points.filter((p) => p.text.trim())

  return (
    <div className="mx-auto w-full max-w-xs rounded-2xl border border-border bg-white p-4 shadow-sm">
      <h3 className="mb-2 text-base font-bold text-heading">{value.heading || 'Important Instructions'}</h3>
      {value.subheading_enabled && value.subheading.trim() && <h4 className="mb-3 text-sm font-bold text-body">{value.subheading}</h4>}

      {points.length === 0 ? (
        <p className="text-sm italic text-body-subtle">Add points to preview...</p>
      ) : (
        <div className="flex flex-col gap-3">
          {points.map((point) => (
            <div key={point.id} className="flex items-start gap-2.5">
              <Icon icon={MARKER_ICON[point.marker]} className={clsx('mt-0.5 shrink-0 text-base', MARKER_COLOR[point.marker])} />
              <p className="text-sm font-medium leading-relaxed text-body">{parseInlineMarkup(point.text)}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
