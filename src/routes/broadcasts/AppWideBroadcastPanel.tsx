import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Pill } from '@/components/ui/Pill'
import { BroadcastEditor } from '@/components/broadcasts/BroadcastEditor'
import type { BroadcastTarget } from '@/types/broadcasts'

const GLOBAL_TARGETS: { kind: 'intro' | 'global'; label: string }[] = [
  { kind: 'intro', label: 'Intro Screen' },
  { kind: 'global', label: 'Global (All Users)' },
]

export function AppWideBroadcastPanel() {
  const [selected, setSelected] = useState<'intro' | 'global'>('global')
  const target: BroadcastTarget = { kind: selected }

  return (
    <div>
      <Card className="mb-5">
        <h2 className="mb-3 text-base font-semibold text-heading">Select Global Target</h2>
        <div className="flex gap-2">
          {GLOBAL_TARGETS.map((t) => (
            <Pill key={t.kind} active={selected === t.kind} onClick={() => setSelected(t.kind)}>
              {t.label}
            </Pill>
          ))}
        </div>
      </Card>

      <BroadcastEditor key={selected} target={target} prefixWithGlobal={false} />
    </div>
  )
}
