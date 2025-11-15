/**
 * Aggregation Routes
 * Routes for MongoDB aggregation pipeline operations
 */
import express from 'express';
import {
  executeAggregation,
  getAggregationSuggestions,
  validatePipeline,
  explainAggregation
} from '../controllers/aggregationController.js';
import { extractSession } from '../middleware/sessionMiddleware.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All aggregation routes require session
router.use(extractSession);

// Aggregation routes
router.post('/databases/:dbName/collections/:collName/aggregate', apiLimiter, executeAggregation);
router.get('/databases/:dbName/collections/:collName/aggregate/suggestions', apiLimiter, getAggregationSuggestions);
router.post('/databases/:dbName/collections/:collName/aggregate/explain', apiLimiter, explainAggregation);
router.post('/aggregate/validate', apiLimiter, validatePipeline);

export default router;
