'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Remove unique index on username if it exists
    await queryInterface.removeIndex('Users', 'username');

    // Remove unique index on email if it exists
    await queryInterface.removeIndex('Users', 'email');
  },

  async down(queryInterface, Sequelize) {
    // Re-add the indexes if necessary
    await queryInterface.addIndex('Users', ['username'], {
      unique: true,
      name: 'username'
    });

    await queryInterface.addIndex('Users', ['email'], {
      unique: true,
      name: 'email'
    });
  }
};