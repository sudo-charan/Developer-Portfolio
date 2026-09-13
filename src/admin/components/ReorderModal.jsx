import { useState, useEffect, useRef, useCallback } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import { GripVertical, X, Check, AlertCircle } from 'lucide-react'

const LAYOUT_SPRING = {
  type: 'spring',
  stiffness: 300,
  damping: 35,
}

const DRAG_SPRING = {
  type: 'spring',
  stiffness: 500,
  damping: 40,
}

const ROW_DRAG_WHILE = {
  scale: 1.02,
  zIndex: 1000,
  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
}

function ReorderItemRow({
  item,
  index,
  total,
  moveUp,
  moveDown,
  dragControls,
  renderItem,
  titleField,
  subtitleField,
}) {
  const onKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      moveUp(index)
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      moveDown(index)
    }
  }

  return (
    <Reorder.Item
      value={item}
      as="div"
      drag="y"
      dragControls={dragControls}
      dragListener={false}
      dragElastic={0.1}
      dragMomentum={false}
      dragPropagation={false}
      whileDrag={ROW_DRAG_WHILE}
      transition={DRAG_SPRING}
      className={`
        flex items-center gap-3 p-4
        hover:bg-dark-bg/50
        transition-colors duration-150
        ${index !== total - 1 ? 'border-b border-dark-border' : ''}
      `}
    >
      <div
        tabIndex={0}
        role="button"
        aria-roledescription="reorderable item"
        aria-label={`Item ${index + 1} of ${total}. Use arrow keys to reorder.`}
        onKeyDown={onKeyDown}
        className="flex items-center gap-3 w-full outline-none"
      >
        <span className="text-xs text-text-muted font-mono w-8 text-center flex-shrink-0">
          {index + 1}
        </span>
        <div className="flex-1 min-w-0">
          {renderItem
            ? renderItem(item, index)
            : (
              <div className="flex flex-col">
                <span className="font-semibold text-sm truncate">
                  {titleField ? item[titleField] : (item.name || item.title || item.id)}
                </span>
                {subtitleField && item[subtitleField] && (
                  <span className="text-text-muted text-xs font-mono mt-0.5 truncate">
                    {item[subtitleField]}
                  </span>
                )}
              </div>
            )}
        </div>
        <div
          className="
            cursor-grab active:cursor-grabbing
            p-3 text-text-muted hover:text-text-primary
            transition-colors
            flex-shrink-0 select-none
          "
           style={{ touchAction: 'none' }}
           onPointerDown={(e) => {
             dragControls.start(e)
           }}
           aria-label="Drag handle - press and drag to reorder"
         >
           <GripVertical size={16} />
         </div>
      </div>
    </Reorder.Item>
  )
}

function ReorderModalInner({
  title,
  items,
  onSave,
  onClose,
  titleField,
  subtitleField,
  renderItem,
}) {
  const [orderedItems, setOrderedItems] = useState(items)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const dialogRef = useRef(null)
  const dragControls = useDragControls()

  useEffect(() => {
    dialogRef.current?.focus()
  }, [])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && !saving) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose, saving])

  const moveUp = useCallback((index) => {
    if (index === 0) return
    setOrderedItems((prev) => {
      const next = [...prev]
      ;[next[index], next[index - 1]] = [next[index - 1], next[index]]
      return next
    })
  }, [])

  const moveDown = useCallback((index) => {
    if (index >= orderedItems.length - 1) return
    setOrderedItems((prev) => {
      const next = [...prev]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      return next
    })
  }, [orderedItems.length])

  const handleCancel = () => {
    setOrderedItems(items)
    setError('')
    onClose()
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    try {
      await onSave(orderedItems)
      onClose()
    } catch (err) {
      setError(err?.message || 'Failed to save new order. Your changes were not lost.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      ref={dialogRef}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={`Reorder ${title}`}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 outline-none"
    >
      <div className="bg-dark-surface border border-dark-border rounded-lg shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
        {/* Fixed Header */}
        <div className="p-6 border-b border-dark-border flex items-center justify-between flex-shrink-0">
          <h2 className="text-xl font-bold font-mono">REORDER {title.toUpperCase()}</h2>
          <button
            onClick={handleCancel}
            aria-label="Close reorder modal"
            className="p-2 text-text-muted hover:text-text-primary hover:bg-dark-bg rounded transition-colors"
            disabled={saving}
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable List */}
        <div className="flex-1 overflow-y-auto">
          {orderedItems.length === 0 ? (
            <div className="p-8 text-center text-text-muted text-sm">
              No items to reorder.
            </div>
          ) : (
            <Reorder.Group
              axis="y"
              onReorder={setOrderedItems}
              values={orderedItems}
              as="div"
              layout="position"
              transition={LAYOUT_SPRING}
              className="border border-dark-border bg-dark-surface"
            >
              {orderedItems.map((item, index) => (
                <ReorderItemRow
                  key={item.id}
                  item={item}
                  index={index}
                  total={orderedItems.length}
                  moveUp={moveUp}
                  moveDown={moveDown}
                  dragControls={dragControls}
                  renderItem={renderItem}
                  titleField={titleField}
                  subtitleField={subtitleField}
                />
              ))}
            </Reorder.Group>
          )}
        </div>

        {/* Fixed Footer */}
        <div className="p-6 border-t border-dark-border flex items-center justify-between flex-shrink-0">
          {error && (
            <div role="alert" className="flex items-center gap-2 text-accent-2 text-sm">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          {!error && (
            <div className="text-xs text-text-muted">
              Drag items or use arrow keys to reorder.
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="btn-secondary"
              disabled={saving}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || orderedItems.length === 0}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check size={16} />
                  Save
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ReorderModal({
  isOpen,
  onClose,
  title,
  items = [],
  onSave,
  titleField,
  subtitleField,
  renderItem,
}) {
  if (!isOpen) return null

  return (
    <ReorderModalInner
      title={title}
      items={items}
      onSave={onSave}
      onClose={onClose}
      titleField={titleField}
      subtitleField={subtitleField}
      renderItem={renderItem}
    />
  )
}
