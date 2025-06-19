'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, remove the existing foreign key constraint
    await queryInterface.sequelize.query(
      'ALTER TABLE `user_profiles` DROP FOREIGN KEY `user_profiles_ibfk_1`;'
    );
    
    // Change the userId column type to match Users.id (UUID)
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
    // Note: This down migration might be tricky since we can't convert UUID to INTEGER
    // without data loss. You might need to handle this manually if you need to rollback.
    throw new Error('Manual rollback required - cannot automatically convert UUID to INTEGER');
  }
};
