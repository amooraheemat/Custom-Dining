import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import { connectDB } from './config/database.js';
import { specs } from './config/swagger.js';
import authRoutes from './routes/authRoutes.js';
import restaurantRoutes from './routes/restaurantRoutes.js';
import mealRoutes from './routes/mealRoutes.js';
import attachDb from './middleware/dbMiddleware.js';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: './test.env' });
dotenv.config();

// Create Express app
const app = express();

// Basic middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded request bodies
app.use(cookieParser()); // Parse cookies

// Simple request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// API Documentation
const swaggerOptions = {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Custom Dining API',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    url: '/api-docs.json',
    validatorUrl: null,
    defaultModelsExpandDepth: -1,
    defaultModelExpandDepth: 5,
    docExpansion: 'list',
    persistAuthorization: true,
    operationsSorter: 'method',
    tagsSorter: 'alpha',
  }
};

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, swaggerOptions));

// Database middleware - attach database models to request object
app.use(attachDb);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/meals', mealRoutes);

// Serve API spec
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(specs);
});

// 404 handler - must be after all other routes
app.use((req, res) => {
  res.status(404).json({ 
    status: 'error',
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Handle 405 Method Not Allowed - must be after all routes but before error handler
app.use((err, req, res, next) => {
  if (err.status === 405) {
    return res.status(405).json({
      status: 'error',
      message: `The ${req.method} method is not allowed.`
    });
  }
  next(err);
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    status: 'error',
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
};

startServer();

export default app;
