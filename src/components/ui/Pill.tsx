import type { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

interface PillProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  active?: boolean
}

export function Pill({ children, active = false, className, ...rest }: PillProps) {
  return (
    <button
      type="button"
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors duration-150',
        active
          ? 'border-primary bg-primary text-white'
          : 'border-border bg-white text-body hover:border-primary-border-accent',
        rest.disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
