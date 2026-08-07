import { PostListPage } from '@/components/posts/PostListPage'

export function ResultListPage() {
  return (
    <PostListPage
      resource="results"
      group="all_updates"
      newPath="/all-updates/result/new"
      editPath={(post) => `/all-updates/result/${post.id}/edit`}
      title="Result · Manage Published"
      sectionLabel="All Updates"
      renderBadge={() => (
        <span className="shrink-0 rounded-full bg-primary-gradient-from px-2 py-0.5 text-[10px] font-semibold text-primary">
          OUT NOW
        </span>
      )}
    />
  )
}
