'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, drop the foreign key constraint
    const [constraints] = await queryInterface.sequelize.query(
      `SELECT CONSTRAINT_NAME 
       FROM information_schema.TABLE_CONSTRAINTS 
       WHERE TABLE_NAME = 'user_profiles' 
       AND CONSTRAINT_TYPE = 'FOREIGN_KEY' 
       AND CONSTRAINT_SCHEMA = '${process.env.DB_NAME}'`
    );

    if (constraints.length > 0) {
      await queryInterface.removeConstraint(
        'user_profiles',
        constraints[0].CONSTRAINT_NAME
      );
    }

    // Change the id column to UUID
    await queryInterface.sequelize.query(
      'ALTER TABLE user_profiles MODIFY id CHAR(36) NOT NULL'
    );

    // Change the userId column to UUID if it's not already
    await queryInterface.sequelize.query(
      'ALTER TABLE user_profiles MODIFY userId CHAR(36) NOT NULL'
    );

    // Re-add the foreign key constraint
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
