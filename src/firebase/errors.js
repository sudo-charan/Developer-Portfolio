export function withTimeout(operation, timeoutMs = 15000) {
  let timeoutId

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(
        'The request timed out. Check your internet connection and Firebase configuration.'
      ))
    }, timeoutMs)
  })

  const promise = typeof operation === 'function' ? operation() : operation

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId)
  })
}

export function getUserFriendlyFirebaseError(error) {
  if (!error) {
    return 'An unknown error occurred. Please try again.'
  }

  const code = error.code || ''
  const message = error.message || ''

  const combined = `${code} ${message}`

  if (combined.includes('permission-denied') || combined.includes('PERMISSION_DENIED')) {
    return 'Permission denied. You may not have admin access.'
  }

  if (combined.includes('unauthenticated') || combined.includes('UNAUTHENTICATED')) {
    return 'You are not authenticated. Please sign in again.'
  }

  if (combined.includes('unavailable') || combined.includes('UNAVAILABLE')) {
    return 'Firebase is temporarily unavailable. Check your connection and try again.'
  }

  if (combined.includes('deadline-exceeded') || combined.includes('DEADLINE_EXCEEDED')) {
    return 'The request timed out. Please try again.'
  }

  if (combined.includes('network')) {
    return 'Network error. Check your internet connection.'
  }

  if (combined.includes('resource-exhausted') || combined.includes('RESOURCE_EXHAUSTED')) {
    return 'Firebase quota exceeded. Try again later.'
  }

  if (combined.includes('failed-precondition') || combined.includes('FAILED_PRECONDITION')) {
    return 'Request failed. Check your Firebase configuration and Firestore rules.'
  }

  if (combined.includes('internal') || combined.includes('INTERNAL')) {
    return 'Internal server error. Please try again later.'
  }

  return message || code || 'Operation failed. Please try again.'
}
