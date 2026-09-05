import { memo } from 'react'
import { motion } from 'framer-motion'
import { Download } from 'lucide-react'
import BackgroundFX from '../../components/BackgroundFX'
import SocialLinks from '../../components/SocialLinks'

export default memo(function Hero({ content, resumeUrl, settings }) {
  const heroData = settings?.hero || content?.hero || {}
  const socialLinks = settings?.socialLinks || {}

  return (
    <section id="home" className="relative min-h-screen flex items-center justify-center">
      <BackgroundFX />

      <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-8"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-dark-border">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            <span className="text-sm text-text-secondary font-mono">
              {heroData.badge || 'Available for opportunities'}
            </span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 tracking-tight"
        >
          {heroData.name || 'Charanraj M'}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-xl md:text-2xl text-text-secondary mb-4 font-mono"
        >
          {heroData.title || 'Full-Stack Developer · Cybersecurity Enthusiast · ISE Student'}
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-base md:text-lg text-text-muted max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          {heroData.description ||
            'Building practical software, exploring AI and cybersecurity, and continuously learning new technologies. Turning curiosity into code.'}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <a href="#projects" className="btn-primary">
            View My Work
          </a>
          {resumeUrl && (
            <a href={resumeUrl} target="_blank" rel="noopener noreferrer" className="btn-secondary flex items-center gap-2">
              <Download size={18} />
              Download Resume
            </a>
          )}
          <a href="#contact" className="btn-secondary">
            Get In Touch
          </a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="mt-16"
        >
          <div className="flex items-center justify-center gap-6 text-text-muted">
            <SocialLinks links={socialLinks} />
          </div>
        </motion.div>
      </div>

      <div className="absolute bottom-8 left-0 right-0 flex justify-center">
        <motion.a
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          href="#how-i-work"
          className="group inline-flex flex-col items-center gap-3 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-accent/90 transition-colors hover:text-accent"
        >
          <span>See How I Work</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4 animate-bounce text-accent/80 transition-colors group-hover:text-accent"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </motion.a>
      </div>
    </section>
  )
})
