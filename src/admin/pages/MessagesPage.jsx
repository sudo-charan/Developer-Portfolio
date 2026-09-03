import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { getContactMessages } from '../../firebase/services'
import { updateMessageStatus, deleteContactMessage } from '../../firebase/adminServices'
import { MailOpen, Trash2 } from 'lucide-react'
import { SkeletonTable } from '../components/Skeletons'
import { useAdminCache } from '../hooks/useAdminCache'

const CACHE_KEY = 'admin_messages'
const CACHE_TTL = 60 * 1000

export default function MessagesPage() {
  const { get, set: setItem, clear: clearCache } = useAdminCache()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadMessages = useCallback(async () => {
    const cached = get(CACHE_KEY)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setMessages(cached.data)
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')
    try {
      const data = await getContactMessages()
      setMessages(Array.isArray(data) ? data : [])
      setItem(CACHE_KEY, Array.isArray(data) ? data : [])
    } catch (err) {
      setError('Failed to load messages. You may not have permission.')
      console.error('Failed to load messages:', err)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }, [get, setItem])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  const handleStatus = async (id, status) => {
    setError('')
    try {
      await updateMessageStatus(id, status)
      clearCache(CACHE_KEY)
      loadMessages()
    } catch (err) {
      const message = err?.message || 'Failed to update message. You may not have permission.'
      setError(message)
      console.error('[Admin CRUD] Message status update failed', {
        id,
        status,
        code: err.code,
        message: err.message,
      })
    }
  }

  const handleDelete = async (id) => {
    const confirmed = confirm('Delete this message?')
    if (!confirmed) return
    setError('')
    try {
      await deleteContactMessage(id)
      clearCache(CACHE_KEY)
      loadMessages()
    } catch (err) {
      const message = err?.message || 'Failed to delete message. You may not have permission.'
      setError(message)
      console.error('[Admin CRUD] Message delete failed', {
        id,
        code: err.code,
        message: err.message,
      })
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 font-mono">CONTACT_MESSAGES</h1>

      {error && (
        <div className="mb-6 p-3 border border-accent-2/30 bg-accent-2/5 text-accent-2 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <SkeletonTable rows={5} cols={5} />
      ) : (
        <div className="border border-dark-border bg-dark-surface">
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 ${msg.status === 'unread' ? 'border-l-2 border-l-accent' : ''}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-sm">{msg.name}</h3>
                  <p className="text-text-muted text-xs font-mono">{msg.email}</p>
                </div>
                <span className="text-xs text-text-muted font-mono">
                  {msg.createdAt?.seconds ? new Date(msg.createdAt.seconds * 1000).toLocaleString() : ''}
                </span>
              </div>
              <p className="text-accent text-sm font-medium mb-2">{msg.subject}</p>
              <p className="text-text-secondary text-sm mb-4 whitespace-pre-wrap">{msg.message}</p>
              <div className="flex gap-3">
                {msg.status === 'unread' ? (
                  <button onClick={() => handleStatus(msg.id, 'read')} className="flex items-center gap-1 text-xs text-accent hover:underline">
                    <MailOpen size={14} /> Mark as read
                  </button>
                ) : (
                  <span className="flex items-center gap-1 text-xs text-text-muted"><MailOpen size={14} /> Read</span>
                )}
                <button onClick={() => handleDelete(msg.id)} className="flex items-center gap-1 text-xs text-accent-2 hover:text-accent-2">
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </motion.div>
          ))}
          {messages.length === 0 && <div className="p-8 text-center text-text-muted text-sm">No messages yet.</div>}
        </div>
      )}
    </div>
  )
}
