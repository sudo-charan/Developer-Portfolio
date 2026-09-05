import './Loader.css'

export default function Loader({ size = 48, className = '', label = 'Loading...' }) {
  return (
    <div className={`loader ${className}`}>
      <div style={{ width: size, height: size }} />
      {label && <p className="loader-label">{label}</p>}
    </div>
  )
}
