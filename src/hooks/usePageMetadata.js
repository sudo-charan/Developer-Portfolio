import { useEffect } from 'react'

export const SITE_ORIGIN = 'https://charanrajofficial.vercel.app'

function setMeta(attribute, key, content) {
  const selector = `meta[${attribute}="${key}"]`
  let element = document.head.querySelector(selector)

  if (!content) {
    element?.remove()
    return
  }

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }

  element.setAttribute('content', content)
}

export function toIsoDate(value) {
  if (!value) return undefined
  const date = typeof value === 'object' && value.seconds
    ? new Date(value.seconds * 1000)
    : new Date(value)
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

export default function usePageMetadata({
  title,
  description,
  path,
  image,
  type = 'website',
  structuredData,
  noIndex = false,
}) {
  useEffect(() => {
    document.title = title
    setMeta('name', 'description', description)
    setMeta('name', 'robots', noIndex ? 'noindex, nofollow' : 'index, follow')
    setMeta('property', 'og:type', type)
    setMeta('property', 'og:url', new URL(path, SITE_ORIGIN).href)
    setMeta('property', 'og:title', title)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:image', image)
    setMeta('name', 'twitter:card', image ? 'summary_large_image' : 'summary')
    setMeta('name', 'twitter:title', title)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', image)

    let canonical = document.head.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = new URL(path, SITE_ORIGIN).href

    let schema = document.getElementById('page-structured-data')
    if (!structuredData) {
      schema?.remove()
      return
    }
    if (!schema) {
      schema = document.createElement('script')
      schema.id = 'page-structured-data'
      schema.type = 'application/ld+json'
      document.head.appendChild(schema)
    }
    schema.textContent = JSON.stringify(structuredData)
  }, [description, image, noIndex, path, structuredData, title, type])
}
