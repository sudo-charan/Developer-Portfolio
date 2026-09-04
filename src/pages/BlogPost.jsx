import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'
import { useBlogPost } from '../hooks/useFirestore'
import { formatFirestoreDate } from '../utils/format'
import FullPageLoader from '../components/FullPageLoader'

export default function BlogPost() {
  const { id } = useParams()
  const { data: post, loading, error } = useBlogPost(id)

  if (loading) {
    return <FullPageLoader />
  }

  if (error || !post || post.status !== 'published') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-dark-bg">
        <h1 className="text-2xl font-bold mb-4">Post not found</h1>
        <p className="text-text-muted mb-4 text-sm">This post may have been removed or is no longer available.</p>
        <Link to="/blog" className="text-accent hover:underline">← Back to blog</Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dark-bg pt-24 pb-16">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/blog" className="inline-flex items-center gap-2 text-text-muted hover:text-accent transition-colors mb-8">
          <ArrowLeft size={16} />
          Back to blog
        </Link>

        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {post.coverImage && (
            <img
              src={post.coverImage}
              alt={post.title}
              loading="lazy"
              decoding="async"
              className="w-full h-64 md:h-96 object-cover border border-dark-border mb-8"
            />
          )}

          <div className="flex items-center gap-4 mb-6">
            {post.category && (
              <span className="px-3 py-1 text-xs font-medium border border-accent/30 text-accent">
                {post.category}
              </span>
            )}
            <span className="text-sm text-text-muted flex items-center gap-1">
              <Calendar size={14} />
              {formatFirestoreDate(post.publishedAt)}
            </span>
            {post.readingTime && (
              <span className="text-sm text-text-muted flex items-center gap-1">
                <Clock size={14} />
                {post.readingTime} min read
              </span>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-bold mb-8 leading-tight">{post.title}</h1>

          <div className="max-w-none space-y-4">
            {post.content?.split('\n').map((paragraph, i) => (
              <p key={i} className="text-text-secondary leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        </motion.article>
      </div>
    </div>
  )
}
