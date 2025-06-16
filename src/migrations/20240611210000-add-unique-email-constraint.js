export default {
  up: async (queryInterface, Sequelize) => {
    // First, clean up any potential duplicates (keeping the first one)
    const [results] = await queryInterface.sequelize.query(`
      WITH duplicates AS (
        SELECT id, 
               contactEmail,
               ROW_NUMBER() OVER (PARTITION BY LOWER(contactEmail) ORDER BY id) as rn
        FROM Restaurants
        WHERE contactEmail IS NOT NULL
      )
      SELECT * FROM duplicates WHERE rn > 1
    `);

    const duplicateIds = results.map(r => r.id);
    
    if (duplicateIds.length > 0) {
      console.log(`Found ${duplicateIds.length} duplicate restaurant emails. Removing duplicates...`);
      await queryInterface.bulkDelete('Restaurants', { id: duplicateIds });
    }

    // Add a generated column for lowercase email
    await queryInterface.sequelize.query(`
      ALTER TABLE Restaurants
      ADD COLUMN contact_email_lower VARCHAR(255) GENERATED ALWAYS AS (LOWER(contactEmail)) STORED
    `);

    // Add a unique constraint on the generated column
    await queryInterface.addConstraint('Restaurants', {
      fields: ['contact_email_lower'],
      type: 'unique',
      name: 'restaurants_contactemail_lower_unique'
    });
  },

  down: async (queryInterface, Sequelize) => {
    // Remove the unique constraint and the generated column
    await queryInterface.removeConstraint('Restaurants', 'restaurants_contactemail_lower_unique');
    await queryInterface.removeColumn('Restaurants', 'contact_email_lower');
  }
};
