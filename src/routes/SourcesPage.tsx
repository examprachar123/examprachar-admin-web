import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  faArrowUpRightFromSquare,
  faCircleCheck,
  faMagnifyingGlass,
  faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import { Icon } from '@/components/ui/Icon'
import { usePublicOfficialSources } from '@/hooks/useOfficialSources'

export function SourcesPage() {
  const { data: officialSources = [], isLoading, isError } = usePublicOfficialSources()
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return officialSources
    return officialSources.filter((s) => `${s.name} ${s.url}`.toLowerCase().includes(q))
  }, [officialSources, query])

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <header className="sticky top-0 z-40 border-b border-border bg-white">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 sm:px-6">
          <span className="flex items-baseline gap-2">
            <span className="text-xl font-bold tracking-tight text-primary">Examprachar</span>
            <span className="hidden rounded-full border border-primary-border-accent bg-primary-gradient-from px-2 py-0.5 text-[11px] font-semibold text-primary sm:inline-block">
              Official Sources Directory
            </span>
          </span>
        </div>
      </header>

      <main className="flex-1 py-8 sm:py-10">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="mb-6">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              <Icon icon={faCircleCheck} />
              Verified Public Government Sources
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-heading sm:text-3xl">
              Official Information Sources
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-body-muted sm:text-base">
              Examprachar aggregates public recruitment notifications, admit card updates, and
              examination results directly from official government commission and recruitment
              portals.
            </p>
          </div>

          <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
            <div className="flex items-start gap-3.5">
              <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-800">
                <Icon icon={faTriangleExclamation} />
              </div>
              <div className="flex-1 space-y-2.5 text-sm leading-relaxed text-amber-950">
                <h2 className="text-base font-bold text-amber-900">
                  Important Disclaimer: Not Affiliated with Any Government Entity
                </h2>
                <p className="font-bold">
                  Examprachar is a private, independent informational platform and is NOT
                  affiliated with, endorsed by, authorized by, or in any way officially associated
                  with the Government of India, any State Government, or any of their agencies,
                  ministries, departments, or recruitment boards.
                </p>
                <p>
                  All job notifications, admit cards, result announcements, and dates provided on
                  our application and website are curated from publicly accessible official
                  government websites.
                </p>
                <p>
                  We do not conduct recruitment, issue admit cards, or declare results. We strongly
                  advise all candidates to verify all recruitment details and criteria directly on
                  the respective official government websites listed below before applying or
                  submitting applications.
                </p>
              </div>
            </div>
          </div>

          <div className="mb-6 flex flex-col items-center justify-between gap-3 rounded-xl border border-border bg-white p-4 sm:flex-row">
            <div className="relative w-full sm:max-w-md">
              <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-body-subtle">
                <Icon icon={faMagnifyingGlass} />
              </span>
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name, board, or website..."
                className="w-full rounded-lg border border-input-border py-2 pr-4 pl-9 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 focus:outline-none"
              />
            </div>
            <div className="self-start whitespace-nowrap text-xs font-medium text-body-subtle sm:self-center sm:text-sm">
              Showing <span className="font-bold text-heading">{visible.length}</span> official
              sources
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {visible.map((s) => (
              <div
                key={s.id}
                className="flex items-start gap-3.5 rounded-xl border border-border bg-white p-4 transition-all hover:border-primary/40 hover:shadow-md sm:items-center"
              >
                <div
                  className="flex h-12 w-12 shrink-0 select-none items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ backgroundColor: s.color }}
                >
                  {s.abbr}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="mb-1 text-sm leading-snug font-semibold text-heading sm:text-[15px]">
                    {s.name}
                  </h2>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Visit official website: ${s.url}`}
                    className="inline-flex max-w-full items-center gap-1.5 text-xs font-medium text-primary hover:underline sm:text-sm"
                  >
                    <Icon icon={faArrowUpRightFromSquare} className="shrink-0 text-[11px]" />
                    <span className="truncate">{s.host}</span>
                  </a>
                </div>
              </div>
            ))}
          </div>

          {visible.length === 0 && (
            <div className="mt-4 rounded-xl border border-border bg-white p-8 text-center text-body-subtle">
              {isLoading
                ? 'Loading official sources...'
                : isError
                  ? 'Could not load official sources. Please try again later.'
                  : 'No official sources match your search.'}
            </div>
          )}
        </div>
      </main>

      <footer className="mt-auto border-t border-border bg-white py-6">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 px-4 text-xs text-body-subtle sm:flex-row sm:px-6 sm:text-sm">
          <span>© 2026 Examprachar. All rights reserved.</span>
          <div className="flex flex-wrap items-center justify-center gap-3 font-medium sm:gap-4">
            <Link to="/about-us" className="hover:text-heading">
              About Us
            </Link>
            <span>•</span>
            <Link to="/disclaimer" className="hover:text-heading">
              Disclaimer
            </Link>
            <span>•</span>
            <Link to="/privacy-policy" className="hover:text-heading">
              Privacy Policy
            </Link>
            <span>•</span>
            <Link to="/terms-and-conditions" className="hover:text-heading">
              Terms
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
