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

async function checkCollation() {
  try {
    await sequelize.authenticate();
    console.log('Connection to the database has been established successfully.');

    // Check database collation
    const [dbInfo] = await sequelize.query(
      "SELECT SCHEMA_NAME, DEFAULT_CHARACTER_SET_NAME, DEFAULT_COLLATION_NAME " +
      "FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = ?",
      { replacements: [process.env.DB_NAME || 'custom_dining_db'] }
    );
    console.log('Database collation info:');
    console.table(dbInfo);

    // Check Users table collation
    const [tableInfo] = await sequelize.query(
      "SELECT TABLE_NAME, TABLE_COLLATION FROM information_schema.TABLES " +
      "WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('Users', 'Restaurants', 'meals')",
      { replacements: [process.env.DB_NAME || 'custom_dining_db'] }
    );
    console.log('Table collation info:');
    console.table(tableInfo);

    // Check Users table columns collation
    const [columnsInfo] = await sequelize.query(
      "SELECT COLUMN_NAME, CHARACTER_SET_NAME, COLLATION_NAME FROM information_schema.COLUMNS " +
      "WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Users' AND DATA_TYPE IN ('varchar', 'char', 'text')",
      { replacements: [process.env.DB_NAME || 'custom_dining_db'] }
    );
    console.log('Users table columns collation info:');
    console.table(columnsInfo);

  } catch (error) {
    console.error('Error checking collation:', error);
  } finally {
    await sequelize.close();
  }
}

checkCollation();
