import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

export type ToastVariant = 'success' | 'error' | 'info'

export interface ToastItem {
  id: number
  message: string
  variant: ToastVariant
}

interface ToastContextValue {
  toasts: ToastItem[]
  showToast: (message: string, variant?: ToastVariant) => void
  dismissToast: (id: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const AUTO_DISMISS_MS = 3200

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const nextId = useRef(0)

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback(
    (message: string, variant: ToastVariant = 'info') => {
      const id = nextId.current++
      setToasts((prev) => [...prev, { id, message, variant }])
      setTimeout(() => dismissToast(id), AUTO_DISMISS_MS)
    },
    [dismissToast],
  )

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return ctx
}
