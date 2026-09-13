import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Edit2, Trash2, X, GripVertical } from 'lucide-react'
import { SkeletonTable } from './Skeletons'
import { useAdminCache } from '../hooks/useAdminCache'
import ReorderModal from './ReorderModal'

const CACHE_TTL = 60 * 1000

export default function GenericCRUD({ title, fields, fetcher, adder, updater, remover, cacheKey, titleField, subtitleField, renderItem, reorderer, groupBy }) {
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
  const [reorderOpen, setReorderOpen] = useState(false)
  const [filter, setFilter] = useState('all')
  const isMountedRef = useRef(true)

  const categories = useMemo(() => {
    if (!groupBy) return []
    const seen = new Set()
    const ordered = []
    items.forEach((item) => {
      const cat = item[groupBy] || 'Uncategorized'
      if (!seen.has(cat)) {
        seen.add(cat)
        ordered.push(cat)
      }
    })
    return ordered
  }, [items, groupBy])

  const filteredItems = useMemo(() => {
    if (!groupBy || filter === 'all') return items
    return items.filter((item) => (item[groupBy] || 'Uncategorized') === filter)
  }, [items, groupBy, filter])

  const groupedItems = useMemo(() => {
    if (!groupBy || filter !== 'all') return null
    const groups = []
    const seen = new Map()
    filteredItems.forEach((item) => {
      const cat = item[groupBy] || 'Uncategorized'
      if (!seen.has(cat)) {
        seen.set(cat, groups.length)
        groups.push({ category: cat, items: [] })
      }
      groups[seen.get(cat)].items.push(item)
    })
    return groups
  }, [filteredItems, groupBy, filter])

  const fetchItemsData = useCallback(async () => {
    if (cacheKey) {
      const cached = get(cacheKey)
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return { data: cached.data, fromCache: true }
      }
    }
    return { data: await fetcher(), fromCache: false }
  }, [fetcher, cacheKey, get])

  const loadItems = useCallback(async () => {
    if (!isMountedRef.current) return
    try {
      const { data, fromCache } = await fetchItemsData()
      if (!isMountedRef.current) return
      const safeData = Array.isArray(data) ? data : []
      setItems(safeData)
      if (cacheKey && !fromCache) setItem(cacheKey, safeData)
    } catch (err) {
      if (isMountedRef.current) {
        setError('Failed to load data. Please try again.')
        console.error('Failed to fetch items:', err)
        setItems([])
      }
    } finally {
      if (isMountedRef.current) setLoading(false)
    }
  }, [fetchItemsData, cacheKey, setItem])

  useEffect(() => {
    let active = true
    fetchItemsData()
      .then(({ data, fromCache }) => {
        if (!active) return
        const safeData = Array.isArray(data) ? data : []
        setItems(safeData)
        if (cacheKey && !fromCache) setItem(cacheKey, safeData)
        setLoading(false)
      })
      .catch((err) => {
        if (!active) return
        setError('Failed to load data. Please try again.')
        console.error('Failed to fetch items:', err)
        setItems([])
        setLoading(false)
      })
    return () => { active = false }
  }, [fetchItemsData, cacheKey, setItem])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = {}
      fields.forEach((field) => {
        if (field.type === 'checkbox') {
          payload[field.name] = !!formData[field.name]
        } else if (formData[field.name] !== undefined) {
          payload[field.name] = formData[field.name]
        }
      })
      if (editing) {
        await updater(editing, payload)
      } else {
        await adder(payload)
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
    const next = {}
    fields.forEach((field) => {
      next[field.name] = item[field.name]
    })
    setFormData(next)
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

  const handleReorderSave = async (reorderedItems) => {
    if (!reorderer) return
    try {
      const orderPairs = reorderedItems.map((item, index) => ({ id: item.id, order: index }))
      await reorderer(orderPairs)
      setItems(reorderedItems)
      if (cacheKey) setItem(cacheKey, reorderedItems)
    } catch (err) {
      const message = err?.message || 'Failed to reorder items.'
      throw new Error(message)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold font-mono">{title.toUpperCase()}</h1>
        <div className="flex gap-3">
          {reorderer && (
            <button
              onClick={() => setReorderOpen(true)}
              className="btn-secondary flex items-center gap-2"
              aria-label={`Reorder ${title}`}
            >
              <GripVertical size={18} />
              Reorder
            </button>
          )}
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            Add New
          </button>
        </div>
      </div>

      {groupBy && categories.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-mono border transition-colors ${filter === 'all' ? 'border-accent text-accent bg-accent/5' : 'border-dark-border text-text-muted hover:text-text-primary hover:border-accent/30'}`}
            aria-label="Show all categories"
          >
            All
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 text-xs font-mono border transition-colors ${filter === cat ? 'border-accent text-accent bg-accent/5' : 'border-dark-border text-text-muted hover:text-text-primary hover:border-accent/30'}`}
              aria-label={`Filter by ${cat}`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div role="alert" className="mb-6 p-3 border border-accent-2/30 bg-accent-2/5 text-accent-2 text-sm">
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
                  ) : field.type === 'select' ? (
                    <select
                      value={formData[field.name] || ''}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-text-primary focus:outline-none focus:border-accent transition-colors"
                      required={field.required}
                    >
                      <option value="">Choose...</option>
                      {field.options.map((opt) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  ) : (
                    <div>
                      <input
                        type={field.type || 'text'}
                        value={formData[field.name] || ''}
                        onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                        className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-text-primary focus:outline-none focus:border-accent transition-colors"
                        required={field.required}
                        list={groupBy === field.name ? `${field.name}-list` : undefined}
                      />
                      {groupBy === field.name && categories.length > 0 && (
                        <datalist id={`${field.name}-list`}>
                          {categories.map((cat) => (
                            <option key={cat} value={cat} />
                          ))}
                        </datalist>
                      )}
                    </div>
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
      ) : groupedItems ? (
        <div className="border border-dark-border bg-dark-surface">
          {groupedItems.map((group) => (
            <div key={group.category}>
              <div className="px-4 py-2 border-b border-dark-border bg-dark-bg/30">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted font-mono">
                  {group.category}
                  <span className="text-text-muted/60 font-normal normal-case"> ({group.items.length})</span>
                </h3>
              </div>
              {group.items.map((item, _itemIndex) => {
                const globalIndex = filteredItems.indexOf(item)
                const isLast = globalIndex === filteredItems.length - 1
                return (
                  <div key={item.id} className={`flex items-center justify-between p-4 ${!isLast ? 'border-b border-dark-border' : ''}`}>
                    <div className="flex-1 min-w-0">
                      {renderItem ? renderItem(item, globalIndex) : (
                        <h3 className="font-semibold text-sm truncate">
                          {titleField ? item[titleField] : item.name || item.title || item.id}
                        </h3>
                      )}
                    </div>
                    <div className="flex gap-2 flex-shrink-0">
                      <button onClick={() => handleEdit(item)} className="p-2 border border-dark-border hover:border-accent hover:text-accent transition-colors" disabled={saving} aria-label={`Edit ${item[titleField] || item.name || item.title || item.id}`}>
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="p-2 border border-dark-border hover:border-accent-2 hover:text-accent-2 transition-colors" disabled={saving} aria-label={`Delete ${item[titleField] || item.name || item.title || item.id}`}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
          {filteredItems.length === 0 && (
            <div className="p-8 text-center text-text-muted text-sm">
              No items in this category. Create your first one.
            </div>
          )}
        </div>
      ) : (
        <div className="border border-dark-border bg-dark-surface">
          {filteredItems.map((item, index) => (
            <div key={item.id} className={`flex items-center justify-between p-4 ${index !== filteredItems.length - 1 ? 'border-b border-dark-border' : ''}`}>
              <div className="flex-1 min-w-0">
                {renderItem ? renderItem(item, index) : (
                  <div>
                    <h3 className="font-semibold text-sm">
                      {titleField ? item[titleField] : item.name || item.title || item.id}
                    </h3>
                    {subtitleField && (
                      <p className="text-text-muted text-xs font-mono mt-1">
                        {item[subtitleField] || ''}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={() => handleEdit(item)} className="p-2 border border-dark-border hover:border-accent hover:text-accent transition-colors" disabled={saving} aria-label={`Edit ${item[titleField] || item.name || item.title || item.id}`}>
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(item.id)} className="p-2 border border-dark-border hover:border-accent-2 hover:text-accent-2 transition-colors" disabled={saving} aria-label={`Delete ${item[titleField] || item.name || item.title || item.id}`}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {filteredItems.length === 0 && (
            <div className="p-8 text-center text-text-muted text-sm">
              No items yet. Create your first one.
            </div>
          )}
        </div>
      )}

      {reorderer && (
        <ReorderModal
          isOpen={reorderOpen}
          onClose={() => setReorderOpen(false)}
          title={title}
          items={items}
          onSave={handleReorderSave}
          titleField={titleField}
          subtitleField={subtitleField}
          renderItem={renderItem}
          groupField={groupBy}
        />
      )}
    </div>
  )
}
