const rateLimit = require('express-rate-limit');
const { getClientIp } = require('./ipUtil');

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req) || req.ip || 'unknown',
  message: {
    error: 'Too many authentication attempts. Please try again after 15 minutes.'
  }
});

const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per IP per window
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => getClientIp(req) || req.ip || 'unknown',
  message: {
    error: 'Too many requests. Please slow down and try again.'
  }
});

module.exports = {
  authRateLimiter,
  apiRateLimiter
};
