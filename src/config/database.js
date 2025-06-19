import Sequelize from 'sequelize';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: false, // Disable query logging in all environments
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    // dialectOptions: {
    //   ssl: {
    //     ca: fs.readFileSync(path.join(process.cwd(), 'src/config/ca.pem'))
    //   }
    // }
  }
);

// Create Models [Tables]
import createUserModel from '../models/user.js';
import createRestaurantModel from '../models/restaurant.js';
import createMealModel from '../models/meal.js';
import createUserProfileModel from '../models/userProfile.js';

// Initialize models with sequelize instance
const initModels = () => {
  const User = createUserModel(sequelize);
  const Restaurant = createRestaurantModel(sequelize);
  const Meal = createMealModel(sequelize);

  // Initialize UserProfile model
  const UserProfile = createUserProfileModel(sequelize);
  
  UserProfile.init({
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
    },
    userId: {
      type: Sequelize.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: User,
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    healthGoal: {
      type: Sequelize.STRING,
      allowNull: true,
    },
    dietaryRestrictions: {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
    },
    preferredMealTags: {
      type: Sequelize.JSON,
      allowNull: true,
      defaultValue: [],
    },
  }, {
    sequelize,
    modelName: 'UserProfile',
    tableName: 'user_profiles',
    timestamps: true,
  });

  // Set up associations
  User.hasOne(UserProfile, {
    foreignKey: 'userId',
    onDelete: 'CASCADE',
  });
  UserProfile.belongsTo(User, {
    foreignKey: 'userId',
  });

  // Store models in sequelize.models
  sequelize.models = {
    User,
    Restaurant,
    Meal,
    UserProfile
  };

  // Run .associate if it exists on the models
  if (typeof User.associate === 'function') {
    User.associate(sequelize.models);
  }
  if (typeof Restaurant.associate === 'function') {
    Restaurant.associate(sequelize.models);
  }
  if (typeof Meal.associate === 'function') {
    Meal.associate(sequelize.models);
  }

  return {
    User,
    Restaurant,
    Meal,
    sequelize
  };
};

// Initialize models
const db = initModels();

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync database
    try {
      // Only sync specific models and be cautious with alter
      await sequelize.sync({ 
        // Only sync specific models to avoid issues
        // sync: { models: ['User', 'Restaurant', 'Meal'] },
        // Be more specific about what to alter
        alter: {
          drop: false,  // Don't drop any columns/tables
          // Only add new columns, don't modify existing ones
          add: true,
          // Don't drop any indexes or constraints
          dropIndexes: false,
          dropConstraints: false
        },
        // Never drop tables automatically
        force: false
      });
      
      console.log('Database synced successfully (safe mode).');
    } catch (error) {
      console.error('Error syncing database:', error);
      throw error;
    }
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

export { sequelize, connectDB, db };
