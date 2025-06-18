import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import { User } from '../models/user.js';
import { Meal } from '../models/meal.js';

export const Favorite = sequelize.define('Favorite', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: { msg: 'User ID required' },
      isInt: { msg: 'User ID must be an integer' }
    }
  },

  mealId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      notNull: { msg: 'Meal ID required' },
      isInt: { msg: 'Meal ID must be an integer' }
    }
  }

}, 
{
  timestamps: true,
  tableName: 'favorites',
  indexes: [
    { unique: true,
      fields: ['userId', 'mealId'],
    },
  ],
});


User.belongsToMany(Meal, { 
    through: Favorite, 
    foreignKey: 'userId'
});

Meal.belongsToMany(User, { 
    through: Favorite, 
    foreignKey: 'mealId' 
});
