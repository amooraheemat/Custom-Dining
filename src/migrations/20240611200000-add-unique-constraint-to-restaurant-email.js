export default {
  up: async (queryInterface, Sequelize) => {
    // First, handle any potential duplicate emails (keep the first one, remove duplicates)
    // First, check if there are any duplicate emails
    // Check if the contactEmail column exists
    const tableInfo = await queryInterface.describeTable('Restaurants');
    
    if (tableInfo.contactEmail) {
      const [results] = await queryInterface.sequelize.query(`
        SELECT contactEmail, COUNT(*) as count, GROUP_CONCAT(id) as ids
        FROM Restaurants
        WHERE contactEmail IS NOT NULL
        GROUP BY LOWER(TRIM(contactEmail))
        HAVING count > 1
      `);
      
      // For each duplicate email, keep the first one and delete the rest
      for (const row of results) {
        const ids = row.ids.split(',').map(id => id.trim());
        // Keep the first ID
        const idsToDelete = ids.slice(1);
        
        if (idsToDelete.length > 0) {
          console.log(`Found duplicate email ${row.contactEmail}, keeping ID ${ids[0]}, deleting IDs: ${idsToDelete.join(', ')}`);
          await queryInterface.bulkDelete('Restaurants', { id: idsToDelete });
        }
      }

      if (results.length > 0) {
        console.log(`Found and resolved ${results.length} duplicate restaurant emails.`);
      }
    } else {
      console.log('contactEmail column does not exist in Restaurants table, skipping duplicate check.');
    }

    // Check if the unique constraint already exists
    const [constraints] = await queryInterface.sequelize.query(
      `SELECT CONSTRAINT_NAME 
       FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
       WHERE TABLE_NAME = 'Restaurants' 
       AND CONSTRAINT_NAME = 'restaurants_contactemail_unique'`
    );

    // Add unique constraint if it doesn't exist
    if (constraints.length === 0) {
      await queryInterface.addConstraint('Restaurants', {
        fields: ['contactEmail'],
        type: 'unique',
        name: 'restaurants_contactemail_unique'
      });
    }
    
    // Add a case-insensitive index for better performance
    // MySQL/MariaDB doesn't support function-based indexes directly, so we'll use a generated column
    await queryInterface.sequelize.query(`
      ALTER TABLE Restaurants
      ADD COLUMN contactEmailLower VARCHAR(255) GENERATED ALWAYS AS (LOWER(contactEmail)) STORED,
      ADD UNIQUE INDEX restaurants_contactemail_lower_idx (contactEmailLower);
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Check if the constraint exists before trying to remove it
    const tableInfo = await queryInterface.describeTable('Restaurants');
    
    if (tableInfo.contactEmail) {
      await queryInterface.removeConstraint('Restaurants', 'restaurants_contactemail_unique');
    }
    
    // Remove the generated column and its index if they exist
    if (tableInfo.contactEmailLower) {
      await queryInterface.sequelize.query(`
        ALTER TABLE Restaurants
        DROP INDEX IF EXISTS restaurants_contactemail_lower_idx,
        DROP COLUMN IF EXISTS contactEmailLower;
      `);
    }
  }
};
