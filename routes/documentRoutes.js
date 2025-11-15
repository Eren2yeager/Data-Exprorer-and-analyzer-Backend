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
import { extractSession } from '../middleware/sessionMiddleware.js';
import { validate, queryDocumentsSchema, insertDocumentsSchema, updateDocumentSchema } from '../middleware/validation.js';
import { apiLimiter, writeLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All document routes require session
router.use(extractSession);

// Document routes with validation and rate limiting
router.post('/databases/:dbName/collections/:collName/documents/query', apiLimiter, validate(queryDocumentsSchema), queryDocuments);
router.get('/databases/:dbName/collections/:collName/documents/:id', apiLimiter, getDocumentById);
router.post('/databases/:dbName/collections/:collName/documents', writeLimiter, validate(insertDocumentsSchema), insertDocuments);
router.put('/databases/:dbName/collections/:collName/documents/:id', writeLimiter, validate(updateDocumentSchema), updateDocument);
router.delete('/databases/:dbName/collections/:collName/documents/:id', writeLimiter, deleteDocument);

export default router;