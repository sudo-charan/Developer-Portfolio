export default function StatusIndicator({ status = 'loading', label, value, size = 'md' }) {
  const sizeClasses = {
    sm: 'h-1.5 w-1.5',
    md: 'h-2 w-2',
    lg: 'h-3 w-3',
  }

  const dotClass = `${sizeClasses[size]} rounded-full`
  const indicatorStyles = {
    online: `${dotClass} bg-green-400 shadow-sm shadow-green-400/50`,
    warning: `${dotClass} bg-amber-400 shadow-sm shadow-amber-400/50`,
    error: `${dotClass} bg-red-400 shadow-sm shadow-red-400/50`,
    loading: `${dotClass} bg-text-muted animate-pulse`,
  }

  const labels = {
    online: 'CONNECTED',
    warning: 'DEGRADED',
    error: 'ERROR',
    loading: 'CHECKING',
  }

  const displayStatus = value || labels[status]

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span
          className={indicatorStyles[status]}
          style={{
              animation: status === 'online' || status === 'warning'
                ? 'pulse-glow 2s ease-in-out infinite'
                : undefined,
          }}
        />
        <span className="text-xs text-text-secondary font-mono">{label}</span>
      </div>
      <span className="text-xs text-text-muted font-mono">{displayStatus}</span>
    </div>
  )
}
