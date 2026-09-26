const SITE_URL = 'https://charanrajofficial.vercel.app'
const PAGE_SIZE = 1000
const MAX_PAGES = 20

function xmlEscape(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')
}

function publishedDate(fields) {
  const value = fields?.publishedAt
  const raw = value?.timestampValue || value?.stringValue
  if (!raw) return ''
  const date = new Date(raw)
  return Number.isNaN(date.getTime()) ? '' : date.toISOString()
}

async function getPublishedPosts(projectId, apiKey) {
  const posts = []
  let pageToken

  for (let page = 0; page < MAX_PAGES; page += 1) {
    const url = new URL(
      `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/blogPosts`,
    )
    url.searchParams.set('pageSize', String(PAGE_SIZE))
    if (apiKey) url.searchParams.set('key', apiKey)
    if (pageToken) url.searchParams.set('pageToken', pageToken)

    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Firestore returned ${response.status} while listing published blog posts.`)
    }

    const data = await response.json()
    for (const document of data.documents || []) {
      if (document.fields?.status?.stringValue !== 'published') continue
      const id = document.name?.split('/').pop()
      if (id) posts.push({ id, publishedAt: publishedDate(document.fields) })
    }

    pageToken = data.nextPageToken
    if (!pageToken) return posts
  }

  throw new Error(`Published blog post listing exceeded the ${MAX_PAGES}-page sitemap limit.`)
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).send('Method not allowed.')
  }

  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID
  if (!projectId) {
    return res.status(503).send('Sitemap is temporarily unavailable.')
  }

  try {
    const posts = await getPublishedPosts(projectId, process.env.VITE_FIREBASE_API_KEY)
    const entries = [
      { path: '/', lastmod: '' },
      { path: '/blog', lastmod: '' },
      ...posts.map((post) => ({
        path: `/blog/${encodeURIComponent(post.id)}`,
        lastmod: post.publishedAt,
      })),
    ]
    const urls = entries.map(({ path, lastmod }) => {
      const lastModified = lastmod ? `<lastmod>${xmlEscape(lastmod)}</lastmod>` : ''
      return `<url><loc>${xmlEscape(new URL(path, SITE_URL).href)}</loc>${lastModified}</url>`
    })

    res.setHeader('Content-Type', 'application/xml; charset=utf-8')
    res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
    return res.status(200).send(
      `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join('')}</urlset>`,
    )
  } catch (error) {
    console.error('Failed to generate sitemap:', error)
    return res.status(503).send('Sitemap is temporarily unavailable.')
  }
}
