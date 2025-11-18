/**
 * Rate Limiting Middleware
 * Protects API from abuse and DDoS attacks
 * 
 * NOTE: In serverless environments (Vercel), rate limiting uses in-memory storage
 * which resets between function invocations. For production, consider using
 * a distributed store like Redis or Vercel's Edge Config.
 */
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
dotenv.config();
/**
 * Custom handler to include retry time in error message
 */
const createRateLimitHandler = (windowMs, limitType) => {
  return (req, res) => {
    const retryAfterMinutes = Math.ceil(windowMs / 1000 / 60); // Convert to minutes
    const retryTime = new Date(Date.now() + windowMs);
    const retryTimeString = retryTime.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });

    res.status(429).json({
      success: false,
      message: `Too many ${limitType} from this IP. Please try again after ${retryAfterMinutes} minute${retryAfterMinutes > 1 ? 's' : ''} (at ${retryTimeString})`,
      statusCode: 429,
      retryAfter: retryAfterMinutes,
      retryAt: retryTime.toISOString()
    });
  };
};

// General API rate limiter - 5 minute penalty
export const apiLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 1000, // Very high limit
  handler: createRateLimitHandler(5 * 60 * 1000, 'requests'),
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.DISABLE_RATE_LIMIT === 'true', // Allow disabling in dev
});

// Connection limiter - 5 minute penalty
export const connectionLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 200, // Very lenient
  handler: createRateLimitHandler(5 * 60 * 1000, 'connection attempts'),
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.DISABLE_RATE_LIMIT === 'true',
});

// Write operations limiter - 5 minute penalty
export const writeLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 500, // Very lenient
  handler: createRateLimitHandler(5 * 60 * 1000, 'write operations'),
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.DISABLE_RATE_LIMIT === 'true',
});
