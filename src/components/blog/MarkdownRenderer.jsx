import { useMemo, memo } from 'react'
import { marked } from 'marked'

// Configure marked options for GFM (GitHub Flavored Markdown)
marked.setOptions({
  gfm: true,
  breaks: false,
})

export default memo(function MarkdownRenderer({ content }) {
  const htmlContent = useMemo(() => {
    if (!content) return ''
    try {
      return marked.parse(content)
    } catch (err) {
      console.error('Error rendering markdown:', err)
      return content
    }
  }, [content])

  return (
    <div
      className="blog-prose max-w-none text-text-secondary font-sans leading-relaxed"
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  )
})
