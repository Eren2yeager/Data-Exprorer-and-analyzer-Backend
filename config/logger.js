/**
 * Logger Configuration
 * Winston-based structured logging
 */
import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue',
};

winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Define console format (more readable)
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}`
  )
);

// Define transports
const transports = [
  // Console transport (always available)
  new winston.transports.Console({
    format: consoleFormat,
  }),
];

// Only add file transports in non-serverless environments
// Vercel and other serverless platforms have read-only filesystems
const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.FUNCTION_NAME;

if (!isServerless) {
  // Create logs directory if it doesn't exist (only in non-serverless)
  const logsDir = path.join(__dirname, '../logs');
  try {
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Add file transports only if we can write to filesystem
    transports.push(
      // Error log file
      new winston.transports.File({
        filename: path.join(__dirname, '../logs/error.log'),
        level: 'error',
        format,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      }),
      
      // Combined log file
      new winston.transports.File({
        filename: path.join(__dirname, '../logs/combined.log'),
        format,
        maxsize: 5242880, // 5MB
        maxFiles: 5,
      })
    );
  } catch (error) {
    // Silently fail if we can't create logs directory (serverless environment)
    console.warn('Unable to create logs directory, using console logging only');
  }
}

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format,
  transports,
  exitOnError: false,
});

// Helper functions for structured logging
export const logInfo = (message, meta = {}) => {
  logger.info(message, meta);
};

export const logError = (message, error = null, meta = {}) => {
  if (error) {
    logger.error(message, {
      ...meta,
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name,
      },
    });
  } else {
    logger.error(message, meta);
  }
};

export const logWarn = (message, meta = {}) => {
  logger.warn(message, meta);
};

export const logDebug = (message, meta = {}) => {
  logger.debug(message, meta);
};

export const logHttp = (message, meta = {}) => {
  logger.http(message, meta);
};

// HTTP request logger middleware
export const httpLogger = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const message = `${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`;
    
    logHttp(message, {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration,
      ip: req.ip,
      userAgent: req.get('user-agent'),
    });
  });
  
  next();
};

export default logger;
