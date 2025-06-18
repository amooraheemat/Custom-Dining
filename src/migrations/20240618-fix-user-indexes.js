import { QueryTypes } from 'sequelize';

export default {
  up: async (queryInterface, Sequelize) => {
    const transaction = await queryInterface.sequelize.transaction();
    
    try {
      // Get all indexes on Users table
      const [results] = await queryInterface.sequelize.query(
        `SHOW INDEX FROM \`Users\` WHERE \`Key_name\` != 'PRIMARY'`,
        { transaction }
      );

      // Find duplicate indexes (same column, different names)
      const indexGroups = results.reduce((acc, index) => {
        const key = index.Column_name;
        if (!acc[key]) {
          acc[key] = [];
        }
        acc[key].push(index);
        return acc;
      }, {});

      // Drop duplicate indexes, keeping the first one
      for (const [column, indexes] of Object.entries(indexGroups)) {
        if (indexes.length > 1) {
          console.log(`Found duplicate indexes for column ${column}:`, indexes.map(i => i.Key_name).join(', '));
          
          // Keep the first index, drop the rest
          for (let i = 1; i < indexes.length; i++) {
            console.log(`Dropping index ${indexes[i].Key_name} on column ${column}`);
            await queryInterface.removeIndex('Users', indexes[i].Key_name, { transaction });
          }
        }
      }

      await transaction.commit();
      console.log('Successfully cleaned up duplicate indexes on Users table');
    } catch (error) {
      await transaction.rollback();
      console.error('Error cleaning up indexes:', error);
      throw error;
    }
  },

  down: async () => {
    // No need to revert this migration
    console.log('No action needed to revert index cleanup');
  }
};
