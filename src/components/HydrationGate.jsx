import { useEffect } from 'react'

export default function HydrationGate({ children }) {
  useEffect(() => {
    document.getElementById('root')?.classList.remove('app-hydrating')
  }, [])

  return children
}
