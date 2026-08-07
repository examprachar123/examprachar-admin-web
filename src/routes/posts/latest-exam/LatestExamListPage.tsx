import { PostListPage } from '@/components/posts/PostListPage'

interface LatestExamListPageProps {
  variant: 'all-updates' | 'personalized'
}

export function LatestExamListPage({ variant }: LatestExamListPageProps) {
  const group = variant === 'all-updates' ? 'all_updates' : 'personalized'
  const basePath = variant === 'all-updates' ? '/all-updates/latest-exam' : '/personalized/latest-exam'

  return (
    <PostListPage
      resource="latest-exams"
      group={group}
      newPath={`${basePath}/new`}
      editPath={(post) => `${basePath}/${post.id}/edit`}
      title="Latest Exam · Manage Published"
      sectionLabel={variant === 'all-updates' ? 'All Updates' : 'Personalized'}
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
