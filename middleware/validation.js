/**
 * Request Validation Middleware
 * Joi schemas for validating API requests
 */
import Joi from 'joi';

// Connection string validation
export const connectionSchema = Joi.object({
  connStr: Joi.string()
    .required()
    .pattern(/^mongodb(\+srv)?:\/\//)
    .max(1000)
    .messages({
      'string.pattern.base': 'Invalid MongoDB connection string format',
      'string.max': 'Connection string too long'
    })
});

// Session validation
export const sessionSchema = Joi.object({
  sessionId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid session ID format'
    })
});

// Database name validation
export const databaseNameSchema = Joi.object({
  dbName: Joi.string()
    .required()
    .min(1)
    .max(64)
    .pattern(/^[a-zA-Z0-9_-]+$/)
    .messages({
      'string.pattern.base': 'Database name can only contain letters, numbers, underscores, and hyphens'
    })
}).unknown(true); // Allow other fields in params

// Collection name validation
export const collectionNameSchema = Joi.object({
  collName: Joi.string()
    .required()
    .min(1)
    .max(255)
    .messages({
      'string.min': 'Collection name cannot be empty'
    })
}).unknown(true); // Allow other fields in params

// Query documents validation
export const queryDocumentsSchema = Joi.object({
  filter: Joi.alternatives().try(
    Joi.object(),
    Joi.string().max(10000)
  ).default({}),
  projection: Joi.object().default(null),
  sort: Joi.object().default({}),
  page: Joi.number().integer().min(1).default(1),
  pageSize: Joi.number().integer().min(1).max(100).default(25)
});

// Insert documents validation
export const insertDocumentsSchema = Joi.object({
  documents: Joi.alternatives().try(
    Joi.object().required(),
    Joi.array().items(Joi.object()).min(1).max(1000).required()
  ).required()
});

// Update document validation
export const updateDocumentSchema = Joi.object({
  update: Joi.object().required()
});

// Create collection validation
export const createCollectionSchema = Joi.object({
  collName: Joi.string().required().min(1).max(255),
  options: Joi.object().optional()
});

// Rename collection validation
export const renameCollectionSchema = Joi.object({
  newName: Joi.string().required().min(1).max(255)
});

/**
 * Validation middleware factory
 * @param {Joi.Schema} schema - Joi validation schema
 * @param {string} source - Source of data to validate ('body', 'params', 'query')
 * @returns {Function} - Express middleware function
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const dataToValidate = req[source];
    const { error, value } = schema.validate(dataToValidate, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.error('Validation failed', 400, { errors });
    }

    // Replace request data with validated and sanitized data
    req[source] = value;
    next();
  };
}
