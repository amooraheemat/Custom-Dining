import { sequelize } from '../src/config/database.js';

async function checkMealTable() {
  try {
    // Get query interface
    const queryInterface = sequelize.getQueryInterface();
    
    // Describe the meals table
    const tableDescription = await queryInterface.describeTable('meals');
    console.log('Meals table structure:', JSON.stringify(tableDescription, null, 2));
    
    // Get the current database name
    const [results] = await sequelize.query('SELECT DATABASE() as db;');
    console.log('Current database:', results[0].db);
    
    process.exit(0);
  } catch (error) {
    console.error('Error checking meals table:', error);
    process.exit(1);
  }
}

checkMealTable();
