import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { faTimes } from '@fortawesome/free-solid-svg-icons'
import { Pill } from '@/components/ui/Pill'
import { Icon } from '@/components/ui/Icon'
import { useStates } from '@/hooks/useStates'
import { useQualificationLevels } from '@/hooks/useProfileOptions'
import { qualificationChildrenApi, qualificationOptionsApi } from '@/api/profileOptionsApi'
import { qualificationParentsApi } from '@/api/profileOptionsApi'
import type { PersonalizedTargetingValue, QualificationChip } from '@/types/postCommon'
import type { QualificationLevel } from '@/types/profileOptions'

const GENDERS: { value: PersonalizedTargetingValue['gender']; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
]

interface PersonalizedTargetingFieldProps {
  value: PersonalizedTargetingValue
  onChange: (value: PersonalizedTargetingValue) => void
}

export function PersonalizedTargetingField({ value, onChange }: PersonalizedTargetingFieldProps) {
  const { data: states = [] } = useStates()
  const [addingQualification, setAddingQualification] = useState(false)

  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-heading">Region</h3>
        <div className="flex flex-wrap gap-2">
          <Pill
            active={value.region === 'all-india'}
            onClick={() => onChange({ ...value, region: 'all-india' })}
          >
            All India
          </Pill>
          {states.map((state) => (
            <Pill
              key={state.id}
              active={typeof value.region === 'object' && value.region.stateId === state.id}
              onClick={() => onChange({ ...value, region: { stateId: state.id } })}
            >
              {state.name}
            </Pill>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-heading">Gender</h3>
        <div className="flex flex-wrap gap-2">
          {GENDERS.map((g) => (
            <Pill key={g.value} active={value.gender === g.value} onClick={() => onChange({ ...value, gender: g.value })}>
              {g.label}
            </Pill>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-heading">Qualification</h3>
        {value.qualifications.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {value.qualifications.map((chip) => (
              <QualificationChipView
                key={chip.id}
                chip={chip}
                onRemove={() =>
                  onChange({ ...value, qualifications: value.qualifications.filter((c) => c.id !== chip.id) })
                }
              />
            ))}
          </div>
        )}
        {value.qualifications.length > 0 && (
          <p className="mb-2 text-xs text-body-subtle">
            Any one of these qualifies a user — not a combination.
          </p>
        )}

        {addingQualification ? (
          <AddQualificationPanel
            onAdd={(chip) => {
              onChange({ ...value, qualifications: [...value.qualifications, chip] })
              setAddingQualification(false)
            }}
            onCancel={() => setAddingQualification(false)}
          />
        ) : (
          <button
            type="button"
            onClick={() => setAddingQualification(true)}
            className="rounded-lg border border-dashed border-input-border px-3.5 py-1.5 text-sm font-medium text-body-subtle hover:border-primary-border-accent hover:text-primary"
          >
            + Add Qualification
          </button>
        )}
      </div>
    </div>
  )
}

function QualificationChipView({ chip, onRemove }: { chip: QualificationChip; onRemove: () => void }) {
  let text = chip.levelName
  if (chip.mode === 'parent-child') {
    text += ` › ${chip.parentName}`
    if (chip.childName) text += ` › ${chip.childName}`
  } else if (chip.mode === 'flat') {
    text += ` › ${chip.optionName}`
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-gradient-from px-3 py-1.5 text-sm font-medium text-primary">
      {text}
      <button type="button" onClick={onRemove} aria-label={`Remove ${text}`}>
        <Icon icon={faTimes} className="text-xs" />
      </button>
    </span>
  )
}

function AddQualificationPanel({
  onAdd,
  onCancel,
}: {
  onAdd: (chip: QualificationChip) => void
  onCancel: () => void
}) {
  const { data: levels = [] } = useQualificationLevels()
  const [level, setLevel] = useState<QualificationLevel | null>(null)
  const [parentId, setParentId] = useState<number | null>(null)

  const { data: parents = [] } = useQuery({
    queryKey: ['qualification-parents', level?.id],
    queryFn: () => qualificationParentsApi.list(level!.id),
    enabled: level?.structure === 'two_level',
  })
  const { data: children = [] } = useQuery({
    queryKey: ['qualification-children', parentId],
    queryFn: () => qualificationChildrenApi.list(parentId!),
    enabled: parentId !== null,
  })
  const { data: options = [] } = useQuery({
    queryKey: ['qualification-options', level?.id],
    queryFn: () => qualificationOptionsApi.list(level!.id),
    enabled: level?.structure === 'one_level',
  })

  const makeId = () => crypto.randomUUID()

  return (
    <div className="mt-2 rounded-xl border border-border bg-page p-4">
      {!level && (
        <>
          <p className="mb-2 text-xs font-medium text-body-subtle">Choose a level</p>
          <div className="flex flex-wrap gap-2">
            {levels.map((l) => (
              <Pill key={l.id} onClick={() => setLevel(l)}>
                {l.name}
              </Pill>
            ))}
          </div>
        </>
      )}

      {level && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm font-medium text-heading">{level.name}</p>
            <button type="button" onClick={() => setLevel(null)} className="text-xs text-primary hover:underline">
              Change level
            </button>
          </div>

          <button
            type="button"
            onClick={() => onAdd({ id: makeId(), levelId: level.id, levelName: level.name, mode: 'whole-level' })}
            className="mb-3 w-full rounded-lg border border-input-border py-2 text-sm font-medium text-body hover:bg-white"
          >
            Target entire {level.name}
          </button>

          {level.structure === 'two_level' && !parentId && (
            <div className="flex flex-wrap gap-2">
              {parents.map((p) => (
                <Pill key={p.id} onClick={() => setParentId(p.id)}>
                  {p.name}
                </Pill>
              ))}
            </div>
          )}

          {level.structure === 'two_level' && parentId && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-medium text-body-subtle">
                  {parents.find((p) => p.id === parentId)?.name}
                </p>
                <button type="button" onClick={() => setParentId(null)} className="text-xs text-primary hover:underline">
                  Change
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  const parent = parents.find((p) => p.id === parentId)!
                  onAdd({
                    id: makeId(),
                    levelId: level.id,
                    levelName: level.name,
                    mode: 'parent-child',
                    parentId: parent.id,
                    parentName: parent.name,
                    childId: null,
                    childName: null,
                  })
                }}
                className="mb-2 w-full rounded-lg border border-input-border py-2 text-sm font-medium text-body hover:bg-white"
              >
                Target any {parents.find((p) => p.id === parentId)?.name}
              </button>
              <div className="flex flex-wrap gap-2">
                {children.map((c) => (
                  <Pill
                    key={c.id}
                    onClick={() => {
                      const parent = parents.find((p) => p.id === parentId)!
                      onAdd({
                        id: makeId(),
                        levelId: level.id,
                        levelName: level.name,
                        mode: 'parent-child',
                        parentId: parent.id,
                        parentName: parent.name,
                        childId: c.id,
                        childName: c.name,
                      })
                    }}
                  >
                    {c.name}
                  </Pill>
                ))}
              </div>
            </div>
          )}

          {level.structure === 'one_level' && (
            <div className="flex flex-wrap gap-2">
              {options.map((o) => (
                <Pill
                  key={o.id}
                  onClick={() =>
                    onAdd({
                      id: makeId(),
                      levelId: level.id,
                      levelName: level.name,
                      mode: 'flat',
                      optionId: o.id,
                      optionName: o.name,
                    })
                  }
                >
                  {o.name}
                </Pill>
              ))}
            </div>
          )}
        </div>
      )}

      <button type="button" onClick={onCancel} className="mt-3 text-xs text-body-subtle hover:text-body">
        Cancel
      </button>
    </div>
  )
}
