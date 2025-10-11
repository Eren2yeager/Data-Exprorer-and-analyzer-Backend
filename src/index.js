/**
 * MongoDB Data Explorer and Analyzer - Backend Server
 * Main entry point for the Express application
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { successResponse, errorResponse, errorHandler, notFound } from '../middleware/responseHandler.js';

// Import routes
import connectionRoutes from '../routes/connectionRoutes.js';
import databaseRoutes from '../routes/databaseRoutes.js';
import collectionRoutes from '../routes/collectionRoutes.js';
import documentRoutes from '../routes/documentRoutes.js';
import schemaRoutes from '../routes/schemaRoutes.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 4000;
const DOMAIN = process.env.DOMAIN || 'localhost';

// Middleware
app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

// Response handler middleware
app.use(successResponse);
app.use(errorResponse);

// API Routes
app.use('/api', connectionRoutes);
app.use('/api', databaseRoutes);
app.use('/api', collectionRoutes);
app.use('/api', documentRoutes);
app.use('/api', schemaRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.success({ status: 'ok', uptime: process.uptime() }, 'Server is running');
});

// 404 handler
app.use(notFound);

// Error handler middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://${DOMAIN}:${PORT}`);
});

export default app;
