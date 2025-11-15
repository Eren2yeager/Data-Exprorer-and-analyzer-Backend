/**
 * Database Routes
 * Routes for MongoDB database operations
 */
import express from 'express';
import { listDatabases, getDatabaseInfo, createDatabase, dropDatabase } from '../controllers/databaseController.js';
import { extractSession } from '../middleware/sessionMiddleware.js';
import { validate, databaseNameSchema } from '../middleware/validation.js';
import { apiLimiter, writeLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All database routes require session
router.use(extractSession);

// Database routes with validation and rate limiting
router.get('/databases', apiLimiter, listDatabases);
router.get('/databases/:dbName', apiLimiter, validate(databaseNameSchema, 'params'), getDatabaseInfo);
router.post('/databases/:dbName', writeLimiter, validate(databaseNameSchema, 'params'), createDatabase);
router.delete('/databases/:dbName', writeLimiter, validate(databaseNameSchema, 'params'), dropDatabase);

export default router;