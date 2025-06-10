import Sequelize from 'sequelize';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const sequelize = new Sequelize(
  process.env.DB_NAME || 'custom_dining_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASS || 'Your_password',
  {
    host: process.env.DB_HOST || 'localhost',
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
    },
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
    console.log('Database connection established.');

    if (process.env.NODE_ENV === 'development') {
      await sequelize.sync({ alter: true });
      console.log(' Database synchronized.');
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error.message);
    process.exit(1);
  }
};

export { sequelize, connectDB };
