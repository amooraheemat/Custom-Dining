'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First ensure the Users table exists with UUID id
    await queryInterface.sequelize.query(`
      CREATE TABLE IF NOT EXISTS Users (
        id CHAR(36) PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('user', 'restaurant', 'admin') NOT NULL DEFAULT 'user',
        isEmailVerified BOOLEAN DEFAULT false,
        verificationToken VARCHAR(255),
        passwordResetToken VARCHAR(255),
        passwordResetExpires DATETIME,
        isTemporaryPassword BOOLEAN DEFAULT false,
        temporaryPasswordExpires DATETIME,
        forcePasswordChange BOOLEAN DEFAULT false,
        isActive BOOLEAN DEFAULT true,
        createdAt DATETIME NOT NULL,
        updatedAt DATETIME NOT NULL,
        UNIQUE KEY users_username_unique (username),
        UNIQUE KEY users_email_unique (email)
      ) ENGINE=InnoDB;
    `);

    // Now create user_profiles with matching UUID type
    await queryInterface.createTable('user_profiles', {
      id: {
        type: Sequelize.UUID,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE'
      },
      healthGoal: {
        type: Sequelize.STRING,
        allowNull: true,
      },
      dietaryRestrictions: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
      },
      preferredMealTags: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: [],
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addIndex('user_profiles', ['userId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_profiles');
  }
};