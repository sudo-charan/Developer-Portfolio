import { useState, useEffect } from 'react'
import { getUnreadMessageCount } from '../../firebase/adminServices.js'
import { UnreadCountContext } from './UnreadCountContext.js'

export function UnreadCountProvider({ children }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let isMounted = true

    const fetchCount = async () => {
      try {
        const result = await getUnreadMessageCount()
        if (isMounted) setCount(result)
      } catch {
        // ignore count fetch errors
      }
    }

    fetchCount()
    const interval = setInterval(fetchCount, 30000)
    return () => {
      isMounted = false
      clearInterval(interval)
    }
  }, [])

  return (
    <UnreadCountContext.Provider value={count}>
      {children}
    </UnreadCountContext.Provider>
  )
}
