import 'dotenv/config';
import { createInterface } from 'readline';
import { fileURLToPath } from 'url';
import path from 'path';

// Import the existing database configuration
import { sequelize, connectDB } from './src/config/database.js';

// Import models (needed for model registration)
import './src/models/user.js';
import './src/models/restaurant.js';
import './src/models/meal.js';

// Function to get user confirmation
function getConfirmation(question) {
  const readline = createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    readline.question(question, (answer) => {
      readline.close();
      resolve(answer.toLowerCase() === 'yes');
    });
  });
}

// Function to set up the database
async function setupDatabase() {
  try {
    console.log('WARNING: This will DROP ALL TABLES and recreate the database schema.');
    console.log('ALL DATA WILL BE LOST!');
    
    const confirmed = await getConfirmation('Are you sure you want to continue? (yes/no) ');
    
    if (!confirmed) {
      console.log('Database setup cancelled.');
      process.exit(0);
    }

    console.log('Connecting to database...');
    await connectDB();
    
    console.log('Recreating database tables...');
    await sequelize.sync({ force: true });
    
    console.log('✅ Database tables have been recreated.');
    console.log('✅ Database setup completed successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Unable to set up the database:');
    console.error(error);
    process.exit(1);
  }
}

// Get the current module's URL and check if it's the main module
const isMainModule = process.argv[1] === fileURLToPath(import.meta.url);

// Run the setup if this is the main module
if (isMainModule) {
  setupDatabase();
} else {
  console.warn('This script is meant to be run directly, not required as a module');
  process.exit(1);
}
