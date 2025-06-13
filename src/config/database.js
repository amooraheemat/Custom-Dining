import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    dialectOptions: {
      ssl: {
        ca: fs.readFileSync(path.join(process.cwd(), 'src/config/ca.pem'))
      }
    }
  }
);

// Create Models [Tables]
import createUserModel from '../models/user.js';
import createRestaurantModel from '../models/restaurant.js';

// Initialize models with sequelize instance
const initModels = () => {
  const User = createUserModel(sequelize);
  const Restaurant = createRestaurantModel(sequelize);

  // Store models in sequelize.models
  sequelize.models = {
    User,
    Restaurant
  };

  // Run .associate if it exists on the models
  if (typeof User.associate === 'function') {
    User.associate(sequelize.models);
  }
  if (typeof Restaurant.associate === 'function') {
    Restaurant.associate(sequelize.models);
  }

  return {
    User,
    Restaurant,
    sequelize
  };
};

// Initialize models
const db = initModels();

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync database in development mode
    if (process.env.NODE_ENV === 'development') {
      try {
        // First try with alter: true
        await sequelize.sync({ alter: true });
        console.log('Database synced successfully with alter.');
      } catch (alterError) {
        console.log('Alter sync failed, trying force sync...');
        // If alter fails, try with force: true (this will drop and recreate tables)
        await sequelize.sync({ force: true });
        console.log('Database synced with force option (tables recreated).');
      }
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

export { sequelize, connectDB, db };
