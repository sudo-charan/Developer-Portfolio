import { memo } from 'react'
import { motion } from 'framer-motion'

const steps = [
  {
    num: '01',
    title: 'Research',
    desc: 'Understand the problem space, threat model, and requirements before writing any code.',
  },
  {
    num: '02',
    title: 'Architect',
    desc: 'Design secure, scalable systems with clear data flows and separation of concerns.',
  },
  {
    num: '03',
    title: 'Build',
    desc: 'Implement with clean, tested code — prioritizing security, performance, and maintainability.',
  },
  {
    num: '04',
    title: 'Validate',
    desc: 'Review, test, and harden the solution against real-world edge cases and attack vectors.',
  },
]

export default memo(function HowIWork() {
  return (
    <section id="how-i-work" className="py-24 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <p className="section-label">Methodology</p>
          <h2 className="section-title">How I Work</h2>
          <p className="section-subtitle">
            A structured approach to building secure, reliable software — from concept to deployment.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-px bg-dark-border">
          {steps.map((step, index) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group bg-dark-surface p-8 lg:p-10 hover:bg-dark-elevated transition-all duration-300"
            >
              <div className="flex items-center gap-4 mb-4">
                <span className="text-accent font-mono text-sm font-bold tracking-widest">{step.num}</span>
                <div className="h-px flex-1 bg-dark-border group-hover:bg-accent/30 transition-colors" />
              </div>
              <h3 className="text-xl font-bold mb-3 group-hover:text-accent transition-colors">{step.title}</h3>
              <p className="text-text-secondary text-sm leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
})
