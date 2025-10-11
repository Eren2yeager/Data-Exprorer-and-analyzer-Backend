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

const router = express.Router();

// Collection routes
router.post('/databases/:dbName/collections', listCollections);
router.post('/databases/:dbName/collections/:collName', getCollectionStats);
router.post('/databases/:dbName/collections/:collName/create', createCollection);
router.delete('/databases/:dbName/collections/:collName', dropCollection);
router.put('/databases/:dbName/collections/:collName/rename', renameCollection);

export default router;