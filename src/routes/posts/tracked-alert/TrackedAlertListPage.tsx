import { PostListPage } from '@/components/posts/PostListPage'

/**
 * Unified across both Dashboard entry points — the API only documents filtering this list by
 * ?parent=, not by group (unlike every other post type), so there's no group-scoped list to
 * show. Each row still routes to the correct group-scoped edit route using the alert's own
 * `group` (server-derived from its parent), since editing does need that context.
 */
export function TrackedAlertListPage() {
  return (
    <PostListPage
      resource="tracked-alerts"
      editPath={(post) => `/${post.group === 'personalized' ? 'personalized' : 'all-updates'}/tracked-alert/${post.id}/edit`}
      title="Tracked Alerts · Manage Published"
      sectionLabel="All Tracked Alerts"
    />
  )
}
