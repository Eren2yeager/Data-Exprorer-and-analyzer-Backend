/**
 * Connection Controller
 * Handles MongoDB connection management operations
 */
import { getMongoClient, closeMongoClient, getActiveConnections, testLocalMongoDB, LOCAL_MONGODB_URI } from '../config/db.js';
import { createSession, deleteSession, getActiveSessions } from '../config/sessionManager.js';

/**
 * Test and establish a MongoDB connection
 * Creates a session and returns session ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const connectToDatabase = async (req, res) => {
  try {
    const { connStr } = req.body;
    
    if (!connStr) {
      return res.error('Connection string is required', 400);
    }
    
    // Test connection
    const client = await getMongoClient(connStr);
    
    // Get server information
    const admin = client.db().admin();
    const serverInfo = await admin.serverStatus();
    
    // Create session and return session ID
    const sessionId = createSession(connStr);
    
    // Return connection information with session ID
    return res.success({
      sessionId,
      connected: true,
      serverInfo: {
        version: serverInfo.version,
        uptime: serverInfo.uptime,
        host: serverInfo.host,
        process: serverInfo.process,
        connections: {
          current: serverInfo.connections?.current,
          available: serverInfo.connections?.available
        }
      }
    }, 'Successfully connected to MongoDB');
    
  } catch (error) {
    console.error('Connection error:', error.message);
    return res.error(`Failed to connect: ${error.message}`, 500);
  }
};

/**
 * Connect to local MongoDB instance
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const connectToLocal = async (req, res) => {
  try {
    // Test if local MongoDB is available
    const isAvailable = await testLocalMongoDB();
    
    if (!isAvailable) {
      return res.error('Local MongoDB not found. Make sure MongoDB is running on localhost:27017', 503);
    }
    
    // Connect to local MongoDB
    const client = await getMongoClient(LOCAL_MONGODB_URI);
    const admin = client.db().admin();
    const serverInfo = await admin.serverStatus();
    
    // Create session
    const sessionId = createSession(LOCAL_MONGODB_URI);
    
    return res.success({
      sessionId,
      connected: true,
      isLocal: true,
      serverInfo: {
        version: serverInfo.version,
        uptime: serverInfo.uptime,
        host: serverInfo.host
      }
    }, 'Successfully connected to local MongoDB');
    
  } catch (error) {
    console.error('Local connection error:', error.message);
    return res.error(`Failed to connect to local MongoDB: ${error.message}`, 500);
  }
};

/**
 * Disconnect from a MongoDB instance (close session)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const disconnectFromDatabase = async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.error('Session ID is required', 400);
    }
    
    // Delete session
    const deleted = deleteSession(sessionId);
    
    if (deleted) {
      return res.success(null, 'Successfully disconnected from MongoDB');
    } else {
      return res.error('Session not found', 404);
    }
    
  } catch (error) {
    console.error('Disconnection error:', error.message);
    return res.error(`Failed to disconnect: ${error.message}`, 500);
  }
};

/**
 * Get all active sessions
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getSessions = async (req, res) => {
  try {
    const sessions = getActiveSessions();
    const connections = getActiveConnections();
    
    return res.success({
      sessions,
      connections,
      totalSessions: sessions.length,
      totalConnections: connections.length
    }, 'Active sessions retrieved successfully');
  } catch (error) {
    console.error('Get sessions error:', error.message);
    return res.error(`Failed to get sessions: ${error.message}`, 500);
  }
};

/**
 * Test local MongoDB availability
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const checkLocalMongoDB = async (req, res) => {
  try {
    const isAvailable = await testLocalMongoDB();
    
    return res.success({
      available: isAvailable,
      uri: LOCAL_MONGODB_URI
    }, isAvailable ? 'Local MongoDB is available' : 'Local MongoDB is not available');
    
  } catch (error) {
    console.error('Check local MongoDB error:', error.message);
    return res.error(`Failed to check local MongoDB: ${error.message}`, 500);
  }
};