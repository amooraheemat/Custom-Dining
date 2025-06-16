'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // First, handle any potential duplicate emails (keep the first one, remove duplicates)
    const [results] = await queryInterface.sequelize.query(`
      WITH duplicates AS (
        SELECT id, 
               contact_email,
               ROW_NUMBER() OVER (PARTITION BY LOWER(TRIM(contact_email)) ORDER BY id) as rn
        FROM "Restaurants"
        WHERE contact_email IS NOT NULL
      )
      SELECT id FROM duplicates WHERE rn > 1
    `);

    const duplicateIds = results.map(r => r.id);
    
    if (duplicateIds.length > 0) {
      console.log(`Found ${duplicateIds.length} duplicate restaurant emails. Removing duplicates...`);
      await queryInterface.bulkDelete('Restaurants', { id: duplicateIds });
    }

    // Add unique constraint
    await queryInterface.addConstraint('Restaurants', {
      fields: ['contactEmail'],
      type: 'unique',
      name: 'restaurants_contactemail_unique'
    });
    
    // Add a case-insensitive index for better performance
    await queryInterface.sequelize.query(
      'CREATE UNIQUE INDEX restaurants_contactemail_lower_idx ON "Restaurants" (LOWER("contactEmail"))'
    );
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the case-insensitive index first
    await queryInterface.sequelize.query(
      'DROP INDEX IF EXISTS restaurants_contactemail_lower_idx'
    );
    
    // Then remove the unique constraint
    await queryInterface.removeConstraint('Restaurants', 'restaurants_contactemail_unique');
  }
};
