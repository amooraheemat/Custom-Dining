import { sequelize } from './src/config/database.js';

async function verifyFix() {
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
    const [tableInfo] = await sequelize.query('SHOW CREATE TABLE user_profiles');
    console.log('\nuser_profiles table structure:');
    console.log(tableInfo[0]['Create Table']);

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

    // Check if we can insert a test record
    try {
      console.log('\nTesting insert into user_profiles...');
      const [users] = await sequelize.query('SELECT id FROM Users LIMIT 1');
      
      if (users.length > 0) {
        const userId = users[0].id;
        await sequelize.query(
          `INSERT INTO user_profiles 
           (id, userId, healthGoal, dietaryRestrictions, preferredMealTags) 
           VALUES (UUID(), ?, 'Test Goal', '[]', '[]')`,
          { replacements: [userId] }
        );
        console.log('Successfully inserted test record into user_profiles');
        
        // Clean up
        await sequelize.query(
          'DELETE FROM user_profiles WHERE healthGoal = ?',
          { replacements: ['Test Goal'] }
        );
        console.log('Cleaned up test record');
      } else {
        console.log('No users found in the database to test with');
      }
    } catch (err) {
      console.error('Error testing user_profiles table:', err);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

verifyFix();
