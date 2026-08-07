import { PostListPage } from '@/components/posts/PostListPage'

interface UpcomingExamListPageProps {
  variant: 'all-updates' | 'personalized'
}

export function UpcomingExamListPage({ variant }: UpcomingExamListPageProps) {
  const group = variant === 'all-updates' ? 'all_updates' : 'personalized'
  const basePath = variant === 'all-updates' ? '/all-updates/upcoming-exam' : '/personalized/upcoming-exam'

  return (
    <PostListPage
      resource="upcoming-exams"
      group={group}
      newPath={`${basePath}/new`}
      editPath={(post) => `${basePath}/${post.id}/edit`}
      title="Upcoming Exam · Manage Published"
      sectionLabel={variant === 'all-updates' ? 'All Updates' : 'Personalized'}
      renderBadge={() => (
        <span className="shrink-0 rounded-full bg-primary-gradient-from px-2 py-0.5 text-[10px] font-semibold text-primary">
          UPCOMING
        </span>
      )}
    />
  )
}
