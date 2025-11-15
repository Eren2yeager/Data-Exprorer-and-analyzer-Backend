/**
 * Document Controller
 * Handles MongoDB document operations
 */
import { getMongoClient } from '../config/db.js';
import { ObjectId } from 'mongodb';

/**
 * Query documents with pagination, sorting, and filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const queryDocuments = async (req, res) => {
  try {
    const { connStr } = req; // From session middleware
    const { dbName, collName } = req.params;
    const { 
      filter = {}, 
      projection = null, 
      sort = {}, 
      page = 1, 
      pageSize = 25 
    } = req.body;
    
    const client = await getMongoClient(connStr);
    const collection = client.db(dbName).collection(collName);
    
    // Parse string filter to object if needed
    let parsedFilter = filter;
    if (typeof filter === 'string') {
      try {
        parsedFilter = JSON.parse(filter);
      } catch (err) {
        return res.error('Invalid filter JSON', 400);
      }
    }
    
    // Sanitize filter to prevent NoSQL injection
    parsedFilter = sanitizeFilter(parsedFilter);
    
    // Calculate skip value for pagination
    const skip = (Math.max(1, page) - 1) * pageSize;
    
    // Query documents with pagination
    const cursor = collection
      .find(parsedFilter, { projection })
      .sort(sort)
      .skip(skip)
      .limit(Math.min(pageSize, 100)); // Max 100 per page
    
    const documents = await cursor.toArray();
    
    // Get total count for pagination
    const total = await collection.countDocuments(parsedFilter);
    
    return res.success({
      documents,
      pagination: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize)
      }
    }, 'Documents retrieved successfully');
    
  } catch (error) {
    console.error('Query documents error:', error.message);
    return res.error(`Failed to query documents: ${error.message}`, 500);
  }
};

/**
 * Get a specific document by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getDocumentById = async (req, res) => {
  try {
    const { connStr } = req; // From session middleware
    const { dbName, collName, id } = req.params;
    
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (err) {
      return res.error('Invalid document ID format', 400);
    }
    
    const client = await getMongoClient(connStr);
    const collection = client.db(dbName).collection(collName);
    const document = await collection.findOne({ _id: objectId });
    
    if (!document) {
      return res.error('Document not found', 404);
    }
    
    return res.success(document, 'Document retrieved successfully');
    
  } catch (error) {
    console.error('Get document error:', error.message);
    return res.error(`Failed to get document: ${error.message}`, 500);
  }
};

/**
 * Insert one or more documents
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const insertDocuments = async (req, res) => {
  try {
    const { connStr } = req; // From session middleware
    const { documents } = req.body;
    const { dbName, collName } = req.params;
    
    // Check if documents is an array or single document
    const isArray = Array.isArray(documents);
    
    const client = await getMongoClient(connStr);
    const collection = client.db(dbName).collection(collName);
    
    let result;
    if (isArray) {
      // Insert many documents
      result = await collection.insertMany(documents);
      return res.success({
        insertedCount: result.insertedCount,
        insertedIds: result.insertedIds
      }, `${result.insertedCount} documents inserted successfully`);
    } else {
      // Insert single document
      result = await collection.insertOne(documents);
      return res.success({
        insertedId: result.insertedId
      }, 'Document inserted successfully');
    }
    
  } catch (error) {
    console.error('Insert documents error:', error.message);
    return res.error(`Failed to insert documents: ${error.message}`, 500);
  }
};

/**
 * Update a document by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const updateDocument = async (req, res) => {
  try {
    const { connStr } = req; // From session middleware
    const { update } = req.body;
    const { dbName, collName, id } = req.params;
    
    if (!update) {
      return res.error('Update data is required', 400);
    }
    
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (err) {
      return res.error('Invalid document ID format', 400);
    }
    
    const client = await getMongoClient(connStr);
    const collection = client.db(dbName).collection(collName);
    
    // Check if update has MongoDB operators, if not wrap in $set
    const updateOperation = Object.keys(update)[0]?.startsWith('$') 
      ? update 
      : { $set: update };
    
    const result = await collection.updateOne(
      { _id: objectId },
      updateOperation
    );
    
    return res.success({
      matchedCount: result.matchedCount,
      modifiedCount: result.modifiedCount,
      upsertedId: result.upsertedId
    }, 'Document updated successfully');
    
  } catch (error) {
    console.error('Update document error:', error.message);
    return res.error(`Failed to update document: ${error.message}`, 500);
  }
};

/**
 * Delete a document by ID
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const deleteDocument = async (req, res) => {
  try {
    const { connStr } = req; // From session middleware
    const { dbName, collName, id } = req.params;
    
    let objectId;
    try {
      objectId = new ObjectId(id);
    } catch (err) {
      return res.error('Invalid document ID format', 400);
    }
    
    const client = await getMongoClient(connStr);
    const collection = client.db(dbName).collection(collName);
    const result = await collection.deleteOne({ _id: objectId });
    
    if (result.deletedCount === 0) {
      return res.error('Document not found or already deleted', 404);
    }
    
    return res.success({
      deletedCount: result.deletedCount
    }, 'Document deleted successfully');
    
  } catch (error) {
    console.error('Delete document error:', error.message);
    return res.error(`Failed to delete document: ${error.message}`, 500);
  }
};

/**
 * Sanitize MongoDB filter to prevent NoSQL injection
 * @param {Object} filter - Filter object
 * @returns {Object} - Sanitized filter
 */
function sanitizeFilter(filter) {
  if (typeof filter !== 'object' || filter === null) {
    return {};
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(filter)) {
    // Skip dangerous operators
    if (key.startsWith('$where') || key.startsWith('$function')) {
      continue;
    }
    
    // Recursively sanitize nested objects
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeFilter(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}
