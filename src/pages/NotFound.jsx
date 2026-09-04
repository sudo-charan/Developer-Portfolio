import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-bg">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-accent mb-4">404</h1>
        <p className="text-text-secondary text-lg mb-8">Page not found</p>
        <Link to="/" className="btn-primary">Go Home</Link>
      </div>
    </div>
  )
}
