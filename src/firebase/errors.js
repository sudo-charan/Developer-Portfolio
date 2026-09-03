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

  const code = error.code || error.message || ''

  if (typeof code === 'string' && code.includes('permission-denied')) {
    return 'Permission denied. You may not have admin access.'
  }

  if (typeof code === 'string' && code.includes('unauthenticated')) {
    return 'You are not authenticated. Please sign in again.'
  }

  if (typeof code === 'string' && code.includes('unavailable')) {
    return 'Firebase is temporarily unavailable. Check your connection and try again.'
  }

  if (typeof code === 'string' && code.includes('deadline-exceeded')) {
    return 'The request timed out. Please try again.'
  }

  if (typeof code === 'string' && code.includes('network')) {
    return 'Network error. Check your internet connection.'
  }

  return error.message || 'Operation failed. Please try again.'
}
