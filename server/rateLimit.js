const windows = new Map()
let lastCleanup = 0
const MAX_BUCKETS = 10_000

export function checkRateLimit(req, { bucket, limit, windowMs }) {
  const forwardedFor = req.headers['x-forwarded-for']
  const realIp = req.headers['x-real-ip']
  const clientIp =
    (typeof realIp === 'string' && realIp.length <= 64 ? realIp : '') ||
    (typeof forwardedFor === 'string' ? forwardedFor.split(',')[0].trim() : '') ||
    req.socket?.remoteAddress ||
    'unknown'
  const key = `${bucket}:${clientIp}`
  const now = Date.now()
  let entry = windows.get(key)

  if (!entry || now >= entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs }
    windows.set(key, entry)
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    }
  }

  entry.count += 1

  if (now - lastCleanup > 60_000 || windows.size > MAX_BUCKETS) {
    for (const [windowKey, window] of windows) {
      if (now >= window.resetAt) windows.delete(windowKey)
    }
    while (windows.size > MAX_BUCKETS) {
      windows.delete(windows.keys().next().value)
    }
    lastCleanup = now
  }

  return { allowed: true, retryAfterSeconds: 0 }
}

export function getRequestBodySize(body) {
  try {
    const serialized = JSON.stringify(body)
    return serialized === undefined ? 0 : Buffer.byteLength(serialized, 'utf8')
  } catch {
    return Number.POSITIVE_INFINITY
  }
}
