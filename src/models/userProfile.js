import { DataTypes } from 'sequelize';

export default function(sequelize) {
  const UserProfile = sequelize.define('UserProfile', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
      allowNull: false,
      autoIncrement: false  // Ensure autoIncrement is false for UUID
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
      unique: true,
      references: {
        model: 'Users',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
      comment: 'References the Users table'
    },
    healthGoal: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 255]
      }
    },
    dietaryRestrictions: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      validate: {
        isValidDietaryRestrictions(value) {
          if (value && !Array.isArray(value)) {
            throw new Error('dietaryRestrictions must be an array');
          }
        }
      }
    },
    preferredMealTags: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: [],
      validate: {
        isValidMealTags(value) {
          if (value && !Array.isArray(value)) {
            throw new Error('preferredMealTags must be an array');
          }
        }
      }
    },
  }, {
    timestamps: true,
    tableName: 'user_profiles',
    paranoid: true, // Enable soft deletes
    indexes: [
      {
        unique: true,
        fields: ['userId']
      }
    ]
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

  // Add instance methods if needed
  UserProfile.prototype.getProfileSummary = function() {
    return {
      healthGoal: this.healthGoal,
      dietaryRestrictions: this.dietaryRestrictions || [],
      preferredMealTags: this.preferredMealTags || []
    };
  };

  return UserProfile;
}