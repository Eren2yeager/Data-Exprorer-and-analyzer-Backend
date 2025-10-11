/**
 * Database configuration and connection management
 * This module provides functions to connect to MongoDB and manage client instances
 */
import { MongoClient } from 'mongodb';

// Keep per-connection MongoClient instances in memory keyed by connection string
const clients = new Map();

/**
 * Generate a unique key for the connection string
 * @param {string} connStr - MongoDB connection string
 * @returns {string} - Unique key for the connection
 */
function getClientKey(connStr) {
  // In production, you might want to hash this for security
  return connStr;
}

/**
 * Get or create a MongoDB client for the given connection string
 * @param {string} connStr - MongoDB connection string
 * @returns {Promise<MongoClient>} - MongoDB client instance
 */
export async function getMongoClient(connStr) {
  const key = getClientKey(connStr);
  
  // Return existing client if available
  if (clients.has(key)) {
    const existing = clients.get(key);
    return existing.client;
  }
  
  // Create new client if not exists
  const client = new MongoClient(connStr, {
    connectTimeoutMS: 10000,
    serverSelectionTimeoutMS: 10000,
  });
  
  // Connect and store the client
  await client.connect();
  clients.set(key, { client, created: Date.now() });
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
    await client.close();
    clients.delete(key);
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
      connectionString: key,
      createdAt: value.created
    });
  }
  
  return connections;
}