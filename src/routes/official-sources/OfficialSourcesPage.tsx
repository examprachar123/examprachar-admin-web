import { useMemo, useState } from 'react'
import { faBuildingColumns, faPen } from '@fortawesome/free-solid-svg-icons'
import { faTrashCan } from '@fortawesome/free-regular-svg-icons'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Icon } from '@/components/ui/Icon'
import { SearchInput } from '@/components/ui/SearchInput'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'
import { useToast } from '@/context/ToastContext'
import {
  useCreateOfficialSource,
  useDeleteOfficialSource,
  useOfficialSources,
  useSetOfficialSourceActive,
  useUpdateOfficialSource,
} from '@/hooks/useOfficialSources'
import { ApiError } from '@/lib/apiClient'
import type { OfficialSource, OfficialSourceInput } from '@/types/officialSources'

const EMPTY_FORM: OfficialSourceInput = { name: '', url: '', abbr: '', color: '#003087', is_active: true }

const inputClass =
  'w-full rounded-xl border border-input-border px-4 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-border-accent'

export function OfficialSourcesPage() {
  const { data: sources = [], isLoading } = useOfficialSources()
  const createSource = useCreateOfficialSource()
  const updateSource = useUpdateOfficialSource()
  const setActive = useSetOfficialSourceActive()
  const deleteSource = useDeleteOfficialSource()
  const { showToast } = useToast()

  const [form, setForm] = useState<OfficialSourceInput>(EMPTY_FORM)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [pendingDelete, setPendingDelete] = useState<OfficialSource | null>(null)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return sources
    return sources.filter((s) => `${s.name} ${s.url} ${s.abbr}`.toLowerCase().includes(q))
  }, [sources, search])

  const setField = <K extends keyof OfficialSourceInput>(key: K, value: OfficialSourceInput[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const resetForm = () => {
    setForm(EMPTY_FORM)
    setEditingId(null)
  }

  const handleStartEdit = (s: OfficialSource) => {
    setEditingId(s.id)
    setForm({ name: s.name, url: s.url, abbr: s.abbr, color: s.color, is_active: s.is_active })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleSubmit = () => {
    const input: OfficialSourceInput = {
      ...form,
      name: form.name.trim(),
      url: form.url.trim(),
      abbr: form.abbr.trim(),
    }
    if (!input.name || !input.url || !input.abbr) {
      showToast('Name, website URL and abbreviation are required.', 'error')
      return
    }
    const onError = (err: unknown) =>
      showToast(err instanceof ApiError ? err.message : 'Could not save source. Please try again.', 'error')

    if (editingId === null) {
      createSource.mutate(input, {
        onSuccess: () => {
          resetForm()
          showToast('Source added.', 'success')
        },
        onError,
      })
    } else {
      updateSource.mutate(
        { id: editingId, input },
        {
          onSuccess: () => {
            resetForm()
            showToast('Source updated.', 'success')
          },
          onError,
        },
      )
    }
  }

  const handleConfirmDelete = () => {
    if (!pendingDelete) return
    const target = pendingDelete
    setPendingDelete(null)
    deleteSource.mutate(target.id, {
      onSuccess: () => {
        if (editingId === target.id) resetForm()
        showToast('Source deleted.', 'success')
      },
      onError: (err) =>
        showToast(err instanceof ApiError ? err.message : 'Could not delete source. Please try again.', 'error'),
    })
  }

  const isSaving = createSource.isPending || updateSource.isPending

  return (
    <AppShell title="Manage Official Sources" showBack>
      <Card className="mb-5">
        <h2 className="mb-3 text-base font-semibold text-heading">
          {editingId === null ? 'Add New Source' : 'Edit Source'}
        </h2>

        <label htmlFor="source-name" className="mb-1.5 block text-sm font-medium text-body">
          Name
        </label>
        <input
          id="source-name"
          type="text"
          value={form.name}
          onChange={(e) => setField('name', e.target.value)}
          placeholder="e.g. Union Public Service Commission (UPSC)"
          className={inputClass + ' mb-3'}
        />

        <label htmlFor="source-url" className="mb-1.5 block text-sm font-medium text-body">
          Website URL
        </label>
        <input
          id="source-url"
          type="url"
          value={form.url}
          onChange={(e) => setField('url', e.target.value)}
          placeholder="https://upsc.gov.in/"
          className={inputClass + ' mb-3'}
        />

        <div className="mb-3 grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="source-abbr" className="mb-1.5 block text-sm font-medium text-body">
              Badge Text
            </label>
            <input
              id="source-abbr"
              type="text"
              maxLength={20}
              value={form.abbr}
              onChange={(e) => setField('abbr', e.target.value)}
              placeholder="UPSC"
              className={inputClass}
            />
          </div>
          <div>
            <label htmlFor="source-color" className="mb-1.5 block text-sm font-medium text-body">
              Badge Color
            </label>
            <div className="flex items-center gap-2">
              <input
                id="source-color"
                type="color"
                value={form.color}
                onChange={(e) => setField('color', e.target.value)}
                className="h-[42px] w-12 shrink-0 cursor-pointer rounded-lg border border-input-border bg-white p-1"
              />
              <span
                className="flex h-[42px] min-w-0 flex-1 items-center justify-center truncate rounded-xl px-2 text-xs font-bold text-white"
                style={{ backgroundColor: form.color }}
              >
                {form.abbr || 'Preview'}
              </span>
            </div>
          </div>
        </div>

        <div className="mb-4 flex items-center justify-between">
          <span className="text-sm font-medium text-body">Show on public Sources page</span>
          <ToggleSwitch checked={form.is_active} onChange={(v) => setField('is_active', v)} label="Active" />
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSaving}
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-hover disabled:opacity-60"
          >
            {editingId === null ? 'Add Source' : 'Save Changes'}
          </button>
          {editingId !== null && (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-input-border px-5 py-2.5 text-sm font-semibold text-body hover:bg-page"
            >
              Cancel
            </button>
          )}
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-heading">Configured Sources</h2>
          <span className="rounded-full bg-primary-gradient-from px-3 py-1 text-xs font-semibold text-primary">
            {sources.length} Total
          </span>
        </div>

        <SearchInput value={search} onChange={setSearch} placeholder="Search sources..." className="mb-4" />

        {isLoading && <p className="py-6 text-center text-sm text-body-subtle">Loading sources...</p>}

        {!isLoading && filtered.length === 0 && (
          <div className="flex flex-col items-center py-10 text-center">
            <Icon icon={faBuildingColumns} className="mb-3 text-3xl text-border" />
            <p className="text-sm text-body-subtle">No sources found.</p>
          </div>
        )}

        <ul className="divide-y divide-border">
          {filtered.map((s) => (
            <li key={s.id} className="flex items-center gap-3 py-3">
              <div
                className="flex h-10 w-10 shrink-0 select-none items-center justify-center rounded-full text-[11px] font-bold text-white"
                style={{ backgroundColor: s.color }}
              >
                {s.abbr.slice(0, 5)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-body">{s.name}</p>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block truncate text-xs text-primary hover:underline"
                >
                  {s.host}
                </a>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <ToggleSwitch
                  checked={s.is_active}
                  onChange={(checked) => setActive.mutate({ id: s.id, isActive: checked })}
                  label={`Toggle ${s.name}`}
                />
                <button
                  type="button"
                  onClick={() => handleStartEdit(s)}
                  aria-label={`Edit ${s.name}`}
                  className="text-body-subtle hover:text-primary"
                >
                  <Icon icon={faPen} />
                </button>
                <button
                  type="button"
                  onClick={() => setPendingDelete(s)}
                  aria-label={`Delete ${s.name}`}
                  className="text-body-subtle hover:text-error"
                >
                  <Icon icon={faTrashCan} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Card>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete source?"
        description={`"${pendingDelete?.name ?? ''}" will be removed from the public Sources page.`}
        confirmLabel="Delete"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </AppShell>
  )
}
