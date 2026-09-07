import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, Reorder } from 'framer-motion'
import { Plus, Edit2, Trash2, X, GripVertical } from 'lucide-react'
import { SkeletonTable } from './Skeletons'
import { useAdminCache } from '../hooks/useAdminCache'

const CACHE_TTL = 60 * 1000

export default function GenericCRUD({ title, fields, fetcher, adder, updater, remover, cacheKey, titleField, subtitleField, renderItem, reorderer }) {
  const { get, set: setItem, clear: clearCache } = useAdminCache()
  const [items, setItems] = useState(() => {
    if (cacheKey) {
      const cached = get(cacheKey)
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data
      }
    }
    return []
  })
  const [loading, setLoading] = useState(() => {
    if (cacheKey) {
      const cached = get(cacheKey)
      return !(cached && Date.now() - cached.timestamp < CACHE_TTL)
    }
    return true
  })
  const [editing, setEditing] = useState(null)
  const [formData, setFormData] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [reordering, setReordering] = useState(false)

  const loadItems = useCallback(async () => {
    if (cacheKey) {
      const cached = get(cacheKey)
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setItems(cached.data)
        setLoading(false)
        return
      }
    }
    setLoading(true)
    setError('')
    try {
      const data = await fetcher()
      setItems(Array.isArray(data) ? data : [])
      if (cacheKey) setItem(cacheKey, Array.isArray(data) ? data : [])
    } catch (err) {
      setError('Failed to load data. Please try again.')
      console.error('Failed to fetch items:', err)
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [fetcher, cacheKey, get, setItem])

  useEffect(() => {
    loadItems()
  }, [loadItems])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      if (editing) {
        await updater(editing, formData)
      } else {
        await adder(formData)
      }
      if (cacheKey) clearCache(cacheKey)
      setShowForm(false)
      setEditing(null)
      setFormData({})
      loadItems()
    } catch (err) {
      const message = err?.message || 'Operation failed. You may not have permission.'
      setError(message)
      console.error('[Admin CRUD] Submit failed', {
        collection: cacheKey,
        editing: !!editing,
        code: err.code,
        message: err.message,
      })
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = (item) => {
    setEditing(item.id)
    setFormData(item)
    setShowForm(true)
    setError('')
  }

  const handleDelete = async (id) => {
    const confirmed = confirm('Are you sure you want to delete this item?')
    if (!confirmed) return
    setError('')
    setSaving(true)
    try {
      await remover(id)
      if (cacheKey) clearCache(cacheKey)
      loadItems()
    } catch (err) {
      const message = err?.message || 'Delete failed. You may not have permission.'
      setError(message)
      console.error('[Admin CRUD] Delete failed', {
        collection: cacheKey,
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
    setFormData({})
    setShowForm(false)
    setError('')
  }

  const handleReorder = async (newOrder) => {
    if (!reorderer) return
    setReordering(true)
    try {
      const orderPairs = newOrder.map((item, index) => ({ id: item.id, order: index }))
      await reorderer(orderPairs)
      setItems(newOrder)
      if (cacheKey) setItem(cacheKey, newOrder)
    } catch (err) {
      const message = err?.message || 'Failed to reorder items.'
      setError(message)
    } finally {
      setReordering(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-mono">{title.toUpperCase()}</h1>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={18} />
          Add New
        </button>
      </div>

      {error && (
        <div className="mb-6 p-3 border border-accent-2/30 bg-accent-2/5 text-accent-2 text-sm">
          {error}
        </div>
      )}

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="border border-dark-border bg-dark-surface p-6 mb-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold font-mono">{editing ? 'EDIT' : 'NEW'} {title.toUpperCase()}</h3>
              <button onClick={resetForm} className="text-text-muted hover:text-text-primary">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              {fields.map((field) => (
                <div key={field.name}>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-1">{field.label}</label>
                  {field.type === 'textarea' ? (
                    <textarea
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-text-primary focus:outline-none focus:border-accent transition-colors"
                      rows={3}
                      required={field.required}
                    />
                  ) : field.type === 'checkbox' ? (
                    <label className="flex items-center gap-2 text-sm text-text-secondary cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!formData[field.name]}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.checked })}
                        className="w-4 h-4 accent-accent"
                      />
                      Enabled
                    </label>
                  ) : (
                    <input
                      type={field.type || 'text'}
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-text-primary focus:outline-none focus:border-accent transition-colors"
                      required={field.required}
                    />
                  )}
                </div>
              ))}
              <div className="flex gap-3">
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
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
        <SkeletonTable rows={6} cols={3} />
      ) : reorderer ? (
        <Reorder.Group axis="y" values={items} onReorder={handleReorder} className="border border-dark-border bg-dark-surface">
          {items.map((item, index) => (
            <Reorder.Item
              key={item.id}
              value={item}
              className={`flex items-center justify-between p-4 ${index !== items.length - 1 ? 'border-b border-dark-border' : ''}`}
            >
              <div className="flex items-center gap-2 flex-shrink-0 cursor-grab active:cursor-grabbing">
                <GripVertical size={16} className="text-text-muted" />
              </div>
              <div className="flex-1 min-w-0">
                {renderItem ? renderItem(item, index) : (
                  <div>
                    <h3 className="font-semibold text-sm">
                      {titleField ? item[titleField] : item.name || item.title || item.id}
                    </h3>
                    <p className="text-text-muted text-xs font-mono mt-1">
                      {subtitleField
                        ? (item[subtitleField] || '')
                        : (item.company || item.degree || item.category || '')}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => handleEdit(item)} className="p-2 border border-dark-border hover:border-accent hover:text-accent transition-colors" disabled={saving}>
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-2 border border-dark-border hover:border-accent-2 hover:text-accent-2 transition-colors" disabled={saving}>
                  <Trash2 size={14} />
                </button>
              </div>
            </Reorder.Item>
          ))}
          {items.length === 0 && (
            <div className="p-8 text-center text-text-muted text-sm">
              No items yet. Create your first one.
            </div>
          )}
          {reordering && (
            <div className="p-3 border-t border-dark-border text-xs text-accent font-mono">
              Reordering...
            </div>
          )}
        </Reorder.Group>
      ) : (
        <div className="border border-dark-border bg-dark-surface">
          {items.map((item, index) => (
            <div key={item.id} className={`flex items-center justify-between p-4 ${index !== items.length - 1 ? 'border-b border-dark-border' : ''}`}>
              <div className="flex-1 min-w-0">
                {renderItem ? renderItem(item, index) : (
                  <div>
                    <h3 className="font-semibold text-sm">
                      {titleField ? item[titleField] : item.name || item.title || item.id}
                    </h3>
                    <p className="text-text-muted text-xs font-mono mt-1">
                      {subtitleField
                        ? (item[subtitleField] || '')
                        : (item.company || item.degree || item.category || '')}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => handleEdit(item)} className="p-2 border border-dark-border hover:border-accent hover:text-accent transition-colors" disabled={saving}>
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-2 border border-dark-border hover:border-accent-2 hover:text-accent-2 transition-colors" disabled={saving}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="p-8 text-center text-text-muted text-sm">
              No items yet. Create your first one.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
