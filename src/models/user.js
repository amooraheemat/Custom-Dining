import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';

// Export a function that receives the sequelize instance and returns the model
export default function(sequelize) {
  const User = sequelize.define('User', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
    },
    username: {
  type: DataTypes.STRING,
  allowNull: false,
  unique: true,
  validate: {
    notNull: {
      msg: 'Username is required'
    },
    notEmpty: {
      msg: 'Username cannot be empty'
    },
    len: {
      args: [8, 30],
      msg: 'Username must be between 8 and 30 characters'
    }
  }
},
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: {
                msg: 'Please provide a valid email address'
            },
            notNull: {
                msg: 'Email is required'
            },
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            notNull: {
                msg: 'Password is required'
            },
            notEmpty: {
                msg: 'Password cannot be empty'
            }
        }
    },
    role: {
        type: DataTypes.ENUM('user', 'admin', 'restaurant'),
        defaultValue: 'user',
        allowNull: false
    },
    avatar: {
        type: DataTypes.STRING,
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    },
    resetPasswordToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    resetPasswordExpires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    lastLogin: {
        type: DataTypes.DATE,
        allowNull: true
    },
    isEmailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    emailVerificationToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    emailVerificationExpires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: false // User is inactive until email is verified
    }
}, {
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
    }
  });

  // Instance methods
  User.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  // ensure that when data is pulled, certain sensitive data are not sent back
  User.prototype.toJSON = function() {
    const values = Object.assign({}, this.get());
    delete values.password;
    delete values.resetPasswordToken;
    delete values.resetPasswordExpires;
    return values;
  };

  // Add any model associations here
  User.associate = function(models) {
    User.hasMany(models.Restaurant, {
      foreignKey: 'userId',
      as: 'restaurants'
    });
    
    User.hasMany(models.Restaurant, {
      foreignKey: 'approvedBy',
      as: 'approvedRestaurants'
    });
  };

  return User;
}
