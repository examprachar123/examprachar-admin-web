import { faSearch } from '@fortawesome/free-solid-svg-icons'
import type { InputHTMLAttributes } from 'react'
import clsx from 'clsx'
import { Icon } from '@/components/ui/Icon'

interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'onChange' | 'className'> {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
  className,
  ...rest
}: SearchInputProps) {
  return (
    <div className={clsx('relative', className)}>
      <Icon icon={faSearch} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-body-subtle" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-input-border bg-white py-2.5 pl-10 pr-4 text-sm text-body placeholder:text-body-subtle focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-border-accent"
        {...rest}
      />
    </div>
  )
}
