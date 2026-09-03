import './Loader.css'

export default function Loader({ size = 48, className = '', label = 'Loading page...' }) {
  return (
    <div className={`loader ${className}`} style={{ width: size, height: size }}>
      <l-mirage size={size} speed="2.5" color="black"></l-mirage>
      {label && <p className="loader-label">{label}</p>}
    </div>
  )
}
