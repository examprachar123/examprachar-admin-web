import { useState } from 'react'
import { faChevronRight } from '@fortawesome/free-solid-svg-icons'
import { faTrashCan } from '@fortawesome/free-regular-svg-icons'
import { Icon } from '@/components/ui/Icon'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/context/ToastContext'
import { ApiError } from '@/lib/apiClient'
import {
  useConfirmDeleteQualificationParent,
  useCreateQualificationParent,
  useDeleteQualificationParent,
  useQualificationParents,
} from '@/hooks/useProfileOptions'

interface ParentCategoryListProps {
  levelId: number
  onSelectParent: (parentId: number, parentName: string) => void
}

export function ParentCategoryList({ levelId, onSelectParent }: ParentCategoryListProps) {
  const { data: parents = [], isLoading } = useQualificationParents(levelId)
  const createParent = useCreateQualificationParent(levelId)
  const deleteParent = useDeleteQualificationParent()
  const confirmDeleteParent = useConfirmDeleteQualificationParent(levelId)
  const { showToast } = useToast()

  const [showAddModal, setShowAddModal] = useState(false)
  const [newName, setNewName] = useState('')
  const [pendingDelete, setPendingDelete] = useState<{ id: number; name: string; childCount: number } | null>(
    null,
  )

  const handleCreate = () => {
    const trimmed = newName.trim()
    if (!trimmed) {
      showToast('Please enter a category name.', 'error')
      return
    }
    createParent.mutate(trimmed, {
      onSuccess: () => {
        setNewName('')
        setShowAddModal(false)
      },
      onError: (err) =>
        showToast(err instanceof ApiError ? err.message : 'Could not add category. Please try again.', 'error'),
    })
  }

  const handleDeleteClick = (parent: { id: number; name: string }) => {
    deleteParent.mutate(parent.id, {
      onSuccess: (result) => setPendingDelete({ id: parent.id, name: parent.name, childCount: result.child_count }),
      onError: (err) =>
        showToast(err instanceof ApiError ? err.message : 'Could not check this category. Please try again.', 'error'),
    })
  }

  const handleConfirmDelete = () => {
    if (!pendingDelete) return
    confirmDeleteParent.mutate(pendingDelete.id, {
      onSuccess: () => showToast('Category deleted.', 'success'),
      onError: (err) =>
        showToast(err instanceof ApiError ? err.message : 'Could not delete category. Please try again.', 'error'),
    })
    setPendingDelete(null)
  }

  return (
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-heading">Parent Categories</h2>
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="rounded-lg bg-primary px-3.5 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
        >
          + Add New Parent Category
        </button>
      </div>

      {isLoading && <p className="py-4 text-sm text-body-subtle">Loading...</p>}

      <ul className="divide-y divide-border">
        {parents.map((parent) => (
          <li key={parent.id} className="flex items-center justify-between py-2.5">
            <button
              type="button"
              onClick={() => onSelectParent(parent.id, parent.name)}
              className="flex flex-1 items-center justify-between text-left text-sm font-medium text-body hover:text-primary"
            >
              {parent.name}
              <Icon icon={faChevronRight} className="text-xs text-body-subtle" />
            </button>
            <button
              type="button"
              onClick={() => handleDeleteClick(parent)}
              aria-label={`Delete ${parent.name}`}
              className="ml-3 flex h-7 w-7 items-center justify-center rounded-lg text-body-subtle hover:text-error"
            >
              <Icon icon={faTrashCan} className="text-xs" />
            </button>
          </li>
        ))}
        {!isLoading && parents.length === 0 && (
          <li className="py-4 text-center text-sm text-body-subtle">No categories yet.</li>
        )}
      </ul>

      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4">
          <div className="w-full max-w-sm rounded-[20px] border-[1.5px] border-border bg-white p-6 shadow-xl">
            <h3 className="mb-3 text-base font-semibold text-heading">New Parent Category</h3>
            <input
              type="text"
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="e.g. Engineering"
              className="mb-4 w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false)
                  setNewName('')
                }}
                className="rounded-lg border border-input-border px-4 py-2 text-sm font-medium text-body hover:bg-page"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={createParent.isPending}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this category?"
        description={
          <>
            Deleting <strong>{pendingDelete?.name}</strong> also removes{' '}
            <strong>{pendingDelete?.childCount}</strong> item{pendingDelete?.childCount === 1 ? '' : 's'} nested
            under it. This action is permanent and cannot be undone.
          </>
        }
        confirmLabel="Delete Category"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </Card>
  )
}
