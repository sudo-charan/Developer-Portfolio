export function reorderGroup(prev, category, newGroupOrder, groupField) {
  const result = []
  let groupIdx = 0
  for (const item of prev) {
    if ((item[groupField] || 'Uncategorized') === category) {
      if (groupIdx < newGroupOrder.length) {
        result.push(newGroupOrder[groupIdx])
      } else {
        result.push(item)
      }
      groupIdx++
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
  for (const cat of newCategoryOrder) {
    const items = itemsByCategory.get(cat)
    if (items) result.push(...items)
  }
  return result
}
