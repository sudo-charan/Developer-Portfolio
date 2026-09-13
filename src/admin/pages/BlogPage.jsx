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

  useEffect(() => { loadPosts() }, [loadPosts])

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
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        status: formData.status,
        readingTime: parseInt(formData.readingTime) || 5,
        coverImage: formData.coverImage || '',
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
          <Plus size={18} /> New Post
        </button>
      </div>

      {error && (
        <div className="mb-6 p-3 border border-accent-2/30 bg-accent-2/5 text-accent-2 text-sm">
          {error}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="border border-dark-border bg-dark-surface p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold font-mono">{editing ? 'EDIT' : 'NEW'} POST</h3>
              <button onClick={resetForm} className="text-text-muted"><X size={20} /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <input value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} placeholder="Title" className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-text-primary focus:outline-none focus:border-accent" required />
              <input value={formData.excerpt} onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })} placeholder="Excerpt" className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-text-primary focus:outline-none focus:border-accent" />
              <div className="grid grid-cols-2 gap-4">
                <input value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} placeholder="Category" className="px-4 py-2 bg-dark-bg border border-dark-border text-text-primary focus:outline-none focus:border-accent" />
                <input value={formData.readingTime} onChange={(e) => setFormData({ ...formData, readingTime: e.target.value })} placeholder="Reading time (min)" type="number" className="px-4 py-2 bg-dark-bg border border-dark-border text-text-primary focus:outline-none focus:border-accent" />
              </div>
              <input value={formData.coverImage} onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })} placeholder="Cover Image URL" className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-text-primary focus:outline-none focus:border-accent" />
              <input value={formData.tags} onChange={(e) => setFormData({ ...formData, tags: e.target.value })} placeholder="Tags (comma-separated)" className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-text-primary focus:outline-none focus:border-accent" />
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="px-4 py-2 bg-dark-bg border border-dark-border text-text-primary focus:outline-none focus:border-accent">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
              <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} placeholder="Content (plain text or markdown)" rows={6} className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-text-primary focus:outline-none focus:border-accent resize-none" required />
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
              <div>
                <h3 className="font-semibold text-sm">{post.title}</h3>
                <p className="text-text-muted text-xs font-mono mt-1">{post.category} • {post.status}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleEdit(post)} className="p-2 border border-dark-border hover:border-accent hover:text-accent transition-colors" disabled={saving} aria-label="Edit post"><Edit2 size={14} /></button>
                {post.status === 'draft' ? (
                  <button onClick={() => handlePublish(post)} className="p-2 border border-accent/30 hover:border-accent hover:text-accent transition-colors" disabled={saving} aria-label="Publish post">✓</button>
                ) : (
                  <button onClick={() => handleUnpublish(post)} className="p-2 border border-dark-border hover:border-text-muted hover:text-text-muted transition-colors" disabled={saving} aria-label="Unpublish post">✗</button>
                )}
                <button onClick={() => handleDelete(post.id)} className="p-2 border border-dark-border hover:border-accent-2 hover:text-accent-2 transition-colors" disabled={saving}><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {posts.length === 0 && <div className="p-8 text-center text-text-muted text-sm">No posts yet.</div>}
        </div>
      )}
    </div>
  )
}
