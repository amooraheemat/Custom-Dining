'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if the table exists
    const [tables] = await queryInterface.sequelize.query(
      `SHOW TABLES LIKE 'user_profiles'`
    );
    
    if (tables.length === 0) {
      console.log('user_profiles table does not exist, creating it...');
      await queryInterface.createTable('user_profiles', {
        id: {
          type: Sequelize.CHAR(36),
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true,
          allowNull: false
        },
        userId: {
          type: Sequelize.CHAR(36),
          allowNull: false,
          references: {
            model: 'Users',
            key: 'id'
          },
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE'
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
        },
        deletedAt: {
          type: Sequelize.DATE,
          allowNull: true
        }
      });


      // Add index on userId
      await queryInterface.addIndex('user_profiles', ['userId'], {
        name: 'user_profiles_userId_idx',
        unique: true
      });
      
      return;
    }

    // If table exists, check if we need to modify it
    const [columns] = await queryInterface.sequelize.query(
      `SHOW COLUMNS FROM user_profiles LIKE 'id'`
    );

    const idColumn = columns[0];
    
    // If the id column is already CHAR(36), we're done
    if (idColumn.Type === 'char(36)') {
      console.log('user_profiles table already has the correct id type');
      return;
    }

    console.log('Modifying user_profiles table to use UUID for id...');
    
    // Create a temporary table with the new schema
    await queryInterface.sequelize.query(`
      CREATE TABLE user_profiles_new (
        id CHAR(36) NOT NULL DEFAULT (UUID()),
        userId CHAR(36) NOT NULL,
        healthGoal VARCHAR(255) NULL,
        dietaryRestrictions JSON NULL,
        preferredMealTags JSON NULL,
        createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deletedAt DATETIME NULL,
        PRIMARY KEY (id)
      ) ENGINE=InnoDB;
    `);

    // Copy data from old table to new table
    await queryInterface.sequelize.query(`
      INSERT INTO user_profiles_new 
      (id, userId, healthGoal, dietaryRestrictions, preferredMealTags, createdAt, updatedAt, deletedAt)
      SELECT 
        UUID() as id,
        userId,
        healthGoal,
        dietaryRestrictions,
        preferredMealTags,
        createdAt,
        updatedAt,
        deletedAt
      FROM user_profiles;
    `);

    // Drop the old table
    await queryInterface.dropTable('user_profiles');

    // Rename the new table to the original name
    await queryInterface.sequelize.query('RENAME TABLE user_profiles_new TO user_profiles;');

    // Add the unique index on userId
    await queryInterface.addIndex('user_profiles', ['userId'], {
      name: 'user_profiles_userId_idx',
      unique: true
    });

    // Add the foreign key constraint
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
