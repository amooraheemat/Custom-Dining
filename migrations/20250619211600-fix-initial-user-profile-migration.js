'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First check the structure of the Users table
    const [results] = await queryInterface.sequelize.query(
      "SHOW CREATE TABLE Users"
    );
    console.log('Users table structure:', results[0]['Create Table']);

    // Drop existing user_profiles table if it exists
    const [tableExists] = await queryInterface.sequelize.query(
      "SHOW TABLES LIKE 'user_profiles'"
    );
    
    if (tableExists.length > 0) {
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
        type: Sequelize.UUID, // Must match Users.id type
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