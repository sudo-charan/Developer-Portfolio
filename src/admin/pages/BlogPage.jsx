import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Trash2, X } from 'lucide-react'
import { getBlogPosts } from '../../firebase/services'
import { createBlogPost, updateBlogPost, deleteBlogPost } from '../../firebase/adminServices'
import { SkeletonTable } from '../components/Skeletons'
import { useAdminCache } from '../hooks/useAdminCache'

const CACHE_KEY = 'admin_blog_posts'
const CACHE_TTL = 60 * 1000

export default function BlogPage() {
  const { get, set: setItem, clear: clearCache } = useAdminCache()
  const [posts, setPosts] = useState(() => {
    const cached = get(CACHE_KEY)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data
    return []
  })
  const [loading, setLoading] = useState(() => {
    const cached = get(CACHE_KEY)
    return !(cached && Date.now() - cached.timestamp < CACHE_TTL)
  })
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({
    title: '', content: '', excerpt: '', category: '', tags: '', status: 'draft', readingTime: '', coverImage: ''
  })
  const [saving, setSaving] = useState(false)

  const loadPosts = useCallback(async () => {
    const cached = get(CACHE_KEY)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setPosts(cached.data)
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await getBlogPosts('all')
      setPosts(Array.isArray(data) ? data : [])
      setItem(CACHE_KEY, Array.isArray(data) ? data : [])
    } catch (err) {
      setError('Failed to load blog posts. You may not have permission.')
      console.error('Failed to load posts:', err)
      setPosts([])
    } finally {
      setLoading(false)
    }
  }, [get, setItem])

  useEffect(() => {
    const cached = get(CACHE_KEY)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return
    }
    getBlogPosts('all')
      .then((data) => {
        setPosts(Array.isArray(data) ? data : [])
        setItem(CACHE_KEY, Array.isArray(data) ? data : [])
      })
      .catch((err) => {
        setError('Failed to load blog posts. You may not have permission.')
        console.error('Failed to load posts:', err)
        setPosts([])
      })
      .finally(() => {
        setLoading(false)
      })
  }, [get, setItem])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const data = {
        title: formData.title,
        content: formData.content,
        excerpt: formData.excerpt,
        category: formData.category,
        tags: formData.tags.split(',').map(t => t.trim()),
        status: formData.status,
        readingTime: parseInt(formData.readingTime) || 5,
      }
      if (editing) {
        await updateBlogPost(editing, data)
      } else {
        await createBlogPost(data)
      }
      clearCache(CACHE_KEY)
      setShowForm(false)
      setEditing(null)
      setFormData({ title: '', content: '', excerpt: '', category: '', tags: '', status: 'draft', readingTime: '' })
      loadPosts()
    } catch (err) {
      const message = err?.message || 'Failed to save post. You may not have permission.'
      setError(message)
      console.error('[Admin CRUD] Blog save failed', {
        editing: !!editing,
        code: err.code,
        message: err.message,
      })
    } finally {
      setSaving(false)
    }
  }

  const handlePublish = async (post) => {
    setError('')
    setSaving(true)
    try {
      await updateBlogPost(post.id, {
        status: 'published',
        publishedAt: post.publishedAt || new Date().toISOString(),
      })
      clearCache(CACHE_KEY)
      loadPosts()
    } catch (err) {
      const message = err?.message || 'Failed to publish post. You may not have permission.'
      setError(message)
      console.error('[Admin CRUD] Blog publish failed', {
        id: post.id,
        code: err.code,
        message: err.message,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleUnpublish = async (post) => {
    setError('')
    setSaving(true)
    try {
      await updateBlogPost(post.id, { status: 'draft' })
      clearCache(CACHE_KEY)
      loadPosts()
    } catch (err) {
      const message = err?.message || 'Failed to unpublish post. You may not have permission.'
      setError(message)
      console.error('[Admin CRUD] Blog unpublish failed', {
        id: post.id,
        code: err.code,
        message: err.message,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (post) => {
    setEditing(post.id)
    setFormData({
      ...post,
      tags: post.tags?.join(', ') || '',
      readingTime: post.readingTime?.toString() || '',
    })
    setShowForm(true)
    setError('')
  }

  const handleDelete = async (id) => {
    const confirmed = confirm('Delete this post?')
    if (!confirmed) return
    setError('')
    setSaving(true)
    try {
      await deleteBlogPost(id)
      clearCache(CACHE_KEY)
      loadPosts()
    } catch (err) {
      const message = err?.message || 'Failed to delete post. You may not have permission.'
      setError(message)
      console.error('[Admin CRUD] Blog delete failed', {
        id,
        code: err.code,
        message: err.message,
      })
    } finally {
      setSaving(false)
    }
  }

  const resetForm = () => {
    setEditing(null)
    setFormData({ title: '', content: '', excerpt: '', category: '', tags: '', status: 'draft', readingTime: '', coverImage: '' })
    setShowForm(false)
    setError('')
  }

  return (
    <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold font-mono">BLOG_POSTS</h1>
          <button onClick={() => { resetForm(); setShowForm(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={18} aria-hidden="true" /> New Post
          </button>
        </div>

      {error && (
        <div role="alert" className="mb-6 p-3 border border-accent-2/30 bg-accent-2/5 text-accent-2 text-sm">
          {error}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="border border-dark-border bg-dark-surface p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold font-mono">{editing ? 'EDIT' : 'NEW'} POST</h3>
              <button
                onClick={resetForm}
                aria-label="Close form"
                className="text-text-muted"
              >
                <X size={20} aria-hidden="true" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="blog-title" className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-1">Title</label>
                <input
                  id="blog-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Title"
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-text-primary focus:outline-none focus:border-accent"
                  required
                />
              </div>
              <div>
                <label htmlFor="blog-excerpt" className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-1">Excerpt</label>
                <input
                  id="blog-excerpt"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Brief summary of the post"
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="blog-category" className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-1">Category</label>
                  <input
                    id="blog-category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g. Security"
                    className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label htmlFor="blog-reading-time" className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-1">Reading Time (min)</label>
                  <input
                    id="blog-reading-time"
                    value={formData.readingTime}
                    onChange={(e) => setFormData({ ...formData, readingTime: e.target.value })}
                    type="number"
                    className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-text-primary focus:outline-none focus:border-accent"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="blog-cover-image" className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-1">Cover Image URL</label>
                <input
                  id="blog-cover-image"
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  placeholder="https://example.com/image.jpg"
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label htmlFor="blog-tags" className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-1">Tags (comma-separated)</label>
                <input
                  id="blog-tags"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="e.g. AI, Security"
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-text-primary focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label htmlFor="blog-status" className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-1">Status</label>
                <select
                  id="blog-status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-text-primary focus:outline-none focus:border-accent"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </div>
              <div>
                <label htmlFor="blog-content" className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-1">Content</label>
                <textarea
                  id="blog-content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Content (plain text or markdown)"
                  rows={6}
                  className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-text-primary focus:outline-none focus:border-accent resize-none"
                  required
                />
              </div>
              <div className="flex gap-3">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Update' : 'Publish'}
                </button>
                <button type="button" onClick={resetForm} className="btn-secondary" disabled={saving}>
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      {loading ? (
        <SkeletonTable rows={6} cols={4} />
      ) : (
        <div className="border border-dark-border bg-dark-surface">
          {posts.map((post, index) => (
            <div key={post.id} className={`flex items-center justify-between p-4 ${index !== posts.length - 1 ? 'border-b border-dark-border' : ''}`}>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{post.title}</h3>
                <p className="text-text-muted text-xs font-mono mt-1 truncate">{post.category} • {post.status}</p>
              </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => handleEdit(post)}
                    aria-label={`Edit post: ${post.title}`}
                    className="p-3 border border-dark-border hover:border-accent hover:text-accent transition-colors"
                    disabled={saving}
                  >
                    <Edit2 size={14} aria-hidden="true" />
                  </button>
                  {post.status === 'draft' ? (
                    <button
                      onClick={() => handlePublish(post)}
                      aria-label="Publish"
                      className="p-3 border border-accent/30 hover:border-accent hover:text-accent transition-colors"
                      disabled={saving}
                    >
                      <span aria-hidden="true">✓</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUnpublish(post)}
                      aria-label="Unpublish"
                      className="p-3 border border-dark-border hover:border-text-muted hover:text-text-muted transition-colors"
                      disabled={saving}
                    >
                      <span aria-hidden="true">✗</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(post.id)}
                    aria-label={`Delete post: ${post.title}`}
                    className="p-3 border border-dark-border hover:border-accent-2 hover:text-accent-2 transition-colors"
                    disabled={saving}
                  >
                    <Trash2 size={14} aria-hidden="true" />
                  </button>
                </div>
            </div>
          ))}
          {posts.length === 0 && <div className="p-8 text-center text-text-muted text-sm">No posts yet.</div>}
        </div>
      )}
    </div>
  )
}
