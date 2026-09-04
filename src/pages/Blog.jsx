import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Calendar, Clock, Search } from 'lucide-react'
import { useBlogPosts } from '../hooks/useFirestore'
import { formatFirestoreDate } from '../utils/format'
import Loader from '../components/Loader'

export default function Blog() {
  const { data: posts = [], loading, error } = useBlogPosts('published')
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  const categories = ['all', ...new Set(posts.map((p) => p.category).filter(Boolean))]

  const filtered = posts.filter((post) => {
    const matchesSearch = !search ||
      post.title?.toLowerCase().includes(search.toLowerCase()) ||
      post.excerpt?.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || post.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  return (
    <div className="min-h-screen bg-dark-bg pt-24 pb-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16 text-center"
        >
          <p className="section-label">Blog</p>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Insights & Research</h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Thoughts on cybersecurity, AI, web development, and technology.
          </p>
        </motion.div>

        <div className="flex flex-col sm:flex-row gap-4 mb-12">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search posts..."
              className="w-full pl-10 pr-4 py-3 bg-dark-surface border border-dark-border text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-3 bg-dark-surface border border-dark-border text-text-primary focus:outline-none focus:border-accent transition-colors"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === 'all' ? 'All Categories' : cat}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <Loader mode="section" size={48} />
        ) : error ? (
          <div className="text-center py-20 text-text-muted">
            Failed to load blog posts. Please try again later.
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-text-muted">
            No posts found.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-px bg-dark-border">
            {filtered.map((post, index) => (
              <motion.article
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="group bg-dark-surface p-6 lg:p-8 hover:bg-dark-elevated transition-all duration-300"
              >
                {post.coverImage && (
                  <img
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-48 object-cover border border-dark-border mb-4"
                  />
                )}
                <div className="flex items-center gap-3 mb-3">
                  {post.category && (
                    <span className="px-2 py-1 text-xs font-medium border border-accent/30 text-accent">
                      {post.category}
                    </span>
                  )}
                  <span className="text-xs text-text-muted flex items-center gap-1">
                    <Calendar size={12} />
                     {formatFirestoreDate(post.publishedAt)}
                  </span>
                  {post.readingTime && (
                    <span className="text-xs text-text-muted flex items-center gap-1">
                      <Clock size={12} />
                      {post.readingTime} min read
                    </span>
                  )}
                </div>
                <Link to={`/blog/${post.id}`}>
                  <h2 className="text-xl font-bold mb-2 group-hover:text-accent transition-colors line-clamp-2">
                    {post.title}
                  </h2>
                </Link>
                <p className="text-text-secondary text-sm line-clamp-3 mb-4">
                  {post.excerpt || post.content?.substring(0, 150)}
                </p>
                <Link
                  to={`/blog/${post.id}`}
                  className="text-accent text-sm font-medium hover:underline"
                >
                  Read more →
                </Link>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
