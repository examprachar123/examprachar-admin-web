import {
  faBell,
  faBullseye,
  faLocationDot,
  faStopwatch,
  faTableList,
} from '@fortawesome/free-solid-svg-icons'
import { Icon } from '@/components/ui/Icon'

const features = [
  {
    icon: faTableList,
    title: 'Smart Personalized Tab',
    body: 'A dedicated space where you receive exam updates strictly tailored to your educational qualifications, guiding you seamlessly from start to end.',
  },
  {
    icon: faBell,
    title: "The 'Track' Button",
    body: "Found an exam you want to apply for? Tap the 'Track' button on the exam card and we'll send you direct, personalized updates for that specific exam — from the initial notification all the way to the final results.",
  },
  {
    icon: faLocationDot,
    title: 'State Tags',
    body: 'Looking for a job close to home? Our clear State Tags let you instantly filter and find government exams specific to your state.',
  },
  {
    icon: faStopwatch,
    title: 'Urgency Cards',
    body: 'Deadlines sneak up fast. Our Urgency Cards highlight approaching closing dates so you never miss a final application day again.',
  },
]

export function AboutUsPage() {
  return (
    <div className="min-h-screen bg-page px-4 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-primary">
          <span className="inline-block h-[2px] w-5 bg-primary" />
          Examprachar
        </div>
        <div className="mb-1 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-gradient-from to-primary-gradient-to">
            <Icon icon={faBullseye} className="text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-heading">About Us</h1>
        </div>
        <p className="mb-10 text-sm text-body-subtle">Why we built Examprachar</p>

        <section className="mb-10">
          <h2 className="mb-3 border-b border-border pb-2.5 text-lg font-semibold text-heading">
            Our Story
          </h2>
          <div className="space-y-3 text-sm leading-relaxed text-body">
            <p>
              Every year, millions of students put their heart and soul into preparing for
              government exams. Yet, too many hardworking aspirants miss out on their dream jobs
              for one simple reason: they didn't get the right information at the right time. They
              struggle to find exams that match their specific qualifications, or worse, they miss
              a crucial application deadline.
            </p>
            <p>
              Examprachar was built to solve this exact problem. We understand the journey of an
              aspirant, and we believe that your only job should be to study. Finding the right
              exam and tracking its updates is our job.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 border-b border-border pb-2.5 text-lg font-semibold text-heading">
            Designed for Your Success
          </h2>
          <p className="mb-4 text-sm leading-relaxed text-body">
            We built Examprachar to cut through the noise and deliver only what matters to you. Our
            platform is designed with unique tools to keep you ahead:
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-border bg-white p-4">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-primary-gradient-from">
                  <Icon icon={f.icon} className="text-sm text-primary" />
                </div>
                <div className="mb-1 text-sm font-semibold text-heading">{f.title}</div>
                <p className="text-sm leading-relaxed text-body-subtle">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-3 border-b border-border pb-2.5 text-lg font-semibold text-heading">
            Our Promise to You
          </h2>
          <div className="space-y-3 text-sm leading-relaxed text-body">
            <p className="rounded-lg border border-primary-border-accent bg-primary-gradient-from px-4 py-3">
              Our promise is simple:{' '}
              <span className="font-semibold text-heading">
                you will not miss a single update, and you will always find the right exams for
                what you have studied.
              </span>
            </p>
            <p>
              With Examprachar, you will never have to worry about missing an opportunity again.
              You focus on your preparation, and we will make sure you get the right updates, right
              on time.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
