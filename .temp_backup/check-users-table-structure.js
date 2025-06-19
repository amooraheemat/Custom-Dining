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

async function checkTableStructure() {
  try {
    await sequelize.authenticate();
    console.log('Connection to the database has been established successfully.');

    // Check Users table structure
    const [usersColumns] = await sequelize.query("SHOW CREATE TABLE Users");
    console.log('Users table creation script:');
    console.log(usersColumns[0]['Create Table']);

    // Check if user_profiles table exists
    const [profilesTable] = await sequelize.query("SHOW TABLES LIKE 'user_profiles'");
    if (profilesTable.length > 0) {
      const [profilesColumns] = await sequelize.query("SHOW CREATE TABLE user_profiles");
      console.log('\nuser_profiles table creation script:');
      console.log(profilesColumns[0]['Create Table']);
    } else {
      console.log('\nuser_profiles table does not exist yet.');
    }

  } catch (error) {
    console.error('Error checking table structure:', error);
  } finally {
    await sequelize.close();
  }
}

checkTableStructure();
