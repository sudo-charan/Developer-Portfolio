import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { getUnreadMessageCount } from '../../firebase/services'

const UnreadCountContext = createContext(null)

export function UnreadCountProvider({ children }) {
  const [count, setCount] = useState(0)

  const fetchCount = useCallback(async () => {
    try {
      const result = await getUnreadMessageCount()
      setCount(result)
    } catch {
      // ignore count fetch errors
    }
  }, [])

  useEffect(() => {
    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [fetchCount])

  return (
    <UnreadCountContext.Provider value={count}>
      {children}
    </UnreadCountContext.Provider>
  )
}

export function useUnreadMessageCount() {
  return useContext(UnreadCountContext)
}
