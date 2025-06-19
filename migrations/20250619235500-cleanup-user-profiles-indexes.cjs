'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    console.log('Cleaning up duplicate indexes on user_profiles table...');
    
    // Drop the duplicate indexes
    try {
      await queryInterface.removeIndex('user_profiles', 'userId');
      console.log('Dropped index: userId');
    } catch (err) {
      console.log('Index userId does not exist or could not be dropped');
    }

    try {
      await queryInterface.removeIndex('user_profiles', 'user_profiles_user_id');
      console.log('Dropped index: user_profiles_user_id');
    } catch (err) {
      console.log('Index user_profiles_user_id does not exist or could not be dropped');
    }

    // Keep only the user_profiles_userId_idx index
    try {
      const [indexes] = await queryInterface.sequelize.query(
        "SHOW INDEX FROM user_profiles WHERE Key_name = 'user_profiles_userId_idx'"
      );
      
      if (indexes.length === 0) {
        await queryInterface.addIndex('user_profiles', ['userId'], {
          name: 'user_profiles_userId_idx',
          unique: true
        });
        console.log('Added index: user_profiles_userId_idx');
      } else {
        console.log('Index user_profiles_userId_idx already exists');
      }
    } catch (err) {
      console.error('Error managing user_profiles_userId_idx index:', err);
    }
    
    console.log('Index cleanup complete');
  },

  down: async (queryInterface, Sequelize) => {
    // This migration is not reversible as we can't know which indexes existed before
    console.warn('Warning: This migration cannot be automatically rolled back');
  }
};
