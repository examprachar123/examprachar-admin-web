import type { ReactNode } from 'react'
import { faTrashCan } from '@fortawesome/free-solid-svg-icons'
import { Icon } from '@/components/ui/Icon'

const CONTACT_EMAIL = 'examprachar123@gmail.com'

const mail = (
  <a href={`mailto:${CONTACT_EMAIL}`} className="text-primary hover:underline">
    {CONTACT_EMAIL}
  </a>
)

const sections: { id: string; title: string; body: ReactNode }[] = [
  {
    id: 'our-commitment',
    title: 'Our commitment to you',
    body: (
      <>
        <p>
          You are in control of your personal data. Examprachar is committed to deleting your
          personal data when you ask us to, and we are legally and ethically liable to honour every
          valid deletion request made by you, as provided under India's Digital Personal Data
          Protection Act (DPDPA).
        </p>
        <p className="rounded-lg border border-primary-border-accent bg-primary-gradient-from px-4 py-3 text-sm">
          All of your data will be deleted within <span className="font-semibold">7 working days</span>{' '}
          of us receiving your verified request.
        </p>
      </>
    ),
  },
  {
    id: 'how-to-request',
    title: 'How to request data deletion',
    body: (
      <>
        <p>You can request deletion of your account and data in either of these ways:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <span className="font-medium text-body">Email us:</span> send your request to {mail}.
          </li>
          <li>
            <span className="font-medium text-body">In the app:</span> use the "Delete Account"
            option in the app's settings menu.
          </li>
        </ul>
        <p>To help us process your request quickly, please include the following in your email:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            Subject line: <span className="italic">"Data Deletion Request"</span>
          </li>
          <li>
            The mobile number registered with your Examprachar account (so we can locate and verify
            your account)
          </li>
          <li>A short statement that you want your account and all associated data deleted</li>
        </ul>
        <p>
          Your request should be sent from the email address or contact details linked to your
          account where possible. We may ask for additional information to confirm your identity
          before deleting anything, so that nobody else can delete your data.
        </p>
      </>
    ),
  },
  {
    id: 'what-we-delete',
    title: 'What data will be deleted',
    body: (
      <>
        <p>Once your request is verified, we will permanently delete:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Your mobile number and account login details</li>
          <li>Your profile information — state, gender, and educational qualifications</li>
          <li>Your notification preferences and tracked exam alerts</li>
          <li>Device data linked to your account, including device ID, model, and push tokens</li>
          <li>Any support correspondence containing your personal information</li>
        </ul>
        <p>
          Deletion is permanent and cannot be undone. After deletion you will be signed out, and
          you will need to register again as a new user if you want to use Examprachar in future.
        </p>
      </>
    ),
  },
  {
    id: 'timeline',
    title: 'Timeline',
    body: (
      <ol className="space-y-2">
        {[
          ['Day 0', 'We receive your request and acknowledge it by email.'],
          ['Within 7 working days', 'Your account and all associated personal data are deleted from our active databases.'],
          ['On completion', 'We send you a confirmation email that the deletion is complete.'],
        ].map(([k, v]) => (
          <li key={k} className="rounded-xl border border-border bg-white px-4 py-3">
            <div className="text-xs font-semibold uppercase tracking-wide text-body-subtle">{k}</div>
            <div className="mt-0.5 text-sm text-body">{v}</div>
          </li>
        ))}
      </ol>
    ),
  },
  {
    id: 'data-we-may-retain',
    title: 'Data we may be required to retain',
    body: (
      <>
        <p>
          We do not keep your personal data after deletion, except where we are required to retain
          specific records to comply with Indian law (for example, to resolve legal disputes or
          meet a statutory obligation). Any such data is kept only for the period the law requires,
          is not used for any other purpose, and is then deleted.
        </p>
        <p>
          Anonymised, aggregated data that cannot identify you may be retained for analytics and
          app performance purposes.
        </p>
      </>
    ),
  },
  {
    id: 'third-parties',
    title: 'Third-party service providers',
    body: (
      <p>
        Where your data was processed by trusted service providers on our behalf — such as cloud
        storage, authentication, and analytics services — we will ensure it is removed from those
        systems as part of the same deletion request. Data held independently by third parties,
        such as an ad network's own records, is governed by their privacy policies.
      </p>
    ),
  },
  {
    id: 'contact',
    title: 'Contact us',
    body: (
      <>
        <p>
          If you have questions about this policy or the status of your deletion request, or if
          your request has not been completed within 7 working days, please contact us.
        </p>
        <div className="rounded-xl border border-border bg-white px-5 py-4">
          <dl className="divide-y divide-border text-sm">
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-body-subtle">Company</dt>
              <dd className="font-medium text-heading">Examprachar</dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-body-subtle">Email</dt>
              <dd className="font-medium text-heading">{mail}</dd>
            </div>
            <div className="flex items-center justify-between py-2.5">
              <dt className="text-body-subtle">Location</dt>
              <dd className="font-medium text-heading">Kerala, India</dd>
            </div>
          </dl>
        </div>
        <p>
          See also our{' '}
          <a href="/privacy-policy" className="text-primary hover:underline">
            Privacy Policy
          </a>
          .
        </p>
      </>
    ),
  },
]

export function DataDeletionPolicyPage() {
  return (
    <div className="min-h-screen bg-page px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary">
          <span className="inline-block h-[2px] w-5 bg-primary" />
          Examprachar
        </div>
        <div className="mb-1 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-gradient-from to-primary-gradient-to">
            <Icon icon={faTrashCan} className="text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-heading">Data Deletion Policy</h1>
        </div>
        <p className="mb-6 text-sm text-body-subtle">Last updated: October 8, 2026</p>

        <p className="mb-10 text-body">
          This Data Deletion Policy explains how you can ask <span className="font-semibold">Examprachar</span>{' '}
          ("we," "us," or "our") to delete your personal data, and what happens when you do.
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
          <span>Last updated October 8, 2026</span>
        </footer>
      </div>
    </div>
  )
}
