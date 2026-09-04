import { useMemo } from 'react'

const PARTICLES = Array.from({ length: 8 }, (_, i) => ({
  id: i,
  left: `${Math.random() * 100}%`,
  top: `${Math.random() * 100}%`,
  size: `${1 + Math.random() * 1.5}px`,
  duration: `${18 + Math.random() * 20}s`,
  delay: `${-Math.random() * 20}s`,
  opacity: `${0.15 + Math.random() * 0.35}`,
}))

export default function BackgroundFX() {
  const particles = useMemo(() => PARTICLES, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-dark-bg to-dark-bg" />

      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)`,
        backgroundSize: '64px 64px'
      }} />

      <div
        className="absolute -top-32 left-1/4 w-[32rem] h-[32rem] rounded-full blur-[120px] animate-drift-slow"
        style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)' }}
      />
      <div
        className="absolute top-1/3 -right-16 w-[28rem] h-[28rem] rounded-full blur-[100px] animate-drift-slower"
        style={{ background: 'radial-gradient(circle, rgba(6,182,212,0.10) 0%, transparent 70%)' }}
      />
      <div
        className="absolute -bottom-24 left-1/3 w-[30rem] h-[30rem] rounded-full blur-[110px] animate-drift-slow-reverse"
        style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-0 right-1/4 w-80 h-80 rounded-full blur-[100px] animate-pulse-slow"
        style={{ background: 'radial-gradient(circle, rgba(239,68,68,0.06) 0%, transparent 70%)' }}
      />

      <div className="absolute inset-0">
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute rounded-full bg-accent animate-float-particle"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              opacity: p.opacity,
              animationDuration: p.duration,
              animationDelay: p.delay,
            }}
          />
        ))}
      </div>
    </div>
  )
}
