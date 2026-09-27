export function reorderGroup(prev, category, newGroupOrder, groupField) {
  const reorderedById = new Map(newGroupOrder.map((item) => [item.id, item]))
  const result = []
  for (const item of prev) {
    if ((item[groupField] || 'Uncategorized') === category) {
      result.push(reorderedById.get(item.id) || item)
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
