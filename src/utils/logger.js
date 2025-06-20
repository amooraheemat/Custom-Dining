import winston from 'winston';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file and directory names
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define logging level based on environment
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  const isDevelopment = env === 'development';
  return isDevelopment ? 'debug' : 'warn';
};

// Define colors for different log levels
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'blue'
};

// Add colors to winston
winston.addColors(colors);

// Define log format
const format = winston.format.combine(
  // Add timestamp to logs
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  // Colorize the output
  winston.format.colorize({ all: true }),
  // Define the format of the message
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');

// Define where to store logs
const transports = [
  // Console logs
  new winston.transports.Console(),
  // Error logs
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
  }),
  // All logs
  new winston.transports.File({ 
    filename: path.join(logsDir, 'combined.log') 
  })
];

// Create the logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports,
  // Handle exceptions
  exceptionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'exceptions.log') 
    })
  ],
  // Handle unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({ 
      filename: path.join(logsDir, 'rejections.log') 
    })
  ]
});

// Create logs directory if it doesn't exist
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';

if (!existsSync(logsDir)) {
  await mkdir(logsDir, { recursive: true });
}

export { logger };
