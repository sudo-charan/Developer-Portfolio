import { ArrowUp } from 'lucide-react'

export default function Footer({ settings }) {
  return (
    <footer className="border-t border-dark-border bg-dark-surface">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-center md:text-left">
            <a href="/" className="text-xl font-bold tracking-tight font-mono">
              <span className="text-accent">&lt;</span>CHARANRAJ<span className="text-accent">/&gt;</span>
            </a>
            <p className="text-text-muted text-sm mt-2">{settings?.hero?.title || 'Full-Stack Developer · Cybersecurity Enthusiast · ISE Student'}</p>
          </div>
        </div>

        <div className="divider my-8" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-text-muted">
          <p>© {new Date().getFullYear()} {settings?.hero?.name || 'Charanraj M'}. All rights reserved.</p>
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 hover:text-accent transition-colors"
          >
            Back to top <ArrowUp size={14} />
          </button>
        </div>
      </div>
    </footer>
  )
}
