'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, drop the foreign key constraint
    await queryInterface.sequelize.query(
      'ALTER TABLE `user_profiles` DROP FOREIGN KEY `user_profiles_ibfk_1`;'
    );

    // Then drop the index on userId
    await queryInterface.removeIndex('user_profiles', ['userId']);

    // Change the column type to match Users.id (UUID)
    await queryInterface.changeColumn('user_profiles', 'userId', {
      type: Sequelize.UUID,
      allowNull: false,
      references: {
        model: 'Users',
        key: 'id',
      },
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // In case of rollback, we'll need to convert back to INTEGER
    // But this might be tricky if there's data that can't be converted
    // For safety, we'll just throw an error for manual intervention
    throw new Error('Manual rollback required - cannot automatically convert UUID back to INTEGER');
  }
};
