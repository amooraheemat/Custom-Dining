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

async function checkUsersTable() {
  try {
    await sequelize.authenticate();
    console.log('Connection to the database has been established successfully.');

    // Check Users table structure
    const [usersColumns] = await sequelize.query("SHOW COLUMNS FROM Users");
    console.log('Columns in Users table:');
    console.table(usersColumns);

    // Check Users table indexes
    const [indexes] = await sequelize.query("SHOW INDEX FROM Users");
    console.log('Indexes in Users table:');
    console.table(indexes);

    // Check if there are any users in the database
    const [users] = await sequelize.query("SELECT id, email, role FROM Users LIMIT 5");
    console.log('Sample users in the database:');
    console.table(users);

  } catch (error) {
    console.error('Error checking Users table:', error);
  } finally {
    await sequelize.close();
  }
}

checkUsersTable();
