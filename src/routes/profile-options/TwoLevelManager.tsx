import { useState } from 'react'
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons'
import { Icon } from '@/components/ui/Icon'
import { ParentCategoryList } from '@/routes/profile-options/ParentCategoryList'
import { FlatOptionList } from '@/routes/profile-options/FlatOptionList'

export function TwoLevelManager({ levelId }: { levelId: number }) {
  const [selectedParent, setSelectedParent] = useState<{ id: number; name: string } | null>(null)

  if (!selectedParent) {
    return (
      <ParentCategoryList levelId={levelId} onSelectParent={(id, name) => setSelectedParent({ id, name })} />
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setSelectedParent(null)}
        className="mb-4 flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <Icon icon={faArrowLeft} className="text-xs" />
        Back to Parent Categories
      </button>
      <FlatOptionList
        resource={{ kind: 'children', parentId: selectedParent.id }}
        label={selectedParent.name}
        addPlaceholder="Add item..."
      />
    </div>
  )
}
