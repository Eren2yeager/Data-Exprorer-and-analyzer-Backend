/**
 * Database-Backed Session Manager with In-Memory Fallback
 * Stores sessions in MongoDB for persistence across serverless restarts
 * Falls back to in-memory storage if database is unavailable
 */
import { v4 as uuidv4 } from 'uuid';
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';
dotenv.config();

// Configuration
const SESSION_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours
const CLEANUP_PROBABILITY = 0.05; // 5% chance to cleanup on each request

// Session database configuration
const SESSION_DB_URI = process.env.SESSION_DB_URI || 'mongodb://localhost:27017';
const SESSION_DB_NAME = process.env.SESSION_DB_NAME || 'mongo_explorer_sessions';
const SESSION_COLLECTION = 'sessions';

let sessionDbClient = null;
let sessionCollection = null;
let dbInitAttempted = false;
let dbAvailable = false;

// In-memory fallback storage
const memoryStore = new Map();
let lastCleanupTime = Date.now();

/**
 * Initialize session database connection
 */
async function initSessionDB() {
  // Return cached collection if available
  if (sessionCollection) {
    return sessionCollection;
  }

  // Only try once to avoid repeated connection attempts
  if (dbInitAttempted && !dbAvailable) {
    return null;
  }

  dbInitAttempted = true;

  try {
    console.log(`[Session Storage] Attempting to connect to: ${SESSION_DB_URI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')}`);
    
    sessionDbClient = new MongoClient(SESSION_DB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 3000,
      connectTimeoutMS: 3000,
    });

    await sessionDbClient.connect();
    const db = sessionDbClient.db(SESSION_DB_NAME);
    sessionCollection = db.collection(SESSION_COLLECTION);

    // Create TTL index for automatic cleanup
    await sessionCollection.createIndex(
      { lastAccessed: 1 },
      { 
        expireAfterSeconds: Math.floor(SESSION_TIMEOUT / 1000),
        name: 'session_ttl_index'
      }
    );

    // Create index on sessionId for fast lookups
    await sessionCollection.createIndex(
      { sessionId: 1 },
      { unique: true, name: 'session_id_index' }
    );

    dbAvailable = true;
    console.log('[Session Storage] ✅ Connected to MongoDB database');
    console.log('[Session Storage] ✅ Sessions will persist across server restarts');
    return sessionCollection;
  } catch (error) {
    dbAvailable = false;
    console.error('[Session Storage] ❌ Failed to connect to MongoDB');
    console.error('[Session Storage] Error:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('ECONNREFUSED')) {
      console.error('[Session Storage] → MongoDB server is not running or not accessible');
      console.error('[Session Storage] → For local: Start MongoDB with "mongod"');
      console.error('[Session Storage] → For serverless: Use MongoDB Atlas (see SERVERLESS_SETUP_REQUIRED.md)');
    } else if (error.message.includes('authentication')) {
      console.error('[Session Storage] → Check username and password in SESSION_DB_URI');
    } else if (error.message.includes('timeout')) {
      console.error('[Session Storage] → Connection timeout - check network/firewall');
    }
    
    console.warn('[Session Storage] ⚠️  Falling back to in-memory storage');
    console.warn('[Session Storage] ⚠️  Sessions will NOT persist across server restarts');
    console.warn('[Session Storage] ⚠️  This is NOT suitable for serverless production!');
    
    return null;
  }
}

/**
 * Create a new session with connection string
 * @param {string} connStr - MongoDB connection string
 * @returns {Promise<string>} - Session ID (token)
 */
export async function createSession(connStr) {
  const sessionId = uuidv4();
  const now = new Date();

  try {
    const collection = await initSessionDB();
    
    if (collection) {
      // Store in database
      await collection.insertOne({
        sessionId,
        connStr,
        createdAt: now,
        lastAccessed: now
      });

      console.log(`[Session Storage] Session created in DB: ${sessionId.substring(0, 8)}...`);
    } else {
      // Fallback to in-memory
      memoryStore.set(sessionId, {
        connStr,
        createdAt: now.getTime(),
        lastAccessed: now.getTime()
      });
      console.log(`[Session Storage] Session created in memory: ${sessionId.substring(0, 8)}... (Total: ${memoryStore.size})`);
    }

    return sessionId;
  } catch (error) {
    console.error('[Session Storage] Error creating session:', error.message);
    // Emergency fallback to memory
    memoryStore.set(sessionId, {
      connStr,
      createdAt: now.getTime(),
      lastAccessed: now.getTime()
    });
    return sessionId;
  }
}

/**
 * Get connection string from session ID
 * @param {string} sessionId - Session ID
 * @returns {Promise<string|null>} - Connection string or null if not found/expired
 */
export async function getConnectionString(sessionId) {
  if (!sessionId) {
    return null;
  }

  try {
    const collection = await initSessionDB();
    
    if (collection) {
      // Use database
      const session = await collection.findOne({ sessionId });

      if (!session) {
        return null;
      }

      // Check if expired
      const timeSinceLastAccess = Date.now() - session.lastAccessed.getTime();
      if (timeSinceLastAccess > SESSION_TIMEOUT) {
        await collection.deleteOne({ sessionId });
        return null;
      }

      // Update last accessed time
      await collection.updateOne(
        { sessionId },
        { $set: { lastAccessed: new Date() } }
      );

      // Occasional cleanup
      if (Math.random() < CLEANUP_PROBABILITY) {
        performCleanup();
      }

      return session.connStr;
    } else {
      // Use in-memory fallback
      const session = memoryStore.get(sessionId);

      if (!session) {
        return null;
      }

      // Check if expired
      const timeSinceLastAccess = Date.now() - session.lastAccessed;
      if (timeSinceLastAccess > SESSION_TIMEOUT) {
        memoryStore.delete(sessionId);
        return null;
      }

      // Update last accessed time
      session.lastAccessed = Date.now();

      // Occasional cleanup
      if (Date.now() - lastCleanupTime > 5 * 60 * 1000) {
        cleanupMemoryStore();
      }

      return session.connStr;
    }
  } catch (error) {
    console.error('[Session Storage] Error getting session:', error.message);
    // Try memory fallback on error
    const session = memoryStore.get(sessionId);
    return session ? session.connStr : null;
  }
}

/**
 * Delete a session
 * @param {string} sessionId - Session ID
 * @returns {Promise<boolean>} - True if deleted, false if not found
 */
export async function deleteSession(sessionId) {
  try {
    const collection = await initSessionDB();
    
    if (collection) {
      const result = await collection.deleteOne({ sessionId });
      return result.deletedCount > 0;
    } else {
      // Use in-memory fallback
      return memoryStore.delete(sessionId);
    }
  } catch (error) {
    console.error('[Session Storage] Error deleting session:', error.message);
    // Try memory fallback
    return memoryStore.delete(sessionId);
  }
}

/**
 * Get all active sessions info (without connection strings)
 * @returns {Promise<Array>} - Array of session info
 */
export async function getActiveSessions() {
  try {
    const collection = await initSessionDB();
    
    if (collection) {
      const sessions = await collection
        .find({}, { projection: { connStr: 0 } })
        .toArray();

      return sessions.map(session => ({
        sessionId: session.sessionId,
        createdAt: session.createdAt.getTime(),
        lastAccessed: session.lastAccessed.getTime(),
        expiresIn: SESSION_TIMEOUT - (Date.now() - session.lastAccessed.getTime())
      }));
    } else {
      // Use in-memory fallback
      return Array.from(memoryStore.entries()).map(([id, data]) => ({
        sessionId: id,
        createdAt: data.createdAt,
        lastAccessed: data.lastAccessed,
        expiresIn: SESSION_TIMEOUT - (Date.now() - data.lastAccessed)
      }));
    }
  } catch (error) {
    console.error('[Session Storage] Error getting sessions:', error.message);
    // Return memory sessions on error
    return Array.from(memoryStore.entries()).map(([id, data]) => ({
      sessionId: id,
      createdAt: data.createdAt,
      lastAccessed: data.lastAccessed,
      expiresIn: SESSION_TIMEOUT - (Date.now() - data.lastAccessed)
    }));
  }
}

/**
 * Cleanup expired sessions from memory store
 */
function cleanupMemoryStore() {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [sessionId, session] of memoryStore.entries()) {
    if (now - session.lastAccessed > SESSION_TIMEOUT) {
      memoryStore.delete(sessionId);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    console.log(`[Session Storage] Cleaned up ${cleaned} expired memory session(s)`);
  }
  
  lastCleanupTime = now;
}

/**
 * Perform cleanup of expired sessions
 * Note: TTL index handles most cleanup automatically for DB
 */
export async function performCleanup() {
  try {
    const collection = await initSessionDB();
    
    if (collection) {
      const cutoffTime = new Date(Date.now() - SESSION_TIMEOUT);
      const result = await collection.deleteMany({
        lastAccessed: { $lt: cutoffTime }
      });

      if (result.deletedCount > 0) {
        console.log(`[Session Storage] Cleaned up ${result.deletedCount} expired DB session(s)`);
      }
    } else {
      // Cleanup memory store
      cleanupMemoryStore();
    }
  } catch (error) {
    console.error('[Session Storage] Error during cleanup:', error.message);
    // Fallback to memory cleanup
    cleanupMemoryStore();
  }
}

/**
 * Close session database connection (for graceful shutdown)
 */
export async function closeSessionDB() {
  if (sessionDbClient) {
    await sessionDbClient.close();
    sessionDbClient = null;
    sessionCollection = null;
    console.log('[Session DB] Connection closed');
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await closeSessionDB();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeSessionDB();
  process.exit(0);
});
