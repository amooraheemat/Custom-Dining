import { sequelize } from './src/config/database.js';

async function checkUsersTable() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Get table structure
    const [tableInfo] = await sequelize.query('SHOW CREATE TABLE Users');
    console.log('\nUsers table structure:');
    console.log(tableInfo[0]['Create Table']);

    // Get indexes
    const [indexes] = await sequelize.query('SHOW INDEX FROM Users');
    console.log('\nIndexes on Users table:');
    console.table(indexes);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkUsersTable();
