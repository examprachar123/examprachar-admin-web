import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { SegmentedToggle } from '@/components/ui/SegmentedToggle'
import { AppWideBroadcastPanel } from '@/routes/broadcasts/AppWideBroadcastPanel'
import { AllUpdatesBroadcastPanel } from '@/routes/broadcasts/AllUpdatesBroadcastPanel'

const SCOPES = [
  { value: 'app-wide', label: 'App-Wide' },
  { value: 'all-updates', label: 'All Updates' },
] as const

export function BroadcastsPage() {
  const [scope, setScope] = useState<(typeof SCOPES)[number]['value']>('all-updates')

  return (
    <AppShell title="Manage Broadcasts" showBack>
      <SegmentedToggle options={[...SCOPES]} value={scope} onChange={setScope} className="mb-6" />
      {scope === 'app-wide' ? <AppWideBroadcastPanel /> : <AllUpdatesBroadcastPanel />}
    </AppShell>
  )
}
