import { memo, useState, useEffect, useCallback, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Award, ExternalLink, Eye, ChevronLeft, ChevronRight } from 'lucide-react'

const SPRING_TRANSITION = {
  type: 'spring',
  stiffness: 320,
  damping: 28,
  mass: 0.8,
}

function normalizeCategoryName(cat) {
  if (!cat || typeof cat !== 'string') return 'Other'
  const trimmed = cat.trim()
  const lower = trimmed.toLowerCase().replace(/[-_]/g, ' ')
  if (lower.includes('cyber') || lower.includes('security')) return 'Cyber Security'
  if (lower.includes('full') || lower.includes('stack') || lower.includes('web')) return 'Full-Stack'
  if (lower.includes('cloud') || lower.includes('aws')) return 'Cloud'
  if (lower.includes('network')) return 'Networking'
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

export default memo(function Certificates({ certificates = [] }) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [activeCategory, setActiveCategory] = useState('All')
  const [failedImages, setFailedImages] = useState({})
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  )

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize, { passive: true })
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Process and normalize categories, eliminating duplicate names
  const normalizedCertificates = useMemo(() => {
    return (certificates || []).map((cert) => ({
      ...cert,
      displayCategory: normalizeCategoryName(cert.category),
    }))
  }, [certificates])

  const categoryList = useMemo(() => {
    const counts = new Map()
    normalizedCertificates.forEach((c) => {
      const cat = c.displayCategory
      counts.set(cat, (counts.get(cat) || 0) + 1)
    })
    return Array.from(counts.entries()).map(([name, count]) => ({ name, count }))
  }, [normalizedCertificates])

  const filteredCertificates = useMemo(() => {
    if (activeCategory === 'All') return normalizedCertificates
    return normalizedCertificates.filter((c) => c.displayCategory === activeCategory)
  }, [normalizedCertificates, activeCategory])

  const total = filteredCertificates.length

  const handleCategoryChange = (catName) => {
    setActiveCategory(catName)
    setActiveIndex(0)
  }

  const handleNext = useCallback(() => {
    if (total <= 1) return
    setActiveIndex((prev) => (prev + 1) % total)
  }, [total])

  const handlePrev = useCallback(() => {
    if (total <= 1) return
    setActiveIndex((prev) => (prev - 1 + total) % total)
  }, [total])

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') handleNext()
      if (e.key === 'ArrowLeft') handlePrev()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleNext, handlePrev])

  const isMobile = windowWidth < 640
  const isTablet = windowWidth < 1024

  const getCardStyle = (index) => {
    if (total === 0) return { x: 0, scale: 1, opacity: 1, zIndex: 30, pointerEvents: 'auto' }

    let offset = index - activeIndex

    if (offset < -1 && offset < -Math.floor(total / 2)) {
      offset += total
    } else if (offset > 2 && offset > Math.floor(total / 2)) {
      offset -= total
    }

    if (offset === 0) {
      return {
        x: 0,
        scale: 1,
        opacity: 1,
        zIndex: 30,
        pointerEvents: 'auto',
      }
    }

    if (offset === 1) {
      return {
        x: isMobile ? 24 : isTablet ? 50 : 65,
        scale: 0.93,
        opacity: 0.25,
        zIndex: 20,
        pointerEvents: 'none',
      }
    }

    if (offset === 2) {
      return {
        x: isMobile ? 48 : isTablet ? 95 : 120,
        scale: 0.86,
        opacity: 0.10,
        zIndex: 10,
        pointerEvents: 'none',
      }
    }

    if (offset === -1) {
      return {
        x: isMobile ? -24 : isTablet ? -50 : -65,
        scale: 0.93,
        opacity: 0.25,
        zIndex: 20,
        pointerEvents: 'none',
      }
    }

    return {
      x: offset > 0 ? (isMobile ? 70 : 160) : (isMobile ? -70 : -160),
      scale: 0.78,
      opacity: 0,
      zIndex: 0,
      pointerEvents: 'none',
    }
  }

  return (
    <section className="py-10 md:py-12 px-4 relative overflow-hidden" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 500px' }}>
      {/* Background ambient mesh */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, rgba(249,115,22,0.3) 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Compact Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-6 text-center sm:text-left"
        >
          <p className="section-label mb-2">Credentials</p>
          <h2 className="section-title text-2xl md:text-3xl mb-2">Certifications</h2>
          <p className="text-text-muted text-xs md:text-sm max-w-xl">
            Verified credentials and completed professional certifications.
          </p>
        </motion.div>

        {/* Deduplicated Category Filter Tabs */}
        {categoryList.length > 0 && (
          <div className="flex items-center gap-1.5 mb-6 overflow-x-auto pb-1 scrollbar-none">
            <button
              onClick={() => handleCategoryChange('All')}
              className={`px-3 py-1 text-xs font-mono border transition-all duration-200 flex-shrink-0 ${
                activeCategory === 'All'
                  ? 'border-accent text-accent bg-accent/10 font-semibold'
                  : 'border-dark-border text-text-muted hover:text-text-primary hover:border-accent/40'
              }`}
              aria-label="Filter all certificates"
            >
              All ({normalizedCertificates.length})
            </button>
            {categoryList.map(({ name, count }) => (
              <button
                key={name}
                onClick={() => handleCategoryChange(name)}
                className={`px-3 py-1 text-xs font-mono border transition-all duration-200 flex-shrink-0 ${
                  activeCategory === name
                    ? 'border-accent text-accent bg-accent/10 font-semibold'
                    : 'border-dark-border text-text-muted hover:text-text-primary hover:border-accent/40'
                }`}
                aria-label={`Filter ${name} certificates`}
              >
                {name} ({count})
              </button>
            ))}
          </div>
        )}

        {/* Compact 3D Depth Showcase */}
        {total === 0 ? (
          <div className="border border-dark-border bg-dark-surface p-8 text-center text-text-muted text-xs font-mono">
            No certificates found in this category.
          </div>
        ) : (
          <div className="relative">
            {/* Integrated Navigation Side Arrows */}
            <div className="absolute inset-y-0 left-0 right-0 z-40 flex items-center justify-between pointer-events-none max-w-lg mx-auto">
              <button
                type="button"
                onClick={handlePrev}
                disabled={total <= 1}
                aria-label="Previous certificate"
                className={`pointer-events-auto p-2 md:p-2.5 border border-dark-border bg-dark-surface/90 backdrop-blur-md text-text-primary transition-all duration-200 hover:border-accent hover:text-accent disabled:opacity-20 shadow-lg ${
                  total <= 1 ? 'opacity-20 pointer-events-none' : ''
                }`}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={total <= 1}
                aria-label="Next certificate"
                className={`pointer-events-auto p-2 md:p-2.5 border border-dark-border bg-dark-surface/90 backdrop-blur-md text-text-primary transition-all duration-200 hover:border-accent hover:text-accent disabled:opacity-20 shadow-lg ${
                  total <= 1 ? 'opacity-20 pointer-events-none' : ''
                }`}
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Depth Card Stage */}
            <div className="relative min-h-[320px] md:min-h-[350px] flex items-center justify-center overflow-hidden py-2">
              <AnimatePresence initial={false}>
                {filteredCertificates.map((cert, index) => {
                  const style = getCardStyle(index)
                  const isCurrent = index === activeIndex
                  const verifyUrl = cert.verifyUrl || cert.certificateUrl || cert.url || cert.link
                  const imageFailed = !cert.image || failedImages[cert.id]

                  return (
                    <motion.div
                      key={cert.id || index}
                      initial={style}
                      animate={{
                        x: style.x,
                        scale: style.scale,
                        opacity: style.opacity,
                        zIndex: style.zIndex,
                      }}
                      transition={SPRING_TRANSITION}
                      style={{
                        position: 'absolute',
                        pointerEvents: style.pointerEvents,
                        width: isMobile ? 'calc(100% - 50px)' : '400px',
                        maxWidth: '420px',
                      }}
                      className="border border-dark-border bg-dark-surface p-4 md:p-5 shadow-xl transition-all duration-300 hover:border-accent/60 hover:shadow-[0_0_20px_rgba(249,115,22,0.15)] group"
                    >
                      {/* Top Header Bar */}
                      <div className="flex items-center justify-between gap-2 mb-2.5 pb-2 border-b border-dark-border">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                          <span className="text-[10px] font-mono text-accent uppercase tracking-wider font-semibold truncate">
                            {cert.displayCategory || 'CERTIFICATE'}
                          </span>
                        </div>
                        <span className="text-[11px] text-text-muted font-mono flex-shrink-0">
                          {cert.year || 'VERIFIED'}
                        </span>
                      </div>

                      {/* Main Image Preview Area / Polished Fallback */}
                      <div className="relative w-full h-36 md:h-40 mb-3 bg-dark-bg/80 border border-dark-border overflow-hidden flex items-center justify-center p-2">
                        {!imageFailed ? (
                          <img
                            src={cert.image}
                            alt={cert.name}
                            loading="lazy"
                            decoding="async"
                            onError={() =>
                              setFailedImages((prev) => ({ ...prev, [cert.id]: true }))
                            }
                            className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          /* Developer Credential Badge Fallback */
                          <div className="flex flex-col items-center justify-center text-center p-3">
                            <div className="p-2.5 border border-dark-border bg-dark-surface mb-2 text-accent">
                              <Award size={26} />
                            </div>
                            <span className="text-[11px] font-mono text-text-muted">
                              {cert.issuer || 'Verified Credential'}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Title & Issuer (Single Instance below preview) */}
                      <div className="mb-3">
                        <h3 className="font-bold text-sm md:text-base text-text-primary mb-0.5 line-clamp-1 group-hover:text-accent transition-colors">
                          {cert.name}
                        </h3>
                        <p className="text-xs text-text-muted font-mono line-clamp-1">
                          {cert.issuer}
                        </p>
                      </div>

                      {/* View Certificate Action Button */}
                      {isCurrent && verifyUrl ? (
                        <a
                          href={verifyUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`View certificate ${cert.name}`}
                          className="inline-flex items-center justify-center gap-1.5 w-full px-3 py-2 text-xs font-mono font-semibold border border-accent/40 bg-accent/10 text-accent hover:bg-accent hover:text-white transition-all duration-200 cursor-pointer"
                        >
                          <Eye size={13} />
                          View Certificate
                          <ExternalLink size={11} className="ml-0.5" />
                        </a>
                      ) : (
                        <div className="h-8" />
                      )}
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>

            {/* Compact Segmented Progress Bar & Counter */}
            <div className="flex flex-col items-center justify-center gap-2 mt-3">
              <div className="text-[11px] font-mono font-semibold text-text-muted">
                <span className="text-accent">{String(activeIndex + 1).padStart(2, '0')}</span> / {String(total).padStart(2, '0')}
              </div>
              <div className="flex items-center gap-1 max-w-[200px] w-full">
                {filteredCertificates.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveIndex(idx)}
                    aria-label={`Go to certificate ${idx + 1}`}
                    className={`h-1 flex-1 transition-all duration-200 ${
                      idx === activeIndex
                        ? 'bg-accent shadow-[0_0_8px_rgba(249,115,22,0.4)]'
                        : 'bg-dark-border hover:bg-text-muted'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
})
