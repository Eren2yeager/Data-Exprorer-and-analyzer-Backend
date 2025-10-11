/**
 * Database Routes
 * Routes for MongoDB database operations
 */
import express from 'express';
import { listDatabases, getDatabaseInfo, createDatabase, dropDatabase } from '../controllers/databaseController.js';

const router = express.Router();

// Database routes
router.post('/databases', listDatabases);
router.post('/databases/:dbName', getDatabaseInfo);
router.post('/databases/:dbName/create', createDatabase);
router.delete('/databases/:dbName', dropDatabase);

export default router;