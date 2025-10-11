/**
 * Schema Routes
 * Routes for MongoDB schema analysis and index management
 */
import express from 'express';
import { 
  analyzeSchema, 
  getCollectionStats, 
  listIndexes, 
  createIndex, 
  dropIndex 
} from '../controllers/schemaController.js';

const router = express.Router();

// Schema analysis routes
router.post('/databases/:dbName/collections/:collName/schema', analyzeSchema);
router.post('/databases/:dbName/collections/:collName/stats', getCollectionStats);

// Index management routes
router.post('/databases/:dbName/collections/:collName/indexes', listIndexes);
router.post('/databases/:dbName/collections/:collName/indexes/create', createIndex);
router.delete('/databases/:dbName/collections/:collName/indexes/:indexName', dropIndex);

export default router;