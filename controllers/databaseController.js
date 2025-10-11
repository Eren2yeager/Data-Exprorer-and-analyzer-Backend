/**
 * Database Controller
 * Handles MongoDB database operations
 */
import { getMongoClient } from '../config/db.js';

/**
 * List all databases in MongoDB instance
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const listDatabases = async (req, res) => {
  try {
    const { connStr } = req.body;
    
    if (!connStr) {
      return res.error('Connection string is required', 400);
    }
    
    const client = await getMongoClient(connStr);
    const admin = client.db().admin();
    const { databases } = await admin.listDatabases();
    
    // Format the response
    const formattedDatabases = databases.map(db => ({
      name: db.name,
      sizeOnDisk: db.sizeOnDisk,
      empty: db.empty
    }));
    
    return res.success(formattedDatabases, 'Databases retrieved successfully');
    
  } catch (error) {
    console.error('List databases error:', error);
    return res.error(`Failed to list databases: ${error.message}`, 500, error);
  }
};

/**
 * Get database information and stats
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getDatabaseInfo = async (req, res) => {
  try {
    const { connStr } = req.body;
    const { dbName } = req.params;
    
    if (!connStr) {
      return res.error('Connection string is required', 400);
    }
    
    if (!dbName) {
      return res.error('Database name is required', 400);
    }
    
    const client = await getMongoClient(connStr);
    const db = client.db(dbName);
    const stats = await db.stats();
    
    return res.success(stats, `Database '${dbName}' stats retrieved successfully`);
    
  } catch (error) {
    console.error('Get database info error:', error);
    return res.error(`Failed to get database info: ${error.message}`, 500, error);
  }
};

/**
 * Create a new database (by creating a collection in it)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createDatabase = async (req, res) => {
  try {
    const { connStr } = req.body;
    const { dbName } = req.params;
    
    if (!connStr) {
      return res.error('Connection string is required', 400);
    }
    
    if (!dbName) {
      return res.error('Database name is required', 400);
    }
    
    // In MongoDB, databases are created when a collection is added
    // So we create a temporary collection
    const client = await getMongoClient(connStr);
    const db = client.db(dbName);
    await db.createCollection('_temp_init_collection');
    
    return res.success({ name: dbName }, `Database '${dbName}' created successfully`);
    
  } catch (error) {
    console.error('Create database error:', error);
    return res.error(`Failed to create database: ${error.message}`, 500, error);
  }
};

/**
 * Drop a database
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const dropDatabase = async (req, res) => {
  try {
    const { connStr } = req.body;
    const { dbName } = req.params;
    
    if (!connStr) {
      return res.error('Connection string is required', 400);
    }
    
    if (!dbName) {
      return res.error('Database name is required', 400);
    }
    
    // Prevent dropping admin or config databases
    if (['admin', 'config', 'local'].includes(dbName)) {
      return res.error(`Cannot drop system database '${dbName}'`, 403);
    }
    
    const client = await getMongoClient(connStr);
    await client.db(dbName).dropDatabase();
    
    return res.success(null, `Database '${dbName}' dropped successfully`);
    
  } catch (error) {
    console.error('Drop database error:', error);
    return res.error(`Failed to drop database: ${error.message}`, 500, error);
  }
};