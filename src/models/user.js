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
        validate: {
            notNull: {
                msg: 'Username is required'
            },
            notEmpty: {
                msg: 'Username cannot be empty'
            }
        }
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isEmail: {
                msg: 'Please provide a valid email address'
            },
            notNull: {
                msg: 'Email is required'
            },
            notEmpty: {
                msg: 'Email cannot be empty'
            }
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
            },
            len: {
                args: [8, 100],
                msg: 'Password must be between 8 and 100 characters'
            }
        }
    },
    role: {
        type: DataTypes.ENUM('user', 'restaurant', 'admin'),
        defaultValue: 'user',
        allowNull: false
    },
    isEmailVerified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    verificationToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    passwordResetToken: {
        type: DataTypes.STRING,
        allowNull: true
    },
    passwordResetExpires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    isTemporaryPassword: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    temporaryPasswordExpires: {
        type: DataTypes.DATE,
        allowNull: true
    },
    forcePasswordChange: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
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
      // Only hash the password if it's being modified
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    // Add a beforeSave hook to handle direct updates
    beforeSave: async (user) => {
      if (user._previousDataValues && 
          user._previousDataValues.password !== user.password &&
          user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
  });

  // Instance methods
  User.prototype.comparePassword = async function(candidatePassword) {
    try {
      console.log('Comparing passwords:', {
        userId: this.id,
        candidatePassword: candidatePassword ? 'provided' : 'missing',
        storedPassword: this.password ? 'exists' : 'missing',
        storedPasswordStartsWith: this.password ? this.password.substring(0, 10) + '...' : 'n/a'
      });
      
      if (!candidatePassword || !this.password) {
        console.log('Missing password for comparison');
        return false;
      }
      
      const isMatch = await bcrypt.compare(candidatePassword, this.password);
      console.log('Password comparison result:', isMatch);
      return isMatch;
    } catch (error) {
      console.error('Error comparing passwords:', error);
      return false;
    }
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

  // Add indexes after model definition
  User.afterSync('addIndexes', async () => {
    try {
      // Check if indexes exist before creating them
      const [results] = await sequelize.query("SHOW INDEX FROM Users WHERE Key_name IN ('users_username_unique', 'users_email_unique')");
      const existingIndexes = results.map(row => row.Key_name);
      
      // Add username index if it doesn't exist
      if (!existingIndexes.includes('users_username_unique')) {
        await sequelize.queryInterface.addIndex('Users', ['username'], {
          name: 'users_username_unique',
          unique: true
        });
        console.log('Created username index');
      }
      
      // Add email index if it doesn't exist
      if (!existingIndexes.includes('users_email_unique')) {
        await sequelize.queryInterface.addIndex('Users', ['email'], {
          name: 'users_email_unique',
          unique: true
        });
        console.log('Created email index');
      }
    } catch (error) {
      console.error('Error adding indexes:', error);
    }
  });

  return User;
}
