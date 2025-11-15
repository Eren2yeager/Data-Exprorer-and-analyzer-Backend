/**
 * Export/Import Routes
 * Routes for data export and import operations
 */
import express from 'express';
import {
  exportToJSON,
  exportToCSV,
  importFromJSON,
  importFromCSV,
  getExportInfo
} from '../controllers/exportImportController.js';
import { extractSession } from '../middleware/sessionMiddleware.js';
import { apiLimiter, writeLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All export/import routes require session
router.use(extractSession);

// Export routes
router.post('/databases/:dbName/collections/:collName/export/json', apiLimiter, exportToJSON);
router.post('/databases/:dbName/collections/:collName/export/csv', apiLimiter, exportToCSV);
router.post('/databases/:dbName/collections/:collName/export/info', apiLimiter, getExportInfo);

// Import routes
router.post('/databases/:dbName/collections/:collName/import/json', writeLimiter, importFromJSON);
router.post('/databases/:dbName/collections/:collName/import/csv', writeLimiter, importFromCSV);

export default router;
