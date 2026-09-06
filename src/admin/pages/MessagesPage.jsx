import { useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Star, Trash2, MailOpen, Archive,
  AlertCircle, ArrowLeft, Reply
} from 'lucide-react'
import { getContactMessages } from '../../firebase/services'
import {
  updateMessageStatus,
  toggleMessageStar,
  toggleMessageArchive,
  bulkUpdateMessages,
  deleteContactMessage,
} from '../../firebase/adminServices'
import { getUserFriendlyFirebaseError } from '../../firebase/errors'
import { SkeletonTable } from '../components/Skeletons'
import { useAdminCache } from '../hooks/useAdminCache'

const CACHE_KEY = 'admin_messages'
const CACHE_TTL = 60 * 1000

const normaliseMessage = (msg) => ({
  ...msg,
  isRead: msg.status === 'read',
  isStarred: msg.isStarred === true,
  isArchived: msg.isArchived === true,
})

export default function MessagesPage() {
  const { get, set: setItem, clear: clearCache } = useAdminCache()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState('newest')
  const [selectedIds, setSelectedIds] = useState([])
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  const loadMessages = useCallback(async () => {
    const cached = get(CACHE_KEY)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setMessages(cached.data.map(normaliseMessage))
      setLoading(false)
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await getContactMessages()
      const normalised = (Array.isArray(data) ? data : []).map(normaliseMessage)
      setMessages(normalised)
      setItem(CACHE_KEY, normalised)
    } catch (err) {
      setError(getUserFriendlyFirebaseError(err))
      console.error('Failed to load messages:', err)
      setMessages([])
    } finally {
      setLoading(false)
    }
  }, [get, setItem])

  useEffect(() => {
    loadMessages()
  }, [loadMessages])

  const filteredSorted = useMemo(() => {
    let result = messages

    if (filter === 'unread') result = result.filter((m) => !m.isRead)
    else if (filter === 'read') result = result.filter((m) => m.isRead)
    else if (filter === 'starred') result = result.filter((m) => m.isStarred)
    else if (filter === 'archived') result = result.filter((m) => m.isArchived)
    else if (filter === 'inbox') result = result.filter((m) => !m.isArchived)

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (m) =>
          m.name?.toLowerCase().includes(term) ||
          m.email?.toLowerCase().includes(term) ||
          m.subject?.toLowerCase().includes(term) ||
          m.message?.toLowerCase().includes(term)
      )
    }

    result = [...result].sort((a, b) => {
      const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime()
      const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime()

      if (sort === 'newest') return bTime - aTime
      if (sort === 'oldest') return aTime - bTime
      if (sort === 'unread_first') {
        if (a.isRead !== b.isRead) return a.isRead ? 1 : -1
        return bTime - aTime
      }
      return bTime - aTime
    })

    return result
  }, [messages, filter, searchTerm, sort])

  const unreadCount = messages.filter((m) => !m.isRead && !m.isArchived).length

  const handleToggleRead = async (msg) => {
    if (!msg) return
    setActionLoading(true)
    try {
      const newStatus = msg.isRead ? 'unread' : 'read'
      await updateMessageStatus(msg.id, newStatus)
      const updated = messages.map((m) =>
        m.id === msg.id ? { ...m, isRead: !m.isRead, status: newStatus } : m
      )
      setMessages(updated)
      setItem(CACHE_KEY, updated)
      clearCache(CACHE_KEY)
      if (selectedMessage?.id === msg.id) {
        setSelectedMessage({ ...msg, isRead: !msg.isRead, status: newStatus })
      }
    } catch (err) {
      console.error('Failed to toggle read status:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleStar = async (msg) => {
    if (!msg) return
    setActionLoading(true)
    try {
      await toggleMessageStar(msg.id, !msg.isStarred)
      const updated = messages.map((m) =>
        m.id === msg.id ? { ...m, isStarred: !m.isStarred } : m
      )
      setMessages(updated)
      setItem(CACHE_KEY, updated)
      clearCache(CACHE_KEY)
      if (selectedMessage?.id === msg.id) {
        setSelectedMessage({ ...msg, isStarred: !msg.isStarred })
      }
    } catch (err) {
      console.error('Failed to toggle star:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleToggleArchive = async (msg) => {
    if (!msg) return
    setActionLoading(true)
    try {
      await toggleMessageArchive(msg.id, !msg.isArchived)
      const updated = messages.map((m) =>
        m.id === msg.id ? { ...m, isArchived: !m.isArchived } : m
      )
      setMessages(updated)
      setItem(CACHE_KEY, updated)
      clearCache(CACHE_KEY)
      setSelectedMessage(null)
    } catch (err) {
      console.error('Failed to toggle archive:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleDelete = async (msg) => {
    const confirmed = confirm(`Delete message from "${msg.name}"? This cannot be undone.`)
    if (!confirmed) return
    setActionLoading(true)
    try {
      await deleteContactMessage(msg.id)
      const updated = messages.filter((m) => m.id !== msg.id)
      setMessages(updated)
      setItem(CACHE_KEY, updated)
      clearCache(CACHE_KEY)
      if (selectedMessage?.id === msg.id) setSelectedMessage(null)
      setSelectedIds(selectedIds.filter((id) => id !== msg.id))
    } catch (err) {
      console.error('Failed to delete message:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleBulkRead = async () => {
    setActionLoading(true)
    try {
      await bulkUpdateMessages(selectedIds, { status: 'read' })
      const updated = messages.map((m) =>
        selectedIds.includes(m.id) ? { ...m, isRead: true, status: 'read' } : m
      )
      setMessages(updated)
      setItem(CACHE_KEY, updated)
      clearCache(CACHE_KEY)
      setSelectedIds([])
    } catch (err) {
      console.error('Failed to mark messages as read:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleBulkUnread = async () => {
    setActionLoading(true)
    try {
      await bulkUpdateMessages(selectedIds, { status: 'unread' })
      const updated = messages.map((m) =>
        selectedIds.includes(m.id) ? { ...m, isRead: false, status: 'unread' } : m
      )
      setMessages(updated)
      setItem(CACHE_KEY, updated)
      clearCache(CACHE_KEY)
      setSelectedIds([])
    } catch (err) {
      console.error('Failed to mark messages as unread:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleBulkArchive = async () => {
    setActionLoading(true)
    try {
      await bulkUpdateMessages(selectedIds, { isArchived: true })
      const updated = messages.map((m) =>
        selectedIds.includes(m.id) ? { ...m, isArchived: true } : m
      )
      setMessages(updated)
      setItem(CACHE_KEY, updated)
      clearCache(CACHE_KEY)
      setSelectedIds([])
    } catch (err) {
      console.error('Failed to archive messages:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const handleBulkDelete = async () => {
    const confirmed = confirm(`Delete ${selectedIds.length} message(s)? This cannot be undone.`)
    if (!confirmed) return
    setActionLoading(true)
    try {
      await bulkUpdateMessages(selectedIds, { status: 'deleted' })
      const updated = messages.filter((m) => !selectedIds.includes(m.id))
      setMessages(updated)
      setItem(CACHE_KEY, updated)
      clearCache(CACHE_KEY)
      setSelectedIds([])
    } catch (err) {
      console.error('Failed to bulk delete:', err)
    } finally {
      setActionLoading(false)
    }
  }

  const formatDate = (msg) => {
    if (!msg.createdAt?.seconds) return 'Unknown'
    const date = new Date(msg.createdAt.seconds * 1000)
    const now = new Date()
    const diffMs = now - date
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`
    if (diffHours < 24) return `${diffHours} hr ago`
    if (diffDays < 2) return 'Yesterday'
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold font-mono">MESSAGES</h1>
          <SkeletonTable rows={1} cols={4} />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)]">
      <div className="lg:w-3/5 xl:w-2/3 flex flex-col">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold font-mono">MESSAGES</h1>
            <p className="text-xs text-text-muted font-mono mt-1">{unreadCount} UNREAD</p>
          </div>
        </div>

        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-dark-bg border border-dark-border text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="px-3 py-2 bg-dark-bg border border-dark-border text-text-primary text-xs font-mono focus:outline-none focus:border-accent"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="unread_first">Unread first</option>
          </select>
        </div>

        <div className="flex items-center gap-1 mb-4 overflow-x-auto">
          {[
            { key: 'inbox', label: 'INBOX' },
            { key: 'unread', label: 'UNREAD' },
            { key: 'read', label: 'READ' },
            { key: 'starred', label: 'STARRED' },
            { key: 'archived', label: 'ARCHIVED' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 text-xs font-mono font-semibold transition-colors border-b-2 ${
                filter === tab.key
                  ? 'border-accent text-accent'
                  : 'border-transparent text-text-muted hover:text-accent hover:border-accent/20'
              }}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence>
          {selectedIds.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="border border-dark-border bg-dark-elevated/50 px-4 py-3 mb-4 flex items-center gap-3"
            >
              <span className="text-xs font-mono text-text-muted">
                {selectedIds.length} selected
              </span>
              <div className="flex gap-1">
                <button
                  onClick={handleBulkRead}
                  disabled={actionLoading}
                  className="px-3 py-1 text-xs font-mono border border-dark-border hover:border-accent hover:text-accent transition-colors"
                  title="Mark as read"
                >
                  <MailOpen size={12} />
                </button>
                <button
                  onClick={handleBulkUnread}
                  disabled={actionLoading}
                  className="px-3 py-1 text-xs font-mono border border-dark-border hover:border-accent hover:text-accent transition-colors"
                  title="Mark as unread"
                >
                  <AlertCircle size={12} />
                </button>
                <button
                  onClick={handleBulkArchive}
                  disabled={actionLoading}
                  className="px-3 py-1 text-xs font-mono border border-dark-border hover:border-accent hover:text-accent transition-colors"
                  title="Archive"
                >
                  <Archive size={12} />
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={actionLoading}
                  className="px-3 py-1 text-xs font-mono border border-accent-2/30 hover:border-accent-2 hover:text-accent-2 transition-colors"
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex-1 overflow-y-auto border border-dark-border bg-dark-surface">
          {error && (
            <div className="p-4 border-b border-accent-2/30 bg-accent-2/5 text-accent-2 text-sm">
              {error}
            </div>
          )}
          {filteredSorted.length === 0 ? (
            <div className="p-8 text-center text-text-muted text-sm">
              {searchTerm ? 'No messages match your search.' : filter === 'archived' ? 'No archived messages.' : filter === 'unread' ? "You're all caught up." : filter === 'starred' ? 'No starred messages.' : filter === 'read' ? 'No read messages.' : 'No messages yet.'}
            </div>
          ) : (
            filteredSorted.map((msg) => (
              <div
                key={msg.id}
                onClick={() => { setSelectedMessage(msg); setSelectedIds([]) }}
                className={`group p-4 border-b border-dark-border last:border-b-0 cursor-pointer transition-colors ${
                  !msg.isRead && !msg.isArchived
                    ? 'bg-accent/3 font-medium'
                    : ''
                } ${
                  selectedIds.includes(msg.id) ? 'bg-accent/5' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="pt-0.5 flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(msg.id)}
                      onChange={(e) => {
                        e.stopPropagation()
                        const newIds = e.target.checked
                          ? [...selectedIds, msg.id]
                          : selectedIds.filter((id) => id !== msg.id)
                        setSelectedIds(newIds)
                      }}
                      className="border-dark-border accent-accent"
                    />
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        msg.isRead || msg.isArchived ? 'bg-text-muted' : 'bg-accent'
                      }`}
                      title={msg.isRead ? 'Read' : 'Unread'}
                    />
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleToggleStar(msg) }}
                    className={`p-1 transition-colors ${
                      msg.isStarred ? 'text-accent' : 'text-text-muted hover:text-accent'
                    }`}
                  >
                    <Star size={14} fill={msg.isStarred ? 'currentColor' : 'none'} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-medium truncate ${
                        msg.isRead ? 'text-text-secondary' : 'text-text-primary'
                      }`}>{msg.name || 'Anonymous'}</span>
                      <span className="text-xs text-text-muted font-mono">
                        {formatDate(msg)}
                      </span>
                    </div>
                    {msg.subject && (
                      <div className={`text-sm mb-1 truncate ${
                        msg.isRead ? 'text-text-secondary' : 'text-text-primary'
                      }`}>{msg.subject}</div>
                    )}
                    <div className="text-xs text-text-muted truncate">
                      {msg.message || msg.email || ''}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="lg:w-2/5 xl:w-1/3 border border-dark-border bg-dark-surface flex flex-col">
        {selectedMessage ? (
          <>
            <div className="p-6 border-b border-dark-border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-text-muted">Message Details</h2>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="lg:hidden text-text-muted"
                >
                  <ArrowLeft size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">From</label>
                  <p className="text-sm font-medium mt-1">{selectedMessage.name || 'Anonymous'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">Email</label>
                  <p className="text-sm text-text-secondary mt-1 break-all">{selectedMessage.email || '—'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">Subject</label>
                  <p className="text-sm text-text-secondary mt-1">{selectedMessage.subject || '—'}</p>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-text-muted">Received</label>
                  <p className="text-sm text-text-secondary mt-1 font-mono">
                    {selectedMessage.createdAt?.seconds
                      ? new Date(selectedMessage.createdAt.seconds * 1000).toLocaleString()
                      : 'Unknown'}
                  </p>
                </div>
                <div className="flex gap-2 pt-2">
                  <span className={`text-xs px-2 py-0.5 border ${
                    selectedMessage.isRead ? 'border-dark-border text-text-muted' : 'border-accent/30 text-accent'
                  }`}>
                    {selectedMessage.isRead ? 'READ' : 'UNREAD'}
                  </span>
                  {selectedMessage.isStarred && (
                    <span className="text-xs px-2 py-0.5 border border-dark-border text-accent">
                      STARRED
                    </span>
                  )}
                  {selectedMessage.isArchived && (
                    <span className="text-xs px-2 py-0.5 border border-dark-border text-text-muted">
                      ARCHIVED
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="p-6 border-b border-dark-border flex-1 overflow-y-auto">
              <label className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-2 block">Message</label>
              <p className="text-sm text-text-secondary whitespace-pre-wrap break-words">
                {selectedMessage.message || 'No message content.'}
              </p>
            </div>
            <div className="p-4 border-t border-dark-border flex items-center justify-between gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleRead(selectedMessage)}
                  disabled={actionLoading}
                  className="px-3 py-1.5 text-xs font-mono border border-dark-border hover:border-accent hover:text-accent transition-colors"
                >
                  {selectedMessage.isRead ? 'Mark Unread' : 'Mark Read'}
                </button>
                <button
                  onClick={() => handleToggleArchive(selectedMessage)}
                  disabled={actionLoading}
                  className="px-3 py-1.5 text-xs font-mono border border-dark-border hover:border-accent hover:text-accent transition-colors"
                >
                  {selectedMessage.isArchived ? 'Unarchive' : 'Archive'}
                </button>
                <a
                  href={`mailto:${selectedMessage.email || ''}?subject=Re: ${encodeURIComponent(selectedMessage.subject || '')}`}
                  className="px-3 py-1.5 text-xs font-mono border border-dark-border hover:border-accent hover:text-accent transition-colors flex items-center gap-1"
                >
                  <Reply size={12} /> Reply via Email
                </a>
              </div>
              <button
                onClick={() => handleDelete(selectedMessage)}
                disabled={actionLoading}
                className="px-3 py-1.5 text-xs font-mono border border-accent-2/30 hover:border-accent-2 hover:text-accent-2 transition-colors"
              >
                <Trash2 size={12} className="inline mr-1" /> Delete
              </button>
            </div>
          </>
        ) : (
          <div className="p-8 text-center text-text-muted flex flex-col items-center justify-center h-full">
            <MailOpen size={48} className="mb-4 opacity-30" />
            <p className="text-sm">Select a message to view details</p>
          </div>
        )}
      </div>
    </div>
  )
}
