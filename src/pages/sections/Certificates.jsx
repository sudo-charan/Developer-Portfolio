import { memo } from 'react'
import { motion } from 'framer-motion'
import { Award, ExternalLink } from 'lucide-react'

export default memo(function Certificates({ certificates }) {
  const categories = certificates?.reduce((acc, cert) => {
    const cat = cert.category || 'Other'
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(cert)
    return acc
  }, {}) || {}

  return (
    <section className="py-16 px-4 relative" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 600px' }}>
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle, rgba(249,115,22,0.3) 1px, transparent 1px)`,
        backgroundSize: '24px 24px'
      }} />
      <div className="max-w-6xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <p className="section-label">Credentials</p>
          <h2 className="section-title">Certifications</h2>
          <p className="section-subtitle">
            Professional certifications and courses completed.
          </p>
        </motion.div>

        <div className="space-y-6">
          {Object.entries(categories).map(([category, certs], catIndex) => (
            <div key={category}>
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-accent">{category}</h3>
                <div className="flex-1 h-px bg-dark-border" />
                <span className="text-xs text-text-muted font-mono">{certs.length} ITEMS</span>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-dark-border">
                {(certs || []).map((cert, index) => (
                  <motion.div
                    key={cert.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: catIndex * 0.1 + index * 0.05 }}
                     className="group bg-dark-surface p-5 hover:bg-dark-elevated transition-all duration-300 hover:-translate-y-0.5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="p-2 border border-dark-border bg-dark-bg flex-shrink-0">
                        <Award className="text-accent" size={20} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-sm mb-1 group-hover:text-accent transition-colors line-clamp-2">
                          {cert.name}
                        </h4>
                        <p className="text-text-muted text-xs mb-1">{cert.issuer}</p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-text-muted font-mono">{cert.year}</span>
                          {cert.verifyUrl && (
                            <a
                              href={cert.verifyUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-text-muted hover:text-accent transition-colors"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                    {cert.image && (
                       <img
                         src={cert.image}
                         alt={cert.name}
                         loading="lazy"
                         decoding="async"
                         className="mt-4 w-full h-32 object-cover border border-dark-border"
                       />
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
})
