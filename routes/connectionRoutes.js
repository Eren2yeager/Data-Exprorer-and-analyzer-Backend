/**
 * Connection Routes
 * Routes for MongoDB connection management
 */
import express from 'express';
import { 
  connectToDatabase, 
  connectToLocal,
  disconnectFromDatabase, 
  getSessions,
  checkLocalMongoDB 
} from '../controllers/connectionController.js';
import { validate, connectionSchema, sessionSchema } from '../middleware/validation.js';
import { connectionLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Connection routes with validation and rate limiting
router.post('/connect', connectionLimiter, validate(connectionSchema), connectToDatabase);
router.post('/connect/local', connectionLimiter, connectToLocal);
router.post('/disconnect', validate(sessionSchema), disconnectFromDatabase);
router.get('/sessions', getSessions);
router.get('/check-local', checkLocalMongoDB);

export default router;