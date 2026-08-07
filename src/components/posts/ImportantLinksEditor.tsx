import { useRef, useState } from 'react'
import { faArrowDown, faArrowUp, faLink, faFilePdf } from '@fortawesome/free-solid-svg-icons'
import { faTrashCan } from '@fortawesome/free-regular-svg-icons'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { useToast } from '@/context/ToastContext'
import { ApiError } from '@/lib/apiClient'
import { uploadsApi } from '@/api/postsApi'
import { DEFAULT_IMPORTANT_LINKS, type ImportantLinkItem, type ImportantLinkKey } from '@/types/postCommon'

interface ImportantLinksEditorProps {
  value: ImportantLinkItem[]
  onChange: (value: ImportantLinkItem[]) => void
}

function reorder(links: ImportantLinkItem[]): ImportantLinkItem[] {
  return links.map((l, order) => ({ ...l, order }))
}

export function ImportantLinksEditor({ value, onChange }: ImportantLinksEditorProps) {
  const { showToast } = useToast()
  const [showAddCustom, setShowAddCustom] = useState(false)
  const [customLabel, setCustomLabel] = useState('')
  const [uploadingIds, setUploadingIds] = useState<Set<string>>(new Set())

  const sorted = [...value].sort((a, b) => a.order - b.order)
  const missingDefaults = DEFAULT_IMPORTANT_LINKS.filter((d) => !value.some((v) => v.key === d.key))

  const update = (id: string, patch: Partial<ImportantLinkItem>) => {
    onChange(value.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }

  // Same staleness concern as the promo-ads uploader: the PDF upload is async, so the final
  // update must read through a ref that's always current rather than this render's `value`.
  const latestValueRef = useRef(value)
  latestValueRef.current = value
  const updateLatest = (id: string, patch: Partial<ImportantLinkItem>) => {
    onChange(latestValueRef.current.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }

  const handlePdfSelect = async (linkId: string, file: File) => {
    setUploadingIds((prev) => new Set(prev).add(linkId))
    try {
      const uploadedUrl = await uploadsApi.upload(file, 'pdf')
      updateLatest(linkId, { pdf_url: uploadedUrl })
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Could not upload PDF. Please try again.', 'error')
    } finally {
      setUploadingIds((prev) => {
        const next = new Set(prev)
        next.delete(linkId)
        return next
      })
    }
  }
  const remove = (id: string) => onChange(reorder(value.filter((l) => l.id !== id)))
  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction
    if (target < 0 || target >= sorted.length) return
    const next = [...sorted]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(reorder(next))
  }
  const addDefault = (key: ImportantLinkKey) => {
    const def = DEFAULT_IMPORTANT_LINKS.find((d) => d.key === key)!
    onChange(reorder([...value, { ...def, id: crypto.randomUUID(), order: 0 }]))
  }
  const addCustom = () => {
    const trimmed = customLabel.trim()
    if (!trimmed) return
    onChange(
      reorder([
        ...value,
        {
          id: crypto.randomUUID(),
          key: 'custom',
          label: trimmed,
          is_default: false,
          source_mode: 'url',
          url: '',
          pdf_url: '',
          order: 0,
        },
      ]),
    )
    setCustomLabel('')
    setShowAddCustom(false)
  }

  return (
    <Card>
      <h2 className="mb-4 text-base font-semibold text-heading">Important Links</h2>

      <div className="space-y-3">
        {sorted.map((link, index) => (
          <div key={link.id} className="rounded-xl border border-border p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium text-body">
                {link.label}
                {link.is_default && <span className="ml-1.5 text-xs text-body-subtle">(default)</span>}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Move up"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-body-subtle hover:bg-page disabled:opacity-30"
                >
                  <Icon icon={faArrowUp} className="text-xs" />
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === sorted.length - 1}
                  aria-label="Move down"
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-body-subtle hover:bg-page disabled:opacity-30"
                >
                  <Icon icon={faArrowDown} className="text-xs" />
                </button>
                <button
                  type="button"
                  onClick={() => remove(link.id)}
                  aria-label={`Remove ${link.label}`}
                  className="ml-1 text-body-subtle hover:text-error"
                >
                  <Icon icon={faTrashCan} className="text-xs" />
                </button>
              </div>
            </div>

            {!link.is_default && (
              <input
                type="text"
                value={link.label}
                onChange={(e) => update(link.id, { label: e.target.value })}
                placeholder="Link label"
                className="mb-2 w-full rounded-lg border border-input-border px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
              />
            )}

            <div className="mb-2 flex gap-1 rounded-lg bg-page p-1">
              <button
                type="button"
                onClick={() => update(link.id, { source_mode: 'url' })}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium ${
                  link.source_mode === 'url' ? 'bg-white text-primary shadow-sm' : 'text-body-subtle'
                }`}
              >
                <Icon icon={faLink} /> Link (URL)
              </button>
              <button
                type="button"
                onClick={() => update(link.id, { source_mode: 'pdf' })}
                className={`flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 text-xs font-medium ${
                  link.source_mode === 'pdf' ? 'bg-white text-primary shadow-sm' : 'text-body-subtle'
                }`}
              >
                <Icon icon={faFilePdf} /> Upload PDF
              </button>
            </div>

            {link.source_mode === 'url' ? (
              <input
                type="url"
                value={link.url}
                onChange={(e) => update(link.id, { url: e.target.value })}
                placeholder="https://..."
                className="w-full rounded-lg border border-input-border px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
              />
            ) : (
              <div>
                <input
                  type="file"
                  accept="application/pdf"
                  disabled={uploadingIds.has(link.id)}
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) handlePdfSelect(link.id, file)
                  }}
                  className="w-full text-sm text-body-subtle"
                />
                {uploadingIds.has(link.id) && <p className="mt-1 text-xs text-body-subtle">Uploading...</p>}
                {!uploadingIds.has(link.id) && link.pdf_url && (
                  <p className="mt-1 truncate text-xs text-primary">Uploaded: {link.pdf_url}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {missingDefaults.map((def) => (
          <button
            key={def.key}
            type="button"
            onClick={() => addDefault(def.key)}
            className="rounded-lg border border-dashed border-input-border px-3 py-1.5 text-xs font-medium text-body-subtle hover:border-primary-border-accent hover:text-primary"
          >
            + Add Default Link ({def.label})
          </button>
        ))}
      </div>

      {showAddCustom ? (
        <div className="mt-3 flex gap-2">
          <input
            type="text"
            autoFocus
            value={customLabel}
            onChange={(e) => setCustomLabel(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addCustom()}
            placeholder="Link label"
            className="flex-1 rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
          <button
            type="button"
            onClick={addCustom}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Add
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddCustom(true)}
          className="mt-3 text-sm font-medium text-primary hover:underline"
        >
          + Add Link
        </button>
      )}
    </Card>
  )
}
