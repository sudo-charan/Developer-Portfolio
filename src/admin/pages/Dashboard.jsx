import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FolderOpen, Code, Briefcase, GraduationCap,
  Award, Clock, FileText, MessageSquare, ExternalLink
} from 'lucide-react'
import { getProjects, getSkills, getExperience, getEducation, getCertificates, getCurrentWork, getBlogPosts, getContactMessages } from '../../firebase/services'
import { auth } from '../../firebase/config'
import { useUnreadMessageCount } from '../context/UnreadCountContext'
import { SkeletonCard, Skeleton } from '../components/Skeletons'
import { useAdminCache } from '../hooks/useAdminCache'
import SystemStatus from '../components/SystemStatus'

const CACHE_KEY = 'dashboard_counts'
const CACHE_TTL = 60 * 1000

const stats = [
  { label: 'Projects', key: 'Projects', icon: FolderOpen, path: '/admin/projects', desc: 'Published portfolio items' },
  { label: 'Skills', key: 'Skills', icon: Code, path: '/admin/skills', desc: 'Technical skills in portfolio' },
  { label: 'Experience', key: 'Experience', icon: Briefcase, path: '/admin/experience', desc: 'Professional experience entries' },
  { label: 'Education', key: 'Education', icon: GraduationCap, path: '/admin/education', desc: 'Education records' },
  { label: 'Certificates', key: 'Certificates', icon: Award, path: '/admin/certificates', desc: 'Verified certifications' },
  { label: 'Current Work', key: 'CurrentWork', icon: Clock, path: '/admin/current-work', desc: 'Active work items' },
  { label: 'Blog Posts', key: 'BlogPosts', icon: FileText, path: '/admin/blog', desc: 'Published articles' },
  { label: 'Messages', key: 'Messages', icon: MessageSquare, path: '/admin/messages', desc: 'Contact messages' },
]

const quickActions = [
  { label: 'PROJECT', icon: FolderOpen, path: '/admin/projects' },
  { label: 'EXPERIENCE', icon: Briefcase, path: '/admin/experience' },
  { label: 'SKILL', icon: Code, path: '/admin/skills' },
  { label: 'BLOG POST', icon: FileText, path: '/admin/blog' },
]

export default function AdminDashboardIndex() {
  const { get, set: setItem } = useAdminCache()
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [updatedAt, setUpdatedAt] = useState(null)
  const unreadCount = useUnreadMessageCount()
  const navigate = useNavigate()

  useEffect(() => {
    const cached = get(CACHE_KEY)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setCounts(cached.data)
      setUpdatedAt(cached.timestamp)
      setLoading(false)
      return
    }

    const loadCounts = async () => {
      try {
        const results = await Promise.allSettled([
          getProjects(),
          getSkills(),
          getExperience(),
          getEducation(),
          getCertificates(),
          getCurrentWork(),
          getBlogPosts('all'),
          getContactMessages(),
        ])
        const [projects, skills, experience, education, certificates, currentWork, blogPosts, messages] = results.map((r) => r.status === 'fulfilled' ? r.value : [])
        const data = {
          Projects: projects.length,
          Skills: skills.length,
          Experience: experience.length,
          Education: education.length,
          Certificates: certificates.length,
          CurrentWork: currentWork.length,
          BlogPosts: blogPosts.length,
          Messages: messages.length,
        }
        setCounts(data)
        const now = Date.now()
        setUpdatedAt(now)
        setItem(CACHE_KEY, data)
      } catch (err) {
        console.error('Failed to load dashboard counts:', err)
      } finally {
        setLoading(false)
      }
    }
    loadCounts()
  }, [get, setItem])

  const formatTime = (timestamp) => {
    if (!timestamp) return '--:--'
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  if (loading) {
    return (
      <div>
        <div className="mb-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-dark-border mb-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold mb-1 font-mono">DASHBOARD</h1>
          <p className="text-text-muted text-sm">Portfolio control center</p>
        </div>
        <div className="text-xs text-text-muted font-mono space-y-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            SYSTEM ONLINE
          </div>
          <div>Updated: {formatTime(updatedAt)}</div>
          <div>Admin: {auth?.currentUser?.email || 'authenticated'}</div>
        </div>
      </div>

      {/* Statistics */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-4">Statistics</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-dark-border">
          {stats.map((stat) => (
            <button
              key={stat.key}
              onClick={() => navigate(stat.path)}
              className="bg-dark-surface p-4 lg:p-6 hover:bg-dark-elevated transition-colors text-left group"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 border border-dark-border bg-dark-bg group-hover:border-accent/30 transition-colors">
                  <stat.icon size={18} className="text-accent" />
                </div>
                <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">{stat.label}</span>
              </div>
              <p className="text-3xl font-bold font-mono mb-1">{counts?.[stat.key] || 0}</p>
              <p className="text-text-muted text-xs mb-4">{stat.desc}</p>
              <div className="flex items-center gap-1 text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                View {stat.label.toLowerCase()} <ExternalLink size={12} />
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-4">Quick Actions</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-dark-border">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => navigate(action.path)}
              className="bg-dark-surface p-4 hover:bg-dark-elevated transition-colors flex items-center gap-3 group"
            >
              <div className="p-2 border border-dark-border bg-dark-bg group-hover:border-accent/30 transition-colors">
                <action.icon size={16} className="text-accent" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-widest text-text-secondary group-hover:text-accent transition-colors">
                + {action.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* System Status */}
      <div className="mb-8">
        <SystemStatus />
      </div>
      {/* Recent Activity + Messages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-4">Recent Activity</p>
          <div className="border border-dark-border bg-dark-surface p-8 text-center">
            <p className="text-text-muted text-sm">No recent activity available</p>
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-text-muted mb-4">Recent Messages</p>
          <button
            onClick={() => navigate('/admin/messages')}
            className="w-full border border-dark-border bg-dark-surface p-6 hover:bg-dark-elevated transition-colors text-left group"
          >
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">Messages</span>
              <ExternalLink size={14} className="text-text-muted group-hover:text-accent transition-colors" />
            </div>
            <div className="flex items-end gap-3 mb-2">
              <span className="text-4xl font-bold font-mono">{String(unreadCount).padStart(2, '0')}</span>
            </div>
            <p className="text-text-secondary text-sm">
              {unreadCount === 0 ? 'No unread messages' : 'Unread messages'}
            </p>
                    <div className="mt-4 text-xs text-accent opacity-0 group-hover:opacity-100 transition-opacity">
                      View messages →
                    </div>
          </button>
        </div>
      </div>
    </div>
  )
}
