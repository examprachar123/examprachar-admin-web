import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { faFileAlt, faPlus } from '@fortawesome/free-solid-svg-icons'
import { faTrashCan } from '@fortawesome/free-regular-svg-icons'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { SearchInput } from '@/components/ui/SearchInput'
import { Icon } from '@/components/ui/Icon'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useToast } from '@/context/ToastContext'
import { ApiError } from '@/lib/apiClient'
import { useConfirmDeletePost, useDeletePost, usePostList } from '@/hooks/usePostForm'
import type { ConfirmRequiredDelete, PostGroup, PostResource, PostSummary } from '@/types/posts'

interface PostListPageProps {
  resource: PostResource
  /** Omit for post types (Tracked Alert) whose list isn't filterable by group per the API. */
  group?: PostGroup
  /** Omit to hide the "New" button — used when creation needs more context than this list has. */
  newPath?: string
  editPath: (post: PostSummary) => string
  title: string
  sectionLabel: string
  /** e.g. an URGENT / OUT NOW / UPCOMING badge — each post type decides its own. */
  renderBadge?: (post: PostSummary) => ReactNode
}

function formatPublishedAt(value: string | null): string {
  if (!value) return 'Not yet published'
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

/**
 * Shared "Manage Published" list for every post type: search, edit-on-click, and the
 * two-step confirm delete (only Latest Exam's delete ever actually requires confirmation —
 * for the rest, useDeletePost's first call already deletes and this reduces to one click).
 */
export function PostListPage({ resource, group, newPath, editPath, title, sectionLabel, renderBadge }: PostListPageProps) {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [search, setSearch] = useState('')
  const [pendingDelete, setPendingDelete] = useState<{
    id: number
    heading: string
    trackedAlertCount: number
  } | null>(null)

  const { data, isLoading } = usePostList(resource, { group, search: search.trim() || undefined })
  const posts = (data as PostSummary[] | undefined) ?? []
  const deletePost = useDeletePost(resource)
  const confirmDeletePost = useConfirmDeletePost(resource)

  const handleDeleteClick = (post: PostSummary) => {
    deletePost.mutate(post.id, {
      onSuccess: (result) => {
        const confirmRequired = result as ConfirmRequiredDelete | undefined
        if (confirmRequired?.confirm_required) {
          setPendingDelete({
            id: post.id,
            heading: post.card_heading,
            trackedAlertCount: confirmRequired.tracked_alert_count,
          })
        } else {
          showToast('Post deleted.', 'success')
        }
      },
      onError: (err) =>
        showToast(err instanceof ApiError ? err.message : 'Could not delete post. Please try again.', 'error'),
    })
  }

  const handleConfirmDelete = () => {
    if (!pendingDelete) return
    confirmDeletePost.mutate(pendingDelete.id, {
      onSuccess: () => {
        showToast('Post deleted.', 'success')
        setPendingDelete(null)
      },
      onError: (err) => {
        showToast(err instanceof ApiError ? err.message : 'Could not delete post. Please try again.', 'error')
        setPendingDelete(null)
      },
    })
  }

  return (
    <AppShell title={title} showBack>
      <Card>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-heading">{sectionLabel}</h2>
          {newPath && (
            <button
              type="button"
              onClick={() => navigate(newPath)}
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3.5 py-1.5 text-sm font-medium text-white hover:bg-primary-hover"
            >
              <Icon icon={faPlus} className="text-xs" />
              New
            </button>
          )}
        </div>

        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by heading, commission, title..."
          className="mb-4"
        />

        {isLoading && <p className="py-6 text-center text-sm text-body-subtle">Loading posts...</p>}

        {!isLoading && posts.length === 0 && (
          <div className="flex flex-col items-center py-10 text-center">
            <Icon icon={faFileAlt} className="mb-3 text-3xl text-border" />
            <p className="text-sm text-body-subtle">No posts found.</p>
          </div>
        )}

        <ul className="divide-y divide-border">
          {posts.map((post) => (
            <li key={post.id} className="flex items-center justify-between gap-3 py-3">
              <button
                type="button"
                onClick={() => navigate(editPath(post))}
                className="min-w-0 flex-1 text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-medium text-body">{post.card_heading}</span>
                  {renderBadge?.(post)}
                </div>
                <span className="block truncate text-xs text-body-subtle">
                  {post.commission_name} &middot; {post.title}
                </span>
                <span className="block text-[11px] text-body-subtle">{formatPublishedAt(post.published_at)}</span>
              </button>
              <button
                type="button"
                onClick={() => handleDeleteClick(post)}
                aria-label={`Delete ${post.card_heading}`}
                className="shrink-0 text-body-subtle hover:text-error"
              >
                <Icon icon={faTrashCan} />
              </button>
            </li>
          ))}
        </ul>
      </Card>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this post?"
        description={
          pendingDelete ? (
            <>
              Deleting <strong>{pendingDelete.heading}</strong>
              {pendingDelete.trackedAlertCount > 0 && (
                <>
                  {' '}
                  also removes <strong>{pendingDelete.trackedAlertCount}</strong> linked Tracked Alert
                  {pendingDelete.trackedAlertCount === 1 ? '' : 's'}
                </>
              )}
              . This action is permanent and cannot be undone.
            </>
          ) : null
        }
        confirmLabel="Delete Permanently"
        destructive
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </AppShell>
  )
}
