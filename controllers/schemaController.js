/**
 * Schema Controller
 * Handles MongoDB schema analysis and index management
 */
import { getMongoClient } from '../config/db.js';

/**
 * Analyze collection schema by sampling documents
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const analyzeSchema = async (req, res) => {
  try {
    const { connStr } = req.body;
    const { dbName, collName } = req.params;
    const { sampleSize = 100 } = req.body;
    
    if (!connStr || !dbName || !collName) {
      return res.error('Connection string, database name, and collection name are required', 400);
    }
    
    const client = await getMongoClient(connStr);
    const collection = client.db(dbName).collection(collName);
    
    // Get sample documents
    const sampleDocs = await collection.aggregate([
      { $sample: { size: sampleSize } }
    ]).toArray();
    
    if (sampleDocs.length === 0) {
      return res.error('Collection is empty', 404);
    }
    
    // Analyze schema structure
    const schemaMap = {};
    const fieldStats = {};
    
    sampleDocs.forEach(doc => {
      analyzeDocument(doc, '', schemaMap, fieldStats);
    });
    
    // Calculate field frequencies
    Object.keys(fieldStats).forEach(field => {
      fieldStats[field].frequency = fieldStats[field].count / sampleDocs.length;
    });
    
    return res.success({
      schema: schemaMap,
      fieldStats,
      sampleSize: sampleDocs.length
    }, 'Schema analysis completed successfully');
    
  } catch (error) {
    console.error('Schema analysis error:', error);
    return res.error(`Failed to analyze schema: ${error.message}`, 500, error);
  }
};

/**
 * Recursively analyze document structure
 * @param {Object} obj - Document or subdocument to analyze
 * @param {String} path - Current field path
 * @param {Object} schemaMap - Schema structure map
 * @param {Object} fieldStats - Field statistics
 */
function analyzeDocument(obj, path, schemaMap, fieldStats) {
  if (obj === null) {
    updateFieldStats(path, 'null', null, fieldStats);
    return;
  }
  
  if (Array.isArray(obj)) {
    // Handle arrays
    if (!schemaMap[path]) {
      schemaMap[path] = { type: 'array', items: {} };
    }
    
    // Analyze array items
    obj.forEach((item, index) => {
      const itemType = getType(item);
      
      if (itemType === 'object') {
        analyzeDocument(item, path ? `${path}.[]` : '[]', schemaMap[path].items, fieldStats);
      } else {
        updateFieldStats(path ? `${path}.[]` : '[]', itemType, item, fieldStats);
        
        if (!schemaMap[path].items.type) {
          schemaMap[path].items.type = [itemType];
        } else if (!schemaMap[path].items.type.includes(itemType)) {
          schemaMap[path].items.type.push(itemType);
        }
      }
    });
    
  } else if (typeof obj === 'object') {
    // Handle objects
    Object.keys(obj).forEach(key => {
      const fullPath = path ? `${path}.${key}` : key;
      const value = obj[key];
      const valueType = getType(value);
      
      if (valueType === 'object') {
        if (!schemaMap[fullPath]) {
          schemaMap[fullPath] = { type: 'object', properties: {} };
        }
        analyzeDocument(value, fullPath, schemaMap, fieldStats);
      } else if (valueType === 'array') {
        if (!schemaMap[fullPath]) {
          schemaMap[fullPath] = { type: 'array', items: {} };
        }
        analyzeDocument(value, fullPath, schemaMap, fieldStats);
      } else {
        updateFieldStats(fullPath, valueType, value, fieldStats);
        
        if (!schemaMap[fullPath]) {
          schemaMap[fullPath] = { type: [valueType] };
        } else if (!schemaMap[fullPath].type.includes(valueType)) {
          schemaMap[fullPath].type.push(valueType);
        }
      }
    });
  }
}

/**
 * Update field statistics
 * @param {String} path - Field path
 * @param {String} type - Field type
 * @param {*} value - Field value
 * @param {Object} fieldStats - Field statistics object
 */
function updateFieldStats(path, type, value, fieldStats) {
  if (!path) return;
  
  if (!fieldStats[path]) {
    fieldStats[path] = {
      count: 1,
      types: { [type]: 1 },
      values: {}
    };
  } else {
    fieldStats[path].count++;
    fieldStats[path].types[type] = (fieldStats[path].types[type] || 0) + 1;
  }
  
  // Track value distribution (for non-object types)
  if (type !== 'object' && type !== 'array' && value !== null && value !== undefined) {
    const strValue = String(value);
    fieldStats[path].values[strValue] = (fieldStats[path].values[strValue] || 0) + 1;
    
    // Limit number of tracked values to prevent memory issues
    const valueKeys = Object.keys(fieldStats[path].values);
    if (valueKeys.length > 20) {
      const minKey = valueKeys.reduce((min, key) => 
        fieldStats[path].values[key] < fieldStats[path].values[min] ? key : min, valueKeys[0]);
      delete fieldStats[path].values[minKey];
    }
  }
}

/**
 * Get type of a value with MongoDB specific types
 * @param {*} value - Value to check
 * @returns {String} Type name
 */
function getType(value) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  
  const type = typeof value;
  if (type !== 'object') return type;
  
  // Check for MongoDB specific types
  if (value._bsontype === 'ObjectID') return 'objectId';
  if (value instanceof Date) return 'date';
  if (value instanceof RegExp) return 'regex';
  
  return 'object';
}

/**
 * Get collection statistics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getCollectionStats = async (req, res) => {
  try {
    const { connStr } = req.body;
    const { dbName, collName } = req.params;
    
    if (!connStr || !dbName || !collName) {
      return res.error('Connection string, database name, and collection name are required', 400);
    }
    
    const client = await getMongoClient(connStr);
    const stats = await client.db(dbName).command({ collStats: collName });
    
    return res.success(stats, 'Collection statistics retrieved successfully');
    
  } catch (error) {
    console.error('Collection stats error:', error);
    return res.error(`Failed to get collection statistics: ${error.message}`, 500, error);
  }
};

/**
 * List indexes for a collection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const listIndexes = async (req, res) => {
  try {
    const { connStr } = req.body;
    const { dbName, collName } = req.params;
    
    if (!connStr || !dbName || !collName) {
      return res.error('Connection string, database name, and collection name are required', 400);
    }
    
    const client = await getMongoClient(connStr);
    const collection = client.db(dbName).collection(collName);
    const indexes = await collection.indexes();
    
    return res.success(indexes, 'Indexes retrieved successfully');
    
  } catch (error) {
    console.error('List indexes error:', error);
    return res.error(`Failed to list indexes: ${error.message}`, 500, error);
  }
};

/**
 * Create index on a collection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const createIndex = async (req, res) => {
  try {
    const { connStr, key, options = {} } = req.body;
    const { dbName, collName } = req.params;
    
    if (!connStr || !dbName || !collName || !key) {
      return res.error('Connection string, database name, collection name, and index key are required', 400);
    }
    
    const client = await getMongoClient(connStr);
    const collection = client.db(dbName).collection(collName);
    
    const result = await collection.createIndex(key, options);
    
    return res.success({
      indexName: result
    }, 'Index created successfully');
    
  } catch (error) {
    console.error('Create index error:', error);
    return res.error(`Failed to create index: ${error.message}`, 500, error);
  }
};

/**
 * Drop index from a collection
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const dropIndex = async (req, res) => {
  try {
    const { connStr } = req.body;
    const { dbName, collName, indexName } = req.params;
    
    if (!connStr || !dbName || !collName || !indexName) {
      return res.error('Connection string, database name, collection name, and index name are required', 400);
    }
    
    const client = await getMongoClient(connStr);
    const collection = client.db(dbName).collection(collName);
    
    await collection.dropIndex(indexName);
    
    return res.success({
      indexName
    }, 'Index dropped successfully');
    
  } catch (error) {
    console.error('Drop index error:', error);
    return res.error(`Failed to drop index: ${error.message}`, 500, error);
  }
};