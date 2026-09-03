import { motion } from 'framer-motion'
import { ExternalLink, Star, Terminal } from 'lucide-react'

const workflowStages = [
  { label: 'INPUT', desc: 'User prompt ingestion' },
  { label: 'INTENT ANALYSIS', desc: 'Semantic classification' },
  { label: 'RISK ESTIMATION', desc: 'Threat scoring model' },
  { label: 'DECISION ENGINE', desc: 'Policy enforcement' },
  { label: 'ACTION', desc: 'Allow / Sanitize / Block' },
]

function GuardGPTWorkflow() {
  return (
    <div className="mt-6 pt-6 border-t border-dark-border/50">
      <div className="flex items-center gap-2 mb-4">
        <Terminal size={14} className="text-accent" />
        <p className="text-xs font-mono uppercase tracking-widest text-text-muted">Execution Pipeline</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
        {workflowStages.map((stage, i) => (
          <div key={stage.label} className="flex items-center gap-3">
            <div className="flex flex-col items-center">
              <span className="px-2 py-1 border border-accent/30 text-accent bg-accent/5 transition-colors hover:bg-accent/10">
                {stage.label}
              </span>
              <span className="text-text-muted mt-1 hidden sm:block opacity-60">{stage.desc}</span>
            </div>
            {i < workflowStages.length - 1 && (
              <svg className="w-4 h-4 text-dark-border transition-colors group-hover:text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 18l6-6-6-6" />
              </svg>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function Projects({ projects }) {
  const featured = projects?.filter((p) => p.featured) || []
  const others = projects?.filter((p) => !p.featured) || []

  return (
    <section id="projects" className="py-24 px-4">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <p className="section-label">Operations / Intel</p>
          <h2 className="section-title">Mission Case Files</h2>
          <p className="section-subtitle">
            Technical analysis and implementation records of completed security and software missions.
          </p>
        </motion.div>

        <div className="space-y-12">
          {featured.map((project, index) => {
            const isGuardGPT = project.name?.toLowerCase().includes('guard')
            return (
              <motion.div
                key={project.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className={`group relative border bg-dark-surface transition-all duration-500 ${isGuardGPT ? 'border-accent/30 shadow-[0_0_20px_rgba(0,242,255,0.05)] hover:border-accent/50' : 'border-dark-border hover:border-accent/30'}`}
              >
                <div className="flex flex-col lg:flex-row">
                  <div className="flex-1 p-8 lg:p-12">
                    <div className="flex items-center gap-3 mb-6">
                      <span className="flex items-center gap-1 px-3 py-1 text-[10px] font-bold border border-accent/30 text-accent uppercase tracking-tighter bg-accent/5">
                        <Star size={10} />
                        Priority Case
                      </span>
                      {project.status && (
                        <span className="px-3 py-1 text-[10px] font-bold border border-accent-2/30 text-accent-2 uppercase tracking-tighter bg-accent-2/5">
                          {project.status}
                        </span>
                      )}
                      <span className="text-xs text-text-muted font-mono ml-auto opacity-60">
                        MISSION_{String(index + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <h3 className={`text-3xl font-bold mb-4 group-hover:text-accent transition-colors ${isGuardGPT ? 'text-accent' : ''}`}>
                      {project.name}
                    </h3>
                    <p className="text-text-secondary mb-8 leading-relaxed text-lg">
                      {project.description}
                    </p>
                    {project.tags && (
                      <div className="flex flex-wrap gap-2 mb-8">
                        {project.tags.split(',').map((tag, i) => (
                          <span
                            key={i}
                            className="px-3 py-1 text-xs font-mono border border-dark-border text-text-secondary bg-dark-bg transition-colors hover:border-accent/50"
                          >
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                    {isGuardGPT && <GuardGPTWorkflow />}
                    <div className="flex items-center gap-6 mt-8">
                      {project.github && (
                        <a
                          href={project.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm font-mono text-text-secondary hover:text-accent transition-colors"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                          Source_Code
                        </a>
                      )}
                      {project.demo && (
                        <a
                          href={project.demo}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm font-mono text-text-secondary hover:text-accent transition-colors"
                        >
                          <ExternalLink size={16} />
                          Deployment_Live
                        </a>
                      )}
                    </div>
                  </div>
                  {project.image && (
                    <div className="lg:w-96 flex-shrink-0 border-t lg:border-t-0 lg:border-l border-dark-border overflow-hidden">
                      <img
                        src={project.image}
                        alt={project.name}
                        className="w-full h-48 lg:h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 scale-105 group-hover:scale-100"
                      />
                    </div>
                  )}
                </div>
              </motion.div>
            )
          })}

          {others.length > 0 && (
            <div className="grid md:grid-cols-2 gap-px bg-dark-border">
              {others.map((project, index) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="group bg-dark-surface p-8 hover:bg-dark-elevated transition-all duration-300 border-b border-r border-dark-border"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs text-text-muted font-mono opacity-60">MISSION_{String(index + featured.length + 1).padStart(2, '0')}</span>
                    {project.status && (
                      <span className="px-2 py-1 text-[10px] font-bold border border-accent-2/30 text-accent-2 uppercase bg-accent-2/5">
                        {project.status}
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-accent transition-colors">
                    {project.name}
                  </h3>
                  <p className="text-text-secondary text-sm mb-6 line-clamp-3 leading-relaxed">
                    {project.description}
                  </p>
                  {project.tags && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {project.tags.split(',').slice(0, 4).map((tag, i) => (
                        <span
                          key={i}
                          className="px-2 py-1 text-[10px] font-mono border border-dark-border text-text-muted bg-dark-bg transition-colors group-hover:border-accent/30"
                        >
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-6">
                    {project.github && (
                      <a
                        href={project.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-secondary hover:text-accent transition-colors flex items-center gap-1 text-xs font-mono"
                      >
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
                        Source
                      </a>
                    )}
                    {project.demo && (
                      <a
                        href={project.demo}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-text-secondary hover:text-accent transition-colors flex items-center gap-1 text-xs font-mono"
                      >
                        <ExternalLink size={14} />
                        Live
                      </a>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
