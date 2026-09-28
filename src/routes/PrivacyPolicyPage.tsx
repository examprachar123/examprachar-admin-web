import type { ReactNode } from 'react'
import { faShieldHalved } from '@fortawesome/free-solid-svg-icons'
import { Icon } from '@/components/ui/Icon'

const sections: { id: string; title: string; body: ReactNode }[] = [
  {
    id: 'what-we-collect',
    title: 'What information do we collect?',
    body: (
      <>
        <p>
          We collect personal information that you voluntarily provide when you register for an
          account or contact us for support:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Mobile number</li>
          <li>State of residence</li>
          <li>Gender</li>
          <li>Educational qualifications</li>
        </ul>
        <p className="rounded-lg border border-primary-border-accent bg-primary-gradient-from px-4 py-3 text-sm">
          <span className="italic">Sensitive information.</span> We do not collect or process
          sensitive personal information.
        </p>
        <p>
          <span className="italic">Application data.</span> To ensure the app functions correctly,
          we automatically collect:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <span className="font-medium text-body">Mobile device data:</span> device ID, model,
            manufacturer, operating system and version, and IP address.
          </li>
          <li>
            <span className="font-medium text-body">Push notifications:</span> sent for account and
            exam alerts — you can turn these off anytime in your device settings.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'how-we-use-it',
    title: 'How do we use your information?',
    body: (
      <ul className="list-disc space-y-1 pl-5">
        <li>To facilitate account creation, secure OTP login authentication, and manage your user profile.</li>
        <li>To deliver the requested exam notification services based on your state and qualifications.</li>
        <li>To deliver targeted in-app advertising banners relevant to your profile.</li>
        <li>To respond to your inquiries and offer technical support.</li>
        <li>To protect our application — fraud monitoring and prevention.</li>
        <li>To identify technical crashes and evaluate overall app performance.</li>
        <li>To comply with our legal obligations under Indian law.</li>
      </ul>
    ),
  },
  {
    id: 'how-we-share-it',
    title: 'How do we share your information?',
    body: (
      <>
        <p className="rounded-lg border border-primary-border-accent bg-primary-gradient-from px-4 py-3 text-sm">
          We do not sell your personal data. We do not share, sell, or transfer your personal
          profile data (such as your mobile number or state) to third parties for their own
          independent use.
        </p>
        <p>
          We only share data with trusted third-party service providers who perform technical
          services on our behalf:
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            ['Advertising', 'Ad networks, e.g. Google AdSense'],
            ['Infrastructure', 'Cloud computing & data storage services'],
            ['Accounts', 'User registration & authentication services'],
            ['Monitoring', 'Performance monitoring & data analytics'],
          ].map(([k, v]) => (
            <div key={k} className="rounded-xl border border-border bg-white px-4 py-3">
              <div className="text-xs font-semibold uppercase tracking-wide text-body-subtle">{k}</div>
              <div className="mt-0.5 text-sm text-body">{v}</div>
            </div>
          ))}
        </div>
      </>
    ),
  },
  {
    id: 'government-disclaimer',
    title: 'Government information disclaimer',
    body: (
      <p>
        Examprachar is an independent, private platform. We do not represent, nor are we
        affiliated with or endorsed by, any government or political entity. All exam
        notifications, syllabi, and results provided within the app are sourced from publicly
        available official government portals and press releases.
      </p>
    ),
  },
  {
    id: 'third-parties-tracking',
    title: 'Third-party websites & tracking technologies',
    body: (
      <>
        <p>
          The app may contain advertisements or links to third-party websites, such as official
          exam portals, that are not affiliated with us. We are not responsible for the privacy and
          security practices of any third parties.
        </p>
        <p>
          We use basic tracking technologies to gather diagnostic and performance information to
          prevent crashes, fix bugs, and serve targeted advertisements via our trusted ad networks.
        </p>
      </>
    ),
  },
  {
    id: 'retention',
    title: 'How long do we keep your information?',
    body: (
      <p>
        We keep your personal information only for as long as necessary for the purposes set out in
        this Privacy Policy — for the duration you maintain an active account with us. Once your
        account is deleted, your data is removed from our active databases.
      </p>
    ),
  },
  {
    id: 'security',
    title: 'How do we keep your information safe?',
    body: (
      <p>
        We implement appropriate technical and organizational security measures, including
        industry-standard cloud encryption, designed to protect your personal information. However,
        no electronic transmission over the internet can be guaranteed to be 100% secure.
      </p>
    ),
  },
  {
    id: 'childrens-privacy',
    title: "Children's privacy",
    body: (
      <p>
        Our application is intended strictly for adult government exam aspirants. We do not
        knowingly collect data from, track, or serve targeted advertisements to anyone under 18
        years of age. By using Examprachar, you represent that you are at least 18 years old. If we
        learn that personal information from a user under 18 has been collected, we will deactivate
        the account and promptly delete the data.
      </p>
    ),
  },
  {
    id: 'your-rights',
    title: 'Your privacy rights & account deletion',
    body: (
      <>
        <p>
          Under India's Digital Personal Data Protection Act (DPDPA), you have the right to access,
          correct, or delete your personal information, and the right to withdraw your consent for
          data processing at any time.
        </p>
        <p>
          <span className="italic">Account deletion.</span> You may request total deletion of your
          account and all associated personal data at any time:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Use the "Delete Account" option in the app's settings menu.</li>
          <li>
            Or email a deletion request to{' '}
            <a href="mailto:examprachar123@gmail.com" className="text-primary hover:underline">
              examprachar123@gmail.com
            </a>
            .
          </li>
        </ul>
      </>
    ),
  },
  {
    id: 'policy-updates',
    title: 'Updates to this policy',
    body: (
      <p>
        We may update this Privacy Policy from time to time to stay compliant with relevant laws or
        Google Play Developer Policies. The updated version will be indicated by a new "Last
        updated" date at the top of this document.
      </p>
    ),
  },
  {
    id: 'grievance-officer',
    title: 'Grievance officer & contact information',
    body: (
      <>
        <p>
          In accordance with the Digital Personal Data Protection Act (DPDPA), if you have any
          grievances, questions, or requests regarding your personal data or this Privacy Policy,
          you may contact our Grievance Officer.
        </p>
        <div className="rounded-xl border border-border bg-white px-5 py-4">
          <dl className="divide-y divide-border text-sm">
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-body-subtle">Grievance Officer</dt>
              <dd className="font-medium text-heading">Examprachar</dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-body-subtle">Email</dt>
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

export function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-page px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary">
          <span className="inline-block h-[2px] w-5 bg-primary" />
          Examprachar
        </div>
        <div className="mb-1 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-gradient-from to-primary-gradient-to">
            <Icon icon={faShieldHalved} className="text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-heading">Privacy Policy</h1>
        </div>
        <p className="mb-6 text-sm text-body-subtle">Last updated: September 14, 2026</p>

        <p className="mb-6 border-l-2 border-border pl-4 text-xs italic text-body-subtle">
          This Privacy Policy is an electronic record in the form of an electronic contract formed
          under the Information Technology Act, 2000, and the rules made thereunder. This
          electronic record is generated by a computer system and does not require any physical or
          digital signatures.
        </p>

        <p className="mb-4 text-body">
          This Privacy Policy for <span className="font-semibold">Examprachar</span> ("we," "us,"
          or "our") describes how and why we access, collect, store, use, and process your personal
          information when you use our services, including when you download and use our mobile
          application, Examprachar.
        </p>
        <p className="mb-4 text-body">
          Examprachar is an independent mobile application that delivers fast and clean updates for
          Indian competitive government exams — timely notifications, admit cards, results, and
          tracked alerts matched directly to a user's eligibility.
        </p>
        <p className="mb-10 text-body">
          If you do not agree with our policies and practices, please do not use our app. Questions
          or concerns can be sent to{' '}
          <a href="mailto:examprachar123@gmail.com" className="text-primary hover:underline">
            examprachar123@gmail.com
          </a>
          .
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
