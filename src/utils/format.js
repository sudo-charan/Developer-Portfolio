export function formatFirestoreDate(value) {
  if (!value) return ''
  const time = typeof value === 'object' && value.seconds ? value.seconds * 1000 : new Date(value).getTime()
  return new Date(time).toLocaleDateString()
}
