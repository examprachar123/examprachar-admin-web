import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Pill } from '@/components/ui/Pill'
import { BroadcastEditor } from '@/components/broadcasts/BroadcastEditor'
import { TAG_SECTIONS, type TagSection } from '@/types/tags'
import type { BroadcastTarget } from '@/types/broadcasts'
import { useOrderedTags } from '@/hooks/useOrderedTags'
import { useStates } from '@/hooks/useStates'
import { usePscMapping } from '@/hooks/useTagsAdmin'

export function AllUpdatesBroadcastPanel() {
  const [section, setSection] = useState<TagSection>('latest_exam')
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null)
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null)

  const { data: tags = [] } = useOrderedTags(section)
  const { data: states = [] } = useStates()

  useEffect(() => {
    setSelectedTagId(null)
    setSelectedStateId(null)
  }, [section])

  const selectedTag = selectedTagId !== null ? tags.find((t) => t.id === selectedTagId) : undefined
  const isStateTag = selectedTag?.kind === 'state'

  let target: BroadcastTarget | null = null
  if (selectedTag?.kind === 'tag' && selectedTag.id !== null) {
    target = { kind: 'section-tag', section, tagId: selectedTag.id }
  } else if (isStateTag && selectedStateId !== null) {
    target = { kind: 'section-state', section, stateId: selectedStateId }
  }

  return (
    <div>
      <Card className="mb-5">
        <h2 className="mb-3 text-base font-semibold text-heading">Section</h2>
        <div className="flex flex-wrap gap-2">
          {TAG_SECTIONS.map((s) => (
            <Pill key={s.value} active={s.value === section} onClick={() => setSection(s.value)}>
              {s.label}
            </Pill>
          ))}
        </div>
      </Card>

      <Card className="mb-5">
        <h2 className="mb-3 text-base font-semibold text-heading">Target Audience</h2>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Pill
              key={tag.id}
              active={selectedTagId === tag.id}
              onClick={() => {
                setSelectedTagId(tag.id)
                setSelectedStateId(null)
              }}
            >
              {tag.label}
            </Pill>
          ))}
        </div>

        {isStateTag && (
          <StateDrillDown
            selectedStateId={selectedStateId}
            onSelect={setSelectedStateId}
            states={states}
          />
        )}
      </Card>

      {target && <BroadcastEditor key={JSON.stringify(target)} target={target} prefixWithGlobal />}
    </div>
  )
}

function StateDrillDown({
  selectedStateId,
  onSelect,
  states,
}: {
  selectedStateId: number | null
  onSelect: (id: number) => void
  states: { id: number; name: string }[]
}) {
  return (
    <div className="mt-4 border-t border-border pt-4">
      <p className="mb-2 text-xs font-medium text-body-subtle">Select State</p>
      <div className="flex flex-wrap gap-2">
        {states.map((state) => (
          <StatePill
            key={state.id}
            stateId={state.id}
            stateName={state.name}
            active={selectedStateId === state.id}
            onClick={() => onSelect(state.id)}
          />
        ))}
      </div>
    </div>
  )
}

function StatePill({
  stateId,
  stateName,
  active,
  onClick,
}: {
  stateId: number
  stateName: string
  active: boolean
  onClick: () => void
}) {
  const { data: mapping } = usePscMapping(stateId)
  return (
    <Pill active={active} onClick={onClick}>
      {stateName}
      {mapping?.commission_name ? ` • ${mapping.commission_name}` : ''}
    </Pill>
  )
}
