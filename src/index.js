/**
 * MongoDB Data Explorer and Analyzer - Backend Server
 * Main entry point for the Express application
 */
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { successResponse, errorResponse, errorHandler, notFound } from '../middleware/responseHandler.js';
import { apiLimiter } from '../middleware/rateLimiter.js';

// Import routes
import connectionRoutes from '../routes/connectionRoutes.js';
import databaseRoutes from '../routes/databaseRoutes.js';
import collectionRoutes from '../routes/collectionRoutes.js';
import documentRoutes from '../routes/documentRoutes.js';
import schemaRoutes from '../routes/schemaRoutes.js';
import aggregationRoutes from '../routes/aggregationRoutes.js';
import exportImportRoutes from '../routes/exportImportRoutes.js';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin:  '*'

}));
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: '2mb' }));

// Simple HTTP request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Response handler middleware
app.use(successResponse);
app.use(errorResponse);

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// API Routes
app.use('/api', connectionRoutes);
app.use('/api', databaseRoutes);
app.use('/api', collectionRoutes);
app.use('/api', documentRoutes);
app.use('/api', schemaRoutes);
app.use('/api', aggregationRoutes);
app.use('/api', exportImportRoutes);

// Health check route
app.get('/health', (req, res) => {
  res.success({ 
    status: 'ok', 
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  }, 'Server is running');
});

// 404 handler
app.use(notFound);

// Error handler middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 4000;
const DOMAIN = process.env.DOMAIN || 'localhost';

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║  MongoDB Data Explorer & Analyzer - Backend Server       ║
║  Server running on http://${DOMAIN}:${PORT}                    ║
║  Environment: ${process.env.NODE_ENV || 'development'}                          ║
╚═══════════════════════════════════════════════════════════╝
  `);
  
  console.log(`Server started - Port: ${PORT}, Environment: ${process.env.NODE_ENV || 'development'}, Node: ${process.version}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});

export default app;
