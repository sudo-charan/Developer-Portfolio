import 'ldrs/react/Mirage.css'
import { Mirage } from 'ldrs/react'

export default function Loader({ size = 48, className = '', label = 'Loading page...' }) {
  return (
    <div className={`loader ${className}`} style={{ width: size, height: size }}>
      <Mirage size={size} speed="2.5" color="black" />
      {label && <p className="loader-label">{label}</p>}
    </div>
  )
}
