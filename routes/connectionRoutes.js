/**
 * Connection Routes
 * Routes for MongoDB connection management
 */
import express from 'express';
import { 
  connectToDatabase, 
  disconnectFromDatabase, 
  getSessions,
  validateSession
} from '../controllers/connectionController.js';
import { validate, connectionSchema, sessionSchema } from '../middleware/validation.js';
import { connectionLimiter, apiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Connection routes with validation and rate limiting
router.post('/connect', connectionLimiter, validate(connectionSchema), connectToDatabase);
router.post('/validate-session', apiLimiter, validateSession);
router.post('/disconnect', validate(sessionSchema), disconnectFromDatabase);
router.get('/sessions', getSessions);


export default router;