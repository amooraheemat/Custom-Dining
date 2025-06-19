'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('Starting final fix for user_profiles table...');
    
    // Use raw SQL to handle the table modification
    const sequelize = queryInterface.sequelize;
    
    // Start a transaction
    const transaction = await sequelize.transaction();
    
    try {
      // 1. First, drop the foreign key constraint
      console.log('Dropping foreign key constraint...');
      try {
        await sequelize.query(
          'ALTER TABLE user_profiles DROP FOREIGN KEY user_profiles_userId_fk',
          { transaction }
        );
      } catch (err) {
        console.log('Could not drop foreign key constraint (may not exist):', err.message);
      }
      
      // 2. Drop all indexes on userId except one
      console.log('Dropping duplicate indexes...');
      try {
        await sequelize.query(
          'ALTER TABLE user_profiles DROP INDEX userId',
          { transaction }
        );
      } catch (err) {
        console.log('Could not drop index userId (may not exist):', err.message);
      }
      
      try {
        await sequelize.query(
          'ALTER TABLE user_profiles DROP INDEX user_profiles_user_id',
          { transaction }
        );
      } catch (err) {
        console.log('Could not drop index user_profiles_user_id (may not exist):', err.message);
      }
      
      try {
        await sequelize.query(
          'ALTER TABLE user_profiles DROP INDEX user_profiles_userId_idx',
          { transaction }
        );
      } catch (err) {
        console.log('Could not drop index user_profiles_userId_idx (may not exist):', err.message);
      }
      
      // 3. Create a new table with the correct structure
      console.log('Creating new user_profiles table...');
      await sequelize.query(
        `CREATE TABLE user_profiles_new (
          id CHAR(36) NOT NULL DEFAULT (UUID()),
          userId CHAR(36) NOT NULL,
          healthGoal VARCHAR(255) NULL,
          dietaryRestrictions JSON NULL,
          preferredMealTags JSON NULL,
          createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          deletedAt DATETIME NULL,
          PRIMARY KEY (id)
        ) ENGINE=InnoDB`,
        { transaction }
      );
      
      // 4. Copy data from old table to new table
      console.log('Copying data to new table...');
      await sequelize.query(
        `INSERT INTO user_profiles_new 
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
         FROM user_profiles`,
        { transaction }
      );
      
      // 5. Drop the old table
      console.log('Dropping old table...');
      await sequelize.query(
        'DROP TABLE IF EXISTS user_profiles',
        { transaction }
      );
      
      // 6. Rename the new table
      console.log('Renaming new table...');
      await sequelize.query(
        'RENAME TABLE user_profiles_new TO user_profiles',
        { transaction }
      );
      
      // 7. Add the unique index on userId
      console.log('Adding unique index on userId...');
      await sequelize.query(
        'CREATE UNIQUE INDEX user_profiles_userId_idx ON user_profiles (userId)',
        { transaction }
      );
      
      // 8. Add the foreign key constraint
      console.log('Adding foreign key constraint...');
      await sequelize.query(
        `ALTER TABLE user_profiles 
         ADD CONSTRAINT user_profiles_userId_fk 
         FOREIGN KEY (userId) REFERENCES Users(id) 
         ON DELETE CASCADE ON UPDATE CASCADE`,
        { transaction }
      );
      
      // Commit the transaction
      await transaction.commit();
      console.log('Successfully fixed user_profiles table');
      
    } catch (error) {
      // If anything goes wrong, roll back the transaction
      await transaction.rollback();
      console.error('Error fixing user_profiles table:', error);
      throw error;
    }
  },

  down: async (queryInterface, Sequelize) => {
    console.warn('Warning: This migration cannot be automatically rolled back');
  }
};
