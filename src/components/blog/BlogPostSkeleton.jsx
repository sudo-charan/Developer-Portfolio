import { motion } from 'framer-motion'

export default function BlogPostSkeleton() {
  return (
    <motion.div
      animate={{ opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      className="min-h-screen bg-dark-bg pt-24 pb-16"
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="w-40 h-5 bg-dark-border rounded mb-8" />
        <div className="w-full h-64 md:h-96 bg-dark-border rounded mb-8" />
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-6 bg-dark-border rounded" />
          <div className="w-32 h-5 bg-dark-border rounded" />
          <div className="w-24 h-5 bg-dark-border rounded" />
        </div>
        <div className="w-full h-8 bg-dark-border rounded mb-2" />
        <div className="w-3/4 h-8 bg-dark-border rounded mb-8" />
        <div className="space-y-4 pt-4">
          <div className="w-full h-5 bg-dark-border rounded" />
          <div className="w-full h-5 bg-dark-border rounded" />
          <div className="w-full h-5 bg-dark-border rounded" />
          <div className="w-5/6 h-5 bg-dark-border rounded" />
          <div className="w-full h-5 bg-dark-border rounded" />
          <div className="w-4/5 h-5 bg-dark-border rounded" />
          <div className="w-full h-5 bg-dark-border rounded" />
        </div>
      </div>
    </motion.div>
  )
}
