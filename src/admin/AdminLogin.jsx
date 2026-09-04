import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, AlertCircle } from 'lucide-react'
import { signInWithEmailAndPassword } from '@firebase/auth'
import { auth } from '../firebase/config'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (location.state?.message) {
      setError(location.state.message)
    }
  }, [location.state])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!auth) {
      setError('Firebase is not configured. Please add your Firebase config to .env')
      return
    }
    setLoading(true)
    setError('')
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/admin', { replace: true })
    } catch {
      setError('Invalid credentials')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 border border-accent bg-dark-surface mb-4">
            <Lock className="text-accent" size={24} />
          </div>
          <h1 className="text-2xl font-bold mb-2 font-mono">ADMIN<span className="text-accent">_</span>LOGIN</h1>
          <p className="text-text-muted text-sm">Authenticate to manage portfolio content</p>
        </div>
        <form onSubmit={handleSubmit} className="border border-dark-border bg-dark-surface p-6 space-y-6">
          {error && (
            <div className="flex items-center gap-2 text-accent-2 text-sm border border-accent-2/30 bg-accent-2/5 p-3">
              <AlertCircle size={16} />
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-dark-bg border border-dark-border text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
              placeholder="admin@example.com"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-dark-bg border border-dark-border text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary flex items-center justify-center"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
