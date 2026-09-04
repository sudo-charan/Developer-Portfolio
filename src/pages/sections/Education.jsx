import { memo } from 'react'
import { motion } from 'framer-motion'
import { GraduationCap, Calendar, MapPin, Award } from 'lucide-react'

export default memo(function Education({ education }) {
  return (
    <section className="py-16 px-4 relative" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 500px' }}>
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `radial-gradient(circle, rgba(249,115,22,0.3) 1px, transparent 1px)`,
        backgroundSize: '24px 24px'
      }} />
      <div className="max-w-5xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <p className="section-label">Education</p>
          <h2 className="section-title">Academic Background</h2>
          <p className="section-subtitle">
            My formal education and qualifications.
          </p>
        </motion.div>

        <div className="space-y-6">
          {(education || []).map((edu, index) => (
            <motion.div
              key={edu.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="border border-dark-border bg-dark-surface p-6 lg:p-8 hover:border-accent/30 transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 border border-dark-border bg-dark-bg flex-shrink-0">
                  <GraduationCap className="text-accent" size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-1">{edu.degree}</h3>
                  {edu.branch && (
                    <p className="text-text-primary font-medium mb-2">{edu.branch}</p>
                  )}
                  <p className="text-text-primary font-medium mb-2">{edu.institution}</p>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-text-muted">
                    <span className="flex items-center gap-1 font-mono text-xs">
                      <Calendar size={14} />
                       {edu.startYear} – {edu.endYear || 'Present'}
                    </span>
                    <span className="flex items-center gap-1 font-mono text-xs">
                      <MapPin size={14} />
                      {edu.location}
                    </span>
                    {edu.grade && (
                      <span className="flex items-center gap-1 font-mono text-xs">
                        <Award size={14} />
                        {edu.grade}
                      </span>
                    )}
                  </div>
                  {edu.description && (
                    <p className="text-text-secondary text-sm mt-3 leading-relaxed">
                      {edu.description}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
})
