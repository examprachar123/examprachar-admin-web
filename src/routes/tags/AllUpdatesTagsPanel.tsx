import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Pill } from '@/components/ui/Pill'
import { ToggleSwitch } from '@/components/ui/ToggleSwitch'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { TAG_SECTIONS, type CustomTag, type TagSection } from '@/types/tags'
import {
  useCreateCustomTag,
  useCustomTags,
  useDeleteCustomTag,
  useReorderCustomTag,
  useUpdateCustomTag,
} from '@/hooks/useTagsAdmin'
import { useToast } from '@/context/ToastContext'
import { ApiError } from '@/lib/apiClient'

const MAX_TAGS_PER_SECTION = 15
const MAX_NAME_LENGTH = 20

export function AllUpdatesTagsPanel() {
  const [section, setSection] = useState<TagSection>('latest_exam')
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)

  const { data: tags = [], isLoading } = useCustomTags(section)

  return (
    <div>
      <Card className="mb-5">
        <h2 className="mb-3 text-base font-semibold text-heading">Section</h2>
        <div className="flex flex-wrap gap-2">
          {TAG_SECTIONS.map((s) => (
            <Pill
              key={s.value}
              active={s.value === section}
              onClick={() => {
                setSection(s.value)
                setSelectedTagId(null)
                setCreating(false)
              }}
            >
              {s.label}
            </Pill>
          ))}
        </div>
      </Card>

      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-heading">
            Custom Tags &middot; {TAG_SECTIONS.find((s) => s.value === section)?.label}
          </h2>
          <span className="text-xs text-body-subtle">
            {tags.length}/{MAX_TAGS_PER_SECTION}
          </span>
        </div>

        {isLoading && <p className="py-4 text-sm text-body-subtle">Loading tags...</p>}

        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Pill
              key={tag.id}
              active={selectedTagId === tag.id}
              onClick={() => {
                setSelectedTagId(tag.id)
                setCreating(false)
              }}
            >
              {tag.name}
              {!tag.is_visible && <span className="text-[10px] opacity-70">(hidden)</span>}
            </Pill>
          ))}

          <Pill
            disabled={tags.length >= MAX_TAGS_PER_SECTION}
            title={
              tags.length >= MAX_TAGS_PER_SECTION
                ? `Maximum of ${MAX_TAGS_PER_SECTION} tags reached for this section.`
                : undefined
            }
            onClick={() => {
              setCreating(true)
              setSelectedTagId(null)
            }}
          >
            + Add New Tag
          </Pill>
        </div>

        {creating && (
          <CreateTagPanel
            section={section}
            existingNames={tags.map((t) => t.name)}
            onDone={() => setCreating(false)}
          />
        )}

        {selectedTagId && (
          <EditTagPanel
            section={section}
            tag={tags.find((t) => t.id === selectedTagId)!}
            onDone={() => setSelectedTagId(null)}
          />
        )}
      </Card>
    </div>
  )
}

function CreateTagPanel({
  section,
  existingNames,
  onDone,
}: {
  section: TagSection
  existingNames: string[]
  onDone: () => void
}) {
  const [name, setName] = useState('')
  const createTag = useCreateCustomTag(section)
  const { showToast } = useToast()

  const trimmed = name.trim()
  const isDuplicate = existingNames.some((n) => n.toLowerCase() === trimmed.toLowerCase())
  const isValid = trimmed.length > 0 && !isDuplicate

  const handleSave = () => {
    if (!isValid) return
    createTag.mutate(trimmed, {
      onSuccess: () => {
        showToast('Tag created.', 'success')
        onDone()
      },
      onError: (err) =>
        showToast(err instanceof ApiError ? err.message : 'Could not create tag. Please try again.', 'error'),
    })
  }

  return (
    <div className="mt-4 rounded-xl border border-border bg-page p-4">
      <label htmlFor="new-tag-name" className="mb-1.5 block text-sm font-medium text-body">
        Tag Name
      </label>
      <input
        id="new-tag-name"
        type="text"
        autoFocus
        value={name}
        maxLength={MAX_NAME_LENGTH}
        onChange={(e) => setName(e.target.value)}
        className="mb-1 w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />
      <div className="mb-3 flex items-center justify-between text-xs">
        <span className={isDuplicate ? 'text-error' : 'text-transparent'}>
          {isDuplicate ? 'This tag already exists in this section.' : '.'}
        </span>
        <span className="text-body-subtle">
          {name.length}/{MAX_NAME_LENGTH}
        </span>
      </div>

      {trimmed && (
        <div className="mb-3">
          <span className="mb-1.5 block text-xs font-medium text-body-subtle">Preview</span>
          <Pill active>{trimmed}</Pill>
        </div>
      )}

      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className="rounded-lg border border-input-border px-4 py-2 text-sm font-medium text-body hover:bg-white"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!isValid || createTag.isPending}
          onClick={handleSave}
          className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
        >
          Save
        </button>
      </div>
    </div>
  )
}

function EditTagPanel({
  section,
  tag,
  onDone,
}: {
  section: TagSection
  tag: CustomTag
  onDone: () => void
}) {
  const [name, setName] = useState(tag.name)
  const [rank, setRank] = useState(tag.rank)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const updateTag = useUpdateCustomTag(section)
  const reorderTag = useReorderCustomTag(section)
  const deleteTag = useDeleteCustomTag(section)
  const { showToast } = useToast()

  const handleToggleVisible = (isVisible: boolean) => {
    updateTag.mutate(
      { id: tag.id, patch: { is_visible: isVisible } },
      {
        onError: (err) =>
          showToast(err instanceof ApiError ? err.message : 'Could not update visibility. Please try again.', 'error'),
      },
    )
  }

  const handleSave = async () => {
    try {
      if (name.trim() !== tag.name) {
        await updateTag.mutateAsync({ id: tag.id, patch: { name: name.trim() } })
      }
      if (rank !== tag.rank) {
        await reorderTag.mutateAsync({ id: tag.id, newRank: rank })
      }
      showToast('Tag updated.', 'success')
    } catch (err) {
      showToast(err instanceof ApiError ? err.message : 'Could not update tag. Please try again.', 'error')
    }
  }

  const handleDelete = () => {
    deleteTag.mutate(tag.id, {
      onSuccess: () => {
        showToast('Tag deleted.', 'success')
        setConfirmDelete(false)
        onDone()
      },
      onError: (err) =>
        showToast(err instanceof ApiError ? err.message : 'Could not delete tag. Please try again.', 'error'),
    })
  }

  return (
    <div className="mt-4 rounded-xl border border-border bg-page p-4">
      <label htmlFor="edit-tag-name" className="mb-1.5 block text-sm font-medium text-body">
        Display Name
      </label>
      <input
        id="edit-tag-name"
        type="text"
        maxLength={MAX_NAME_LENGTH}
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="mb-4 w-full rounded-lg border border-input-border px-3 py-2 text-sm focus:border-primary focus:outline-none"
      />

      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-body">Visible to Users</span>
        <ToggleSwitch checked={tag.is_visible} onChange={handleToggleVisible} label="Toggle visibility" />
      </div>

      <div className="mb-4 flex items-center justify-between">
        <span className="text-sm font-medium text-body">Rank</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setRank((r) => Math.max(1, r - 1))}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-input-border text-body hover:bg-white"
          >
            &minus;
          </button>
          <input
            type="number"
            value={rank}
            min={1}
            onChange={(e) => setRank(Number(e.target.value))}
            className="w-14 rounded-lg border border-input-border px-2 py-1 text-center text-sm"
          />
          <button
            type="button"
            onClick={() => setRank((r) => r + 1)}
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-input-border text-body hover:bg-white"
          >
            +
          </button>
        </div>
      </div>

      <p className="mb-4 text-xs text-body-subtle">{tag.post_count} posts currently use this tag.</p>

      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={() => setConfirmDelete(true)}
          className="rounded-lg px-4 py-2 text-sm font-medium text-error hover:bg-red-50"
        >
          Delete Tag
        </button>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onDone}
            className="rounded-lg border border-input-border px-4 py-2 text-sm font-medium text-body hover:bg-white"
          >
            Close
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateTag.isPending || reorderTag.isPending}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:opacity-60"
          >
            Save
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this tag?"
        description={
          <>
            "{tag.name}" is used by <strong>{tag.post_count}</strong> post{tag.post_count === 1 ? '' : 's'}.
            This action is permanent and cannot be undone. If you just want to stop showing it to users,
            use the "Hide instead?" &mdash; turn off "Visible to Users" above &mdash; instead of deleting.
          </>
        }
        confirmLabel="Delete Permanently"
        destructive
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  )
}
