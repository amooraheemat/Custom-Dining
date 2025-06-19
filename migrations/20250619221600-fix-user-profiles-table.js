'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, drop the existing foreign key constraint if it exists
    const [results] = await queryInterface.sequelize.query(
      "SELECT CONSTRAINT_NAME FROM information_schema.table_constraints " +
      "WHERE table_name = 'user_profiles' AND constraint_type = 'FOREIGN KEY'"
    );
    
    if (results.length > 0) {
      await queryInterface.sequelize.query(
        `ALTER TABLE user_profiles DROP FOREIGN KEY ${results[0].CONSTRAINT_NAME}`
      );
    }

    // Drop the existing index on userId if it exists
    const [indexes] = await queryInterface.sequelize.query(
      "SHOW INDEX FROM user_profiles WHERE Key_name = 'user_profiles_userId_idx'"
    );
    
    if (indexes.length > 0) {
      await queryInterface.removeIndex('user_profiles', 'user_profiles_userId_idx');
    }

    // Drop the existing table
    await queryInterface.dropTable('user_profiles');

    // Recreate the table with the correct schema
    await queryInterface.createTable('user_profiles', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      userId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        comment: 'References the Users table'
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

    // Add unique index on userId
    await queryInterface.addIndex('user_profiles', ['userId'], {
      name: 'user_profiles_userId_idx',
      unique: true
    });
  },

  down: async (queryInterface, Sequelize) => {
    // This is a destructive migration, so the down migration will just drop the table
    await queryInterface.dropTable('user_profiles');
  }
};
