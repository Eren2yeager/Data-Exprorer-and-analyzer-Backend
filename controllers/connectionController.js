/**
 * Connection Controller
 * Handles MongoDB connection management operations
 */
import { getMongoClient, closeMongoClient, getActiveConnections } from '../config/db.js';

/**
 * Test and establish a MongoDB connection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const connectToDatabase = async (req, res) => {
  try {
    const { connStr } = req.body;
    //   debug
    console.log('request-body:', req.body);
    if (!connStr) {
      return res.error('Connection string is required', 400);
    }
    
    const client = await getMongoClient(connStr);
    
    // Get server information
    const admin = client.db().admin();
    const serverInfo = await admin.serverStatus();
    
    // Return connection information
    return res.success({
      connected: true,
      serverInfo: {
        version: serverInfo.version,
        uptime: serverInfo.uptime,
        connections: serverInfo.connections,
      }
    }, 'Successfully connected to MongoDB');
    
  } catch (error) {
    console.error('Connection error:', error);
    return res.error(`Failed to connect: ${error.message}`, 500, error);
  }
};

/**
 * Disconnect from a MongoDB instance
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const disconnectFromDatabase = async (req, res) => {
  try {
    const { connStr } = req.body;
    
    if (!connStr) {
      return res.error('Connection string is required', 400);
    }
    
    const closed = await closeMongoClient(connStr);
    
    if (closed) {
      return res.success(null, 'Successfully disconnected from MongoDB');
    } else {
      return res.error('Connection not found', 404);
    }
    
  } catch (error) {
    console.error('Disconnection error:', error);
    return res.error(`Failed to disconnect: ${error.message}`, 500, error);
  }
};

/**
 * Get all active connections
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getConnections = async (req, res) => {
  try {
    const connections = getActiveConnections();
    return res.success(connections, 'Active connections retrieved successfully');
  } catch (error) {
    console.error('Get connections error:', error);
    return res.error(`Failed to get connections: ${error.message}`, 500, error);
  }
};