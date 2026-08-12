import { useState } from 'react'
import { faPen } from '@fortawesome/free-solid-svg-icons'
import { Icon } from '@/components/ui/Icon'

interface EditableHeadingProps {
  value: string
  /** Shown (and what actually gets saved as the effective heading) whenever value is blank. */
  fallback: string
  onChange: (value: string) => void
  maxLength?: number
}

/** A heading that defaults to `fallback` and reveals an input only once the user opts to customize it. */
export function EditableHeading({ value, fallback, onChange, maxLength }: EditableHeadingProps) {
  const [editing, setEditing] = useState(false)

  if (!editing) {
    return (
      <div className="mb-4 flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-body">
          Heading: <span className="font-semibold text-heading">{value.trim() || fallback}</span>
        </span>
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label="Edit heading"
          className="flex items-center gap-1 text-xs font-medium text-primary hover:underline"
        >
          <Icon icon={faPen} className="text-xs" />
          Edit
        </button>
      </div>
    )
  }

  return (
    <div className="mb-4">
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-sm font-medium text-body">Heading</label>
        <button type="button" onClick={() => setEditing(false)} className="text-xs font-medium text-primary hover:underline">
          Done
        </button>
      </div>
      <input
        type="text"
        autoFocus
        value={value}
        maxLength={maxLength}
        placeholder={fallback}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
      {maxLength !== undefined && (
        <p className="mt-1 text-right text-xs text-body-subtle">
          {value.length}/{maxLength}
        </p>
      )}
    </div>
  )
}
