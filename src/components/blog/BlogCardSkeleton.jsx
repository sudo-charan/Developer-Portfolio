import { motion } from 'framer-motion'

export default function BlogCardSkeleton() {
  return (
    <motion.div
      animate={{ opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      className="bg-dark-elevated p-6 lg:p-8 space-y-4"
    >
      <div className="w-full h-48 bg-dark-border rounded mb-4" />
      <div className="flex items-center gap-3 mb-3">
        <div className="w-16 h-5 bg-dark-border rounded" />
        <div className="w-32 h-4 bg-dark-border rounded" />
        <div className="w-20 h-4 bg-dark-border rounded" />
      </div>
      <div className="w-full h-6 bg-dark-border rounded mb-2" />
      <div className="w-11/12 h-6 bg-dark-border rounded mb-4" />
      <div className="space-y-2">
        <div className="w-full h-4 bg-dark-border rounded" />
        <div className="w-full h-4 bg-dark-border rounded" />
        <div className="w-3/4 h-4 bg-dark-border rounded" />
      </div>
      <div className="pt-2">
        <div className="w-24 h-4 bg-dark-border rounded" />
      </div>
    </motion.div>
  )
}
