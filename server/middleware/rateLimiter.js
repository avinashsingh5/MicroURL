const rateLimit = require('express-rate-limit');

// In-memory store for user-based rate limiting
const userRequestStore = new Map();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of userRequestStore.entries()) {
    if (now > data.resetTime) {
      userRequestStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

// User-based rate limiter for QR code generation
const qrCodeUserRateLimiter = (req, res, next) => {
  if (!req.user || !req.user._id) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const userId = req.user._id.toString();
  const now = Date.now();
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 15; // 15 requests per window

  const userData = userRequestStore.get(userId);

  // Initialize or check if window has expired
  if (!userData || now > userData.resetTime) {
    userRequestStore.set(userId, {
      count: 1,
      resetTime: now + windowMs,
    });
    return next();
  }

  // Check if limit exceeded
  if (userData.count >= maxRequests) {
    const remainingMinutes = Math.ceil((userData.resetTime - now) / 1000 / 60);
    return res.status(429).json({
      error: `Rate limit exceeded. You can generate ${maxRequests} QR codes per ${windowMs / 60000} minutes. Please try again in ${remainingMinutes} minute(s).`,
      retryAfter: Math.ceil((userData.resetTime - now) / 1000),
    });
  }

  // Increment count
  userData.count++;
  next();
};

// IP-based rate limiter as additional protection
const qrCodeIPRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // Limit each IP to 30 requests per windowMs
  message: {
    error: 'Too many QR code generation requests from this IP. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = {
  qrCodeUserRateLimiter,
  qrCodeIPRateLimiter,
};

