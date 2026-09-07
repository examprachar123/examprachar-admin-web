import { useState } from 'react'
import { faArrowDown, faArrowUp, faTimes } from '@fortawesome/free-solid-svg-icons'
import { faTrashCan } from '@fortawesome/free-regular-svg-icons'
import { Icon } from '@/components/ui/Icon'
import { SegmentedToggle } from '@/components/ui/SegmentedToggle'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/context/ToastContext'
import { ApiError } from '@/lib/apiClient'
import {
  useConfirmDeleteQualificationLevel,
  useCreateQualificationLevel,
  useDeleteQualificationLevel,
  useMoveQualificationLevel,
  useQualificationLevels,
} from '@/hooks/useProfileOptions'
import type { QualificationStructure } from '@/types/profileOptions'

const STRUCTURE_OPTIONS: { value: QualificationStructure; label: string }[] = [
  { value: 'two_level', label: 'Two Level' },
  { value: 'one_level', label: 'One Level' },
  { value: 'none', label: 'None' },
]

const STRUCTURE_LABEL: Record<QualificationStructure, string> = {
  two_level: 'Two Level',
  one_level: 'One Level',
  none: 'None',
}

interface LevelManagerProps {
  onClose: () => void
}

export function LevelManager({ onClose }: LevelManagerProps) {
  const { data: levels = [], isLoading } = useQualificationLevels()
  const createLevel = useCreateQualificationLevel()
  const deleteLevel = useDeleteQualificationLevel()
  const confirmDeleteLevel = useConfirmDeleteQualificationLevel()
  const moveLevel = useMoveQualificationLevel()
  const { showToast } = useToast()

  const [newName, setNewName] = useState('')
  const [newStructure, setNewStructure] = useState<QualificationStructure>('two_level')
  const [pendingDelete, setPendingDelete] = useState<{ id: number; name: string; dependentCount: number } | null>(
    null,
  )

  const sorted = [...levels].sort((a, b) => a.order - b.order)

  const handleCreate = () => {
    const trimmed = newName.trim()
    if (!trimmed) {
      showToast('Please enter a level name.', 'error')
      return
    }
    createLevel.mutate(
      { name: trimmed, structure: newStructure },
      {
        onSuccess: () => setNewName(''),
        onError: (err) => showToast(err instanceof ApiError ? err.message : 'Could not add level. Please try again.', 'error'),
      },
    )
  }

  const handleMove = (id: number, direction: 'up' | 'down') => {
    moveLevel.mutate(
      { id, direction },
      {
        onError: (err) => showToast(err instanceof ApiError ? err.message : 'Could not reorder level. Please try again.', 'error'),
      },
    )
  }

  const handleDeleteClick = (level: { id: number; name: string }) => {
    deleteLevel.mutate(level.id, {
      onSuccess: (result) => setPendingDelete({ id: level.id, name: level.name, dependentCount: result.dependent_count }),
      onError: (err) =>
        showToast(err instanceof ApiError ? err.message : 'Could not check this level. Please try again.', 'error'),
    })
  }

  const handleConfirmDelete = () => {
    if (!pendingDelete) return
    confirmDeleteLevel.mutate(pendingDelete.id, {
      onSuccess: () => showToast('Level deleted.', 'success'),
      onError: (err) => showToast(err instanceof ApiError ? err.message : 'Could not delete level. Please try again.', 'error'),
    })
    setPendingDelete(null)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-[20px] border-[1.5px] border-border bg-white p-6 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-base font-semibold text-heading">Manage Qualification Levels</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-body-subtle hover:bg-page"
          >
            <Icon icon={faTimes} />
          </button>
        </div>

        {isLoading && <p className="py-4 text-sm text-body-subtle">Loading...</p>}

        <ul className="mb-4 divide-y divide-border">
          {sorted.map((level, index) => (
            <li key={level.id} className="flex items-center justify-between gap-2 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-body">{level.name}</p>
                <p className="text-xs text-body-subtle">{STRUCTURE_LABEL[level.structure]}</p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleMove(level.id, 'up')}
                  disabled={index === 0}
                  aria-label={`Move ${level.name} up`}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-body-subtle hover:bg-page disabled:opacity-30"
                >
                  <Icon icon={faArrowUp} className="text-xs" />
                </button>
                <button
                  type="button"
                  onClick={() => handleMove(level.id, 'down')}
                  disabled={index === sorted.length - 1}
                  aria-label={`Move ${level.name} down`}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-body-subtle hover:bg-page disabled:opacity-30"
                >
                  <Icon icon={faArrowDown} className="text-xs" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteClick(level)}
                  aria-label={`Delete ${level.name}`}
                  className="ml-1 flex h-7 w-7 items-center justify-center rounded-lg text-body-subtle hover:text-error"
                >
                  <Icon icon={faTrashCan} className="text-xs" />
                </button>
              </div>
            </li>
          ))}
          {!isLoading && sorted.length === 0 && (
            <li className="py-4 text-center text-sm text-body-subtle">No levels yet.</li>
          )}
        </ul>

        <div className="space-y-2 border-t border-border pt-4">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            placeholder="e.g. Post Graduate Diploma"
            className="w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <SegmentedToggle options={STRUCTURE_OPTIONS} value={newStructure} onChange={setNewStructure} />
          <button
            type="button"
            onClick={handleCreate}
            disabled={createLevel.isPending}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
          >
            + Add Level
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this level?"
        description={
          pendingDelete && pendingDelete.dependentCount > 0 ? (
            <>
              Deleting <strong>{pendingDelete.name}</strong> also removes{' '}
              <strong>{pendingDelete.dependentCount}</strong> qualification value{pendingDelete.dependentCount === 1 ? '' : 's'} nested
              under it. This action is permanent and cannot be undone.
            </>
          ) : (
            <>
              Deleting <strong>{pendingDelete?.name}</strong> is permanent and cannot be undone.
            </>
          )
        }
        confirmLabel="Delete Level"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  )
}
