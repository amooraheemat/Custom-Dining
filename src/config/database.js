import Sequelize from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync database
    try {
      // In production, use alter: true to safely update tables
      // In development, use force: true to recreate tables
      await sequelize.sync({ 
        alter: process.env.NODE_ENV === 'production',
        force: process.env.NODE_ENV === 'development'
      });
      
      console.log(`Database synced successfully (${process.env.NODE_ENV === 'production' ? 'alter' : 'force'} mode).`);
    } catch (error) {
      console.error('Error syncing database:', error);
      throw error;
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

export {sequelize, connectDB};
