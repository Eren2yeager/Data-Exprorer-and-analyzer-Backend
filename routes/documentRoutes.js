/**
 * Document Routes
 * Routes for MongoDB document operations
 */
import express from 'express';
import { 
  queryDocuments, 
  getDocumentById, 
  insertDocuments, 
  updateDocument, 
  deleteDocument 
} from '../controllers/documentController.js';

const router = express.Router();

// Document routes
router.post('/databases/:dbName/collections/:collName/documents', queryDocuments);
router.post('/databases/:dbName/collections/:collName/documents/:id', getDocumentById);
router.post('/databases/:dbName/collections/:collName/documents/insert', insertDocuments);
router.put('/databases/:dbName/collections/:collName/documents/:id', updateDocument);
router.delete('/databases/:dbName/collections/:collName/documents/:id', deleteDocument);

export default router;