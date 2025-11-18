/**
 * Session Middleware
 * Extracts and validates session, retrieves connection string
 */
import { getConnectionString } from '../config/sessionManagerDB.js';

/**
 * Middleware to extract session ID and get connection string
 * Adds connStr to req object for use in controllers
 */
export async function extractSession(req, res, next) {
  // Get session ID from body, query, or header
  const sessionId = req.body.sessionId || req.query.sessionId || req.headers['x-session-id'];

  if (!sessionId) {
    return res.error('Session ID is required', 401);
  }

  // Get connection string from session (now async with DB)
  const connStr = await getConnectionString(sessionId);

  if (!connStr) {
    return res.error('Invalid or expired session', 401);
  }

  // Add connection string to request object
  req.connStr = connStr;
  req.sessionId = sessionId;

  next();
}

/**
 * Optional session middleware - doesn't fail if session not provided
 * Used for endpoints that can work with or without session
 */
export async function optionalSession(req, res, next) {
  const sessionId = req.body.sessionId || req.query.sessionId || req.headers['x-session-id'];

  if (sessionId) {
    const connStr = await getConnectionString(sessionId);
    if (connStr) {
      req.connStr = connStr;
      req.sessionId = sessionId;
    }
  }

  next();
}
