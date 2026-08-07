import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Pill } from '@/components/ui/Pill'
import { useStates } from '@/hooks/useStates'
import { usePscMapping, useSavePscMapping } from '@/hooks/useTagsAdmin'
import { useToast } from '@/context/ToastContext'
import { ApiError } from '@/lib/apiClient'

export function AppWideTagsPanel() {
  const { data: states = [] } = useStates()
  const [selectedStateId, setSelectedStateId] = useState<number | null>(null)
  const { data: mapping, isFetching } = usePscMapping(selectedStateId)
  const saveMapping = useSavePscMapping()
  const { showToast } = useToast()

  const [pscName, setPscName] = useState('')

  useEffect(() => {
    setPscName(mapping?.commission_name ?? '')
  }, [mapping])

  useEffect(() => {
    if (!selectedStateId && states.length > 0) {
      setSelectedStateId(states[0].id)
    }
  }, [states, selectedStateId])

  const selectedState = states.find((s) => s.id === selectedStateId)
  const isValid = pscName.trim().length >= 2

  const handleSave = () => {
    if (!selectedStateId || !isValid) return
    saveMapping.mutate(
      { stateId: selectedStateId, existingId: mapping?.id ?? null, commissionName: pscName.trim() },
      {
        onSuccess: () => showToast('State tag saved.', 'success'),
        onError: (err) =>
          showToast(err instanceof ApiError ? err.message : 'Could not save state tag. Please try again.', 'error'),
      },
    )
  }

  return (
    <Card>
      <h2 className="mb-1 text-base font-semibold text-heading">State &rarr; PSC Mapping</h2>
      <p className="mb-4 text-sm text-body-subtle">
        Each state maps to one PSC tag, shown as its "State" tag wherever this state is selected.
      </p>

      <label htmlFor="state-select" className="mb-1.5 block text-sm font-medium text-body">
        State
      </label>
      <select
        id="state-select"
        value={selectedStateId ?? ''}
        onChange={(e) => setSelectedStateId(Number(e.target.value))}
        className="mb-4 w-full rounded-xl border border-input-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-border-accent"
      >
        {states.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      <label htmlFor="psc-name" className="mb-1.5 block text-sm font-medium text-body">
        PSC Name
      </label>
      <input
        id="psc-name"
        type="text"
        value={pscName}
        disabled={isFetching}
        onChange={(e) => setPscName(e.target.value)}
        placeholder="e.g. UPPSC"
        className="mb-2 w-full rounded-xl border border-input-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-border-accent"
      />

      {pscName.trim() && (
        <div className="mb-3">
          <span className="mb-1.5 block text-xs font-medium text-body-subtle">Preview</span>
          <Pill active>{pscName.trim()}</Pill>
        </div>
      )}

      <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
        This tag is shown automatically for {selectedState?.name ?? 'the selected state'} across every
        section &mdash; it doesn't need to be added per-section like custom tags.
      </p>

      <button
        type="button"
        onClick={handleSave}
        disabled={!isValid || saveMapping.isPending}
        className="w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
      >
        Save
      </button>
    </Card>
  )
}
