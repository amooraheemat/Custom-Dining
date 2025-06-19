import { DataTypes } from 'sequelize';

export default function(sequelize) {
  const UserProfile = sequelize.define('UserProfile', {
    id: {
      type: DataTypes.UUID,
      autoIncrement: true,
      primaryKey: true,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: {
          tableName: 'Users', // Explicit table name
          schema: 'public' // If using schema
        },
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
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
    tableName: 'user_profiles'
  });

  // Associations
  UserProfile.associate = function(models) {
    UserProfile.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  };

  return UserProfile;
}