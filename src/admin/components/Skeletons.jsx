export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-dark-border/60 ${className}`} />
}

export function SkeletonCard() {
  return (
    <div className="border border-dark-border bg-dark-surface p-6">
      <Skeleton className="h-4 w-1/3 mb-4" />
      <Skeleton className="h-3 w-2/3 mb-2" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  )
}

export function SkeletonForm() {
  return (
    <div className="border border-dark-border bg-dark-surface p-6 space-y-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i}>
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <Skeleton className="h-10 w-32" />
    </div>
  )
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="border border-dark-border bg-dark-surface">
      <div className="grid border-b border-dark-border bg-dark-elevated/50" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="px-4 py-3">
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="grid border-b border-dark-border last:border-b-0" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}>
          {Array.from({ length: cols }).map((_, colIndex) => (
            <div key={colIndex} className="px-4 py-3">
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
