import { useContext } from 'react'
import { UnreadCountContext } from '../context/UnreadCountContext.js'

export function useUnreadMessageCount() {
  return useContext(UnreadCountContext)
}
