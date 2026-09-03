import { useState, useCallback } from 'react'
import { AdminCacheContext } from './AdminCacheContext.js'

export function AdminCacheProvider({ children }) {
  const [cache, setCache] = useState({})

  const get = useCallback((key) => cache[key], [cache])

  const setItem = useCallback((key, value) => {
    setCache((prev) => ({ ...prev, [key]: { data: value, timestamp: Date.now() } }))
  }, [])

  const clearKey = useCallback((key) => {
    setCache((prev) => {
      const next = { ...prev }
      delete next[key]
      return next
    })
  }, [])

  const clearAll = useCallback(() => setCache({}), [])

  return (
    <AdminCacheContext.Provider value={{ cache, get, set: setItem, clearKey, clearAll }}>
      {children}
    </AdminCacheContext.Provider>
  )
}
