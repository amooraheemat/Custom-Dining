'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, drop the foreign key constraint if it exists
    const [constraints] = await queryInterface.sequelize.query(
      `SELECT CONSTRAINT_NAME 
       FROM information_schema.TABLE_CONSTRAINTS 
       WHERE TABLE_NAME = 'user_profiles' 
       AND CONSTRAINT_TYPE = 'FOREIGN_KEY' 
       AND CONSTRAINT_SCHEMA = '${process.env.DB_NAME || 'custom_dining_db'}'`
    );

    if (constraints.length > 0) {
      await queryInterface.removeConstraint(
        'user_profiles',
        constraints[0].CONSTRAINT_NAME
      );
    }

    // Drop the existing index if it exists
    const [indexes] = await queryInterface.sequelize.query(
      `SHOW INDEX FROM user_profiles WHERE Key_name = 'user_profiles_userId_idx'`
    );
    
    if (indexes.length > 0) {
      await queryInterface.removeIndex('user_profiles', 'user_profiles_userId_idx');
    }

    // Drop the existing table
    await queryInterface.dropTable('user_profiles');

    // Recreate the table with the correct schema
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

    // Add foreign key constraint
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
    // This is a destructive migration, so we can't easily roll it back
    console.warn('Warning: This migration cannot be automatically rolled back');
  }
};
