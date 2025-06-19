import { DataTypes } from 'sequelize';

export default function(sequelize) {
  const User = sequelize.models.User;
  
  const UserProfile = sequelize.define('UserProfile', {
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
        model: 'Users',
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

  // Define associations
  if (User) {
    UserProfile.belongsTo(User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE'
    });

    User.hasOne(UserProfile, {
      foreignKey: 'userId',
      as: 'profile',
      onDelete: 'CASCADE'
    });
  }

  return UserProfile;
}
