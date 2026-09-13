import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Reorder, useDragControls } from 'framer-motion'
import { GripVertical, X, Check, AlertCircle } from 'lucide-react'
import { reorderGroup, reorderCategories } from '../utils/reorderHelpers'

const LAYOUT_SPRING = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
}

const DRAG_SPRING = {
  type: 'spring',
  stiffness: 500,
  damping: 40,
}

const ROW_DRAG_WHILE = {
  scale: 1.02,
  zIndex: 1000,
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
  transition: { duration: 0.15 },
}

const CATEGORY_DRAG_WHILE = {
  scale: 1.01,
  zIndex: 10,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
  transition: { duration: 0.15 },
}

function ItemRow({
  item,
  position,
  total,
  dragControls,
  onMoveUp,
  onMoveDown,
  titleField,
  subtitleField,
  renderItem,
}) {
  const onKeyDown = (e) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      onMoveUp()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      onMoveDown()
    }
  }

  const itemName = titleField
    ? item[titleField]
    : item.name || item.title || item.id

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
      dragTransition={DRAG_SPRING}
      whileDrag={ROW_DRAG_WHILE}
      layout="position"
      transition={LAYOUT_SPRING}
      style={{ touchAction: 'none' }}
      className="flex items-center gap-3 p-3 hover:bg-dark-bg/30 transition-colors duration-150"
    >
      <div
        tabIndex={0}
        role="button"
        aria-roledescription="reorderable item"
        aria-label={`Item ${position} of ${total}. Use arrow keys to reorder.`}
        onKeyDown={onKeyDown}
        className="flex items-center gap-3 w-full outline-none"
      >
        <span className="text-xs text-text-muted font-mono w-8 text-center flex-shrink-0">
          {position}
        </span>
        <div className="flex-1 min-w-0">
          {renderItem
            ? renderItem(item, position - 1)
            : (
              <div className="flex flex-col">
                <span className="font-semibold text-sm truncate">
                  {itemName}
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
            p-2 text-text-muted hover:text-text-primary
            transition-colors
            flex-shrink-0 select-none
          "
          style={{ touchAction: 'none' }}
          onPointerDown={(e) => {
            e.stopPropagation()
            dragControls.start(e, { distanceThreshold: 5 })
          }}
          aria-label="Drag handle - press and drag to reorder"
        >
          <GripVertical size={14} />
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
  groupField,
}) {
  const [orderedItems, setOrderedItems] = useState(items)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const dialogRef = useRef(null)
  const dragControls = useDragControls()
  const categoryDragControls = useDragControls()

  const grouped = useMemo(() => {
    if (!groupField || orderedItems.length === 0) return null
    const map = new Map()
    const order = []
    for (const item of orderedItems) {
      const cat = item[groupField] || 'Uncategorized'
      if (!map.has(cat)) {
        map.set(cat, [])
        order.push(cat)
      }
      map.get(cat).push(item)
    }
    return order.map((cat) => ({ category: cat, items: map.get(cat) }))
  }, [orderedItems, groupField])

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

  const moveUp = useCallback((globalIndex) => {
    setOrderedItems((prev) => {
      if (globalIndex === 0) return prev
      const item = prev[globalIndex]
      const prevItem = prev[globalIndex - 1]
      if (groupField) {
        const itemGroup = item[groupField] || 'Uncategorized'
        const prevGroup = prevItem[groupField] || 'Uncategorized'
        if (itemGroup !== prevGroup) return prev
      }
      const next = [...prev]
      ;[next[globalIndex], next[globalIndex - 1]] = [next[globalIndex - 1], next[globalIndex]]
      return next
    })
  }, [groupField])

  const moveDown = useCallback((globalIndex) => {
    setOrderedItems((prev) => {
      if (globalIndex >= prev.length - 1) return prev
      const item = prev[globalIndex]
      const nextItem = prev[globalIndex + 1]
      if (groupField) {
        const itemGroup = item[groupField] || 'Uncategorized'
        const nextGroup = nextItem[groupField] || 'Uncategorized'
        if (itemGroup !== nextGroup) return prev
      }
      const next = [...prev]
      ;[next[globalIndex], next[globalIndex + 1]] = [next[globalIndex + 1], next[globalIndex]]
      return next
    })
  }, [groupField])

  const handleCategoryReorder = useCallback((newCategoryOrder) => {
    setOrderedItems((prev) => reorderCategories(prev, newCategoryOrder, groupField))
  }, [groupField])

  const handleGroupReorder = useCallback((category, newGroupOrder) => {
    setOrderedItems((prev) => reorderGroup(prev, category, newGroupOrder, groupField))
  }, [groupField])

  const handleCancel = () => {
    setOrderedItems(items)
    setError('')
    onClose()
  }

  const handleSave = async () => {
    if (saving) return
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
          ) : grouped ? (
            <Reorder.Group
              axis="y"
              onReorder={handleCategoryReorder}
              values={grouped.map((g) => g.category)}
              as="div"
              layout="position"
              transition={LAYOUT_SPRING}
              className="border border-dark-border bg-dark-surface"
            >
              {grouped.map((group) => {
                const itemCount = group.items.length
                return (
                  <Reorder.Item
                    key={group.category}
                    value={group.category}
                    as="div"
                    dragListener={false}
                    dragControls={categoryDragControls}
                    drag="y"
                    dragPropagation={false}
                    dragTransition={DRAG_SPRING}
                    whileDrag={CATEGORY_DRAG_WHILE}
                    layout="position"
                    transition={LAYOUT_SPRING}
                    className="flex flex-col"
                  >
                    {/* Category header — NOT a Reorder.Item, just a styled header with drag handle */}
                    <div
                      className="px-4 py-2 border-b border-dark-border bg-dark-bg/30 flex items-center justify-between"
                    >
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-text-muted font-mono">
                        {group.category}
                        <span className="text-text-muted/60 font-normal normal-case"> ({itemCount})</span>
                      </h3>
                      <div
                        style={{ touchAction: 'none' }}
                        onPointerDown={(e) => {
                          e.stopPropagation()
                          categoryDragControls.start(e, { distanceThreshold: 5 })
                        }}
                        className="
                          cursor-grab active:cursor-grabbing
                          p-2 text-text-muted hover:text-text-primary
                          transition-colors
                          rounded
                          flex-shrink-0 select-none
                        "
                        aria-label={`Drag to move ${group.category} category`}
                      >
                        <GripVertical size={14} />
                      </div>
                    </div>

                    {/* Inner Reorder.Group — item-level reordering within this category */}
                    <Reorder.Group
                      axis="y"
                      onReorder={(newOrder) => handleGroupReorder(group.category, newOrder)}
                      values={group.items}
                      as="div"
                      layout="position"
                      transition={LAYOUT_SPRING}
                      className="bg-dark-surface"
                    >
                      {group.items.map((item, groupIdx) => {
                        const globalIndex = orderedItems.indexOf(item)
                        return (
                          <ItemRow
                            key={item.id}
                            item={item}
                            position={groupIdx + 1}
                            total={itemCount}
                            dragControls={dragControls}
                            onMoveUp={() => moveUp(globalIndex)}
                            onMoveDown={() => moveDown(globalIndex)}
                            titleField={titleField}
                            subtitleField={subtitleField}
                            renderItem={renderItem}
                          />
                        )
                      })}
                    </Reorder.Group>
                  </Reorder.Item>
                )
              })}
            </Reorder.Group>
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
                <ItemRow
                  key={item.id}
                  item={item}
                  position={index + 1}
                  total={orderedItems.length}
                  dragControls={dragControls}
                  onMoveUp={() => moveUp(index)}
                  onMoveDown={() => moveDown(index)}
                  titleField={titleField}
                  subtitleField={subtitleField}
                  renderItem={renderItem}
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
              {grouped
                ? 'Drag category handles to move groups. Drag items within a category to reorder. Use arrow keys for keyboard navigation.'
                : 'Drag items or use arrow keys to reorder.'}
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
  groupField,
}) {
  if (!isOpen) return null

  return (
    <ReorderModalInner
      key={items.map((i) => i.id).join(',')}
      title={title}
      items={items}
      onSave={onSave}
      onClose={onClose}
      titleField={titleField}
      subtitleField={subtitleField}
      renderItem={renderItem}
      groupField={groupField}
    />
  )
}
