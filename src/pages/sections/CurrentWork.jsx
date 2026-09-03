import { motion } from 'framer-motion'
import { Clock, CheckCircle2 } from 'lucide-react'

export default function CurrentWork({ currentWork }) {
  return (
    <section className="py-16 px-4 relative">
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }} />
      <div className="max-w-5xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <p className="section-label">Current Focus</p>
          <h2 className="section-title">Currently Working On</h2>
          <p className="section-subtitle">
            What I'm exploring and building right now.
          </p>
        </motion.div>

        <div className="space-y-4">
          {(currentWork || []).map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="border border-dark-border bg-dark-surface p-6 lg:p-8 hover:border-accent/30 transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 border border-dark-border bg-dark-bg flex-shrink-0">
                  <Clock className="text-accent" size={24} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold">{item.title}</h3>
                      <span className={`flex items-center gap-1 px-2 py-1 text-xs font-medium border ${
                        item.status === 'in-progress'
                          ? 'border-accent-3/30 text-accent-3'
                          : 'border-accent/30 text-accent'
                      }`}>
                        {item.status === 'in-progress' ? (
                          <span className="w-3 h-3 border-2 border-accent-3 border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <><CheckCircle2 size={12} /> {item.status || 'Active'}</>
                        )}
                      </span>
                  </div>
                  <p className="text-text-secondary text-sm leading-relaxed mb-3">
                    {item.description}
                  </p>
                  {item.updatedAt && (
                    <p className="text-text-muted text-xs font-mono">
                      Last updated: {new Date(item.updatedAt).toLocaleDateString()}
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
}
