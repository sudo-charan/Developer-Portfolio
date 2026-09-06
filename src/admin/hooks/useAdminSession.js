import { useContext } from 'react'
import { AdminSessionContext } from '../context/AdminSessionContext.js'

export function useAdminSession() {
  const context = useContext(AdminSessionContext)
  if (!context) {
    throw new Error('useAdminSession must be used within AdminSessionProvider')
  }
  return context
}
