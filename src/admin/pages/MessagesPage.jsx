import { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, Star, Trash2, MailOpen, Archive,
  AlertCircle, ArrowLeft, Reply, RefreshCw, X,
  Mail, Inbox, Check,
} from 'lucide-react'
import { getContactMessages } from '../../firebase/adminServices'
import {
  updateMessageStatus,
  toggleMessageStar,
  toggleMessageArchive,
  bulkUpdateMessages,
  deleteContactMessage,
} from '../../firebase/adminServices'
import { Skeleton } from '../components/Skeletons'
import { useAdminCache } from '../hooks/useAdminCache'

const CACHE_KEY = 'admin_messages'
const CACHE_TTL = 60 * 1000

const normaliseMessage = (msg) => ({
  ...msg,
  isRead: msg.status === 'read',
  isStarred: msg.isStarred === true,
  isArchived: msg.isArchived === true,
})

// ── Skeleton row ───────────────────────────────────────────────────────────────
function SkeletonMsgRow() {
  return (
    <div className="flex items-start gap-3 px-4 py-3 border-b border-dark-border">
      <div className="flex items-center gap-2 pt-1 flex-shrink-0">
        <Skeleton className="w-4 h-4 rounded" />
        <Skeleton className="w-2 h-2 rounded-full" />
      </div>
      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-12 flex-shrink-0" />
        </div>
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-3 w-full" />
      </div>
    </div>
  )
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyState({ Icon, title, description }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="p-5 border border-dark-border bg-dark-elevated mb-4 opacity-30">
        <Icon size={32} className="text-text-muted" />
      </div>
      <p className="text-sm font-medium text-text-secondary mb-1">{title}</p>
      {description && <p className="text-xs text-text-muted">{description}</p>}
    </div>
  )
}

// ── Format timestamps ──────────────────────────────────────────────────────────
function fmtShort(msg) {
  if (!msg.createdAt?.seconds) return ''
  const date = new Date(msg.createdAt.seconds * 1000)
  const diffMs = Date.now() - date.getTime()
  const mins = Math.floor(diffMs / 60000)
  const hrs = Math.floor(diffMs / 3600000)
  const days = Math.floor(diffMs / 86400000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  if (hrs < 24) return `${hrs}h`
  if (days < 2) return 'Yesterday'
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function fmtFull(msg) {
  if (!msg.createdAt?.seconds) return 'Unknown'
  return new Date(msg.createdAt.seconds * 1000).toLocaleString([], {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Message row ────────────────────────────────────────────────────────────────
function MsgRow({ msg, isSelected, selectedIds, onSelect, onCheck, onStar }) {
  const isChecked = selectedIds.includes(msg.id)
  const isUnread = !msg.isRead && !msg.isArchived

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={isSelected}
      aria-label={`Message from ${msg.name || 'Anonymous'}`}
      onClick={() => onSelect(msg)}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSelect(msg) } }}
      className={[
        'relative flex items-start gap-2 px-4 py-3 border-b border-dark-border last:border-b-0',
        'cursor-pointer transition-colors duration-100 outline-none select-none',
        'focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-accent',
        'hover:bg-dark-elevated/70',
        isSelected ? 'bg-accent/[0.06] border-l-2 border-l-accent' : 'border-l-2 border-l-transparent',
        isUnread && !isSelected ? 'bg-dark-elevated/25' : '',
      ].filter(Boolean).join(' ')}
    >
      {/* Checkbox + unread dot */}
      <div
        className="flex items-center gap-1.5 pt-0.5 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <input
          type="checkbox"
          checked={isChecked}
          onChange={(e) => onCheck(msg.id, e.target.checked)}
          aria-label={`Select message from ${msg.name || 'Anonymous'}`}
          tabIndex={-1}
          className="w-3.5 h-3.5 rounded-none accent-accent cursor-pointer flex-shrink-0"
        />
        <span
          aria-hidden="true"
          className={[
            'w-2 h-2 rounded-full flex-shrink-0 transition-colors',
            isUnread ? 'bg-accent' : 'bg-transparent',
          ].join(' ')}
        />
      </div>

      {/* Content — min-w-0 critical to prevent overflow */}
      <div className="flex-1 min-w-0">
        {/* Sender + time */}
        <div className="flex items-baseline gap-1 mb-0.5">
          <span className={[
            'text-sm truncate min-w-0 flex-1',
            isUnread ? 'font-bold text-text-primary' : 'font-medium text-text-secondary',
          ].join(' ')}>
            {msg.name || 'Anonymous'}
          </span>
          <span className="text-[11px] text-text-muted font-mono flex-shrink-0 ml-1">
            {fmtShort(msg)}
          </span>
        </div>
        {/* Subject */}
        <div className={[
          'text-xs truncate mb-0.5',
          isUnread ? 'text-text-primary font-semibold' : 'text-text-secondary',
        ].join(' ')}>
          {msg.subject || '(No subject)'}
        </div>
        {/* Preview */}
        <div className="text-[11px] text-text-muted truncate">
          {(msg.message || msg.email || '').replace(/\n/g, ' ')}
        </div>
      </div>

      {/* Star */}
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); onStar(msg) }}
        aria-label={msg.isStarred ? 'Unstar' : 'Star'}
        tabIndex={-1}
        className={[
          'p-1 flex-shrink-0 self-start transition-colors',
          msg.isStarred ? 'text-accent-3' : 'text-dark-border hover:text-accent-3',
        ].join(' ')}
      >
        <Star size={12} fill={msg.isStarred ? 'currentColor' : 'none'} />
      </button>
    </div>
  )
}

// ── Detail panel ───────────────────────────────────────────────────────────────
function DetailPanel({ msg, onClose, onRead, onStar, onArchive, onDelete, busy }) {
  if (!msg) {
    return (
      <EmptyState
        Icon={Inbox}
        title="No message selected"
        description="Click a message to read it here."
      />
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-dark-border flex-shrink-0">
        <div className="flex items-center justify-between gap-2 mb-3">
          <button
            type="button"
            onClick={onClose}
            aria-label="Back to list"
            className="lg:hidden flex items-center gap-1 text-xs text-text-muted hover:text-text-primary transition-colors"
          >
            <ArrowLeft size={13} /> Back
          </button>
          <div className="flex items-center gap-1.5 ml-auto flex-wrap">
            {!msg.isRead
              ? <span className="text-[10px] px-2 py-0.5 border border-accent/40 text-accent font-mono">UNREAD</span>
              : <span className="text-[10px] px-2 py-0.5 border border-dark-border text-text-muted font-mono">READ</span>
            }
            {msg.isStarred && <span className="text-[10px] px-2 py-0.5 border border-accent-3/40 text-accent-3 font-mono">STARRED</span>}
            {msg.isArchived && <span className="text-[10px] px-2 py-0.5 border border-dark-border text-text-muted font-mono">ARCHIVED</span>}
          </div>
        </div>

        {/* Subject */}
        <h2 className="text-base font-bold text-text-primary break-words mb-3 leading-snug">
          {msg.subject || '(No subject)'}
        </h2>

        {/* Meta */}
        <dl className="space-y-1.5 text-xs">
          <div className="flex gap-2">
            <dt className="w-12 font-semibold uppercase tracking-widest text-text-muted flex-shrink-0">From</dt>
            <dd className="text-text-secondary break-words min-w-0">{msg.name || 'Anonymous'}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-12 font-semibold uppercase tracking-widest text-text-muted flex-shrink-0">Email</dt>
            <dd className="text-text-secondary break-all min-w-0">{msg.email || '—'}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-12 font-semibold uppercase tracking-widest text-text-muted flex-shrink-0">Date</dt>
            <dd className="text-text-muted font-mono min-w-0">{fmtFull(msg)}</dd>
          </div>
        </dl>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
        <p className="text-sm text-text-secondary whitespace-pre-wrap break-words leading-relaxed">
          {msg.message || 'No message content.'}
        </p>
      </div>

      {/* Actions */}
      <div className="px-5 py-3 border-t border-dark-border flex-shrink-0 flex flex-wrap items-center gap-1.5">
        <button type="button" onClick={() => onRead(msg)} disabled={busy}
          className="px-3 py-1.5 text-xs font-mono border border-dark-border hover:border-accent hover:text-accent transition-colors disabled:opacity-40">
          {msg.isRead ? 'Mark Unread' : 'Mark Read'}
        </button>
        <button type="button" onClick={() => onStar(msg)} disabled={busy}
          aria-label={msg.isStarred ? 'Unstar' : 'Star'}
          className="px-3 py-1.5 text-xs font-mono border border-dark-border hover:border-accent-3 hover:text-accent-3 transition-colors disabled:opacity-40">
          {msg.isStarred ? 'Unstar' : 'Star'}
        </button>
        <button type="button" onClick={() => onArchive(msg)} disabled={busy}
          className="px-3 py-1.5 text-xs font-mono border border-dark-border hover:border-accent hover:text-accent transition-colors disabled:opacity-40">
          {msg.isArchived ? 'Unarchive' : 'Archive'}
        </button>
        <a
          href={`mailto:${msg.email || ''}?subject=Re: ${encodeURIComponent(msg.subject || '')}`}
          aria-label="Reply via email"
          className="px-3 py-1.5 text-xs font-mono border border-dark-border hover:border-accent hover:text-accent transition-colors inline-flex items-center gap-1">
          <Reply size={11} /> Reply
        </a>
        <button type="button" onClick={() => onDelete(msg)} disabled={busy}
          className="px-3 py-1.5 text-xs font-mono border border-accent-2/30 hover:border-accent-2 hover:text-accent-2 transition-colors disabled:opacity-40 ml-auto inline-flex items-center gap-1">
          <Trash2 size={11} /> Delete
        </button>
      </div>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function MessagesPage() {
  const { get, set: setItem } = useAdminCache()
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('inbox')
  const [sort, setSort] = useState('newest')
  const [selectedIds, setSelectedIds] = useState([])
  const [selectedMessage, setSelectedMessage] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)
  // Mobile: whether detail panel is shown (full-width overlay)
  const [mobileDetail, setMobileDetail] = useState(false)

  const doLoad = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = get(CACHE_KEY)
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setMessages(cached.data.map(normaliseMessage))
        setLoading(false)
        return
      }
    }
    setLoading(true)
    setError('')
    try {
      const data = await getContactMessages()
      const norm = (Array.isArray(data) ? data : []).map(normaliseMessage)
      setMessages(norm)
      setItem(CACHE_KEY, norm)
    } catch (err) {
      setError(err.message || 'Failed to load messages.')
      console.error('Failed to load messages:', err)
    } finally {
      setLoading(false)
    }
  }, [get, setItem])

  useEffect(() => {
    let mounted = true
    const run = async () => {
      const cached = get(CACHE_KEY)
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        if (mounted) { setMessages(cached.data.map(normaliseMessage)); setLoading(false) }
        return
      }
      if (mounted) setLoading(true)
      try {
        const data = await getContactMessages()
        if (!mounted) return
        const norm = (Array.isArray(data) ? data : []).map(normaliseMessage)
        setMessages(norm)
        setItem(CACHE_KEY, norm)
      } catch (err) {
        if (!mounted) return
        setError(err.message || 'Failed to load messages.')
        console.error('Failed to load messages:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [get, setItem])

  const filteredSorted = useMemo(() => {
    let r = messages
    if (filter === 'unread') r = r.filter((m) => !m.isRead)
    else if (filter === 'read') r = r.filter((m) => m.isRead)
    else if (filter === 'starred') r = r.filter((m) => m.isStarred)
    else if (filter === 'archived') r = r.filter((m) => m.isArchived)
    else if (filter === 'inbox') r = r.filter((m) => !m.isArchived)

    if (searchTerm.trim()) {
      const t = searchTerm.toLowerCase()
      r = r.filter((m) =>
        m.name?.toLowerCase().includes(t) ||
        m.email?.toLowerCase().includes(t) ||
        m.subject?.toLowerCase().includes(t) ||
        m.message?.toLowerCase().includes(t)
      )
    }

    return [...r].sort((a, b) => {
      const at = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : 0
      const bt = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : 0
      if (sort === 'oldest') return at - bt
      if (sort === 'unread_first') {
        if (a.isRead !== b.isRead) return a.isRead ? 1 : -1
        return bt - at
      }
      return bt - at
    })
  }, [messages, filter, searchTerm, sort])

  const unreadCount = messages.filter((m) => !m.isRead && !m.isArchived).length

  // ── Local state helpers ────────────────────────────────────────────────────
  const patchMessages = useCallback((patcher) => {
    setMessages((prev) => {
      const next = patcher(prev)
      setItem(CACHE_KEY, next)
      return next
    })
  }, [setItem])

  const handleSelect = useCallback((msg) => {
    setSelectedMessage(msg)
    setSelectedIds([])
    setMobileDetail(true)
  }, [])

  const handleCheck = useCallback((id, checked) => {
    setSelectedIds((prev) => checked ? [...prev, id] : prev.filter((x) => x !== id))
  }, [])

  const handleRead = useCallback(async (msg) => {
    if (!msg) return
    setActionLoading(true)
    try {
      const newStatus = msg.isRead ? 'unread' : 'read'
      await updateMessageStatus(msg.id, newStatus)
      patchMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, isRead: !m.isRead, status: newStatus } : m))
      setSelectedMessage((s) => s?.id === msg.id ? { ...s, isRead: !s.isRead, status: newStatus } : s)
    } catch (err) { console.error('Failed to toggle read:', err) }
    finally { setActionLoading(false) }
  }, [patchMessages])

  const handleStar = useCallback(async (msg) => {
    if (!msg) return
    setActionLoading(true)
    try {
      await toggleMessageStar(msg.id, !msg.isStarred)
      patchMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, isStarred: !m.isStarred } : m))
      setSelectedMessage((s) => s?.id === msg.id ? { ...s, isStarred: !s.isStarred } : s)
    } catch (err) { console.error('Failed to toggle star:', err) }
    finally { setActionLoading(false) }
  }, [patchMessages])

  const handleArchive = useCallback(async (msg) => {
    if (!msg) return
    setActionLoading(true)
    try {
      await toggleMessageArchive(msg.id, !msg.isArchived)
      patchMessages((prev) => prev.map((m) => m.id === msg.id ? { ...m, isArchived: !m.isArchived } : m))
      setSelectedMessage(null)
      setMobileDetail(false)
    } catch (err) { console.error('Failed to toggle archive:', err) }
    finally { setActionLoading(false) }
  }, [patchMessages])

  const handleDelete = useCallback(async (msg) => {
    if (!confirm(`Delete message from "${msg.name}"? This cannot be undone.`)) return
    setActionLoading(true)
    try {
      await deleteContactMessage(msg.id)
      patchMessages((prev) => prev.filter((m) => m.id !== msg.id))
      if (selectedMessage?.id === msg.id) { setSelectedMessage(null); setMobileDetail(false) }
      setSelectedIds((prev) => prev.filter((id) => id !== msg.id))
    } catch (err) { console.error('Failed to delete:', err) }
    finally { setActionLoading(false) }
  }, [patchMessages, selectedMessage])

  const handleBulkRead = useCallback(async () => {
    setActionLoading(true)
    try {
      await bulkUpdateMessages(selectedIds, { status: 'read' })
      patchMessages((prev) => prev.map((m) => selectedIds.includes(m.id) ? { ...m, isRead: true, status: 'read' } : m))
      setSelectedIds([])
    } catch (err) { console.error(err) } finally { setActionLoading(false) }
  }, [selectedIds, patchMessages])

  const handleBulkUnread = useCallback(async () => {
    setActionLoading(true)
    try {
      await bulkUpdateMessages(selectedIds, { status: 'unread' })
      patchMessages((prev) => prev.map((m) => selectedIds.includes(m.id) ? { ...m, isRead: false, status: 'unread' } : m))
      setSelectedIds([])
    } catch (err) { console.error(err) } finally { setActionLoading(false) }
  }, [selectedIds, patchMessages])

  const handleBulkArchive = useCallback(async () => {
    setActionLoading(true)
    try {
      await bulkUpdateMessages(selectedIds, { isArchived: true })
      patchMessages((prev) => prev.map((m) => selectedIds.includes(m.id) ? { ...m, isArchived: true } : m))
      setSelectedIds([])
    } catch (err) { console.error(err) } finally { setActionLoading(false) }
  }, [selectedIds, patchMessages])

  const handleBulkDelete = useCallback(async () => {
    if (!confirm(`Delete ${selectedIds.length} message(s)? This cannot be undone.`)) return
    setActionLoading(true)
    try {
      await Promise.all(selectedIds.map((id) => deleteContactMessage(id)))
      patchMessages((prev) => prev.filter((m) => !selectedIds.includes(m.id)))
      setSelectedIds([])
    } catch (err) { console.error(err) } finally { setActionLoading(false) }
  }, [selectedIds, patchMessages])

  // ── Empty state copy ───────────────────────────────────────────────────────
  const emptyMeta = useMemo(() => {
    if (searchTerm.trim()) return { Icon: Search, title: 'No results', description: 'Try a different search term.' }
    if (filter === 'unread') return { Icon: Check, title: "All caught up", description: 'No unread messages right now.' }
    if (filter === 'starred') return { Icon: Star, title: 'No starred messages', description: 'Star important messages to find them quickly.' }
    if (filter === 'archived') return { Icon: Archive, title: 'No archived messages', description: 'Archived messages appear here.' }
    if (filter === 'read') return { Icon: MailOpen, title: 'No read messages', description: 'Messages you open will show here.' }
    return { Icon: Mail, title: 'No messages yet', description: 'Contact form submissions appear here.' }
  }, [searchTerm, filter])

  const TABS = [
    { key: 'inbox', label: 'Inbox', count: null },
    { key: 'unread', label: 'Unread', count: unreadCount || null },
    { key: 'read', label: 'Read', count: null },
    { key: 'starred', label: 'Starred', count: null },
    { key: 'archived', label: 'Archived', count: null },
  ]

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="w-full min-w-0">

      {/* Page header */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <h1 className="text-2xl font-bold font-mono tracking-tight">MESSAGES</h1>
          <p className="text-xs text-text-muted font-mono mt-0.5">
            {loading ? 'Loading…' : unreadCount > 0 ? `${unreadCount} unread` : 'Inbox empty'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => doLoad(true)}
          disabled={loading}
          aria-label="Refresh messages"
          className="flex items-center gap-1.5 px-3 py-2 text-xs font-mono border border-dark-border hover:border-accent hover:text-accent transition-colors disabled:opacity-40 flex-shrink-0"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Search + sort */}
      <div className="flex items-center gap-2 mb-3 min-w-0">
        <div className="relative flex-1 min-w-0">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
          <input
            id="message-search"
            type="text"
            placeholder="Search sender, subject, message…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-8 py-2 bg-dark-bg border border-dark-border text-text-primary placeholder-text-muted text-sm focus:outline-none focus:border-accent transition-colors"
            aria-label="Search messages"
          />
          {searchTerm && (
            <button type="button" onClick={() => setSearchTerm('')} aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary transition-colors">
              <X size={13} />
            </button>
          )}
        </div>
        <label htmlFor="message-sort" className="sr-only">Sort messages</label>
        <select
          id="message-sort"
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-3 py-2 bg-dark-bg border border-dark-border text-text-primary text-xs font-mono focus:outline-none focus:border-accent transition-colors flex-shrink-0"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="unread_first">Unread first</option>
        </select>
      </div>

      {/* Filter tabs — scroll on narrow screens, never push layout wide */}
      <div
        className="flex items-center gap-0 border-b border-dark-border mb-4 overflow-x-auto"
        style={{ scrollbarWidth: 'none' }}
        aria-label="Message filters"
      >
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            aria-pressed={filter === tab.key}
            className={[
              'flex items-center gap-1.5 px-4 py-2.5 text-xs font-mono font-semibold',
              'whitespace-nowrap border-b-2 -mb-px transition-colors flex-shrink-0',
              filter === tab.key
                ? 'border-accent text-accent'
                : 'border-transparent text-text-muted hover:text-text-primary',
            ].join(' ')}
          >
            {tab.label}
            {tab.count !== null && (
              <span className="px-1.5 py-0.5 bg-accent/15 text-accent text-[10px] leading-none rounded-sm">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Error banner */}
      {error && (
        <div role="alert" className="flex items-start gap-2 mb-4 p-3 border border-accent-2/30 bg-accent-2/5 text-accent-2 text-sm min-w-0">
          <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
          <span className="break-words min-w-0">{error}</span>
        </div>
      )}

      {/* Bulk action bar */}
      <AnimatePresence>
        {selectedIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="border border-dark-border bg-dark-elevated/50 px-4 py-2.5 flex items-center gap-3 flex-wrap min-w-0">
              <span className="text-xs font-mono text-text-muted flex-shrink-0">{selectedIds.length} selected</span>
              <div className="flex gap-1.5 flex-wrap">
                <button type="button" onClick={handleBulkRead} disabled={actionLoading}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono border border-dark-border hover:border-accent hover:text-accent transition-colors disabled:opacity-40">
                  <MailOpen size={11} /> Mark read
                </button>
                <button type="button" onClick={handleBulkUnread} disabled={actionLoading}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono border border-dark-border hover:border-accent hover:text-accent transition-colors disabled:opacity-40">
                  <Mail size={11} /> Mark unread
                </button>
                <button type="button" onClick={handleBulkArchive} disabled={actionLoading}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono border border-dark-border hover:border-accent hover:text-accent transition-colors disabled:opacity-40">
                  <Archive size={11} /> Archive
                </button>
                <button type="button" onClick={handleBulkDelete} disabled={actionLoading}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-mono border border-accent-2/30 hover:border-accent-2 hover:text-accent-2 transition-colors disabled:opacity-40">
                  <Trash2 size={11} /> Delete
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Two-column inbox layout */}
      <div
        className="flex flex-row border border-dark-border overflow-hidden min-w-0"
        style={{ height: 'calc(100dvh - 22rem)', minHeight: '380px' }}
      >
        {/* ── List column ── */}
        <div className={[
          'flex flex-col min-w-0 flex-shrink-0 border-dark-border bg-dark-surface',
          'w-full lg:w-[400px] xl:w-[440px]',
          'border-r-0 lg:border-r',
          // Mobile: hide list when detail open
          mobileDetail ? 'hidden lg:flex' : 'flex',
        ].join(' ')}>
          <div className="flex-1 overflow-y-auto min-h-0">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <SkeletonMsgRow key={i} />)
              : filteredSorted.length === 0
                ? <EmptyState {...emptyMeta} />
                : filteredSorted.map((msg) => (
                  <MsgRow
                    key={msg.id}
                    msg={msg}
                    isSelected={selectedMessage?.id === msg.id}
                    selectedIds={selectedIds}
                    onSelect={handleSelect}
                    onCheck={handleCheck}
                    onStar={handleStar}
                  />
                ))
            }
          </div>
          {!loading && filteredSorted.length > 0 && (
            <div className="flex-shrink-0 px-4 py-2 border-t border-dark-border bg-dark-bg/60">
              <span className="text-[11px] text-text-muted font-mono">
                {filteredSorted.length} message{filteredSorted.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* ── Detail column ── */}
        <div className={[
          'flex-1 min-w-0 bg-dark-surface',
          // Mobile: show detail only when open
          mobileDetail ? 'flex flex-col' : 'hidden lg:flex lg:flex-col',
        ].join(' ')}>
          <DetailPanel
            msg={selectedMessage}
            onClose={() => { setSelectedMessage(null); setMobileDetail(false) }}
            onRead={handleRead}
            onStar={handleStar}
            onArchive={handleArchive}
            onDelete={handleDelete}
            busy={actionLoading}
          />
        </div>
      </div>
    </div>
  )
}
