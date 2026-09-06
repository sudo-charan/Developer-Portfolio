import { useState, useEffect } from 'react'
import { getSettings } from '../../firebase/services'
import { updateSettings } from '../../firebase/adminServices'
import { Save } from 'lucide-react'
import { SkeletonForm } from '../components/Skeletons'
import { useAdminCache } from '../hooks/useAdminCache'

const CACHE_KEY = 'admin_settings'
const CACHE_TTL = 60 * 1000

export default function SettingsPage() {
  const { get, set: setItem, clear: clearCache } = useAdminCache()
  const [settings, setSettings] = useState(() => {
    const cached = get(CACHE_KEY)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return {
        hero: cached.data?.hero || {},
        about: cached.data?.about || {},
        socialLinks: cached.data?.socialLinks || {},
        resumeUrl: cached.data?.resumeUrl || '',
      }
    }
    return {
      hero: {},
      about: {},
      socialLinks: {},
      resumeUrl: '',
    }
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(() => {
    const cached = get(CACHE_KEY)
    return !(cached && Date.now() - cached.timestamp < CACHE_TTL)
  })

  useEffect(() => {
    const cached = get(CACHE_KEY)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return
    }
    getSettings().then((data) => {
      const normalized = {
        hero: data?.hero || {},
        about: data?.about || {},
        socialLinks: data?.socialLinks || {},
        resumeUrl: data?.resumeUrl || '',
      }
      setSettings(normalized)
      setItem(CACHE_KEY, normalized)
      setLoading(false)
    }).catch((err) => {
      console.error('Failed to load settings:', err)
      setLoading(false)
    })
  }, [get, setItem])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    try {
      await updateSettings(settings)
      clearCache(CACHE_KEY)
      setMessage('Settings saved successfully')
      setTimeout(() => setMessage(''), 3000)
    } catch (err) {
      setMessage('Failed to save settings')
      console.error('[Admin CRUD] Settings save failed', {
        code: err.code,
        message: err.message,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6 font-mono">SETTINGS</h1>
      {loading ? (
        <SkeletonForm />
      ) : (
       <form onSubmit={handleSubmit} className="space-y-8">
         <div className="border border-dark-border bg-dark-surface p-6">
           <h2 className="text-lg font-semibold mb-4 font-mono">HERO_SECTION</h2>
           <div className="space-y-4">
             <div>
               <label htmlFor="settings-hero-name" className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-1">Name</label>
               <input
                 id="settings-hero-name"
                 value={settings.hero.name || ''}
                 onChange={(e) => setSettings({ ...settings, hero: { ...settings.hero, name: e.target.value } })}
                 placeholder="Name"
                 className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-text-primary focus:outline-none focus:border-accent"
               />
             </div>
             <div>
               <label htmlFor="settings-hero-title" className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-1">Title</label>
               <input
                 id="settings-hero-title"
                 value={settings.hero.title || ''}
                 onChange={(e) => setSettings({ ...settings, hero: { ...settings.hero, title: e.target.value } })}
                 placeholder="Title"
                 className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-text-primary focus:outline-none focus:border-accent"
               />
             </div>
             <div>
               <label htmlFor="settings-hero-badge" className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-1">Badge</label>
               <input
                 id="settings-hero-badge"
                 value={settings.hero.badge || ''}
                 onChange={(e) => setSettings({ ...settings, hero: { ...settings.hero, badge: e.target.value } })}
                 placeholder="e.g. Available for opportunities"
                 className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-text-primary focus:outline-none focus:border-accent"
               />
             </div>
             <div>
               <label htmlFor="settings-hero-description" className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-1">Description</label>
               <textarea
                 id="settings-hero-description"
                 value={settings.hero.description || ''}
                 onChange={(e) => setSettings({ ...settings, hero: { ...settings.hero, description: e.target.value } })}
                 placeholder="Description"
                 rows={3}
                 className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-text-primary focus:outline-none focus:border-accent resize-none"
               />
             </div>
             <div>
               <label htmlFor="settings-hero-resume-url" className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-1">Resume URL</label>
               <input
                 id="settings-hero-resume-url"
                 value={settings.resumeUrl || ''}
                 onChange={(e) => setSettings({ ...settings, resumeUrl: e.target.value })}
                 placeholder="https://example.com/resume.pdf"
                 type="url"
                 className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-text-primary focus:outline-none focus:border-accent"
               />
             </div>
           </div>
         </div>
         <div className="border border-dark-border bg-dark-surface p-6">
           <h2 className="text-lg font-semibold mb-4 font-mono">ABOUT_SECTION</h2>
           <div className="space-y-4">
             <div>
               <label htmlFor="settings-about-text" className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-1">About Text</label>
               <textarea
                 id="settings-about-text"
                 value={settings.about.text || ''}
                 onChange={(e) => setSettings({ ...settings, about: { ...settings.about, text: e.target.value } })}
                 placeholder="Tell the world about yourself..."
                 rows={5}
                 className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-text-primary focus:outline-none focus:border-accent resize-none"
               />
             </div>
           </div>
         </div>
         <div className="border border-dark-border bg-dark-surface p-6">
           <div className="space-y-4">
             <div>
               <label htmlFor="settings-social-github" className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-1">GitHub URL</label>
               <input
                 id="settings-social-github"
                 value={settings.socialLinks.github || ''}
                 onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, github: e.target.value } })}
                 placeholder="GitHub URL"
                 type="url"
                 className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-text-primary focus:outline-none focus:border-accent"
               />
             </div>
             <div>
               <label htmlFor="settings-social-linkedin" className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-1">LinkedIn URL</label>
               <input
                 id="settings-social-linkedin"
                 value={settings.socialLinks.linkedin || ''}
                 onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, linkedin: e.target.value } })}
                 placeholder="LinkedIn URL"
                 type="url"
                 className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-text-primary focus:outline-none focus:border-accent"
               />
             </div>
             <div>
               <label htmlFor="settings-social-email" className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-1">Email</label>
               <input
                 id="settings-social-email"
                 value={settings.socialLinks.email || ''}
                 onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, email: e.target.value } })}
                 placeholder="you@example.com"
                 type="email"
                 autoComplete="email"
                 className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-text-primary focus:outline-none focus:border-accent"
               />
             </div>
             <div>
               <label htmlFor="settings-social-instagram" className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-1">Instagram URL</label>
               <input
                 id="settings-social-instagram"
                 value={settings.socialLinks.instagram || ''}
                 onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, instagram: e.target.value } })}
                 placeholder="https://instagram.com/username"
                 type="url"
                 className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-text-primary focus:outline-none focus:border-accent"
               />
             </div>
             <div>
               <label htmlFor="settings-social-x" className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-1">X URL</label>
               <input
                 id="settings-social-x"
                 value={settings.socialLinks.x || ''}
                 onChange={(e) => setSettings({ ...settings, socialLinks: { ...settings.socialLinks, x: e.target.value } })}
                 placeholder="https://x.com/username"
                 type="url"
                 className="w-full px-4 py-2 bg-dark-bg border border-dark-border text-text-primary focus:outline-none focus:border-accent"
               />
             </div>
           </div>
         </div>
         <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
           <Save size={18} aria-hidden="true" />
           {saving ? 'Saving...' : 'Save Settings'}
         </button>
         {message && <p role="status" aria-live={message.includes('success') ? 'polite' : 'assertive'} className="text-accent-3 text-sm">{message}</p>}
       </form>
      )}
    </div>
  )
}
