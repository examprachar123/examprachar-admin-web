import { useEffect, useState } from 'react'
import { faSlidersH } from '@fortawesome/free-solid-svg-icons'
import { AppShell } from '@/components/layout/AppShell'
import { Icon } from '@/components/ui/Icon'
import { Pill } from '@/components/ui/Pill'
import { LEVEL_COPY_OVERRIDES } from '@/types/profileOptions'
import { useQualificationLevels } from '@/hooks/useProfileOptions'
import { TwoLevelManager } from '@/routes/profile-options/TwoLevelManager'
import { FlatOptionList } from '@/routes/profile-options/FlatOptionList'
import { LevelManager } from '@/routes/profile-options/LevelManager'

export function ProfileOptionsPage() {
  const { data: levels = [], isLoading } = useQualificationLevels()
  const [levelId, setLevelId] = useState<number | null>(null)
  const [showLevelManager, setShowLevelManager] = useState(false)

  const sortedLevels = [...levels].sort((a, b) => a.order - b.order)

  useEffect(() => {
    if (sortedLevels.length === 0) return
    // Also re-selects when the active level was just deleted (now missing from the list).
    if (levelId === null || !sortedLevels.some((l) => l.id === levelId)) {
      setLevelId(sortedLevels[0].id)
    }
  }, [sortedLevels, levelId])

  const activeLevel = sortedLevels.find((l) => l.id === levelId)
  const overrides = activeLevel ? LEVEL_COPY_OVERRIDES[activeLevel.name] : undefined

  return (
    <AppShell title="Manage Profile Options" showBack>
      {isLoading && <p className="py-4 text-sm text-body-subtle">Loading...</p>}

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {sortedLevels.map((l) => (
          <Pill key={l.id} active={l.id === levelId} onClick={() => setLevelId(l.id)}>
            {l.name}
          </Pill>
        ))}
        <button
          type="button"
          onClick={() => setShowLevelManager(true)}
          aria-label="Manage qualification levels"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-white text-body-subtle hover:border-primary-border-accent hover:text-primary"
        >
          <Icon icon={faSlidersH} className="text-xs" />
        </button>
      </div>

      {showLevelManager && <LevelManager onClose={() => setShowLevelManager(false)} />}

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
