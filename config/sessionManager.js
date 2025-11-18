/**
 * Session Manager - Serverless Optimized
 * In-memory session storage with on-demand cleanup
 * 
 * IMPORTANT: In serverless environments, sessions are stored in memory
 * and will be lost when the function cold-starts. For production,
 * consider using Redis or a database for session persistence.
 */
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
dotenv.config();
// Session storage: sessionId -> { connStr, createdAt, lastAccessed }
const sessions = new Map();

// Configuration - hardcoded for serverless
const SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours
const MAX_SESSIONS = 10000; // Increased limit
const CLEANUP_INTERVAL = 600000; // 10 minutes (not used in serverless)

// Track if we're in serverless environment
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.FUNCTION_NAME;

// Log session stats periodically
let lastLogTime = Date.now();
const LOG_INTERVAL = 5 * 60 * 1000; // 5 minutes
/**
 * Create a new session with connection string
 * @param {string} connStr - MongoDB connection string
 * @returns {string} - Session ID (token)
 */

export function createSession(connStr) {
  // Check session limit
  if (sessions.size >= MAX_SESSIONS) {
    // Remove oldest session
    const oldestSession = Array.from(sessions.entries())
      .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed)[0];
    if (oldestSession) {
      console.log(`[Session Manager] Max sessions reached (${MAX_SESSIONS}), removing oldest session`);
      sessions.delete(oldestSession[0]);
    }
  }

  const sessionId = uuidv4();
  sessions.set(sessionId, {
    connStr,
    createdAt: Date.now(),
    lastAccessed: Date.now()
  });

  console.log(`[Session Manager] Session created: ${sessionId.substring(0, 8)}... (Total: ${sessions.size})`);
  
  return sessionId;
}

/**
 * Get connection string from session ID
 * @param {string} sessionId - Session ID
 * @returns {string|null} - Connection string or null if not found/expired
 */
export function getConnectionString(sessionId) {
  // Occasional cleanup (10% chance)
  if (Math.random() < 0.1) {
    performCleanup();
  }

  // Log session stats periodically
  if (Date.now() - lastLogTime > LOG_INTERVAL) {
    console.log(`[Session Manager] Active sessions: ${sessions.size}, Serverless: ${isServerless}`);
    lastLogTime = Date.now();
  }

  if (!sessionId) {
    console.warn('[Session Manager] No session ID provided');
    return null;
  }

  if (!sessions.has(sessionId)) {
    console.warn(`[Session Manager] Session not found: ${sessionId.substring(0, 8)}... (Total sessions: ${sessions.size})`);
    return null;
  }

  const session = sessions.get(sessionId);

  // Check if session expired
  const timeSinceLastAccess = Date.now() - session.lastAccessed;
  if (timeSinceLastAccess > SESSION_TIMEOUT) {
    console.log(`[Session Manager] Session expired: ${sessionId.substring(0, 8)}... (inactive for ${Math.round(timeSinceLastAccess / 1000 / 60)} minutes)`);
    sessions.delete(sessionId);
    return null;
  }

  // Update last accessed time
  session.lastAccessed = Date.now();
  return session.connStr;
}

/**
 * Delete a session
 * @param {string} sessionId - Session ID
 * @returns {boolean} - True if deleted, false if not found
 */
export function deleteSession(sessionId) {
  return sessions.delete(sessionId);
}

/**
 * Get all active sessions info (without connection strings)
 * @returns {Array} - Array of session info
 */
export function getActiveSessions() {
  return Array.from(sessions.entries()).map(([id, data]) => ({
    sessionId: id,
    createdAt: data.createdAt,
    lastAccessed: data.lastAccessed,
    expiresIn: SESSION_TIMEOUT - (Date.now() - data.lastAccessed)
  }));
}

/**
 * Cleanup expired sessions
 */
function cleanupExpiredSessions() {
  const now = Date.now();
  let cleaned = 0;
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.lastAccessed > SESSION_TIMEOUT) {
      sessions.delete(sessionId);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`Cleaned up ${cleaned} expired session(s)`);
  }
}



/**
 * Perform on-demand cleanup (for serverless environments)
 */
export function performCleanup() {
  cleanupExpiredSessions();
}
