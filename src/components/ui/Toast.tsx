import { faCheckCircle, faCircleExclamation, faCircleInfo } from '@fortawesome/free-solid-svg-icons'
import { useToast, type ToastVariant } from '@/context/ToastContext'
import { Icon } from '@/components/ui/Icon'

const VARIANT_ICON = {
  success: faCheckCircle,
  error: faCircleExclamation,
  info: faCircleInfo,
} satisfies Record<ToastVariant, unknown>

export function ToastViewport() {
  const { toasts, dismissToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 z-50 flex -translate-x-1/2 flex-col items-center gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          onClick={() => dismissToast(toast.id)}
          className="flex animate-[toast-in_0.2s_ease-out] cursor-pointer items-center gap-2.5 rounded-xl bg-toast px-4 py-3 text-sm text-white shadow-lg"
        >
          <Icon
            icon={VARIANT_ICON[toast.variant] as never}
            className={
              toast.variant === 'success'
                ? 'text-emerald-400'
                : toast.variant === 'error'
                  ? 'text-error'
                  : 'text-primary-border-accent'
            }
          />
          <span>{toast.message}</span>
        </div>
      ))}
    </div>
  )
}
