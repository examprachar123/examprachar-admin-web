import { faChevronDown, faChevronUp, faPlus } from '@fortawesome/free-solid-svg-icons'
import { faTrashCan } from '@fortawesome/free-regular-svg-icons'
import { Icon } from '@/components/ui/Icon'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'
import { SegmentedToggle } from '@/components/ui/SegmentedToggle'
import { emptyPostWiseEntry, type PostWiseEntry } from '@/types/posts/latestExam'

interface PostWiseDetailsModalProps {
  value: PostWiseEntry[]
  onChange: (value: PostWiseEntry[]) => void
  onClose: () => void
}

export function PostWiseDetailsModal({ value, onChange, onClose }: PostWiseDetailsModalProps) {
  const update = (id: string, patch: Partial<PostWiseEntry>) => {
    onChange(value.map((e) => (e.id === id ? { ...e, ...patch } : e)))
  }
  const remove = (id: string) => onChange(value.filter((e) => e.id !== id))
  const add = () => onChange([...value, emptyPostWiseEntry()])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-8">
      <div className="flex max-h-full w-full max-w-2xl flex-col rounded-[20px] border-[1.5px] border-border bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <h2 className="text-base font-semibold text-heading">Post-Wise Details</h2>
          <button type="button" onClick={onClose} className="text-sm font-medium text-primary hover:underline">
            Done
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
          {value.map((entry, index) => (
            <PostEntryCard
              key={entry.id}
              index={index}
              entry={entry}
              onUpdate={(patch) => update(entry.id, patch)}
              onRemove={() => remove(entry.id)}
            />
          ))}

          {value.length === 0 && (
            <p className="py-6 text-center text-sm text-body-subtle">No posts configured yet.</p>
          )}

          <button
            type="button"
            onClick={add}
            className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-input-border py-2.5 text-sm font-medium text-body-subtle hover:border-primary-border-accent hover:text-primary"
          >
            <Icon icon={faPlus} className="text-xs" />
            Add Post
          </button>
        </div>
      </div>
    </div>
  )
}

function PostEntryCard({
  index,
  entry,
  onUpdate,
  onRemove,
}: {
  index: number
  entry: PostWiseEntry
  onUpdate: (patch: Partial<PostWiseEntry>) => void
  onRemove: () => void
}) {
  const addCategoryRow = () => {
    onUpdate({ category_wise_vacancy: [...entry.category_wise_vacancy, { label: '', count: 0 }] })
  }
  const updateCategoryRow = (index: number, patch: Partial<{ label: string; count: number }>) => {
    onUpdate({
      category_wise_vacancy: entry.category_wise_vacancy.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    })
  }
  const removeCategoryRow = (index: number) => {
    onUpdate({ category_wise_vacancy: entry.category_wise_vacancy.filter((_, i) => i !== index) })
  }

  return (
    <div className="rounded-xl border border-border p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-sm font-semibold text-heading">Post {index + 1}</span>
        <button type="button" onClick={onRemove} aria-label={`Remove post ${index + 1}`} className="text-body-subtle hover:text-error">
          <Icon icon={faTrashCan} className="text-xs" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <LabeledInput label="Post Name" value={entry.post_name} onChange={(v) => onUpdate({ post_name: v })} full />
        <LabeledInput label="Education Level" value={entry.education_level} onChange={(v) => onUpdate({ education_level: v })} />
        <LabeledInput label="Pay Scale" value={entry.pay_scale} onChange={(v) => onUpdate({ pay_scale: v })} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <ModeValueField
          label="Age Limit"
          modeOptions={[
            { value: 'single', label: 'Single' },
            { value: 'range', label: 'Range' },
            { value: 'text', label: 'Text' },
          ]}
          mode={entry.age_limit.mode}
          value={entry.age_limit.value}
          onChange={(patch) => onUpdate({ age_limit: { ...entry.age_limit, ...patch } })}
        />
        <ModeValueField
          label="Vacancy"
          modeOptions={[
            { value: 'number', label: 'Number' },
            { value: 'text', label: 'Text' },
          ]}
          mode={entry.vacancy.mode}
          value={entry.vacancy.value}
          onChange={(patch) => onUpdate({ vacancy: { ...entry.vacancy, ...patch } })}
        />
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg bg-page px-3 py-2">
        <span className="text-sm font-medium text-body">Experience Required</span>
        <ToggleSwitch
          checked={entry.experience_required}
          onChange={(experience_required) => onUpdate({ experience_required })}
          label="Toggle experience required"
        />
      </div>
      {entry.experience_required && (
        <div className="mt-2">
          <LabeledInput
            label="Experience Details"
            value={entry.experience_details}
            onChange={(v) => onUpdate({ experience_details: v })}
            full
          />
        </div>
      )}

      <button
        type="button"
        onClick={() => onUpdate({ detailsExpanded: !entry.detailsExpanded })}
        className="mt-3 flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-sm font-medium text-body hover:bg-page"
      >
        Post Details &amp; Eligibility
        <Icon icon={entry.detailsExpanded ? faChevronUp : faChevronDown} className="text-xs text-body-subtle" />
      </button>
      {entry.detailsExpanded && (
        <div className="mt-2 space-y-2">
          <TextAreaField label="Post Details" value={entry.post_details} onChange={(v) => onUpdate({ post_details: v })} />
          <TextAreaField label="Education Details" value={entry.education_details} onChange={(v) => onUpdate({ education_details: v })} />
          <TextAreaField label="Department Info" value={entry.department_info} onChange={(v) => onUpdate({ department_info: v })} />

          <div>
            <label className="mb-1 block text-xs font-medium text-body-subtle">Additional Details Heading</label>
            <input
              type="text"
              value={entry.additional_details.heading}
              onChange={(e) => onUpdate({ additional_details: { ...entry.additional_details, heading: e.target.value } })}
              className="mb-2 w-full rounded-lg border border-input-border px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
            />
            <TextAreaField
              label="Additional Details Content"
              value={entry.additional_details.content}
              onChange={(v) => onUpdate({ additional_details: { ...entry.additional_details, content: v } })}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-body-subtle">Category-Wise Vacancy</label>
            <div className="space-y-1.5">
              {entry.category_wise_vacancy.map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={row.label}
                    onChange={(e) => updateCategoryRow(i, { label: e.target.value })}
                    placeholder="Category"
                    className="flex-1 rounded-lg border border-input-border px-2 py-1 text-sm focus:border-primary focus:outline-none"
                  />
                  <input
                    type="number"
                    value={row.count}
                    onChange={(e) => updateCategoryRow(i, { count: Number(e.target.value) })}
                    className="w-20 rounded-lg border border-input-border px-2 py-1 text-sm focus:border-primary focus:outline-none"
                  />
                  <button type="button" onClick={() => removeCategoryRow(i)} className="text-body-subtle hover:text-error">
                    <Icon icon={faTrashCan} className="text-xs" />
                  </button>
                </div>
              ))}
            </div>
            <button type="button" onClick={addCategoryRow} className="mt-1.5 text-xs font-medium text-primary hover:underline">
              + Add Category
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function LabeledInput({
  label,
  value,
  onChange,
  full,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  full?: boolean
}) {
  return (
    <div className={full ? 'col-span-2' : undefined}>
      <label className="mb-1 block text-xs font-medium text-body-subtle">{label}</label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-input-border px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
      />
    </div>
  )
}

function TextAreaField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-body-subtle">{label}</label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full resize-none rounded-lg border border-input-border px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
      />
    </div>
  )
}

function ModeValueField<TMode extends string>({
  label,
  modeOptions,
  mode,
  value,
  onChange,
}: {
  label: string
  modeOptions: { value: TMode; label: string }[]
  mode: TMode
  value: string
  onChange: (patch: { mode: TMode; value: string }) => void
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-body-subtle">{label}</label>
      <SegmentedToggle options={modeOptions} value={mode} onChange={(m) => onChange({ mode: m, value })} className="mb-1.5" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange({ mode, value: e.target.value })}
        className="w-full rounded-lg border border-input-border px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
      />
    </div>
  )
}
