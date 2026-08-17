import { useState, type ReactNode } from 'react'
import { faChevronDown, faEye } from '@fortawesome/free-solid-svg-icons'
import { Icon } from '@/components/ui/Icon'

interface LivePreviewPanelProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}

export function LivePreviewPanel({ title, children, defaultOpen = false }: LivePreviewPanelProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between border-b border-border bg-page px-4 py-3 text-left transition-colors hover:bg-primary-gradient-from"
      >
        <span className="flex items-center gap-2 text-sm font-extrabold text-heading">
          <Icon icon={faEye} className="text-primary" />
          Live Preview ({title})
        </span>
        <Icon icon={faChevronDown} className={`text-xs text-body-subtle transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="bg-page p-5">{children}</div>}
    </div>
  )
}
