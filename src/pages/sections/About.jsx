import { motion } from 'framer-motion'

export default function About({ content, settings }) {
  const aboutData = settings?.about || content?.about || {}
  return (
    <section id="about" className="py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-10"
        >
          <p className="section-label">About</p>
          <h2 className="section-title">About Me</h2>
        </motion.div>
        <div className="max-w-3xl">
          <p className="text-text-secondary text-lg leading-relaxed">
            {aboutData.text || "I'm an Information Science and Engineering student with hands-on experience in full-stack web development. I'm passionate about building practical software, exploring AI-based systems, cybersecurity, and networking. I believe in learning by doing — every project is a chance to understand something deeper."}
          </p>
        </div>
      </div>
    </section>
  )
}
