export default {
  up: async (queryInterface, Sequelize) => {
    // Remove priceRange column if it exists
    const tableInfo = await queryInterface.describeTable('Restaurants');
    
    if (tableInfo.priceRange) {
      await queryInterface.removeColumn('Restaurants', 'priceRange');
    }
    
    // Remove isKosher column if it exists
    if (tableInfo.isKosher) {
      await queryInterface.removeColumn('Restaurants', 'isKosher');
    }
    
    // Add contactEmail column if it doesn't exist
    if (!tableInfo.contactEmail) {
      await queryInterface.addColumn('Restaurants', 'contactEmail', {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
          isEmail: true,
          notEmpty: true
        }
      });
    }
  },

  down: async (queryInterface, Sequelize) => {
    // Add back priceRange column
    await queryInterface.addColumn('Restaurants', 'priceRange', {
      type: Sequelize.ENUM('$', '$$', '$$$', '$$$$'),
      allowNull: true
    });
    
    // Add back isKosher column
    await queryInterface.addColumn('Restaurants', 'isKosher', {
      type: Sequelize.BOOLEAN,
      defaultValue: false
    });
    
    // Remove contactEmail column
    await queryInterface.removeColumn('Restaurants', 'contactEmail');
  }
};
