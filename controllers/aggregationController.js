/**
 * Aggregation Controller
 * Handles MongoDB aggregation pipeline operations
 */
import { getMongoClient } from '../config/db.js';

/**
 * Execute aggregation pipeline
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const executeAggregation = async (req, res) => {
  try {
    const { connStr } = req; // From session middleware
    const { dbName, collName } = req.params;
    const { pipeline, options = {} } = req.body;
    
    if (!pipeline || !Array.isArray(pipeline)) {
      return res.error('Pipeline must be an array of aggregation stages', 400);
    }
    
    if (pipeline.length === 0) {
      return res.error('Pipeline cannot be empty', 400);
    }
    
    if (pipeline.length > 50) {
      return res.error('Pipeline too long (max 50 stages)', 400);
    }
    
    const client = await getMongoClient(connStr);
    const collection = client.db(dbName).collection(collName);
    
    // Execute aggregation with timeout
    const startTime = Date.now();
    const results = await collection.aggregate(pipeline, {
      ...options,
      maxTimeMS: options.maxTimeMS || 30000 // 30 second timeout
    }).toArray();
    const executionTime = Date.now() - startTime;
    
    return res.success({
      results,
      count: results.length,
      executionTime,
      pipeline
    }, 'Aggregation executed successfully');
    
  } catch (error) {
    console.error('Aggregation error:', error.message);
    return res.error(`Failed to execute aggregation: ${error.message}`, 500);
  }
};

/**
 * Get aggregation pipeline suggestions based on collection schema
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAggregationSuggestions = async (req, res) => {
  try {
    const { connStr } = req; // From session middleware
    const { dbName, collName } = req.params;
    
    const client = await getMongoClient(connStr);
    const collection = client.db(dbName).collection(collName);
    
    // Get sample document to suggest fields
    const sampleDoc = await collection.findOne({});
    
    if (!sampleDoc) {
      return res.success({
        suggestions: [],
        message: 'Collection is empty'
      }, 'No suggestions available');
    }
    
    const fields = Object.keys(sampleDoc).filter(key => key !== '_id');
    
    // Generate common aggregation suggestions
    const suggestions = [
      {
        name: 'Count Documents',
        description: 'Count total documents in collection',
        pipeline: [{ $count: 'total' }]
      },
      {
        name: 'Group and Count',
        description: `Group by field and count occurrences`,
        pipeline: fields.slice(0, 3).map(field => ({
          example: `Group by ${field}`,
          pipeline: [
            { $group: { _id: `$${field}`, count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 }
          ]
        }))
      },
      {
        name: 'Calculate Statistics',
        description: 'Calculate min, max, avg for numeric fields',
        pipeline: [
          {
            $group: {
              _id: null,
              count: { $sum: 1 },
              // Add numeric field stats dynamically
            }
          }
        ]
      },
      {
        name: 'Recent Documents',
        description: 'Get most recent documents',
        pipeline: [
          { $sort: { _id: -1 } },
          { $limit: 10 }
        ]
      },
      {
        name: 'Distinct Values',
        description: 'Get distinct values for a field',
        pipeline: fields.slice(0, 3).map(field => ({
          example: `Distinct ${field}`,
          pipeline: [
            { $group: { _id: `$${field}` } },
            { $sort: { _id: 1 } }
          ]
        }))
      }
    ];
    
    return res.success({
      suggestions,
      availableFields: fields
    }, 'Aggregation suggestions generated');
    
  } catch (error) {
    console.error('Aggregation suggestions error:', error.message);
    return res.error(`Failed to generate suggestions: ${error.message}`, 500);
  }
};

/**
 * Validate aggregation pipeline without executing
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const validatePipeline = async (req, res) => {
  try {
    const { pipeline } = req.body;
    
    if (!pipeline || !Array.isArray(pipeline)) {
      return res.error('Pipeline must be an array', 400);
    }
    
    // Basic validation
    const errors = [];
    const warnings = [];
    
    if (pipeline.length === 0) {
      errors.push('Pipeline is empty');
    }
    
    if (pipeline.length > 50) {
      errors.push('Pipeline too long (max 50 stages)');
    }
    
    // Check each stage
    pipeline.forEach((stage, index) => {
      if (typeof stage !== 'object' || stage === null) {
        errors.push(`Stage ${index} must be an object`);
        return;
      }
      
      const stageKeys = Object.keys(stage);
      if (stageKeys.length === 0) {
        errors.push(`Stage ${index} is empty`);
      } else if (stageKeys.length > 1) {
        errors.push(`Stage ${index} has multiple operators: ${stageKeys.join(', ')}`);
      } else {
        const operator = stageKeys[0];
        if (!operator.startsWith('$')) {
          errors.push(`Stage ${index}: "${operator}" is not a valid aggregation operator`);
        }
        
        // Warn about potentially expensive operations
        if (['$lookup', '$graphLookup'].includes(operator)) {
          warnings.push(`Stage ${index}: ${operator} can be expensive on large collections`);
        }
        
        if (operator === '$out' || operator === '$merge') {
          warnings.push(`Stage ${index}: ${operator} will write to another collection`);
        }
      }
    });
    
    const isValid = errors.length === 0;
    
    return res.success({
      isValid,
      errors,
      warnings,
      stageCount: pipeline.length
    }, isValid ? 'Pipeline is valid' : 'Pipeline has errors');
    
  } catch (error) {
    console.error('Pipeline validation error:', error.message);
    return res.error(`Failed to validate pipeline: ${error.message}`, 500);
  }
};

/**
 * Explain aggregation pipeline (get execution plan)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const explainAggregation = async (req, res) => {
  try {
    const { connStr } = req; // From session middleware
    const { dbName, collName } = req.params;
    const { pipeline } = req.body;
    
    if (!pipeline || !Array.isArray(pipeline)) {
      return res.error('Pipeline must be an array', 400);
    }
    
    const client = await getMongoClient(connStr);
    const collection = client.db(dbName).collection(collName);
    
    // Get execution plan
    const explanation = await collection.aggregate(pipeline).explain('executionStats');
    
    return res.success({
      explanation,
      summary: {
        executionTimeMillis: explanation.executionStats?.executionTimeMillis,
        totalDocsExamined: explanation.executionStats?.totalDocsExamined,
        totalKeysExamined: explanation.executionStats?.totalKeysExamined,
        nReturned: explanation.executionStats?.nReturned
      }
    }, 'Aggregation explained successfully');
    
  } catch (error) {
    console.error('Explain aggregation error:', error.message);
    return res.error(`Failed to explain aggregation: ${error.message}`, 500);
  }
};
