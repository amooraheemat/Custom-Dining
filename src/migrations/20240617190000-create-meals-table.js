export default {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('meals', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      price: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false
      },
      imageUrl: {
        type: Sequelize.STRING,
        allowNull: true
      },
      dietaryTags: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
      },
      nutritionalInfo: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: {}
      },
      allergens: {
        type: Sequelize.JSON,
        allowNull: true,
        defaultValue: []
      },
      isAvailable: {
        type: Sequelize.BOOLEAN,
        defaultValue: true
      },
      restaurantId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'Restaurants',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP')
      }
    });

    // Create indexes using snake_case column names to match the database
    await queryInterface.sequelize.query(
      'CREATE INDEX `meals_restaurant_id` ON `meals` (`restaurant_id`)'
    );
    
    await queryInterface.sequelize.query(
      'CREATE INDEX `meals_is_available` ON `meals` (`is_available`)'
    );
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('meals');
  }
};

// This migration creates a 'meals' table with all necessary fields and sets up the foreign key relationship with the 'Restaurants' table.
