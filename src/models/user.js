import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';

// Export function that receives the sequelize instance and returns the model
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
        console.log('Hashing password during user creation');
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        console.log('Password hashed successfully');
      }
    },
    beforeUpdate: async (user) => {
      // Hashed password
      if (user.changed('password')) {
        console.log('Password changed, hashing new password');
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
        console.log('Password updated successfully');
      }
    }
  }
  });

  // Instance methods
  User.prototype.comparePassword = async function(candidatePassword) {
    try {
      console.log('=== PASSWORD COMPARISON START ===');
      console.log('User ID:', this.id);
      console.log('Candidate password provided:', candidatePassword ? 'yes' : 'no');
      console.log('Stored password exists:', this.password ? 'yes' : 'no');
      
      if (this.password) {
        console.log('Stored password starts with:', this.password.substring(0, 10) + '...');
        console.log('Stored password length:', this.password.length);
      }
      
      if (!candidatePassword) {
        console.error('No password provided for comparison');
        return false;
      }
      
      if (!this.password) {
        console.error('No stored password to compare with');
        return false;
      }
      
      console.log('Starting bcrypt comparison...');
      const isMatch = await bcrypt.compare(candidatePassword, this.password);
      
      console.log('=== PASSWORD COMPARISON RESULT ===');
      console.log('Passwords match:', isMatch);
      
      if (!isMatch) {
        console.log('Password comparison failed. Possible reasons:');
        console.log('1. The provided password is incorrect');
        console.log('2. The stored password hash is corrupted');
        console.log('3. The password was not properly hashed when saved');
      }
      
      return isMatch;
    } catch (error) {
      console.error('=== PASSWORD COMPARISON ERROR ===');
      console.error('Error details:', error);
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

    // Add UserProfile association
    User.hasOne(models.UserProfile, {
      foreignKey: 'userId',
      as: 'profile',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
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
