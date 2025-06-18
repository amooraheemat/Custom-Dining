import { sequelize } from '../src/config/database.js';

async function checkDatabase() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Check if the columns exist
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'custom_dining_db' 
      AND TABLE_NAME = 'Users'
      AND COLUMN_NAME IN ('isTemporaryPassword', 'temporaryPasswordExpires')
    `);
    
    console.log('Found columns:', results);
    
    // Check if the index exists
    const [indexes] = await sequelize.query(`
      SHOW INDEX FROM Users WHERE Key_name = 'users_istemporarypassword_temporarypasswordexpires'
    `);
    
    console.log('Found indexes:', indexes);
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking database:', error);
    process.exit(1);
  }
}

checkDatabase();
