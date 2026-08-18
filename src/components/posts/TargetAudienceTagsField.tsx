import { Pill } from '@/components/ui/Pill'
import { HorizontalScroller } from '@/components/ui/HorizontalScroller'
import { useOrderedTags } from '@/hooks/useOrderedTags'
import { useStates } from '@/hooks/useStates'
import { usePscMapping } from '@/hooks/useTagsAdmin'
import type { AudienceTagKey, TargetAudienceFieldProps } from '@/types/postCommon'
import type { OrderedTag } from '@/types/tags'

function tagKey(tag: OrderedTag): AudienceTagKey {
  if (tag.kind === 'top') return 'top'
  if (tag.kind === 'state') return 'state'
  return `tag:${tag.id as number}`
}

export function TargetAudienceTagsField({ section, value, onChange, error }: TargetAudienceFieldProps) {
  const { data: tags = [], isLoading } = useOrderedTags(section)
  const { data: states = [] } = useStates()

  const hasState = value.selectedKeys.includes('state')

  const toggleTag = (key: AudienceTagKey) => {
    const selected = value.selectedKeys.includes(key)
    const nextKeys = selected
      ? value.selectedKeys.filter((k) => k !== key)
      : [...value.selectedKeys, key]
    const nextStateIds = key === 'state' && selected ? [] : value.stateIds
    onChange({ selectedKeys: nextKeys, stateIds: nextStateIds })
  }

  const toggleState = (stateId: number) => {
    const selected = value.stateIds.includes(stateId)
    onChange({
      ...value,
      stateIds: selected ? value.stateIds.filter((id) => id !== stateId) : [...value.stateIds, stateId],
    })
  }

  return (
    <div>
      <h3 className="mb-2 text-sm font-semibold text-heading">
        Target Audience Tags <span className="text-error">*</span>
      </h3>

      {isLoading && <p className="text-sm text-body-subtle">Loading tags...</p>}

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const key = tagKey(tag)
          return (
            <Pill key={key} active={value.selectedKeys.includes(key)} onClick={() => toggleTag(key)}>
              {tag.label}
            </Pill>
          )
        })}
      </div>

      {value.selectedKeys.length === 0 && error && <p className="mt-1.5 text-xs text-error">{error}</p>}

      {hasState && (
        <div className="mt-4 rounded-xl border border-border bg-page p-3">
          <p className="mb-2 text-xs font-medium text-body-subtle">
            Select State{states.length > 1 ? 's' : ''} <span className="text-error">*</span>
          </p>
          <HorizontalScroller>
            {states.map((state) => (
              <StatePill
                key={state.id}
                stateId={state.id}
                stateName={state.name}
                active={value.stateIds.includes(state.id)}
                onClick={() => toggleState(state.id)}
              />
            ))}
          </HorizontalScroller>
          {value.stateIds.length === 0 && error && <p className="mt-1.5 text-xs text-error">{error}</p>}
        </div>
      )}
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
    <Pill active={active} onClick={onClick} className="shrink-0 whitespace-nowrap">
      {stateName}
      {mapping?.commission_name ? ` • ${mapping.commission_name}` : ''}
    </Pill>
  )
}
