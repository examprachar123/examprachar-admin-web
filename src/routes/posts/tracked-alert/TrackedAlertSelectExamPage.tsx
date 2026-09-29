import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { faCalendarAlt, faFileAlt, faPlus } from '@fortawesome/free-solid-svg-icons'
import { AppShell } from '@/components/layout/AppShell'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { SearchInput } from '@/components/ui/SearchInput'
import { useLatestExamParentOptions } from '@/hooks/usePostForm'
import type { PostGroup } from '@/types/posts'

interface TrackedAlertSelectExamPageProps {
  variant: 'all-updates' | 'personalized'
}

function formatPublishedAt(value: string | null): string {
  if (!value) return 'Not yet published'
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

/**
 * Step 1 of "Post Tracked Alert": pick the Latest Exam post this alert will track. Replaces the
 * old in-form parent picker -- selecting here (the + button) hands off to TrackedAlertFormPage
 * with the parent already locked in, since a Tracked Alert's whole audience is inherited from it.
 */
export function TrackedAlertSelectExamPage({ variant }: TrackedAlertSelectExamPageProps) {
  const navigate = useNavigate()
  const group: PostGroup = variant === 'all-updates' ? 'all_updates' : 'personalized'
  const [search, setSearch] = useState('')
  const { data: options = [], isLoading } = useLatestExamParentOptions(group, search)

  const selectExam = (postId: number) => navigate(`/${variant}/tracked-alert/new/${postId}`)

  return (
    <AppShell title="Post Tracked Alert" showBack>
      <Card>
        <div className="mb-4">
          <h2 className="text-base font-semibold text-heading">Select an Exam</h2>
          <p className="mt-1 text-xs text-body-subtle">
            Choose the Latest Exam post this alert should track. It inherits that post's full audience.
          </p>
        </div>

        <SearchInput value={search} onChange={setSearch} placeholder="Search Latest Exam posts..." className="mb-4" />

        {isLoading && <p className="py-6 text-center text-sm text-body-subtle">Loading exams...</p>}

        {!isLoading && options.length === 0 && (
          <div className="flex flex-col items-center py-10 text-center">
            <Icon icon={faFileAlt} className="mb-3 text-3xl text-border" />
            <p className="text-sm text-body-subtle">No published Latest Exam posts found.</p>
          </div>
        )}

        <ul className="space-y-3">
          {options.map((post) => (
            <li key={post.id}>
              <div className="flex items-center justify-between gap-4 rounded-2xl border-[1.5px] border-border bg-white p-4 shadow-sm transition-colors hover:border-primary-border-accent">
                <button type="button" onClick={() => selectExam(post.id)} className="min-w-0 flex-1 text-left">
                  <p className="truncate text-sm font-bold text-heading">{post.card_heading}</p>
                  <p className="mt-0.5 truncate text-xs font-semibold text-body-subtle">
                    {post.commission_name} &middot; {post.title}
                  </p>
                  <span className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-border bg-page px-2.5 py-1 text-[11px] font-semibold text-body-subtle">
                    <Icon icon={faCalendarAlt} />
                    Published: {formatPublishedAt(post.published_at)}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => selectExam(post.id)}
                  aria-label={`Add tracked alert for ${post.card_heading}`}
                  title="Add tracked alert for this post"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-primary-border-accent bg-primary-gradient-from text-primary transition-colors hover:bg-primary hover:text-white"
                >
                  <Icon icon={faPlus} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      </Card>
    </AppShell>
  )
}
