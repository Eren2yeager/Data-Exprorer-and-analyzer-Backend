/**
 * Connection Routes
 * Routes for MongoDB connection management
 */
import express from 'express';
import { connectToDatabase, disconnectFromDatabase, getConnections } from '../controllers/connectionController.js';

const router = express.Router();

// Connection routes
router.post('/connect', connectToDatabase);
router.post('/disconnect', disconnectFromDatabase);
router.get('/connections', getConnections);

export default router;