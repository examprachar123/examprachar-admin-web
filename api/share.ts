// Public landing page for links shared from the mobile app, e.g.
// https://app.examprachar.com/exam/123 (rewritten here by vercel.json).
//
// It is a serverless function rather than a React route because WhatsApp and
// other link-preview crawlers do not run JavaScript: the Open Graph tags have
// to be in the HTML we return. Devices with the app installed never see this
// page -- Android App Links open the app directly.

interface Req {
  query: Record<string, string | string[] | undefined>
}
interface Res {
  status(code: number): Res
  setHeader(name: string, value: string): Res
  send(body: string): Res
}

const SITE = 'https://app.examprachar.com'
const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=com.examprachar.app'

// type -> [API list segment, human label]. Types match the paths in vercel.json
// and SHARE_PATHS in the mobile app (src/utils/shareLink.js).
const TYPES: Record<string, { endpoint: string; label: string }> = {
  exam: { endpoint: 'latest-exams', label: 'Exam Notification' },
  'admit-card': { endpoint: 'admit-cards', label: 'Admit Card' },
  result: { endpoint: 'results', label: 'Result' },
  upcoming: { endpoint: 'upcoming-exams', label: 'Upcoming Exam' },
  alert: { endpoint: 'tracked-alerts', label: 'Tracked Alert' },
}

interface PostSummary {
  title_hero?: string
  commission_name_hero?: string
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`)

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

async function fetchPost(endpoint: string, id: string): Promise<PostSummary | null> {
  // VITE_API_BASE_URL already ends in /api (the admin API); the app API lives at /api/app.
  const base = process.env.API_BASE_URL ?? process.env.VITE_API_BASE_URL
  if (!base) return null
  try {
    const response = await fetch(`${base.replace(/\/$/, '')}/app/posts/${endpoint}/${id}/`, {
      headers: { Accept: 'application/json' },
    })
    return response.ok ? ((await response.json()) as PostSummary) : null
  } catch {
    return null
  }
}

function renderPage(opts: { title: string; description: string; url: string; deepLink: string }) {
  const title = escapeHtml(opts.title)
  const description = escapeHtml(opts.description)
  const url = escapeHtml(opts.url)
  const image = `${SITE}/share-logo.png`
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title} | Examprachar</title>
<meta name="description" content="${description}" />
<link rel="canonical" href="${url}" />
<meta property="og:site_name" content="Examprachar" />
<meta property="og:type" content="article" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:url" content="${url}" />
<meta property="og:image" content="${image}" />
<meta name="twitter:card" content="summary" />
<style>
  body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#f8fafc;color:#1e293b;display:flex;min-height:100vh;align-items:center;justify-content:center;padding:24px;box-sizing:border-box}
  .card{max-width:420px;width:100%;background:#fff;border-radius:20px;padding:28px 24px;box-shadow:0 4px 24px rgba(79,70,229,.1);text-align:center}
  img{width:72px;height:72px;border-radius:18px}
  h1{font-size:20px;line-height:1.3;margin:16px 0 8px}
  p{margin:0 0 20px;color:#475569;font-size:14px;line-height:1.5}
  a.btn{display:block;padding:13px;border-radius:12px;font-weight:700;font-size:15px;text-decoration:none;margin-top:10px}
  .primary{background:#4f46e5;color:#fff}
  .secondary{background:#eef2ff;color:#4f46e5}
</style>
</head>
<body>
<main class="card">
  <img src="/share-logo.png" alt="Examprachar" />
  <h1>${title}</h1>
  <p>${description}</p>
  <a class="btn primary" href="${escapeHtml(opts.deepLink)}">Open in app</a>
  <a class="btn secondary" href="${PLAY_STORE_URL}">Get it on Google Play</a>
</main>
</body>
</html>`
}

export default async function handler(req: Req, res: Res) {
  const type = first(req.query.type) ?? ''
  const id = first(req.query.id) ?? ''
  const config = TYPES[type]

  res.setHeader('Content-Type', 'text/html; charset=utf-8')

  if (!config || !/^\d+$/.test(id)) {
    res.status(404).send(
      renderPage({
        title: 'Page not found',
        description: 'This link is invalid. Get the Examprachar app for the latest exam updates.',
        url: SITE,
        deepLink: 'examprachar://',
      }),
    )
    return
  }

  const post = await fetchPost(config.endpoint, id)
  const heading = post?.title_hero || `${config.label} on Examprachar`
  const description = post?.commission_name_hero
    ? `${post.commission_name_hero} - ${config.label}. Get the Examprachar app for the latest exam updates.`
    : `${config.label}. Get the Examprachar app for the latest exam updates.`

  // Cache at the edge so a post shared widely doesn't hit the backend per click.
  res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=3600')
  res.status(200).send(
    renderPage({
      title: heading,
      description,
      url: `${SITE}/${type}/${id}`,
      deepLink: `examprachar://${type}/${id}`,
    }),
  )
}
