import { sequelize } from './src/config/database.js';

async function checkIndexes() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Check if user_profiles table exists
    const [tables] = await sequelize.query("SHOW TABLES LIKE 'user_profiles'");
    if (tables.length === 0) {
      console.log('user_profiles table does not exist');
      return;
    }

    // Get all indexes for user_profiles
    const [indexes] = await sequelize.query(
      "SHOW INDEX FROM user_profiles"
    );
    
    console.log('Indexes on user_profiles table:');
    console.table(indexes);

    // Get table structure
    const [columns] = await sequelize.query("SHOW COLUMNS FROM user_profiles");
    console.log('\nColumns in user_profiles table:');
    console.table(columns);

    // Check if the foreign key constraint exists
    const [constraints] = await sequelize.query(
      `SELECT * FROM information_schema.TABLE_CONSTRAINTS 
       WHERE TABLE_NAME = 'user_profiles' 
       AND CONSTRAINT_TYPE = 'FOREIGN_KEY'`
    );
    
    console.log('\nForeign key constraints on user_profiles:');
    console.table(constraints);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkIndexes();
