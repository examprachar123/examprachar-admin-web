import { useState, type ReactNode } from 'react'
import { faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { Icon } from '@/components/ui/Icon'

interface LivePreviewPanelProps {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}

export function LivePreviewPanel({ title, children, defaultOpen = false }: LivePreviewPanelProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="mt-4 rounded-xl border border-primary-border-accent bg-primary-gradient-from">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-2.5 text-left"
      >
        <span className="text-xs font-semibold text-primary">Live Preview ({title})</span>
        <Icon icon={faChevronDown} className={`text-xs text-primary transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="border-t border-primary-border-accent bg-white p-4">{children}</div>}
    </div>
  )
}
