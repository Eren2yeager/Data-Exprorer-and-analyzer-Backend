/**
 * Collection Routes
 * Routes for MongoDB collection operations
 */
import express from 'express';
import { 
  listCollections, 
  getCollectionStats, 
  createCollection, 
  dropCollection, 
  renameCollection 
} from '../controllers/collectionController.js';
import { extractSession } from '../middleware/sessionMiddleware.js';
import { validate, databaseNameSchema, collectionNameSchema, createCollectionSchema, renameCollectionSchema } from '../middleware/validation.js';
import { apiLimiter, writeLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All collection routes require session
router.use(extractSession);

// Collection routes with validation and rate limiting
router.get('/databases/:dbName/collections', apiLimiter, validate(databaseNameSchema, 'params'), listCollections);
router.get('/databases/:dbName/collections/:collName', apiLimiter, validate(databaseNameSchema, 'params'), validate(collectionNameSchema, 'params'), getCollectionStats);
router.post('/databases/:dbName/collections', writeLimiter, validate(databaseNameSchema, 'params'), validate(createCollectionSchema), createCollection);
router.delete('/databases/:dbName/collections/:collName', writeLimiter, validate(databaseNameSchema, 'params'), validate(collectionNameSchema, 'params'), dropCollection);
router.put('/databases/:dbName/collections/:collName/rename', writeLimiter, validate(databaseNameSchema, 'params'), validate(collectionNameSchema, 'params'), validate(renameCollectionSchema), renameCollection);

export default router;