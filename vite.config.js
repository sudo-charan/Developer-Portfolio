import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    target: 'esnext',
    cssCodeSplit: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@firebase/app')) return 'firebase-app'
            if (id.includes('@firebase/auth')) return 'firebase-auth'
            if (id.includes('@firebase/firestore')) return 'firebase-firestore'
            if (id.includes('@firebase/storage')) return 'firebase-storage'
            if (id.includes('@firebase/util')) return 'firebase-util'
            if (id.includes('framer-motion')) return 'motion'
            if (id.includes('lucide-react')) return 'icons'
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) return 'vendor'
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'framer-motion', 'lucide-react'],
  },
})
