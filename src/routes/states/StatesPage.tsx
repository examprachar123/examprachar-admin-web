import { useMemo, useState } from 'react'
import { faMapMarkerAlt, faMapMarkedAlt, faPen, faCheck, faXmark } from '@fortawesome/free-solid-svg-icons'
import { faTrashCan } from '@fortawesome/free-regular-svg-icons'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { SearchInput } from '@/components/ui/SearchInput'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'
import { Icon } from '@/components/ui/Icon'
import { useToast } from '@/context/ToastContext'
import { useCreateState, useDeleteState, useRenameState, useSetStateActive, useStates } from '@/hooks/useStates'
import { ApiError } from '@/lib/apiClient'

export function StatesPage() {
  const { data: states = [], isLoading } = useStates()
  const createState = useCreateState()
  const setActive = useSetStateActive()
  const renameState = useRenameState()
  const deleteState = useDeleteState()
  const { showToast } = useToast()

  const [nameInput, setNameInput] = useState('')
  const [search, setSearch] = useState('')
  const [exitingIds, setExitingIds] = useState<Set<number>>(new Set())
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return states
    return states.filter((s) => s.name.toLowerCase().includes(q))
  }, [states, search])

  const handleAdd = () => {
    const trimmed = nameInput.trim()
    if (!trimmed) {
      showToast('Please enter a state name.', 'error')
      return
    }
    const isDuplicate = states.some((s) => s.name.toLowerCase() === trimmed.toLowerCase())
    if (isDuplicate) {
      showToast('This state already exists.', 'error')
      return
    }
    createState.mutate(trimmed, {
      onSuccess: () => {
        setNameInput('')
        showToast('State added.', 'success')
      },
      onError: (err) =>
        showToast(err instanceof ApiError ? err.message : 'Could not add state. Please try again.', 'error'),
    })
  }

  const handleDelete = (id: number) => {
    setExitingIds((prev) => new Set(prev).add(id))
    setTimeout(() => {
      deleteState.mutate(id, {
        onError: (err) => {
          // A state still referenced by a PSC mapping or broadcast can't be deleted — the API
          // currently surfaces that as a raw 500 rather than a clean 409, so status alone can't
          // distinguish it from a real server error. Either way "try again" is never the fix.
          const isLikelyDependencyConflict = err instanceof ApiError && (err.status === 409 || err.status === 500)
          showToast(
            isLikelyDependencyConflict
              ? 'This state is still linked to a PSC mapping or broadcast. Remove those first, then delete the state.'
              : err instanceof ApiError
                ? err.message
                : 'Could not delete state. Please try again.',
            'error',
          )
        },
      })
      setExitingIds((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }, 250)
  }

  const handleToggle = (id: number, isActive: boolean) => {
    setActive.mutate({ id, isActive })
  }

  const handleStartEdit = (id: number, currentName: string) => {
    setEditingId(id)
    setEditValue(currentName)
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditValue('')
  }

  const handleSaveEdit = (id: number) => {
    const trimmed = editValue.trim()
    if (!trimmed) {
      showToast('Please enter a state name.', 'error')
      return
    }
    const isDuplicate = states.some((s) => s.id !== id && s.name.toLowerCase() === trimmed.toLowerCase())
    if (isDuplicate) {
      showToast('This state already exists.', 'error')
      return
    }
    renameState.mutate(
      { id, name: trimmed },
      {
        onSuccess: () => {
          showToast('State updated.', 'success')
          setEditingId(null)
          setEditValue('')
        },
        onError: (err) =>
          showToast(err instanceof ApiError ? err.message : 'Could not update state. Please try again.', 'error'),
      },
    )
  }

  return (
    <AppShell title="Manage States" showBack>
      <Card className="mb-5">
        <h2 className="mb-3 text-base font-semibold text-heading">Add New State or UT</h2>
        <label htmlFor="state-name" className="mb-1.5 block text-sm font-medium text-body">
          State / UT Name
        </label>
        <input
          id="state-name"
          type="text"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="e.g. Maharashtra"
          className="mb-3 w-full rounded-xl border border-input-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-border-accent"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={createState.isPending}
          className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
        >
          Add to List
        </button>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-heading">Configured States</h2>
          <span className="rounded-full bg-primary-gradient-from px-3 py-1 text-xs font-semibold text-primary">
            {states.length} Total
          </span>
        </div>

        <SearchInput value={search} onChange={setSearch} placeholder="Search states..." className="mb-4" />

        {isLoading && <p className="py-6 text-center text-sm text-body-subtle">Loading states...</p>}

        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center py-10 text-center">
            <Icon icon={faMapMarkedAlt} className="mb-3 text-3xl text-border" />
            <p className="text-sm text-body-subtle">No states found.</p>
          </div>
        )}

        <ul className="divide-y divide-border">
          {filtered.map((state) => (
            <li
              key={state.id}
              className={
                'flex items-center justify-between py-3 transition-all duration-250 ' +
                (exitingIds.has(state.id) ? 'scale-95 opacity-0' : 'scale-100 opacity-100')
              }
            >
              {editingId === state.id ? (
                <>
                  <div className="flex flex-1 items-center gap-3">
                    <Icon icon={faMapMarkerAlt} className="text-primary" />
                    <input
                      type="text"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(state.id)
                        if (e.key === 'Escape') handleCancelEdit()
                      }}
                      autoFocus
                      className="w-full rounded-lg border border-input-border px-3 py-1.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-border-accent"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleSaveEdit(state.id)}
                      disabled={renameState.isPending}
                      aria-label={`Save ${state.name}`}
                      className="text-body-subtle hover:text-primary disabled:opacity-60"
                    >
                      <Icon icon={faCheck} />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancelEdit}
                      aria-label="Cancel edit"
                      className="text-body-subtle hover:text-error"
                    >
                      <Icon icon={faXmark} />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <Icon icon={faMapMarkerAlt} className="text-primary" />
                    <span className="text-sm font-medium text-body">{state.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={
                        'text-xs font-semibold ' + (state.is_active ? 'text-primary' : 'text-body-subtle')
                      }
                    >
                      {state.is_active ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                    <ToggleSwitch
                      checked={state.is_active}
                      onChange={(checked) => handleToggle(state.id, checked)}
                      label={`Toggle ${state.name}`}
                    />
                    <button
                      type="button"
                      onClick={() => handleStartEdit(state.id, state.name)}
                      aria-label={`Edit ${state.name}`}
                      className="text-body-subtle hover:text-primary"
                    >
                      <Icon icon={faPen} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(state.id)}
                      aria-label={`Delete ${state.name}`}
                      className="text-body-subtle hover:text-error"
                    >
                      <Icon icon={faTrashCan} />
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </AppShell>
  )
}
