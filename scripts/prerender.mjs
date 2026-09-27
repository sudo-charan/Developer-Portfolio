import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
const dist = join(root, '..', 'dist')
const siteUrl = 'https://charanrajofficial.vercel.app'

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function plainText(value = '') {
  return String(value)
    .replace(/```[\s\S]*?```/g, '')
    .replace(/[#*_>`[\]()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function firestoreValue(value) {
  if (!value || typeof value !== 'object') return value
  if ('stringValue' in value) return value.stringValue
  if ('integerValue' in value) return Number(value.integerValue)
  if ('doubleValue' in value) return Number(value.doubleValue)
  if ('booleanValue' in value) return value.booleanValue
  if ('timestampValue' in value) return value.timestampValue
  if ('arrayValue' in value) return (value.arrayValue.values || []).map(firestoreValue)
  if ('mapValue' in value) return firestoreFields(value.mapValue.fields)
  return value
}

function firestoreFields(fields = {}) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, firestoreValue(value)]))
}

async function fetchDocuments(projectId, collection) {
  if (!projectId) return []
  const url = `https://firestore.googleapis.com/v1/projects/${encodeURIComponent(projectId)}/databases/(default)/documents/${collection}`
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) })
  if (!response.ok) throw new Error(`Firestore returned ${response.status} for ${collection}.`)
  const data = await response.json()
  return (data.documents || []).map((document) => ({
    id: document.name.split('/').pop(),
    ...firestoreFields(document.fields),
  }))
}

function metaTag(attribute, name, content) {
  return `<meta ${attribute}="${escapeHtml(name)}" content="${escapeHtml(content)}" />`
}

function pageHtml(template, { title, description, path, body, type = 'website', image }) {
  const canonical = new URL(path, siteUrl).href
  let html = template
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(title)}</title>`)
    .replace(/<meta name="description"[^>]*>/, metaTag('name', 'description', description))
    .replace(/<meta name="robots"[^>]*>/, metaTag('name', 'robots', 'index, follow'))
    .replace(/<meta property="og:type"[^>]*>/, metaTag('property', 'og:type', type))
    .replace(/<meta property="og:url"[^>]*>/, metaTag('property', 'og:url', canonical))
    .replace(/<meta property="og:title"[^>]*>/, metaTag('property', 'og:title', title))
    .replace(/<meta property="og:description"[^>]*>/, metaTag('property', 'og:description', description))
    .replace(/<meta name="twitter:title"[^>]*>/, metaTag('name', 'twitter:title', title))
    .replace(/<meta name="twitter:description"[^>]*>/, metaTag('name', 'twitter:description', description))
    .replace(/<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${escapeHtml(canonical)}" />`)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`)

  if (image) {
    html = html
      .replace('</head>', `${metaTag('property', 'og:image', image)}${metaTag('name', 'twitter:image', image)}</head>`)
  }
  return html
}

function homeBody(settings, projects) {
  const hero = settings?.hero || {}
  const name = hero.name || 'Charanraj M'
  const title = hero.title || 'Full-Stack Developer · Cybersecurity Enthusiast · ISE Student'
  const description = hero.description || 'Building practical software, exploring AI and cybersecurity, and continuously learning new technologies.'
  const cards = projects.slice(0, 6).map((project) => (
    `<article><h2>${escapeHtml(project.name || 'Project')}</h2><p>${escapeHtml(project.description || '')}</p></article>`
  )).join('')
  return `<section aria-labelledby="portfolio-title"><p>Portfolio</p><h1 id="portfolio-title">${escapeHtml(name)}</h1><h2>${escapeHtml(title)}</h2><p>${escapeHtml(description)}</p></section><section aria-labelledby="projects-title"><h2 id="projects-title">Selected projects</h2>${cards}</section>`
}

function blogBody(posts) {
  const cards = posts.map((post) => (
    `<article><h2><a href="/blog/${encodeURIComponent(post.id)}">${escapeHtml(post.title)}</a></h2><p>${escapeHtml(post.excerpt || plainText(post.content).slice(0, 160))}</p></article>`
  )).join('')
  return `<section aria-labelledby="blog-title"><p>Blog</p><h1 id="blog-title">Insights &amp; Research</h1><p>Thoughts on cybersecurity, AI, web development, and technology.</p>${cards || '<p>No posts found.</p>'}</section>`
}

function postBody(post) {
  const description = post.excerpt || plainText(post.content).slice(0, 160)
  return `<article><a href="/blog">Back to blog</a><p>${escapeHtml(post.category || 'Article')}</p><h1>${escapeHtml(post.title)}</h1><p>${escapeHtml(description)}</p><div>${plainText(post.content).split(/\n{2,}/).map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('')}</div></article>`
}

async function main() {
  const template = await readFile(join(dist, 'index.html'), 'utf8')
  const projectId = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID
  let projects = []
  let settings = null
  let posts = []

  try {
    projects = await fetchDocuments(projectId, 'projects')
    posts = (await fetchDocuments(projectId, 'blogPosts'))
      .filter((post) => post.status === 'published')
      .sort((a, b) => new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0))
    const settingsDocuments = await fetchDocuments(projectId, 'settings')
    settings = settingsDocuments.find((item) => item.id === 'general') || null
  } catch (error) {
    console.warn(`Prerender data fetch skipped: ${error.message}`)
  }

  const pages = [
    {
      file: 'index.html',
      title: 'Charanraj M | Full-Stack Developer',
      description: 'Full-Stack Developer, Cybersecurity Enthusiast, and Information Science Student.',
      path: '/',
      body: homeBody(settings, projects),
    },
    {
      file: join('blog', 'index.html'),
      title: 'Blog | Charanraj M',
      description: 'Articles and research notes on cybersecurity, AI, web development, and technology by Charanraj M.',
      path: '/blog',
      body: blogBody(posts),
    },
    ...posts.map((post) => ({
      file: join('blog', post.id, 'index.html'),
      title: `${post.title} | Charanraj M`,
      description: post.excerpt || plainText(post.content).slice(0, 160),
      path: `/blog/${encodeURIComponent(post.id)}`,
      type: 'article',
      image: post.coverImage,
      body: postBody(post),
    })),
  ]

  for (const page of pages) {
    const output = join(dist, page.file)
    await mkdir(dirname(output), { recursive: true })
    await writeFile(output, pageHtml(template, page))
  }
  console.log(`Prerendered ${pages.length} public routes.`)
}

main().catch((error) => {
  console.error('Prerender failed:', error)
  process.exitCode = 1
})
