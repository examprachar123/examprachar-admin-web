import type { ReactNode } from 'react'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'
import clsx from 'clsx'
import { Icon } from '@/components/ui/Icon'

interface SectionCardProps {
  icon: IconDefinition
  title: string
  /** Right-aligned slot in the header row — typically a ToggleSwitch + label. */
  badge?: ReactNode
  error?: boolean
  children: ReactNode
}

export function SectionCard({ icon, title, badge, error, children }: SectionCardProps) {
  return (
    <div className={clsx('rounded-2xl border bg-white p-5 shadow-sm', error ? 'border-error' : 'border-border')}>
      <div className="mb-5 flex items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <h2 className="flex items-center gap-2 text-sm font-extrabold uppercase tracking-tight text-heading">
          <Icon icon={icon} className="text-primary" />
          {title}
        </h2>
        {badge}
      </div>
      {children}
    </div>
  )
}
