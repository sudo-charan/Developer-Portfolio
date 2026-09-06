import { memo, useEffect, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X, Sun, Moon, Download } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { useSettings } from '../hooks/useFirestore'

const navLinks = [
  { name: 'Home', href: '#home' },
  { name: 'About', href: '#about' },
  { name: 'Projects', href: '#projects' },
  { name: 'Experience', href: '#experience' },
  { name: 'Blog', href: '/blog' },
  { name: 'Contact', href: '#contact' },
]

export default memo(function Layout() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const { theme, toggleTheme } = useTheme()
  const { data: settings } = useSettings()
  const resumeUrl = settings?.resumeUrl || null
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
      const sections = ['home', 'about', 'projects', 'experience', 'contact']
      for (const id of sections) {
        const el = document.getElementById(id)
        if (el && el.offsetTop - 200 <= window.scrollY) {
          setActiveSection(id)
        }
      }
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false)
      }
    }
    if (mobileOpen) {
      document.addEventListener('keydown', handleEscape)
    }
    return () => document.removeEventListener('keydown', handleEscape)
  }, [mobileOpen])

  const scrollTo = (href) => {
    if (href.startsWith('/')) {
      navigate(href)
      setMobileOpen(false)
      return
    }

    const isHome = location.pathname === '/'

    if (!isHome) {
      navigate('/')
      setTimeout(() => {
        const el = document.querySelector(href)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' })
        }
      }, 100)
      setMobileOpen(false)
      return
    }

    const el = document.querySelector(href)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' })
      setMobileOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-bg">
      <nav
        aria-label="Main navigation"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-dark-bg/90 backdrop-blur-xl border-b border-dark-border'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            <a href="/" className="text-xl font-bold tracking-tight font-mono">
              <span className="text-accent">&lt;</span>CHARANRAJ<span className="text-accent">/&gt;</span>
            </a>

            <div className="hidden md:flex items-center gap-8">
              {navLinks.map((link) => {
                const isBlog = link.name === 'Blog'
                const isActive = isBlog
                  ? location.pathname === '/blog' || location.pathname.startsWith('/blog/')
                  : location.pathname === '/' && activeSection === link.href.replace('#', '')

                return (
                  <button
                    key={link.name}
                    onClick={() => scrollTo(link.href)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`text-sm font-medium transition-colors duration-200 relative group ${
                      isActive
                        ? 'text-accent'
                        : 'text-text-secondary hover:text-accent'
                    }`}
                  >
                    {link.name}
                    {!link.href.startsWith('/') && (
                      <span className={`absolute -bottom-1 left-0 h-px bg-accent transition-all duration-200 ${
                        isActive ? 'w-full' : 'w-0 group-hover:w-full'
                      }`} />
                    )}
                  </button>
                )
              })}
            </div>

            <div className="hidden md:flex items-center gap-3">
              <button
                onClick={toggleTheme}
                className="p-2 border border-dark-border hover:border-accent hover:text-accent transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={16} aria-hidden="true" /> : <Moon size={16} aria-hidden="true" />}
              </button>
              {resumeUrl && (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent text-white hover:bg-accent/90 transition-colors"
                >
                  <Download size={16} aria-hidden="true" />
                  Resume
                </a>
              )}
            </div>

            <div className="md:hidden flex items-center gap-2">
              <button
                onClick={toggleTheme}
                className="p-2 border border-dark-border hover:border-accent hover:text-accent transition-colors"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
              </button>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-expanded={mobileOpen}
                aria-controls="mobile-menu"
                aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
                className="p-2 border border-dark-border hover:border-accent hover:text-accent transition-colors"
              >
                {mobileOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              id="mobile-menu"
              role="dialog"
              aria-label="Mobile navigation"
              aria-modal="true"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-dark-surface/95 backdrop-blur-xl border-b border-dark-border"
            >
              <div className="px-4 py-4 space-y-2">
                {navLinks.map((link) => {
                  const isBlog = link.name === 'Blog'
                  const isActive = isBlog
                    ? location.pathname === '/blog' || location.pathname.startsWith('/blog/')
                    : location.pathname === '/' && activeSection === link.href.replace('#', '')

                  return (
                    <button
                      key={link.name}
                      onClick={() => scrollTo(link.href)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`block w-full text-left px-4 py-3 text-sm font-medium transition-colors border-l-2 ${
                        isActive
                          ? 'text-accent bg-accent/5 border-accent'
                          : 'text-text-secondary hover:text-accent border-transparent'
                      }`}
                    >
                      {link.name}
                    </button>
                  )
                })}
                {resumeUrl && (
                  <a
                    href={resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-4 py-3 text-sm font-medium text-accent border-l-2 border-accent"
                  >
                    Download Resume
                  </a>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main><Outlet /></main>
    </div>
  )
})
