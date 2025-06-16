import 'dotenv/config';

// Import the existing database configuration
import { sequelize, connectDB } from './src/config/database.js';

// Import models
import User from './src/models/user.js';
import Restaurant from './src/models/restaurant.js';

// Function to set up the database
async function setupDatabase() {
  try {
    // Connect to the database using the existing configuration
    await connectDB();
    
    // Force sync all models with the database (this will drop tables and recreate them)
    await sequelize.sync({ force: true });
    console.log('Database tables have been recreated.');

    console.log('Database setup completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Unable to set up the database:', error);
    process.exit(1);
  }
}

// Run the setup
setupDatabase();
