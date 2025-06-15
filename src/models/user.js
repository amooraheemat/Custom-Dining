import { DataTypes } from 'sequelize';
import bcrypt from 'bcryptjs';
import {sequelize} from '../config/database.js';

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
            },
            len: {
                args: [8, 30],
                msg: 'Password must be between 8 and 30 characters'
            },
            isStrong(value) {
                if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])/.test(value)) {
                    throw new Error('Password must contain uppercase, lowercase, number, and special character');
                }
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
User.prototype.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

// ensure that when data is pulled, certain sensitive data are not sent back
User.prototype.toJSON = function () {
    const values = { ...this.get() };
    delete values.password;
    delete values.resetPasswordToken;
    delete values.resetPasswordExpires;
    return values;
};

export default User;
