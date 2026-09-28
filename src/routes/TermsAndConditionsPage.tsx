import type { ReactNode } from 'react'
import { faFileContract } from '@fortawesome/free-solid-svg-icons'
import { Icon } from '@/components/ui/Icon'

const sources = [
  { name: 'Staff Selection Commission', url: 'https://ssc.gov.in/' },
  { name: 'Union Public Service Commission', url: 'https://upsc.gov.in/' },
  { name: 'Institute of Banking Personnel Selection', url: 'https://ibps.in/' },
  { name: 'National Testing Agency', url: 'https://nta.ac.in/' },
  { name: 'Employment News', url: 'http://employmentnews.gov.in/' },
]

const sections: { id: string; title: string; body: ReactNode }[] = [
  {
    id: 'agreement-to-terms',
    title: 'Agreement to terms',
    body: (
      <>
        <p>
          These Terms and Conditions constitute a legally binding agreement made between you,
          whether personally or on behalf of an entity ("you"), and Examprachar ("we," "us," or
          "our"), concerning your access to and use of the Examprachar mobile application (the
          "App"). By downloading, accessing, or using the App, you agree that you have read,
          understood, and agreed to be bound by all of these Terms and Conditions. If you do not
          agree with all of these Terms, then you are expressly prohibited from using the App and
          you must discontinue use immediately.
        </p>
        <p>
          You must be at least 18 years of age to use the App. By using the App, you represent and
          warrant that you meet this age requirement.
        </p>
      </>
    ),
  },
  {
    id: 'services-and-disclaimers',
    title: 'Our services, sources of information & disclaimers',
    body: (
      <>
        <p>
          Examprachar is an independent platform that delivers fast updates, notifications, admit
          cards, and results for Indian competitive government exams. Please read the following
          disclaimers carefully.
        </p>
        <p>
          <span className="italic">Government affiliation disclaimer.</span> Examprachar is a
          private, independent educational platform. We do not represent, nor are we affiliated
          with, endorsed by, or partnered with any government agency, political entity, or
          official examination board.
        </p>
        <p>
          <span className="italic">Sources of information.</span> All exam notifications, syllabi,
          and results provided within the App are aggregated strictly from publicly available
          official government portals, employment news, and press releases. Primary sources
          include, but are not limited to:
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
        <p className="rounded-lg border border-primary-border-accent bg-primary-gradient-from px-4 py-3 text-sm">
          <span className="italic">Accuracy & verification (as-is clause).</span> All exam
          notifications and details are provided for informational purposes only on an "as-is"
          basis. We do not guarantee the accuracy, completeness, or timeliness of the information.
          Users are strictly advised to cross-verify all exam dates, application deadlines, and
          notifications directly with the official government websites listed above. We are not
          liable for any missed deadlines or incorrect applications.
        </p>
        <p>
          <span className="italic">No guarantee of employment.</span> The use of our App does not
          guarantee that you will pass any examination, clear cutoff marks, or secure government
          employment.
        </p>
      </>
    ),
  },
  {
    id: 'user-accounts',
    title: 'User accounts',
    body: (
      <p>
        To use certain features of the App, you may be required to register for an account using
        your mobile number and an OTP (One-Time Password), and provide profile details (such as
        your gender, state, and educational qualifications). You agree to provide true, accurate,
        and current information. You are responsible for keeping your mobile device secure and
        your OTP confidential. You are strictly prohibited from selling, renting, or otherwise
        transferring your Examprachar profile to another person.
      </p>
    ),
  },
  {
    id: 'prohibited-activities',
    title: 'Prohibited activities',
    body: (
      <>
        <p>
          You may not access or use the App for any purpose other than that for which we make the
          App available. You agree not to:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Use the App to advertise or offer to sell goods and services.</li>
          <li>
            Systematically retrieve data or other content from the App to create or compile a
            database or directory (scraping).
          </li>
          <li>Interfere with, disrupt, or create an undue burden on the App's servers or networks.</li>
          <li>Attempt to bypass any security measures of the App designed to prevent or restrict access.</li>
        </ul>
      </>
    ),
  },
  {
    id: 'third-party-websites',
    title: 'Third-party websites and advertisers',
    body: (
      <>
        <p>
          The App may contain links to third-party websites (such as official exam registration
          portals) and display third-party advertisements (such as banners for coaching
          institutes).
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            We do not own or control these third-party websites and are not responsible for their
            content, security, or privacy practices.
          </li>
          <li>
            We do not endorse the products, services, or coaching institutes advertised in the App.
            If you choose to interact with an advertiser or purchase a service from a coaching
            institute found through our App, you do so at your own risk. We hold no legal liability
            for any losses, scams, or dissatisfaction arising from third-party advertisers.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'availability-force-majeure',
    title: 'App availability & force majeure',
    body: (
      <>
        <p>
          We reserve the right to change, modify, or remove the contents of the App at any time at
          our sole discretion without notice. We cannot guarantee the App will be available at all
          times.
        </p>
        <p>
          <span className="italic">Force majeure.</span> We shall not be held liable for any breach
          of these Terms, server downtime, or delay in updates if such failure is caused by events
          beyond our reasonable control. This includes, but is not limited to, internet and
          telecommunication outages, government-mandated internet shutdowns, natural disasters
          (acts of God), floods, fires, strikes, or unauthorized cyber-attacks. We are not liable
          for any missed exam application deadlines caused by your inability to access the App
          during such disruptions.
        </p>
      </>
    ),
  },
  {
    id: 'limitation-of-liability',
    title: 'Limitation of liability',
    body: (
      <p>
        In no event will we be liable to you or any third party for any direct, indirect,
        consequential, exemplary, incidental, special, or punitive damages arising from your use
        of the App. Notwithstanding anything to the contrary contained herein, our liability to
        you for any cause whatsoever and regardless of the form of the action, will at all times be
        limited to the amount paid, if any, by you to us. Because the App is provided to you
        completely free of charge, our maximum legal and financial liability to you is strictly
        limited to zero.
      </p>
    ),
  },
  {
    id: 'dispute-resolution',
    title: 'Dispute resolution',
    body: (
      <>
        <p>
          To expedite resolution and control the cost of any dispute, controversy, or claim related
          to these Terms and Conditions, you and Examprachar agree to first attempt to negotiate
          any dispute informally for at least thirty (30) days before initiating arbitration.
        </p>
        <p>
          If the dispute cannot be resolved through informal negotiations, it will be finally and
          exclusively resolved by binding arbitration under the Arbitration and Conciliation Act,
          1996. The legal jurisdiction for any disputes, arbitration, or legal proceedings shall
          fall exclusively within the courts located in{' '}
          <span className="font-semibold text-heading">Ernakulam, Kerala, India</span>.
        </p>
      </>
    ),
  },
  {
    id: 'modifications-to-terms',
    title: 'Modifications to terms',
    body: (
      <p>
        We may update these Terms and Conditions from time to time. We will alert you about any
        changes by updating the "Last updated" date of these Terms, and you waive any right to
        receive specific notice of each such change. It is your responsibility to periodically
        review these Terms and Conditions to stay informed of updates.
      </p>
    ),
  },
  {
    id: 'contact-us',
    title: 'Contact us',
    body: (
      <>
        <p>
          In order to resolve a complaint regarding the App or to receive further information
          regarding the use of the App, please contact us.
        </p>
        <div className="rounded-xl border border-border bg-white px-5 py-4">
          <dl className="divide-y divide-border text-sm">
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-body-subtle">Examprachar</dt>
              <dd className="font-medium text-heading">
                <a href="mailto:examprachar123@gmail.com" className="text-primary hover:underline">
                  examprachar123@gmail.com
                </a>
              </dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-body-subtle">Location</dt>
              <dd className="font-medium text-heading">Kerala, India</dd>
            </div>
          </dl>
        </div>
      </>
    ),
  },
]

export function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-page px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary">
          <span className="inline-block h-[2px] w-5 bg-primary" />
          Examprachar
        </div>
        <div className="mb-1 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-gradient-from to-primary-gradient-to">
            <Icon icon={faFileContract} className="text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-heading">Terms and Conditions</h1>
        </div>
        <p className="mb-6 text-sm text-body-subtle">Last updated: September 14, 2026</p>

        <p className="mb-10 border-l-2 border-border pl-4 text-xs italic text-body-subtle">
          This document is an electronic record in terms of the Information Technology Act, 2000,
          and the rules made thereunder. This electronic record is generated by a computer system
          and does not require any physical or digital signatures.
        </p>

        <nav className="mb-10 rounded-2xl border-[1.5px] border-border bg-white p-5">
          <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-body-subtle">
            On this page
          </div>
          <ol className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
            {sections.map((s, i) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  className="flex items-baseline gap-2 text-sm text-body hover:text-primary hover:underline"
                >
                  <span className="min-w-4 font-semibold text-primary">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <div className="space-y-10">
          {sections.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-6">
              <h2 className="mb-3 flex items-baseline gap-2 border-b border-border pb-2.5 text-lg font-semibold text-heading">
                <span className="text-sm font-bold text-primary">{String(i + 1).padStart(2, '0')}</span>
                {s.title}
              </h2>
              <div className="space-y-3 text-sm leading-relaxed text-body [&_a]:font-medium">
                {s.body}
              </div>
            </section>
          ))}
        </div>

        <footer className="mt-14 flex flex-wrap items-center justify-between gap-2 border-t border-border pt-6 text-xs text-body-subtle">
          <span>© 2026 Examprachar</span>
          <span>Last updated September 14, 2026</span>
        </footer>
      </div>
    </div>
  )
}
