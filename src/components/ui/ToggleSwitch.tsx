import clsx from 'clsx'

interface ToggleSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  label?: string
}

export function ToggleSwitch({ checked, onChange, disabled = false, label }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative inline-flex h-[24px] w-[44px] shrink-0 items-center rounded-full transition-colors duration-300',
        checked ? 'bg-primary' : 'bg-body-subtle/40',
        disabled && 'cursor-not-allowed opacity-50',
      )}
    >
      <span
        className={clsx(
          'inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow transition-transform duration-300',
          checked ? 'translate-x-[23px]' : 'translate-x-[3px]',
        )}
      />
    </button>
  )
}
