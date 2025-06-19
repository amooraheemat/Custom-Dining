'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, check if the table exists
    const [results] = await queryInterface.sequelize.query(
      "SHOW TABLES LIKE 'user_profiles'"
    );
    
    // If the table exists, drop it so we can recreate it with the correct schema
    if (results.length > 0) {
      await queryInterface.dropTable('user_profiles');
    }
    
    // Create the table with the correct schema
    await queryInterface.createTable('user_profiles', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        unique: true,
        references: {
          model: 'Users', // Note: Case-sensitive, should match your Users table name
          key: 'id',
        },
        onDelete: 'CASCADE',
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
    
    // Add index on userId for better query performance
    await queryInterface.addIndex('user_profiles', ['userId']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('user_profiles');
  }
};
