import { useState, useEffect } from 'react'
import { Navigate, Outlet, NavLink, useNavigate } from 'react-router-dom'
import { onAuthStateChanged, signOut } from '@firebase/auth'
import { auth } from '../firebase/config'
import {
  LayoutDashboard, FolderOpen, Code, Briefcase, GraduationCap,
  Award, Clock, FileText, MessageSquare, Settings, LogOut,
  Menu, X
} from 'lucide-react'
import FullPageLoader from '../components/FullPageLoader'
import { useUnreadMessageCount } from './context/UnreadCountContext'

const navItems = [
  { path: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: 'projects', label: 'Projects', icon: FolderOpen },
  { path: 'skills', label: 'Skills', icon: Code },
  { path: 'experience', label: 'Experience', icon: Briefcase },
  { path: 'education', label: 'Education', icon: GraduationCap },
  { path: 'certificates', label: 'Certificates', icon: Award },
  { path: 'current-work', label: 'Current Work', icon: Clock },
  { path: 'blog', label: 'Blog', icon: FileText },
  { path: 'messages', label: 'Messages', icon: MessageSquare },
  { path: 'settings', label: 'Settings', icon: Settings },
]

export default function AdminLayout() {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [authError, setAuthError] = useState('')
  const unreadCount = useUnreadMessageCount()
  const navigate = useNavigate()

  const validateAdmin = async (currentUser) => {
    if (!currentUser) {
      setIsAdmin(false)
      setUser(null)
      setLoading(false)
      return
    }

    try {
      const tokenResult = await currentUser.getIdTokenResult(true)
      const admin = tokenResult.claims.admin === true
      setIsAdmin(admin)
      setUser(currentUser)
      if (!admin) {
        setAuthError('Missing admin claim. Re-authenticate or contact the owner.')
      } else {
        setAuthError('')
      }
    } catch (error) {
      setIsAdmin(false)
      setUser(null)
      setAuthError('Unable to verify admin access. Try signing in again.')
      console.error('[Admin] Claim check failed:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!auth) {
      setLoading(false)
      return
    }
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      await validateAdmin(currentUser)
    })
    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    if (auth) {
      await signOut(auth)
    }
    navigate('/admin/login')
  }

  if (loading) {
    return <FullPageLoader />
  }

  if (!user || !isAdmin) {
    return <Navigate to="/admin/login" replace state={{ message: authError || (!user ? 'Please sign in to continue' : 'You do not have admin access') }} />
  }

  return (
    <div className="min-h-screen bg-dark-bg flex">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-dark-surface border-r border-dark-border transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="flex items-center justify-between h-16 px-4 border-b border-dark-border">
            <span className="text-sm font-bold font-mono">ADMIN<span className="text-accent">_</span>PANEL</span>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-text-muted">
              <X size={20} />
            </button>
          </div>
          <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100%-64px)]">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === 'dashboard'}
                onClick={() => setSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 text-sm font-medium transition-colors border-l-2 ${
                    isActive
                      ? 'border-accent text-accent bg-accent/5'
                      : 'border-transparent text-text-secondary hover:text-accent hover:bg-dark-bg'
                  }`
                }
              >
                <item.icon size={18} />
                {item.label}
                {item.path === 'messages' && unreadCount > 0 && (
                  <span className="ml-auto bg-accent text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </NavLink>
            ))}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-accent-2 hover:bg-accent-2/5 transition-colors mt-4 border-l-2 border-transparent hover:border-accent-2"
            >
              <LogOut size={18} />
              Logout
            </button>
          </nav>
        </aside>

        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <main className="flex-1 lg:ml-64">
          <header className="sticky top-0 z-20 bg-dark-bg/90 backdrop-blur border-b border-dark-border h-16 flex items-center justify-between px-4 lg:px-8">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-text-muted">
              <Menu size={24} />
            </button>
            <div className="text-xs text-text-muted font-mono">
              SESSION: {user.email}
            </div>
          </header>
          <div className="p-4 lg:p-8">
            <Outlet />
          </div>
        </main>
      </div>
    )
  }
