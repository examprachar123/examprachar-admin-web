import { faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { Icon } from '@/components/ui/Icon'

const sources = [
  { name: 'Employment News', url: 'http://employmentnews.gov.in/' },
  { name: 'Staff Selection Commission (SSC)', url: 'https://ssc.gov.in/' },
  { name: 'Union Public Service Commission (UPSC)', url: 'https://upsc.gov.in/' },
  { name: 'National Testing Agency (NTA)', url: 'https://nta.ac.in/' },
  { name: 'Institute of Banking Personnel Selection (IBPS)', url: 'https://ibps.in/' },
]

export function DisclaimerPage() {
  return (
    <div className="min-h-screen bg-page px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary">
          <span className="inline-block h-[2px] w-5 bg-primary" />
          Examprachar
        </div>
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-gradient-from to-primary-gradient-to">
            <Icon icon={faTriangleExclamation} className="text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-heading">Disclaimer</h1>
        </div>

        <div className="space-y-10">
          <section>
            <h2 className="mb-3 border-b border-border pb-2.5 text-lg font-semibold text-heading">
              No Government Affiliation
            </h2>
            <p className="text-sm leading-relaxed text-body">
              Examprachar is an independent, private educational platform and is{' '}
              <span className="font-semibold text-heading">NOT</span> affiliated with, endorsed by,
              or connected to the Government of India, any State Government, or any official
              government agency. This app does not represent any government entity.
            </p>
          </section>

          <section>
            <h2 className="mb-3 border-b border-border pb-2.5 text-lg font-semibold text-heading">
              No Guarantee of Accuracy
            </h2>
            <p className="mb-3 text-sm leading-relaxed text-body">
              While we strive to provide fast and accurate updates, all exam notifications,
              results, and details are provided on an "as-is" basis for informational purposes
              only. Examprachar makes no claims or guarantees regarding the accuracy,
              completeness, or legality of the content.
            </p>
            <p className="rounded-lg border border-primary-border-accent bg-primary-gradient-from px-4 py-3 text-sm text-body">
              Users are strictly advised to cross-check and verify all information, dates, and
              application processes directly on the official government websites before making any
              decisions. We are not responsible for any inadvertent errors, missed deadlines, or
              financial losses.
            </p>
          </section>

          <section>
            <h2 className="mb-3 border-b border-border pb-2.5 text-lg font-semibold text-heading">
              Sources of Information
            </h2>
            <p className="mb-4 text-sm leading-relaxed text-body">
              All information provided in this app is aggregated from publicly available official
              government press releases, employment news, and official websites, including but not
              limited to:
            </p>
            <ul className="space-y-2">
              {sources.map((s) => (
                <li
                  key={s.url}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-white px-4 py-3"
                >
                  <span className="text-sm font-medium text-heading">{s.name}</span>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-sm text-primary hover:underline"
                  >
                    {s.url}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
