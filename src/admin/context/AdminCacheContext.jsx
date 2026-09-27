import { useCallback, useMemo, useRef } from 'react'
import { AdminCacheContext } from './AdminCacheContext.js'

export function AdminCacheProvider({ children }) {
  const cacheRef = useRef({})

  const get = useCallback((key) => cacheRef.current[key], [])

  const setItem = useCallback((key, value) => {
    cacheRef.current[key] = { data: value, timestamp: Date.now() }
  }, [])

  const clearKey = useCallback((key) => {
    delete cacheRef.current[key]
  }, [])

  const clearAll = useCallback(() => {
    cacheRef.current = {}
  }, [])

  const value = useMemo(
    () => ({ get, set: setItem, clearKey, clearAll }),
    [get, setItem, clearKey, clearAll],
  )

  return (
    <AdminCacheContext.Provider value={value}>
      {children}
    </AdminCacheContext.Provider>
  )
}
