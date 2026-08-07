import clsx from 'clsx'

export interface SegmentedToggleOption<T extends string> {
  value: T
  label: string
}

interface SegmentedToggleProps<T extends string> {
  options: SegmentedToggleOption<T>[]
  value: T
  onChange: (value: T) => void
  className?: string
}

export function SegmentedToggle<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedToggleProps<T>) {
  return (
    <div
      role="tablist"
      className={clsx('flex items-center gap-1 rounded-xl bg-border p-1', className)}
    >
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(option.value)}
            className={clsx(
              'flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors duration-150',
              active
                ? 'bg-white text-primary shadow-sm'
                : 'text-body-subtle hover:text-body',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
