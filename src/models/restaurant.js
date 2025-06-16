import { DataTypes } from 'sequelize';

export default function(sequelize) {
  const Restaurant = sequelize.define('Restaurant', {
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
                msg: 'Restaurant name is required'
            },
            notEmpty: {
                msg: 'Restaurant name cannot be empty'
            }
        }
    },
    location: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: {
                msg: 'Location is required'
            },
            notEmpty: {
                msg: 'Location cannot be empty'
            }
        }
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        defaultValue: 'pending',
        allowNull: false
    },
    userId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
            model: 'Users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    approvedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
            model: 'Users',
            key: 'id'
        },
        comment: 'User ID of the admin who approved the restaurant'
    },
    approvedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    approvedByUsername: {
        type: DataTypes.STRING,
        allowNull: true,
        references: {
            model: 'Users',
            key: 'username'
        },
        comment: 'Username of the admin who approved the restaurant'
    },
    rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    // Additional restaurant details
    rating: {
        type: DataTypes.FLOAT,
        defaultValue: 0,
        validate: {
            min: 0,
            max: 5
        }
    },
    image: {
        type: DataTypes.STRING,
        allowNull: true
    },
    openingHours: {
        type: DataTypes.STRING,
        allowNull: true
    },
    contactNumber: {
        type: DataTypes.STRING,
        allowNull: true
    },
    website: {
        type: DataTypes.STRING,
        allowNull: true,
        validate: {
            isUrl: {
                msg: 'Please provide a valid website URL'
            }
        }
    },
    cuisineType: {
        type: DataTypes.STRING,
        allowNull: true
    },
    contactEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: {
                msg: 'Please provide a valid email address'
            },
            notNull: {
                msg: 'Contact email is required'
            },
            notEmpty: {
                msg: 'Contact email cannot be empty'
            }
        },
        set(value) {
            // Convert to lowercase to ensure case-insensitive comparison
            if (value) {
                this.setDataValue('contactEmail', value.toLowerCase().trim());
            }
        }
    },
    capacity: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    hasOutdoorSeating: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    hasParking: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false // Will be set to true when approved by admin
    },
    // Dietary preferences
    isVeganFriendly: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isVegetarianFriendly: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isGlutenFreeFriendly: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isHalal: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    timestamps: true,
    paranoid: true,
    defaultScope: {
        where: {
            status: 'approved',
            isActive: true
        }
    },
    scopes: {
        pending: {
            where: { status: 'pending' }
        },
        approved: {
            where: { 
                status: 'approved',
                isActive: true
            }
        },
        rejected: {
            where: { status: 'rejected' }
        },
        inactive: {
            where: { isActive: false }
        },
        withInactive: {
            where: {}
        }
    }
  });

  // Add associations
  Restaurant.associate = function(models) {
    Restaurant.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'owner',
      onDelete: 'CASCADE'
    });
    
    Restaurant.belongsTo(models.User, {
      foreignKey: 'approvedBy',
      as: 'approvedByAdmin',
      onDelete: 'SET NULL'
    });
  };

  return Restaurant;
}
