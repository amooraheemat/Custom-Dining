import { sequelize } from './src/config/database.js';

async function fixMigrationState() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Check if the problematic migration is in SequelizeMeta
    const [migration] = await sequelize.query(
      "SELECT * FROM SequelizeMeta WHERE name = '20250618210000-create-user-profile.cjs'"
    );

    if (migration.length > 0) {
      console.log('Removing problematic migration from SequelizeMeta...');
      await sequelize.query(
        "DELETE FROM SequelizeMeta WHERE name = '20250618210000-create-user-profile.cjs'"
      );
      console.log('Migration removed from SequelizeMeta.');
    } else {
      console.log('Migration not found in SequelizeMeta.');
    }

    // Check if the new migration is already applied
    const [newMigration] = await sequelize.query(
      "SELECT * FROM SequelizeMeta WHERE name = '20250620001000-fix-user-profiles-final.cjs'"
    );

    if (newMigration.length === 0) {
      console.log('Adding new migration to SequelizeMeta...');
      await sequelize.query(
        "INSERT INTO SequelizeMeta (name) VALUES ('20250620001000-fix-user-profiles-final.cjs')"
      );
      console.log('New migration added to SequelizeMeta.');
    }

    console.log('Migration state fixed successfully.');
  } catch (error) {
    console.error('Error fixing migration state:', error);
  } finally {
    await sequelize.close();
  }
}

fixMigrationState();
