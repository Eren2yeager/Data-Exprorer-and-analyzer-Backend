/**
 * Database configuration and connection management
 * This module provides functions to connect to MongoDB and manage client instances
 */
import { MongoClient } from 'mongodb';
import crypto from 'crypto';

// Keep per-connection MongoClient instances in memory keyed by hashed connection string
const clients = new Map();

// Configuration
const CONNECTION_TIMEOUT = 30000; // Increased to 30 seconds for Atlas
const MAX_POOL_SIZE = 10;
const CLIENT_IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes



/**
 * Generate a secure hash key for the connection string
 * @param {string} connStr - MongoDB connection string
 * @returns {string} - Hashed key for the connection
 */
function getClientKey(connStr) {
  return crypto.createHash('sha256').update(connStr).digest('hex');
}



/**
 * Get or create a MongoDB client for the given connection string
 * @param {string} connStr - MongoDB connection string
 * @returns {Promise<MongoClient>} - MongoDB client instance
 */
export async function getMongoClient(connStr) {
  const key = getClientKey(connStr);
  
  // Return existing client if available and still connected
  if (clients.has(key)) {
    const existing = clients.get(key);
    try {
      // Test if connection is still alive
      await existing.client.db().admin().ping();
      existing.lastUsed = Date.now();
      return existing.client;
    } catch (error) {
      // Connection is dead, remove it
      console.log('Removing dead connection');
      clients.delete(key);
    }
  }
  
  // Create new client if not exists
  const client = new MongoClient(connStr, {
    connectTimeoutMS: CONNECTION_TIMEOUT,
    serverSelectionTimeoutMS: CONNECTION_TIMEOUT,
    socketTimeoutMS: 45000, // Socket timeout for long operations
    maxPoolSize: MAX_POOL_SIZE,
    retryWrites: true,
    retryReads: true,
  });
  
  // Connect and store the client
  await client.connect();
  clients.set(key, { 
    client, 
    created: Date.now(),
    lastUsed: Date.now()
  });
  
  console.log(`New MongoDB connection established (Total: ${clients.size})`);
  return client;
}

/**
 * Close a specific MongoDB client connection
 * @param {string} connStr - MongoDB connection string
 * @returns {Promise<boolean>} - True if connection was closed, false if not found
 */
export async function closeMongoClient(connStr) {
  const key = getClientKey(connStr);
  
  if (clients.has(key)) {
    const { client } = clients.get(key);
    try {
      await client.close();
    } catch (error) {
      console.error('Error closing client:', error.message);
    }
    clients.delete(key);
    console.log(`Connection closed (Total: ${clients.size})`);
    return true;
  }
  
  return false;
}

/**
 * Get all active MongoDB client connections
 * @returns {Array} - Array of connection information objects
 */
export function getActiveConnections() {
  const connections = [];
  
  for (const [key, value] of clients.entries()) {
    connections.push({
      connectionKey: key.substring(0, 8) + '...', // Show only first 8 chars of hash
      createdAt: value.created,
      lastUsed: value.lastUsed,
      idleTime: Date.now() - value.lastUsed
    });
  }
  
  return connections;
}

/**
 * Cleanup idle connections
 */
function cleanupIdleConnections() {
  const now = Date.now();
  const toRemove = [];
  
  for (const [key, value] of clients.entries()) {
    if (now - value.lastUsed > CLIENT_IDLE_TIMEOUT) {
      toRemove.push(key);
    }
  }
  
  toRemove.forEach(async (key) => {
    const { client } = clients.get(key);
    try {
      await client.close();
      clients.delete(key);
      console.log(`Idle connection cleaned up (Total: ${clients.size})`);
    } catch (error) {
      console.error('Error cleaning up connection:', error.message);
    }
  });
}

// Start automatic cleanup only in non-serverless environments
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.FUNCTION_NAME;

if (!isServerless) {
  setInterval(cleanupIdleConnections, CLEANUP_INTERVAL);
  console.log('Database connection manager initialized with automatic cleanup');
} else {
  console.log('Database connection manager initialized (serverless mode)');
}

/**
 * Manual cleanup for serverless environments
 */
export function performConnectionCleanup() {
  cleanupIdleConnections();
}
