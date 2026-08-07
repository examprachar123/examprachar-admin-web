import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { SegmentedToggle } from '@/components/ui/SegmentedToggle'
import { AppWideTagsPanel } from '@/routes/tags/AppWideTagsPanel'
import { AllUpdatesTagsPanel } from '@/routes/tags/AllUpdatesTagsPanel'

const SCOPES = [
  { value: 'app-wide', label: 'App-Wide' },
  { value: 'all-updates', label: 'All Updates' },
] as const

export function TagsPage() {
  const [scope, setScope] = useState<(typeof SCOPES)[number]['value']>('app-wide')

  return (
    <AppShell title="Manage Tags" showBack>
      <SegmentedToggle options={[...SCOPES]} value={scope} onChange={setScope} className="mb-6" />
      {scope === 'app-wide' ? <AppWideTagsPanel /> : <AllUpdatesTagsPanel />}
    </AppShell>
  )
}
