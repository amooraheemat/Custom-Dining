import { sequelize } from './src/config/database.js';

async function checkTable() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Check if user_profiles table exists
    const [tables] = await sequelize.query("SHOW TABLES LIKE 'user_profiles'");
    if (tables.length === 0) {
      console.log('user_profiles table does not exist');
      return;
    }

    // Get table structure
    const [columns] = await sequelize.query('SHOW COLUMNS FROM user_profiles');
    console.log('\nColumns in user_profiles table:');
    console.table(columns);

    // Get indexes
    const [indexes] = await sequelize.query('SHOW INDEX FROM user_profiles');
    console.log('\nIndexes on user_profiles table:');
    console.table(indexes);

    // Get foreign keys
    const [fks] = await sequelize.query(
      `SELECT * FROM information_schema.KEY_COLUMN_USAGE 
       WHERE TABLE_NAME = 'user_profiles' 
       AND CONSTRAINT_SCHEMA = '${process.env.DB_NAME || 'custom_dining_db'}' 
       AND REFERENCED_TABLE_NAME IS NOT NULL`
    );
    console.log('\nForeign keys on user_profiles table:');
    console.table(fks);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkTable();
