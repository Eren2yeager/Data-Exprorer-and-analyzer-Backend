/**
 * Session Manager
 * Manages user sessions and connection string mapping with automatic cleanup
 */
import { v4 as uuidv4 } from 'uuid';

// Session storage: sessionId -> { connStr, createdAt, lastAccessed }
const sessions = new Map();

// Configuration
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
const MAX_SESSIONS = 1000; // Prevent memory exhaustion

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
      sessions.delete(oldestSession[0]);
    }
  }

  const sessionId = uuidv4();
  sessions.set(sessionId, {
    connStr,
    createdAt: Date.now(),
    lastAccessed: Date.now()
  });

  return sessionId;
}

/**
 * Get connection string from session ID
 * @param {string} sessionId - Session ID
 * @returns {string|null} - Connection string or null if not found/expired
 */
export function getConnectionString(sessionId) {
  if (!sessionId || !sessions.has(sessionId)) {
    return null;
  }

  const session = sessions.get(sessionId);

  // Check if session expired
  if (Date.now() - session.lastAccessed > SESSION_TIMEOUT) {
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
  for (const [sessionId, session] of sessions.entries()) {
    if (now - session.lastAccessed > SESSION_TIMEOUT) {
      sessions.delete(sessionId);
      console.log(`Session ${sessionId} expired and removed`);
    }
  }
}

// Start automatic cleanup
setInterval(cleanupExpiredSessions, CLEANUP_INTERVAL);

console.log('Session manager initialized with automatic cleanup');
