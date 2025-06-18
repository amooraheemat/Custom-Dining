import { DataTypes } from 'sequelize';

export default function(sequelize) {
  const Meal = sequelize.define('Meal', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Meal name is required'
        },
        notEmpty: {
          msg: 'Meal name cannot be empty'
        }
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
      validate: {
        notNull: {
          msg: 'Description is required'
        },
        notEmpty: {
          msg: 'Description cannot be empty'
        }
      }
    },
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: {
          msg: 'Price must be a valid decimal number'
        },
        min: {
          args: [0],
          msg: 'Price must be a positive number'
        }
      }
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        isUrl: {
          msg: 'Image URL must be a valid URL'
        }
      }
    },
    dietaryTags: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    nutritionalInfo: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: {}
    },
    allergens: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    isAvailable: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    restaurantId: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'Restaurants', // This references the table name, not the model name
        key: 'id'
      },
      onDelete: 'CASCADE'
    }
  }, {
    tableName: 'meals',
    timestamps: true,
    underscored: true
  });

  // Add associations
  Meal.associate = function(models) {
    // A meal belongs to a restaurant
    Meal.belongsTo(models.Restaurant, {
      foreignKey: 'restaurantId',
      as: 'restaurant',
      onDelete: 'CASCADE'
    });
  };

  return Meal;
}