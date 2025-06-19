import { sequelize } from './src/config/database.js';

async function checkDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // List all tables
    const [tables] = await sequelize.query('SHOW TABLES');
    console.log('Tables in database:', tables);

    // Check user_profiles table structure
    try {
      const [columns] = await sequelize.query('DESCRIBE user_profiles');
      console.log('user_profiles columns:', columns);
    } catch (err) {
      console.log('user_profiles table does not exist or cannot be accessed');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkDatabase();
