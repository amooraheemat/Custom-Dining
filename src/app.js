import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import { specs } from './config/swagger.js';
import { connectDB, sequelize } from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import restaurantRoutes from './routes/restaurantRoutes.js';
import mealRoutes from './routes/mealRoutes.js';
// import restaurantRoutes from './routes/restaurantRoutes.js';
// import mealRoutes from './routes/mealRoutes.js';
// import restaurantRoutes from './routes/restaurantRoutes.js';
// import mealRoutes from './routes/mealRoutes.js';
// import userRoutes from './routes/userRoutes.js';
import errorHandler from './middleware/errorHandler.js';

// Load environment variables
dotenv.config();

// Create Express app
const app = express();

// Middleware
app.use(cors()); // Enable CORS for all origins (for development)
app.use(express.json()); // Parses incoming JSON requests
// app.use('/api/meals', mealRoutes);
app.use(express.urlencoded({ extended: true }));// Parses URL -encoded requests

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, { explorer: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/restaurants', restaurantRoutes);
app.use('/api/meals', mealRoutes);
// app.use('/api/users', userRoutes);

// Basic function check route
<<<<<<< HEAD
app.get('/', (req, res) => {
  res.status(200).json({ message: 'Dietary API is running!'});
});
=======
// app.get('/', (req, res) => {
//   res.status(200).json({ message: 'Dietary API is running!'});
// });
>>>>>>> 467eb8144fe63279765eb89c3fdbad9f83949a8b

// Error handling
app.use(errorHandler);

// Handle 404
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found'
  });
});

// Start server
const PORT = process.env.PORT || 3306;

const startServer = async () => {
  try {
    // Connect to database before starting the server
    await connectDB();

    // Start listening
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
      console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};


sequelize.sync({ alter: true }) // or { force: true } to drop & recreate
  .then(() => console.log("Database synced"))
  .catch(err => console.error("Sync failed", err));

startServer();
