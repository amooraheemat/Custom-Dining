import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import { User } from '../models/user.js';

export const UserProfile = sequelize.define('UserProfile', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },

  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    unique: true,
    references: {
      model: User,
      key: 'id',
    },
    onDelete: 'CASCADE', 
  },

  healthGoal: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  
  dietaryRestrictions: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },

  preferredMealTags: {
    type: DataTypes.JSON,
    allowNull: true,
    defaultValue: [],
  },

}, {
  timestamps: true,
  tableName: 'user_profiles',
});


User.hasOne(UserProfile, {
  foreignKey: 'userId',
  onDelete: 'CASCADE',
});

UserProfile.belongsTo(User, {
  foreignKey: 'userId',
});
