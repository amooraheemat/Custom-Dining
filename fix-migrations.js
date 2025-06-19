import { sequelize } from './src/config/database.js';

async function fixMigrations() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Check current migration state
    const [migrations] = await sequelize.query(
      'SELECT * FROM SequelizeMeta ORDER BY name DESC'
    );
    
    console.log('\nApplied migrations:');
    console.table(migrations);

    // Check if our target migration is already applied
    const targetMigration = '20250618210000-create-user-profile.cjs';
    const isApplied = migrations.some(m => m.name === targetMigration);
    
    if (isApplied) {
      console.log(`\nMigration ${targetMigration} is already applied.`);
      
      // Mark the migration as not applied
      console.log('Marking migration as not applied...');
      await sequelize.query(
        `DELETE FROM SequelizeMeta WHERE name = '${targetMigration}'`
      );
      console.log('Migration marked as not applied.');
    } else {
      console.log(`\nMigration ${targetMigration} is not applied.`);
    }

    // Check the current state of the user_profiles table
    try {
      const [userProfiles] = await sequelize.query('SHOW CREATE TABLE user_profiles');
      console.log('\nCurrent user_profiles table structure:');
      console.log(userProfiles[0]['Create Table']);
    } catch (err) {
      console.log('\nCould not get user_profiles table structure:', err.message);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

fixMigrations();
