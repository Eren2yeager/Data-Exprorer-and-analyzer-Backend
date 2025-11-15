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
    const { connStr } = req; // From session middleware
    const { dbName, collName } = req.params;
    const { sampleSize = 100 } = req.body;
    
    const client = await getMongoClient(connStr);
    const collection = client.db(dbName).collection(collName);
    
    // Get total document count
    const totalCount = await collection.estimatedDocumentCount();
    
    if (totalCount === 0) {
      return res.success({
        schema: {},
        fieldStats: {},
        sampleSize: 0,
        totalDocuments: 0,
        isEmpty: true
      }, 'Collection is empty');
    }
    
    // Get sample documents
    const actualSampleSize = Math.min(sampleSize, totalCount, 1000); // Max 1000 samples
    const sampleDocs = await collection.aggregate([
      { $sample: { size: actualSampleSize } }
    ]).toArray();
    
    // Analyze schema structure
    const schemaMap = {};
    const fieldStats = {};
    
    sampleDocs.forEach(doc => {
      analyzeDocument(doc, '', schemaMap, fieldStats);
    });
    
    // Calculate field frequencies and prepare visualization data
    const fields = Object.keys(fieldStats).map(field => {
      const stats = fieldStats[field];
      const frequency = stats.count / sampleDocs.length;
      
      return {
        path: field,
        count: stats.count,
        frequency: frequency,
        types: stats.types,
        primaryType: Object.keys(stats.types).reduce((a, b) => 
          stats.types[a] > stats.types[b] ? a : b
        ),
        topValues: Object.entries(stats.values || {})
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([value, count]) => ({ value, count })),
        isRequired: frequency > 0.95, // Field appears in >95% of documents
        isUnique: stats.uniqueCount === stats.count
      };
    });
    
    return res.success({
      schema: schemaMap,
      fields: fields.sort((a, b) => b.frequency - a.frequency),
      sampleSize: sampleDocs.length,
      totalDocuments: totalCount,
      samplingPercentage: (sampleDocs.length / totalCount * 100).toFixed(2)
    }, 'Schema analysis completed successfully');
    
  } catch (error) {
    console.error('Schema analysis error:', error.message);
    return res.error(`Failed to analyze schema: ${error.message}`, 500);
  }
};

/**
 * Recursively analyze document structure
 */
function analyzeDocument(obj, path, schemaMap, fieldStats) {
  if (obj === null) {
    updateFieldStats(path, 'null', null, fieldStats);
    return;
  }
  
  if (Array.isArray(obj)) {
    if (!schemaMap[path]) {
      schemaMap[path] = { type: 'array', items: {} };
    }
    
    obj.forEach((item) => {
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
        } else {
          if (!Array.isArray(schemaMap[fullPath].type)) {
            schemaMap[fullPath].type = [schemaMap[fullPath].type];
          }
          
          if (!schemaMap[fullPath].type.includes(valueType)) {
            schemaMap[fullPath].type.push(valueType);
          }
        }
      }
    });
  }
}

/**
 * Update field statistics
 */
function updateFieldStats(path, type, value, fieldStats) {
  if (!path) return;
  
  if (!fieldStats[path]) {
    fieldStats[path] = {
      count: 1,
      types: { [type]: 1 },
      values: {},
      uniqueValues: new Set(),
      uniqueCount: 0
    };
  } else {
    fieldStats[path].count++;
    fieldStats[path].types[type] = (fieldStats[path].types[type] || 0) + 1;
  }
  
  // Track value distribution
  if (type !== 'object' && type !== 'array' && value !== null && value !== undefined) {
    const strValue = String(value);
    fieldStats[path].values[strValue] = (fieldStats[path].values[strValue] || 0) + 1;
    fieldStats[path].uniqueValues.add(strValue);
    fieldStats[path].uniqueCount = fieldStats[path].uniqueValues.size;
    
    // Limit tracked values
    const valueKeys = Object.keys(fieldStats[path].values);
    if (valueKeys.length > 50) {
      const minKey = valueKeys.reduce((min, key) => 
        fieldStats[path].values[key] < fieldStats[path].values[min] ? key : min, valueKeys[0]);
      delete fieldStats[path].values[minKey];
    }
  }
}

/**
 * Get type of a value with MongoDB specific types
 */
function getType(value) {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return 'array';
  
  const type = typeof value;
  if (type !== 'object') return type;
  
  // MongoDB specific types
  if (value._bsontype === 'ObjectID' || value.constructor?.name === 'ObjectId') return 'objectId';
  if (value instanceof Date) return 'date';
  if (value instanceof RegExp) return 'regex';
  if (value._bsontype === 'Binary') return 'binary';
  if (value._bsontype === 'Decimal128') return 'decimal';
  
  return 'object';
}

/**
 * List indexes for a collection
 */
export const listIndexes = async (req, res) => {
  try {
    const { connStr } = req; // From session middleware
    const { dbName, collName } = req.params;
    
    const client = await getMongoClient(connStr);
    const collection = client.db(dbName).collection(collName);
    const indexes = await collection.indexes();
    
    // Enhance index information
    const enhancedIndexes = indexes.map(index => ({
      ...index,
      size: index.key ? Object.keys(index.key).length : 0,
      fields: index.key ? Object.keys(index.key) : [],
      isUnique: index.unique || false,
      isSparse: index.sparse || false,
      isPartial: !!index.partialFilterExpression
    }));
    
    return res.success(enhancedIndexes, 'Indexes retrieved successfully');
    
  } catch (error) {
    console.error('List indexes error:', error.message);
    return res.error(`Failed to list indexes: ${error.message}`, 500);
  }
};

/**
 * Create index on a collection
 */
export const createIndex = async (req, res) => {
  try {
    const { connStr } = req; // From session middleware
    const { key, options = {} } = req.body;
    const { dbName, collName } = req.params;
    
    if (!key) {
      return res.error('Index key is required', 400);
    }
    
    const client = await getMongoClient(connStr);
    const collection = client.db(dbName).collection(collName);
    
    const result = await collection.createIndex(key, options);
    
    return res.success({
      indexName: result,
      key,
      options
    }, 'Index created successfully');
    
  } catch (error) {
    console.error('Create index error:', error.message);
    return res.error(`Failed to create index: ${error.message}`, 500);
  }
};

/**
 * Drop index from a collection
 */
export const dropIndex = async (req, res) => {
  try {
    const { connStr } = req; // From session middleware
    const { dbName, collName, indexName } = req.params;
    
    // Prevent dropping _id index
    if (indexName === '_id_') {
      return res.error('Cannot drop the _id index', 403);
    }
    
    const client = await getMongoClient(connStr);
    const collection = client.db(dbName).collection(collName);
    
    await collection.dropIndex(indexName);
    
    return res.success({
      indexName
    }, 'Index dropped successfully');
    
  } catch (error) {
    console.error('Drop index error:', error.message);
    return res.error(`Failed to drop index: ${error.message}`, 500);
  }
};
