import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME || 'custom_dining_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || '',
  {
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: 'mysql',
    logging: console.log,
  }
);

async function checkDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Connection to the database has been established successfully.');

    // Check if Restaurants table exists
    const [results] = await sequelize.query("SHOW TABLES LIKE 'Restaurants'");
    if (results.length === 0) {
      console.log('Restaurants table does not exist. Running migrations...');
      return;
    }

    // Check columns in Restaurants table
    const [columns] = await sequelize.query("DESCRIBE Restaurants");
    console.log('Columns in Restaurants table:', columns.map(col => col.Field).join(', '));

    // Check if user_profiles table exists
    const [userProfileResults] = await sequelize.query("SHOW TABLES LIKE 'user_profiles'");
    if (userProfileResults.length === 0) {
      console.log('user_profiles table does not exist. It will be created by the migration.');
    } else {
      const [userProfileColumns] = await sequelize.query("DESCRIBE user_profiles");
      console.log('Columns in user_profiles table:', userProfileColumns.map(col => col.Field).join(', '));
    }

    // Check if meals table exists
    const [mealsResults] = await sequelize.query("SHOW TABLES LIKE 'meals'");
    if (mealsResults.length === 0) {
      console.log('meals table does not exist. It will be created by the migration.');
    } else {
      const [mealsColumns] = await sequelize.query("DESCRIBE meals");
      console.log('Columns in meals table:', mealsColumns.map(col => col.Field).join(', '));
    }

  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await sequelize.close();
  }
}

checkDatabase();
