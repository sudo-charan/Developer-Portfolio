import { lazy, memo, Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bot, Menu, X, Sun, Moon, Download, Sparkles } from 'lucide-react'
import { useTheme } from '../hooks/useTheme'
import { useSettings } from '../hooks/useFirestore'

const AiAssistantDrawer = lazy(() => import('./AiAssistant/AiAssistantDrawer'))

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
  const [assistantLoaded, setAssistantLoaded] = useState(false)
  const [assistantOpen, setAssistantOpen] = useState(false)
  const assistantLauncherRef = useRef(null)
  const [activeSection, setActiveSection] = useState('home')
  const { theme, toggleTheme } = useTheme()
  const { data: settings } = useSettings()
  const resumeUrl = settings?.resumeUrl || null
  const navigate = useNavigate()
  const location = useLocation()
  const closeAssistant = useCallback(() => setAssistantOpen(false), [])
  const openAssistant = () => {
    setAssistantLoaded(true)
    setAssistantOpen(true)
  }

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
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll, { passive: true })
  }, [])

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
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:bg-dark-surface focus:px-4 focus:py-3 focus:text-text-primary">
        Skip to content
      </a>
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
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              {resumeUrl && (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-accent text-white hover:bg-accent/90 transition-colors"
                >
                  <Download size={16} />
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
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </button>
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="p-2 border border-dark-border hover:border-accent hover:text-accent transition-colors"
                aria-label="Toggle menu"
                aria-expanded={mobileOpen}
                aria-controls="mobile-navigation"
              >
                {mobileOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              id="mobile-navigation"
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

      <main id="main-content" tabIndex="-1"><Outlet context={{ settings }} /></main>
      <div className="fixed bottom-5 right-5 sm:bottom-6 sm:right-6 z-40">
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          ref={assistantLauncherRef}
          onClick={openAssistant}
          className="relative group flex items-center gap-2.5 px-3.5 py-2.5 bg-dark-surface/95 backdrop-blur-md border border-accent/40 text-accent hover:border-accent hover:shadow-[0_0_20px_rgba(249,115,22,0.25)] transition-all duration-300 font-mono text-xs rounded-full cursor-pointer"
          aria-label="Open Ask Charan AI Assistant"
          aria-haspopup="dialog"
        >
          <Bot size={16} />
          <span className="font-semibold tracking-wider text-text-primary group-hover:text-accent transition-colors">Ask Charan AI</span>
          <Sparkles size={12} className="text-accent/70 group-hover:text-accent" />
        </motion.button>
      </div>
      {assistantLoaded && (
        <Suspense fallback={null}>
          <AiAssistantDrawer
            isOpen={assistantOpen}
            onClose={closeAssistant}
            returnFocusRef={assistantLauncherRef}
          />
        </Suspense>
      )}
    </div>
  )
})
