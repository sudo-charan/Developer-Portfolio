import { useContext, useRef, useCallback, useEffect } from 'react'
import { AdminCacheContext } from '../context/AdminCacheContext.js'

export function useAdminCache() {
  const context = useContext(AdminCacheContext)
  const cacheRef = useRef(context?.cache || {})

  useEffect(() => {
    if (context?.cache) {
      cacheRef.current = context.cache
    }
  }, [context?.cache])

  const get = useCallback((key) => cacheRef.current[key], [])

  const setItem = useCallback((key, value) => {
    if (context?.set) {
      context.set(key, value)
    }
  }, [context])

  const clearKey = useCallback((key) => {
    if (context?.clearKey) {
      context.clearKey(key)
    }
  }, [context])

  const clearAll = useCallback(() => {
    if (context?.clearAll) {
      context.clearAll()
    }
  }, [context])

  const clear = useCallback((key) => {
    if (key) {
      clearKey(key)
    } else {
      clearAll()
    }
  }, [clearKey, clearAll])

  return { get, set: setItem, clear }
}
