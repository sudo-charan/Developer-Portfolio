import { memo } from 'react'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Mail, Send } from 'lucide-react'
import { submitContactMessage } from '../../firebase/services'
import SocialLinks from '../../components/SocialLinks'
import Loader from '../../components/Loader'

export default memo(function Contact({ settings }) {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' })
  const [status, setStatus] = useState({ type: '', message: '' })
  const [loading, setLoading] = useState(false)

  const socialLinks = settings?.socialLinks || {}

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setStatus({ type: '', message: '' })
    try {
      await submitContactMessage(formData)
      setStatus({ type: 'success', message: 'Message sent successfully! I\'ll get back to you soon.' })
      setFormData({ name: '', email: '', subject: '', message: '' })
    } catch {
      setStatus({ type: 'error', message: 'Unable to send message right now. Please try again later.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="contact" className="py-16 px-4 relative" style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 600px' }}>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent pointer-events-none" />
      <div className="max-w-5xl mx-auto relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <p className="section-label">Contact</p>
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <h2 className="section-title">Get In Touch</h2>
            <div className="flex items-center gap-2 text-xs text-text-muted font-mono">
              <span className="status-dot w-2 h-2 bg-accent rounded-full" />
              <span>CONNECTION_ENDPOINT_ACTIVE</span>
            </div>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-surface border border-dark-border text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
                    placeholder="Your name"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-dark-surface border border-dark-border text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
                    placeholder="your@email.com"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">Subject</label>
                <input
                  type="text"
                  required
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-surface border border-dark-border text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors"
                  placeholder="How can I help?"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-widest text-text-muted mb-2">Message</label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-4 py-3 bg-dark-surface border border-dark-border text-text-primary placeholder-text-muted focus:outline-none focus:border-accent transition-colors resize-none"
                  placeholder="Tell me about your project..."
                />
              </div>
              {status.message && (
                <p className={`text-sm ${status.type === 'success' ? 'text-accent-3' : 'text-accent-2'}`}>
                  {status.message}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center gap-2"
              >
                {loading ? (
                  <Loader size={20} />
                ) : (
                  <Send size={18} />
                )}
                Send Message
              </button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="flex flex-col justify-center"
          >
            <div className="space-y-6">
              <p className="text-text-secondary text-lg leading-relaxed">
                I'm always interested in hearing about new projects and opportunities. Feel free to reach out!
              </p>

              <div className="border border-dark-border bg-dark-surface p-6 flex items-center gap-4">
                <div className="p-3 border border-dark-border bg-dark-bg">
                  <Mail className="text-accent" size={24} />
                </div>
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-widest mb-1">Email</p>
                  <p className="text-text-primary font-medium">{socialLinks.email || ''}</p>
                </div>
              </div>

               <div>
                 <h3 className="text-sm font-semibold uppercase tracking-widest text-text-muted mb-4">Connect with me</h3>
                 <SocialLinks links={socialLinks} />
               </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
})
