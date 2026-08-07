import type { ReactNode } from 'react'
import { Header } from '@/components/layout/Header'

interface AppShellProps {
  title: string
  showBack?: boolean
  onBack?: () => void
  children: ReactNode
}

export function AppShell({ title, showBack, onBack, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-page">
      <Header title={title} showBack={showBack} onBack={onBack} />
      <main className="mx-auto max-w-[800px] px-6 py-8">{children}</main>
    </div>
  )
}
