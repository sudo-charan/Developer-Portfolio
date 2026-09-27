export function reorderGroup(prev, category, newGroupOrder, groupField) {
  const groupItems = prev.filter(
    (item) => (item[groupField] || 'Uncategorized') === category
  )
  const groupItemIds = new Set(groupItems.map((item) => item.id))
  const reorderedGroup = newGroupOrder.filter((item) => groupItemIds.has(item.id))
  const reorderedIds = new Set(reorderedGroup.map((item) => item.id))

  // Keep any item that was not included in the drag callback rather than
  // dropping it from the list.
  groupItems.forEach((item) => {
    if (!reorderedIds.has(item.id)) reorderedGroup.push(item)
  })

  const result = []
  let groupIndex = 0
  for (const item of prev) {
    if ((item[groupField] || 'Uncategorized') === category) {
      result.push(reorderedGroup[groupIndex])
      groupIndex += 1
    } else {
      result.push(item)
    }
  }
  return result
}

export function reorderCategories(prev, newCategoryOrder, groupField) {
  const itemsByCategory = new Map()
  for (const item of prev) {
    const cat = item[groupField] || 'Uncategorized'
    if (!itemsByCategory.has(cat)) itemsByCategory.set(cat, [])
    itemsByCategory.get(cat).push(item)
  }
  const result = []
  const seenCategories = new Set()
  for (const cat of newCategoryOrder) {
    const items = itemsByCategory.get(cat)
    if (items) {
      result.push(...items)
      seenCategories.add(cat)
    }
  }
  for (const [cat, items] of itemsByCategory) {
    if (!seenCategories.has(cat)) result.push(...items)
  }
  return result
}
