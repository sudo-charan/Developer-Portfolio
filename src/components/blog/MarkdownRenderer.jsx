import { useMemo, memo } from 'react'
import { marked } from 'marked'
import DOMPurify from 'dompurify'

// Configure marked options for GFM (GitHub Flavored Markdown)
marked.setOptions({
  gfm: true,
  breaks: false,
})

export default memo(function MarkdownRenderer({ content }) {
  const htmlContent = useMemo(() => {
    if (!content) return ''
    try {
      return DOMPurify.sanitize(marked.parse(content))
    } catch (err) {
      console.error('Error rendering markdown:', err)
      return DOMPurify.sanitize(content)
    }
  }, [content])

  return (
    <div
      className="blog-prose max-w-none text-text-secondary font-sans leading-relaxed"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  )
})
