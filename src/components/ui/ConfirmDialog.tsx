import type { ReactNode } from 'react'

interface ConfirmDialogProps {
  open: boolean
  title: string
  description: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  destructive?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="w-full max-w-sm rounded-[20px] border-[1.5px] border-border bg-white p-6 shadow-xl">
        <h2 className="text-lg font-semibold text-heading">{title}</h2>
        <div className="mt-2 text-sm text-body-muted">{description}</div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-input-border px-4 py-2 text-sm font-medium text-body hover:bg-page"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={
              destructive
                ? 'rounded-lg bg-error px-4 py-2 text-sm font-medium text-white hover:opacity-90'
                : 'rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover'
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
