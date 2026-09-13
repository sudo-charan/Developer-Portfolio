import { useEffect, useRef, useMemo } from 'react'

const PARTICLE_COUNT = 16
const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  id: i,
  left: `${5 + Math.random() * 90}%`,
  top: `${10 + Math.random() * 80}%`,
  size: `${1 + Math.random() * 2}px`,
  duration: `${20 + Math.random() * 20}s`,
  delay: `${-Math.random() * 20}s`,
  opacity: 0.1 + Math.random() * 0.25,
}))

const FLOATING_SHAPES_COUNT = 12
const FLOATING_SHAPES = Array.from({ length: FLOATING_SHAPES_COUNT }, (_, i) => ({
  id: i,
  size: 12 + Math.random() * 36,
  left: `${5 + Math.random() * 90}%`,
  top: `${10 + Math.random() * 80}%`,
  opacity: 0.02 + Math.random() * 0.05,
  rotation: Math.random() * 360,
  driftDelay: Math.random() * 4,
  driftDuration: 30 + Math.random() * 20,
  isCircle: i % 3 === 0,
}))

const NODES_COUNT = 6
const NODES = Array.from({ length: NODES_COUNT }, (_, i) => ({
  id: i,
  left: `${10 + Math.random() * 80}%`,
  top: `${10 + Math.random() * 80}%`,
  pulseDelay: Math.random() * 3,
}))

export default function BackgroundFX() {
  const prefersReduced = useRef(
    typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false
  )
  const parallaxLayersRef = useRef([])
  const rafRef = useRef(null)
  const targetRef = useRef({ x: 0, y: 0 })
  const tickingRef = useRef(false)

  useEffect(() => {
    const layers = parallaxLayersRef.current
    if (layers.length === 0 || prefersReduced.current) return

    const updateTransforms = () => {
      const { x, y } = targetRef.current
      layers.forEach((layer, i) => {
        if (!layer) return
        const depth = 0.03 + i * 0.06
        const tx = x * depth * 80
        const ty = y * depth * 80
        layer.style.transform = `translate3d(${tx}px, ${ty}px, 0)`
      })
      tickingRef.current = false
    }

    const handleMouseMove = (e) => {
      if (prefersReduced.current) return
      const { innerWidth, innerHeight } = window
      targetRef.current = {
        x: (e.clientX / innerWidth - 0.5) * 2,
        y: (e.clientY / innerHeight - 0.5) * 2,
      }
      if (!tickingRef.current) {
        tickingRef.current = true
        rafRef.current = requestAnimationFrame(updateTransforms)
      }
    }

    const handleMouseLeave = () => {
      if (prefersReduced.current) return
      targetRef.current = { x: 0, y: 0 }
      if (!tickingRef.current) {
        tickingRef.current = true
        rafRef.current = requestAnimationFrame(updateTransforms)
      }
    }

    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mouseleave', handleMouseLeave, { passive: true })

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
      tickingRef.current = false
    }
  }, [])

  const particles = useMemo(() => PARTICLES, [])
  const shapes = useMemo(() => FLOATING_SHAPES, [])
  const nodes = useMemo(() => NODES, [])

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Layer 0: Base background + grid + ground plane (depth 0.03) */}
      <div ref={(el) => (parallaxLayersRef.current[0] = el)} className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-dark-bg to-dark-bg" />
        <div className="absolute inset-0 opacity-[0.04]" style={{
          backgroundImage: `linear-gradient(rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.12) 1px, transparent 1px)`,
          backgroundSize: '64px 64px'
        }} />
        {/* Ground plane - subtle radial gradient at bottom */}
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[32rem] h-40 blur-[60px]"
          style={{
            background: 'radial-gradient(ellipse, rgba(249,115,22,0.04) 0%, transparent 70%)',
            animation: 'ground-shimmer 14s ease-in-out infinite',
          }}
        />
      </div>

      {/* Layer 1: Atmospheric glows + fog (depth 0.06) */}
      <div ref={(el) => (parallaxLayersRef.current[1] = el)} className="absolute inset-0">
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
        {/* Fog layer */}
        <div
          className="absolute bottom-0 left-0 w-full h-60 bg-gradient-to-t from-dark-bg via-dark-bg/80 to-transparent opacity-[0.15] animate-fog-drift"
        />
      </div>

      {/* Layer 2: Central cinematic light (depth 0.10) */}
      <div ref={(el) => (parallaxLayersRef.current[2] = el)} className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-[20rem] h-[28rem] md:w-[24rem] md:h-[36rem] lg:w-[28rem] lg:h-[40rem]">
          {/* Outer atmospheric glow */}
          <div
            className="absolute inset-0 rounded-full blur-[100px] animate-breathe"
            style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.10) 0%, transparent 70%)' }}
          />
          {/* Orange/amber glow */}
          <div
            className="absolute inset-4 rounded-full blur-[60px] animate-breathe"
            style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.08) 0%, transparent 70%)' }}
          />
          {/* Thin illuminated frame */}
          <div className="absolute inset-8 rounded-none border border-accent/10" style={{
            border: '1px solid rgba(249,115,22,0.12)',
            boxShadow: 'inset 0 0 40px rgba(249,115,22,0.10)',
          }} />
          {/* Soft bright interior */}
          <div
            className="absolute inset-12 rounded-sm animate-breathe"
            style={{
              background: 'radial-gradient(circle, rgba(249,115,22,0.04) 0%, transparent 70%)',
            }}
          />
          {/* Atmospheric fade - bottom */}
          <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-dark-bg to-transparent opacity-[0.6]" />
          <div className="absolute bottom-0 left-0 w-full h-1/4 bg-gradient-to-t from-dark-bg via-dark-bg/40 to-transparent" />
        </div>
      </div>

      {/* Layer 3: Floating geometric shapes (depth 0.14) */}
      <div ref={(el) => (parallaxLayersRef.current[3] = el)} className="absolute inset-0 overflow-hidden">
        {shapes.slice(0, 7).map((s) => (
          <div
            key={s.id}
            className="absolute"
            style={{
              left: s.left,
              top: s.top,
              width: s.size,
              height: s.size,
              opacity: s.opacity,
              borderRadius: s.isCircle ? '50%' : '4px',
              border: '1px solid rgba(249,115,22,0.08)',
              transform: `rotate(${s.rotation}deg)`,
              animation: s.isCircle
                ? `rotate-slow 80s linear infinite, drift-slower ${s.driftDuration}s ease-in-out infinite`
                : `drift-slower ${s.driftDuration}s ease-in-out infinite`,
              animationDelay: `${s.driftDelay}s, ${s.driftDelay}s`,
            }}
          />
        ))}
      </div>

      {/* Layer 4: Animated connection lines + glowing nodes (depth 0.18) */}
      <div ref={(el) => (parallaxLayersRef.current[4] = el)} className="absolute inset-0">
        <div
          className="absolute top-1/4 left-1/3 w-32 h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent"
          style={{ animation: 'pulse-slow 8s ease-in-out infinite', animationDelay: '0s' }}
        />
        <div
          className="absolute top-1/3 right-1/4 w-24 h-px bg-gradient-to-r from-transparent via-accent-2/25 to-transparent"
          style={{ animation: 'pulse-slow 10s ease-in-out infinite', animationDelay: '1s' }}
        />
        <div
          className="absolute bottom-1/3 left-1/4 w-28 h-px bg-gradient-to-r from-transparent via-accent-3/30 to-transparent"
          style={{ animation: 'pulse-slow 12s ease-in-out infinite', animationDelay: '2s' }}
        />
        <div
          className="absolute bottom-2/3 right-1/3 w-20 h-px bg-gradient-to-r from-transparent via-accent/15 to-transparent"
          style={{ animation: 'pulse-slow 9s ease-in-out infinite', animationDelay: '1.5s' }}
        />
        {nodes.map((n) => (
          <div
            key={n.id}
            className="absolute rounded-full"
            style={{
              left: n.left,
              top: n.top,
              width: '6px',
              height: '6px',
              background: 'radial-gradient(circle, rgba(249,115,22,0.30) 0%, transparent 70%)',
              animation: `pulse-glow 3s ease-in-out infinite`,
              animationDelay: n.pulseDelay,
            }}
          />
        ))}
      </div>

      {/* Layer 5: Floating particles (depth 0.22) */}
      <div ref={(el) => (parallaxLayersRef.current[5] = el)} className="absolute inset-0">
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

      {/* Layer 6: Foreground glow + fog highlights (depth 0.26) */}
      <div ref={(el) => (parallaxLayersRef.current[6] = el)} className="absolute inset-0">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[24rem] h-[24rem] rounded-full blur-[80px] opacity-[0.04] animate-breathe"
          style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)' }}
        />
        {/* Additional fog drift at bottom */}
        <div
          className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-dark-bg via-transparent to-transparent opacity-[0.10] animate-fog-drift"
          style={{ animationDuration: '35s', animationDelay: '2s' }}
        />
      </div>

      {/* Cinematic vignette (static, not parallax) */}
      <div className="cinematic-vignette" />
    </div>
  )
}
