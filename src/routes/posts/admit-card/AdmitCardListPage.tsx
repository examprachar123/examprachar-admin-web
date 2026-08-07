import { PostListPage } from '@/components/posts/PostListPage'

export function AdmitCardListPage() {
  return (
    <PostListPage
      resource="admit-cards"
      group="all_updates"
      newPath="/all-updates/admit-card/new"
      editPath={(post) => `/all-updates/admit-card/${post.id}/edit`}
      title="Admit Card · Manage Published"
      sectionLabel="All Updates"
      renderBadge={(post) =>
        post.is_urgent ? (
          <span className="shrink-0 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold text-error">
            URGENT
          </span>
        ) : null
      }
    />
  )
}
