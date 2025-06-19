'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, create the table without the foreign key constraint
    await queryInterface.createTable('user_profiles', {
      id: {
        type: Sequelize.CHAR(36), // Store UUID as CHAR(36)
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.CHAR(36), // Match the Users table id type
        allowNull: false
      },
      healthGoal: {
        type: Sequelize.STRING,
        allowNull: true
      },
      dietaryRestrictions: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
      },
      preferredMealTags: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Add index on userId
    await queryInterface.addIndex('user_profiles', ['userId'], {
      name: 'user_profiles_userId_idx',
      unique: true
    });

    // Add foreign key constraint after the table is created
    await queryInterface.addConstraint('user_profiles', {
      fields: ['userId'],
      type: 'foreign key',
      name: 'user_profiles_userId_fk',
      references: {
        table: 'Users',
        field: 'id'
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // First remove the foreign key constraint
    await queryInterface.removeConstraint('user_profiles', 'user_profiles_userId_fk');
    // Then drop the table
    await queryInterface.dropTable('user_profiles');
  }
};
