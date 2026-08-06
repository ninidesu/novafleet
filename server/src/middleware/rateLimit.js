// Lightweight in-memory fixed-window rate limiter, keyed by device_uid (falling
// back to IP). Good enough for a single instance; swap for a Redis-backed
// limiter if the API is horizontally scaled.
export function rateLimit({ windowMs = 60000, max = 120 } = {}) {
  const buckets = new Map();

  return (req, res, next) => {
    const key = req.body?.device_uid || req.ip;
    const now = Date.now();
    let bucket = buckets.get(key);
    if (!bucket || now > bucket.resetAt) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }
    bucket.count += 1;
    if (bucket.count > max) {
      res.set("Retry-After", String(Math.ceil((bucket.resetAt - now) / 1000)));
      return res.status(429).json({ message: "Rate limit exceeded for this device.", code: "rate_limited" });
    }
    next();
  };
}
