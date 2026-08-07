import type { HTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  interactive?: boolean
}

export function Card({ children, interactive = false, className, ...rest }: CardProps) {
  return (
    <div
      className={clsx(
        'rounded-[20px] border-[1.5px] border-border bg-white p-6',
        'shadow-[0_4px_12px_rgba(79,70,229,0.04)]',
        interactive && 'transition-transform duration-200 hover:-translate-y-0.5 hover:border-primary-border-accent cursor-pointer',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  )
}
