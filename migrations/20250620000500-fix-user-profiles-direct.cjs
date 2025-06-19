'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('Starting direct fix for user_profiles table...');
    
    // Use raw SQL to handle the table modification
    const sequelize = queryInterface.sequelize;
    
    // Start a transaction
    const transaction = await sequelize.transaction();
    
    try {
      // 1. Drop existing indexes except PRIMARY
      console.log('Dropping duplicate indexes...');
      await sequelize.query(
        `ALTER TABLE user_profiles 
         DROP INDEX IF EXISTS userId,
         DROP INDEX IF EXISTS user_profiles_user_id,
         DROP INDEX IF EXISTS user_profiles_userId_idx`,
        { transaction }
      );
      
      // 2. Modify the id column to CHAR(36)
      console.log('Modifying id column to CHAR(36)...');
      await sequelize.query(
        `ALTER TABLE user_profiles 
         MODIFY COLUMN id CHAR(36) NOT NULL DEFAULT (UUID())`,
        { transaction }
      );
      
      // 3. Add back the unique index on userId
      console.log('Adding back unique index on userId...');
      await sequelize.query(
        `ALTER TABLE user_profiles 
         ADD UNIQUE INDEX user_profiles_userId_idx (userId)`,
        { transaction }
      );
      
      // 4. Add foreign key constraint if it doesn't exist
      console.log('Adding foreign key constraint...');
      try {
        await sequelize.query(
          `ALTER TABLE user_profiles 
           ADD CONSTRAINT user_profiles_userId_fk 
           FOREIGN KEY (userId) REFERENCES Users(id) 
           ON DELETE CASCADE ON UPDATE CASCADE`,
          { transaction }
        );
      } catch (err) {
        console.log('Foreign key constraint already exists or could not be added:', err.message);
      }
      
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
