/** @type {import('sequelize-cli').Migration} */
export const up = async (queryInterface, Sequelize) => {
  await queryInterface.addColumn('Users', 'isTemporaryPassword', {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: false
  });

  await queryInterface.addColumn('Users', 'temporaryPasswordExpires', {
    type: Sequelize.DATE,
    allowNull: true
  });

  // Add index for better performance on temporary password check
  await queryInterface.addIndex('Users', ['isTemporaryPassword', 'temporaryPasswordExpires']);
};

export const down = async (queryInterface, Sequelize) => {
  await queryInterface.removeIndex('Users', ['isTemporaryPassword', 'temporaryPasswordExpires']);
  await queryInterface.removeColumn('Users', 'temporaryPasswordExpires');
  await queryInterface.removeColumn('Users', 'isTemporaryPassword');
};
