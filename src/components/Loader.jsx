import './Loader.css'

export default function Loader({ size = 48, className = '', label = 'Loading...' }) {
  return (
    <div className={`loader ${className}`}>
      <div style={{ width: size, height: size }}>
        <l-mirage size={size} speed="2.5" color="black"></l-mirage>
      </div>
      {label && <p className="loader-label">{label}</p>}
    </div>
  )
}
