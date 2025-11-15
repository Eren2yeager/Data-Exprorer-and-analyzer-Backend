/**
 * Rate Limiting Middleware
 * Protects API from abuse and DDoS attacks
 */
import rateLimit from 'express-rate-limit';

// General API rate limiter
// For development: increased limits to prevent blocking during testing
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // 1000 for dev, 100 for production
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
    statusCode: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.DISABLE_RATE_LIMIT === 'true', // Allow disabling in dev
});

// Strict limiter for connection attempts
export const connectionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 10 : 100, // 100 for dev, 10 for production
  message: {
    success: false,
    message: 'Too many connection attempts, please try again later',
    statusCode: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.DISABLE_RATE_LIMIT === 'true',
});

// Moderate limiter for write operations
export const writeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === 'production' ? 30 : 200, // 200 for dev, 30 for production
  message: {
    success: false,
    message: 'Too many write operations, please slow down',
    statusCode: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.DISABLE_RATE_LIMIT === 'true',
});
