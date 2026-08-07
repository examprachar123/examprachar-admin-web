import { useState } from 'react'
import { faArrowDown, faArrowUp } from '@fortawesome/free-solid-svg-icons'
import { faTrashCan } from '@fortawesome/free-regular-svg-icons'
import { Icon } from '@/components/ui/Icon'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/context/ToastContext'
import { ApiError } from '@/lib/apiClient'
import { qualificationChildrenApi, qualificationOptionsApi } from '@/api/profileOptionsApi'
import { useManagedList, type ManagedListAdapter } from '@/hooks/useProfileOptions'
import type { QualificationChild, QualificationOption } from '@/types/profileOptions'

type FlatOptionResource = { kind: 'children'; parentId: number } | { kind: 'options'; levelId: number }

interface FlatOptionListProps {
  resource: FlatOptionResource
  label: string
  addPlaceholder?: string
}

function buildAdapter(
  resource: FlatOptionResource,
): ManagedListAdapter<QualificationChild | QualificationOption> {
  if (resource.kind === 'children') {
    const { parentId } = resource
    return {
      queryKey: ['qualification-children', parentId],
      list: () => qualificationChildrenApi.list(parentId),
      create: (name, order) => qualificationChildrenApi.create(parentId, name, order),
      remove: (id) => qualificationChildrenApi.remove(id),
      move: (id, direction) => qualificationChildrenApi.move(id, direction),
    }
  }
  const { levelId } = resource
  return {
    queryKey: ['qualification-options', levelId],
    list: () => qualificationOptionsApi.list(levelId),
    create: (name, order) => qualificationOptionsApi.create(levelId, name, order),
    remove: (id) => qualificationOptionsApi.remove(id),
    move: (id, direction) => qualificationOptionsApi.move(id, direction),
  }
}

export function FlatOptionList({ resource, label, addPlaceholder }: FlatOptionListProps) {
  const { query, items, create, remove, move } = useManagedList(buildAdapter(resource))
  const { showToast } = useToast()

  const [nameInput, setNameInput] = useState('')
  const [pendingDelete, setPendingDelete] = useState<{ id: number; name: string } | null>(null)

  const sorted = [...items].sort((a, b) => a.order - b.order)

  const handleAdd = () => {
    const trimmed = nameInput.trim()
    if (!trimmed) {
      showToast('Please enter a name.', 'error')
      return
    }
    create.mutate(trimmed, {
      onSuccess: () => setNameInput(''),
      onError: (err) => showToast(err instanceof ApiError ? err.message : 'Could not add item. Please try again.', 'error'),
    })
  }

  const handleMove = (id: number, direction: 'up' | 'down') => {
    move.mutate(
      { id, direction },
      {
        onError: (err) =>
          showToast(err instanceof ApiError ? err.message : 'Could not reorder item. Please try again.', 'error'),
      },
    )
  }

  const handleConfirmDelete = () => {
    if (!pendingDelete) return
    const { id } = pendingDelete
    setPendingDelete(null)
    remove.mutate(id, {
      onError: (err) =>
        showToast(err instanceof ApiError ? err.message : 'Could not delete item. Please try again.', 'error'),
    })
  }

  return (
    <Card>
      <h2 className="mb-4 text-base font-semibold text-heading">{label}</h2>

      {query.isLoading && <p className="py-4 text-sm text-body-subtle">Loading...</p>}

      <ul className="mb-4 divide-y divide-border">
        {sorted.map((option, index) => (
          <li key={option.id} className="flex items-center justify-between py-2.5">
            <span className="text-sm text-body">{option.name}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => handleMove(option.id, 'up')}
                disabled={index === 0}
                aria-label={`Move ${option.name} up`}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-body-subtle hover:bg-page disabled:opacity-30"
              >
                <Icon icon={faArrowUp} className="text-xs" />
              </button>
              <button
                type="button"
                onClick={() => handleMove(option.id, 'down')}
                disabled={index === sorted.length - 1}
                aria-label={`Move ${option.name} down`}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-body-subtle hover:bg-page disabled:opacity-30"
              >
                <Icon icon={faArrowDown} className="text-xs" />
              </button>
              <button
                type="button"
                onClick={() => setPendingDelete({ id: option.id, name: option.name })}
                aria-label={`Delete ${option.name}`}
                className="ml-1 flex h-7 w-7 items-center justify-center rounded-lg text-body-subtle hover:text-error"
              >
                <Icon icon={faTrashCan} className="text-xs" />
              </button>
            </div>
          </li>
        ))}
        {!query.isLoading && sorted.length === 0 && (
          <li className="py-4 text-center text-sm text-body-subtle">Nothing added yet.</li>
        )}
      </ul>

      <div className="flex gap-2">
        <input
          type="text"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder={addPlaceholder ?? 'Add new item...'}
          className="flex-1 rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={create.isPending}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
        >
          Add
        </button>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this item?"
        description={
          <>
            Deleting <strong>{pendingDelete?.name}</strong> is permanent and cannot be undone.
          </>
        }
        confirmLabel="Delete"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </Card>
  )
}
