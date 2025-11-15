/**
 * Schema Routes
 * Routes for MongoDB schema analysis and index management
 */
import express from 'express';
import { 
  analyzeSchema, 
  listIndexes, 
  createIndex, 
  dropIndex 
} from '../controllers/schemaController.js';
import { extractSession } from '../middleware/sessionMiddleware.js';
import { apiLimiter, writeLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All schema routes require session
router.use(extractSession);

// Schema analysis routes
router.post('/databases/:dbName/collections/:collName/schema', apiLimiter, analyzeSchema);

// Index management routes
router.get('/databases/:dbName/collections/:collName/indexes', apiLimiter, listIndexes);
router.post('/databases/:dbName/collections/:collName/indexes', writeLimiter, createIndex);
router.delete('/databases/:dbName/collections/:collName/indexes/:indexName', writeLimiter, dropIndex);

export default router;