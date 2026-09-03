import { motion } from 'framer-motion'
import { Cpu } from 'lucide-react'

export default function Skills({ skills }) {
  const grouped = skills?.reduce((acc, skill) => {
    const group = skill.group || 'Other'
    if (!acc[group]) acc[group] = []
    acc[group].push(skill)
    return acc
  }, {}) || {}

  const groupOrder = ['Programming Languages', 'Frontend', 'Backend & Development', 'Databases & Cloud', 'Tools & Other Technologies']
  const orderedGroups = [
    ...groupOrder.filter((g) => grouped[g]),
    ...Object.keys(grouped).filter((g) => !groupOrder.includes(g))
  ]

  return (
    <section className="py-24 px-4 relative">
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(0, 242, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 242, 255, 0.1) 1px, transparent 1px)`,
        backgroundSize: '40px 40px'
      }} />
      <div className="max-w-6xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <p className="section-label">Capability Matrix</p>
          <h2 className="section-title">Specialist Toolkit</h2>
          <p className="section-subtitle">
            Modular capability set optimized for rapid deployment, full-stack engineering, and system analysis.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-px bg-dark-border">
          {orderedGroups.map((group, groupIndex) => (
            <motion.div
              key={group}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: groupIndex * 0.1 }}
              className="bg-dark-surface p-8 relative group transition-all duration-300 hover:bg-dark-elevated hover:-translate-y-0.5"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-dark-border group-hover:bg-accent transition-colors duration-300" />
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Cpu size={16} className="text-accent opacity-70" />
                  <h3 className="text-xs font-mono uppercase tracking-widest text-text-primary group-hover:text-accent transition-colors">
                    {group}
                  </h3>
                </div>
                <span className="text-[10px] text-text-muted font-mono bg-dark-bg border border-dark-border px-2 py-0.5">
                  {grouped[group].length} MODS
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {grouped[group].map((skill) => (
                  <span
                    key={skill.id}
                    className="px-3 py-1.5 text-xs font-mono border border-dark-border text-text-secondary bg-dark-bg transition-all duration-200 hover:border-accent/50 hover:text-accent hover:bg-accent/5"
                  >
                    {skill.name}
                  </span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
