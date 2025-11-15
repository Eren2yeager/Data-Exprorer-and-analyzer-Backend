/**
 * Rate Limiting Middleware
 * Protects API from abuse and DDoS attacks
 * 
 * NOTE: In serverless environments (Vercel), rate limiting uses in-memory storage
 * which resets between function invocations. For production, consider using
 * a distributed store like Redis or Vercel's Edge Config.
 */
import rateLimit from 'express-rate-limit';

const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.FUNCTION_NAME;

// General API rate limiter - Very lenient to avoid blocking users
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Very high limit
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
    statusCode: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.DISABLE_RATE_LIMIT === 'true', // Allow disabling in dev
});

// Lenient limiter for connection attempts
export const connectionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Very lenient
  message: {
    success: false,
    message: 'Too many connection attempts, please try again later',
    statusCode: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.DISABLE_RATE_LIMIT === 'true',
});

// Lenient limiter for write operations
export const writeLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 500, // Very lenient
  message: {
    success: false,
    message: 'Too many write operations, please slow down',
    statusCode: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => process.env.DISABLE_RATE_LIMIT === 'true',
});
