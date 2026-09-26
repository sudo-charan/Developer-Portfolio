import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, Clock, Eye, Plus, Edit2, Trash2, X } from 'lucide-react'
import { Timestamp, deleteField } from '@firebase/firestore'
import { getBlogPosts } from '../../firebase/services'
import { createBlogPost, updateBlogPost, deleteBlogPost } from '../../firebase/adminServices'
import { SkeletonTable } from '../components/Skeletons'
import { useAdminCache } from '../hooks/useAdminCache'
import MarkdownRenderer from '../../components/blog/MarkdownRenderer'
import { formatFirestoreDate } from '../../utils/format'

const CACHE_KEY = 'admin_blog_posts'
const CACHE_TTL = 60 * 1000

function toLocalDateTimeValue(value) {
  if (!value) return ''
  const date = value?.toDate ? value.toDate() : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}

function formatScheduledDate(value) {
  const date = value?.toDate ? value.toDate() : new Date(value)
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString()
}

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
  const [previewPost, setPreviewPost] = useState(null)
  const [formData, setFormData] = useState({
    title: '', content: '', excerpt: '', category: '', tags: '', status: 'draft', readingTime: '', coverImage: '', scheduledAt: ''
  })
  const [saving, setSaving] = useState(false)
  const isMountedRef = useRef(true)

  const fetchPostsData = useCallback(async () => {
    const cached = get(CACHE_KEY)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return { data: cached.data, fromCache: true }
    }
    return { data: await getBlogPosts('all'), fromCache: false }
  }, [get])

  const loadPosts = useCallback(async () => {
    if (!isMountedRef.current) return
    setLoading(true)
    try {
      const { data, fromCache } = await fetchPostsData()
      if (!isMountedRef.current) return
      const safeData = Array.isArray(data) ? data : []
      setPosts(safeData)
      if (!fromCache) setItem(CACHE_KEY, safeData)
    } catch (err) {
      if (isMountedRef.current) {
        setError('Failed to load blog posts. You may not have permission.')
        console.error('Failed to load posts:', err)
        setPosts([])
      }
    } finally {
      if (isMountedRef.current) setLoading(false)
    }
  }, [fetchPostsData, setItem])

  useEffect(() => {
    let isMounted = true
    fetchPostsData()
      .then(({ data, fromCache }) => {
        if (!isMounted) return
        const safeData = Array.isArray(data) ? data : []
        setPosts(safeData)
        if (!fromCache) setItem(CACHE_KEY, safeData)
        setLoading(false)
      })
      .catch((err) => {
        if (!isMounted) return
        setError('Failed to load blog posts. You may not have permission.')
        console.error('Failed to load posts:', err)
        setPosts([])
        setLoading(false)
      })
    return () => { isMounted = false }
  }, [fetchPostsData, setItem])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const existingPost = posts.find((post) => post.id === editing)
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
      if (formData.status === 'scheduled') {
        const scheduledDate = new Date(formData.scheduledAt)
        if (!formData.scheduledAt || Number.isNaN(scheduledDate.getTime()) || scheduledDate <= new Date()) {
          throw new Error('Choose a future date and time to schedule this post.')
        }
        data.scheduledAt = Timestamp.fromDate(scheduledDate)
      } else if (editing && existingPost?.scheduledAt) {
        data.scheduledAt = deleteField()
      }
      if (formData.status === 'published' && existingPost?.status !== 'published') {
        data.publishedAt = Timestamp.now()
      }
      if (editing) {
        const activityAction = formData.status === 'published' && existingPost?.status !== 'published'
          ? 'published'
          : formData.status === 'scheduled' && existingPost?.status !== 'scheduled'
            ? 'scheduled'
            : formData.status === 'draft' && ['published', 'scheduled'].includes(existingPost?.status)
              ? 'unpublished'
              : undefined
        await updateBlogPost(editing, data, activityAction)
      } else {
        await createBlogPost(data)
      }
      clearCache(CACHE_KEY)
      setShowForm(false)
      setEditing(null)
      setFormData({ title: '', content: '', excerpt: '', category: '', tags: '', status: 'draft', readingTime: '', coverImage: '', scheduledAt: '' })
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
        publishedAt: Timestamp.now(),
        scheduledAt: deleteField(),
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
      await updateBlogPost(post.id, { status: 'draft', scheduledAt: deleteField() })
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
      scheduledAt: toLocalDateTimeValue(post.scheduledAt),
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
    setFormData({ title: '', content: '', excerpt: '', category: '', tags: '', status: 'draft', readingTime: '', coverImage: '', scheduledAt: '' })
    setShowForm(false)
    setError('')
  }

  const previewCurrentDraft = () => {
    setPreviewPost({
      ...formData,
      tags: formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean),
      readingTime: parseInt(formData.readingTime) || 5,
      publishedAt: formData.status === 'scheduled' && formData.scheduledAt ? new Date(formData.scheduledAt) : new Date(),
    })
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
                <option value="scheduled">Schedule</option>
              </select>
              {formData.status === 'scheduled' && (
                <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted">
                  Publish date and time (your local timezone)
                  <input
                    type="datetime-local"
                    required
                    value={formData.scheduledAt}
                    onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                    className="mt-2 block w-full px-4 py-2 bg-dark-bg border border-dark-border text-text-primary focus:outline-none focus:border-accent"
                  />
                </label>
              )}
              <textarea value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} placeholder="Content (plain text or markdown)" rows={6} className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-text-primary focus:outline-none focus:border-accent resize-none" required />
              <div className="flex gap-3">
                <button type="button" onClick={previewCurrentDraft} className="btn-secondary" disabled={saving}>
                  Preview
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : formData.status === 'scheduled' ? 'Schedule post' : formData.status === 'published' ? 'Publish post' : 'Save draft'}
                </button>
                <button type="button" onClick={resetForm} className="btn-secondary" disabled={saving}>
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {previewPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 sm:p-8"
            onKeyDown={(event) => { if (event.key === 'Escape') setPreviewPost(null) }}
          >
            <div role="dialog" aria-modal="true" aria-labelledby="blog-preview-title" className="relative mx-auto max-w-3xl border border-dark-border bg-dark-bg p-5 sm:p-8">
              <button type="button" onClick={() => setPreviewPost(null)} aria-label="Close preview" className="absolute right-4 top-4 p-2 text-text-muted hover:text-text-primary">
                <X size={20} />
              </button>
              <p className="section-label mb-4">Post preview</p>
              {previewPost.coverImage && (
                <img src={previewPost.coverImage} alt={previewPost.title} className="mb-8 h-64 w-full border border-dark-border object-cover md:h-96" />
              )}
              <div className="mb-6 flex flex-wrap items-center gap-4">
                {previewPost.category && <span className="border border-accent/30 px-3 py-1 text-xs font-medium text-accent">{previewPost.category}</span>}
                <span className="flex items-center gap-1 text-sm text-text-muted"><Calendar size={14} />{formatFirestoreDate(previewPost.publishedAt)}</span>
                {previewPost.readingTime > 0 && <span className="flex items-center gap-1 text-sm text-text-muted"><Clock size={14} />{previewPost.readingTime} min read</span>}
              </div>
              <h2 id="blog-preview-title" className="mb-8 text-3xl font-extrabold leading-tight tracking-tight text-text-primary font-mono sm:text-5xl">{previewPost.title || 'Untitled post'}</h2>
              <MarkdownRenderer content={previewPost.content} />
            </div>
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
                <p className="text-text-muted text-xs font-mono mt-1">
                  {post.category} • {post.status}
                  {post.status === 'scheduled' && post.scheduledAt && ` · ${formatScheduledDate(post.scheduledAt)}`}
                </p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setPreviewPost(post)} className="p-2 border border-dark-border hover:border-accent hover:text-accent transition-colors" disabled={saving} aria-label="Preview post"><Eye size={14} /></button>
                <button onClick={() => handleEdit(post)} className="p-2 border border-dark-border hover:border-accent hover:text-accent transition-colors" disabled={saving} aria-label="Edit post"><Edit2 size={14} /></button>
                {post.status === 'published' ? (
                  <button onClick={() => handleUnpublish(post)} className="p-2 border border-dark-border hover:border-text-muted hover:text-text-muted transition-colors" disabled={saving} aria-label="Unpublish post">✗</button>
                ) : post.status === 'scheduled' ? (
                  <button onClick={() => handleUnpublish(post)} className="p-2 border border-dark-border hover:border-text-muted hover:text-text-muted transition-colors" disabled={saving} aria-label="Cancel scheduled post"><X size={14} /></button>
                ) : (
                  <button onClick={() => handlePublish(post)} className="p-2 border border-accent/30 hover:border-accent hover:text-accent transition-colors" disabled={saving} aria-label="Publish post">✓</button>
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
