import { useState, useEffect, useCallback } from 'react'
import { getUnreadMessageCount } from '../../firebase/services'
import { UnreadCountContext } from './UnreadCountContext.js'

export function UnreadCountProvider({ children }) {
  const [count, setCount] = useState(0)

  const getCount = useCallback(async () => {
    try {
      return await getUnreadMessageCount()
    } catch {
      return 0
    }
  }, [])

  useEffect(() => {
    getCount().then(setCount)
    const interval = setInterval(() => getCount().then(setCount), 30000)
    return () => clearInterval(interval)
  }, [getCount])

  return (
    <UnreadCountContext.Provider value={count}>
      {children}
    </UnreadCountContext.Provider>
  )
}
