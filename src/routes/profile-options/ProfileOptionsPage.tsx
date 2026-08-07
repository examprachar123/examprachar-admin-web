import { useEffect, useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { Pill } from '@/components/ui/Pill'
import { LEVEL_COPY_OVERRIDES } from '@/types/profileOptions'
import { useQualificationLevels } from '@/hooks/useProfileOptions'
import { TwoLevelManager } from '@/routes/profile-options/TwoLevelManager'
import { FlatOptionList } from '@/routes/profile-options/FlatOptionList'

export function ProfileOptionsPage() {
  const { data: levels = [], isLoading } = useQualificationLevels()
  const [levelId, setLevelId] = useState<number | null>(null)

  const sortedLevels = [...levels].sort((a, b) => a.order - b.order)

  useEffect(() => {
    if (levelId === null && sortedLevels.length > 0) {
      setLevelId(sortedLevels[0].id)
    }
  }, [sortedLevels, levelId])

  const activeLevel = sortedLevels.find((l) => l.id === levelId)
  const overrides = activeLevel ? LEVEL_COPY_OVERRIDES[activeLevel.name] : undefined

  return (
    <AppShell title="Manage Profile Options" showBack>
      {isLoading && <p className="py-4 text-sm text-body-subtle">Loading...</p>}

      <div className="mb-6 flex flex-wrap gap-2">
        {sortedLevels.map((l) => (
          <Pill key={l.id} active={l.id === levelId} onClick={() => setLevelId(l.id)}>
            {l.name}
          </Pill>
        ))}
      </div>

      {activeLevel?.structure === 'two_level' && <TwoLevelManager key={activeLevel.id} levelId={activeLevel.id} />}

      {activeLevel?.structure === 'one_level' && (
        <FlatOptionList
          key={activeLevel.id}
          resource={{ kind: 'options', levelId: activeLevel.id }}
          label={overrides?.flatListLabel ?? activeLevel.name}
          addPlaceholder={`Add ${(overrides?.itemLabel ?? activeLevel.name).toLowerCase()}...`}
        />
      )}

      {activeLevel?.structure === 'none' && (
        <p className="py-8 text-center text-sm text-body-subtle">
          {activeLevel.name} has no further qualification breakdown to manage.
        </p>
      )}
    </AppShell>
  )
}
