import { memo } from 'react'
import { motion } from 'framer-motion'
import { MapPin, Calendar } from 'lucide-react'

export default memo(function Experience({ experiences }) {
  return (
    <section id="experience" className="py-16 px-4" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 500px' }}>
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <p className="section-label">Experience</p>
          <h2 className="section-title">Professional Experience</h2>
        </motion.div>

        <div className="space-y-8">
          {(experiences || []).map((exp, index) => (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="border border-dark-border bg-dark-surface p-6 lg:p-8 hover:border-accent/30 transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-xl font-bold mb-1">{exp.title}</h3>
                  <p className="text-text-primary font-medium">{exp.company}</p>
                </div>
                <div className="flex items-center gap-4 text-sm text-text-muted">
                <span className="flex items-center gap-1 font-mono text-xs">
                  <Calendar size={14} aria-hidden="true" />
                   {exp.startDate} – {exp.endDate || 'Present'}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-xs">
                    <MapPin size={14} aria-hidden="true" />
                    {exp.location}
                  </span>
                </div>
              </div>
              <p className="text-text-secondary text-sm leading-relaxed">
                {exp.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
})
