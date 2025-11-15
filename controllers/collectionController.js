/**
 * Collection Controller
 * Handles MongoDB collection operations
 */
import { getMongoClient } from '../config/db.js';

/**
 * List all collections in a database
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const listCollections = async (req, res) => {
  try {
    const { connStr } = req; // From session middleware
    const { dbName } = req.params;
    
    const client = await getMongoClient(connStr);
    const db = client.db(dbName);
    const collections = await db.listCollections().toArray();
    
    // Enhance each collection with size and document count
    const enhancedCollections = await Promise.all(
      collections.map(async (coll) => {
        try {
          const collRef = db.collection(coll.name);
          const count = await collRef.estimatedDocumentCount();
          const stats = await db.command({ collStats: coll.name });
          return {
            ...coll,
            count,
            size: stats.size || 0,
            avgObjSize: stats.avgObjSize || 0
          };
        } catch (err) {
          // Fallback if stats fail
          return {
            ...coll,
            count: 0,
            size: 0,
            error: 'Could not retrieve stats'
          };
        }
      })
    );
    
    return res.success(enhancedCollections, `Collections in database '${dbName}' retrieved successfully`);
    
  } catch (error) {
    console.error('List collections error:', error.message);
    return res.error(`Failed to list collections: ${error.message}`, 500);
  }
};
/**
 * Get collection statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getCollectionStats = async (req, res) => {
  try {
    const { connStr } = req; // From session middleware
    const { dbName, collName } = req.params;
    
    const client = await getMongoClient(connStr);
    const db = client.db(dbName);
    
    // Use db.command() with collStats instead of .stats()
    const stats = await db.command({ collStats: collName });
    
    return res.success(stats, `Collection '${collName}' stats retrieved successfully`);
    
  } catch (error) {
    console.error('Get collection stats error:', error.message);
    return res.error(`Failed to get collection stats: ${error.message}`, 500);
  }
};

/**
 * Create a new collection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createCollection = async (req, res) => {
  try {
    const { connStr } = req; // From session middleware
    const { dbName } = req.params;
    const { collName, options } = req.body;
    
    const client = await getMongoClient(connStr);
    const db = client.db(dbName);
    await db.createCollection(collName, options || {});
    
    return res.success({ name: collName }, `Collection '${collName}' created successfully`);
    
  } catch (error) {
    console.error('Create collection error:', error.message);
    return res.error(`Failed to create collection: ${error.message}`, 500);
  }
};

/**
 * Drop a collection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const dropCollection = async (req, res) => {
  try {
    const { connStr } = req; // From session middleware
    const { dbName, collName } = req.params;
    
    // Prevent dropping system collections
    if (collName.startsWith('system.')) {
      return res.error(`Cannot drop system collection '${collName}'`, 403);
    }
    
    const client = await getMongoClient(connStr);
    const db = client.db(dbName);
    await db.collection(collName).drop();
    
    return res.success(null, `Collection '${collName}' dropped successfully`);
    
  } catch (error) {
    console.error('Drop collection error:', error.message);
    return res.error(`Failed to drop collection: ${error.message}`, 500);
  }
};

/**
 * Rename a collection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const renameCollection = async (req, res) => {
  try {
    const { connStr } = req; // From session middleware
    const { newName } = req.body;
    const { dbName, collName } = req.params;
    
    if (!newName) {
      return res.error('New collection name is required', 400);
    }
    
    // Prevent renaming system collections
    if (collName.startsWith('system.')) {
      return res.error(`Cannot rename system collection '${collName}'`, 403);
    }
    
    const client = await getMongoClient(connStr);
    const db = client.db(dbName);
    await db.collection(collName).rename(newName);
    
    return res.success({ oldName: collName, newName }, `Collection renamed from '${collName}' to '${newName}' successfully`);
    
  } catch (error) {
    console.error('Rename collection error:', error.message);
    return res.error(`Failed to rename collection: ${error.message}`, 500);
  }
};