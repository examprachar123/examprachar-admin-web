import { useMemo, useRef, useState } from 'react'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import clsx from 'clsx'
import { Icon } from '@/components/ui/Icon'
import { ICON_OPTIONS, getIconByName } from '@/lib/iconLibrary'
import { useClickOutside } from '@/hooks/useClickOutside'

interface IconPickerProps {
  value: string | null
  onChange: (name: string) => void
  label?: string
}

export function IconPicker({ value, onChange, label }: IconPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  useClickOutside(containerRef, () => setOpen(false))

  const filtered = useMemo(() => {
    if (!query.trim()) return ICON_OPTIONS
    const q = query.trim().toLowerCase()
    return ICON_OPTIONS.filter((opt) => opt.name.includes(q))
  }, [query])

  const selectedIcon = getIconByName(value)

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={label ?? 'Choose icon'}
        className="flex items-center gap-2 rounded-lg border border-input-border bg-white px-3 py-2 text-sm text-body hover:border-primary-border-accent"
      >
        {selectedIcon ? <Icon icon={selectedIcon} className="text-primary" /> : <span className="text-body-subtle">No icon</span>}
        <Icon icon={faChevronDown} className="text-xs text-body-subtle" />
      </button>

      {open && (
        <div className="absolute z-40 mt-2 w-64 rounded-xl border border-border bg-white p-3 shadow-lg">
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search icons..."
            className="mb-3 w-full rounded-lg border border-input-border px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
          />
          <div className="grid max-h-48 grid-cols-6 gap-1.5 overflow-y-auto">
            {filtered.map((opt) => (
              <button
                key={opt.name}
                type="button"
                title={opt.name}
                onClick={() => {
                  onChange(opt.name)
                  setOpen(false)
                  setQuery('')
                }}
                className={clsx(
                  'flex h-9 w-9 items-center justify-center rounded-lg text-body hover:bg-primary-gradient-from',
                  value === opt.name && 'bg-primary-gradient-to text-primary',
                )}
              >
                <Icon icon={opt.icon} />
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-6 py-4 text-center text-xs text-body-subtle">No icons found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
