import { useState, useEffect } from 'react'
import { FolderOpen, Code, Briefcase, GraduationCap, Award, Clock, FileText, MessageSquare } from 'lucide-react'
import { getProjects, getSkills, getExperience, getEducation, getCertificates, getCurrentWork, getBlogPosts, getContactMessages } from '../../firebase/services'
import { SkeletonCard } from '../components/Skeletons'
import { useAdminCache } from '../hooks/useAdminCache'

const CACHE_KEY = 'dashboard_counts'
const CACHE_TTL = 60 * 1000

const stats = [
  { label: 'Projects', icon: FolderOpen },
  { label: 'Skills', icon: Code },
  { label: 'Experience', icon: Briefcase },
  { label: 'Education', icon: GraduationCap },
  { label: 'Certificates', icon: Award },
  { label: 'Current Work', icon: Clock },
  { label: 'Blog Posts', icon: FileText },
  { label: 'Messages', icon: MessageSquare },
]

export default function AdminDashboardIndex() {
  const { get, set: setItem } = useAdminCache()
  const [counts, setCounts] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const cached = get(CACHE_KEY)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setCounts(cached.data)
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
        setItem(CACHE_KEY, data)
      } catch (err) {
        console.error('Failed to load dashboard counts:', err)
      } finally {
        setLoading(false)
      }
    }
    loadCounts()
  }, [get, setItem])

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-1 font-mono">DASHBOARD</h1>
      <p className="text-text-muted text-sm mb-8">Portfolio content overview</p>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-dark-border">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-dark-surface p-4 lg:p-6 hover:bg-dark-elevated transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 border border-dark-border bg-dark-bg">
                <stat.icon size={18} className="text-accent" />
              </div>
            </div>
            <p className="text-2xl font-bold font-mono">{counts?.[stat.label] || 0}</p>
            <p className="text-text-muted text-xs uppercase tracking-widest mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
