import { sequelize } from './src/config/database.js';
import { Sequelize } from 'sequelize';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runMigration() {
  try {
    // Read the migration file
    const migrationPath = 'file://' + join(__dirname, 'src', 'migrations', '20240611210000-add-unique-email-constraint.js');
    const migration = (await import(migrationPath)).default;
    
    // Run the migration
    console.log('Running migration...');
    await migration.up(sequelize.getQueryInterface(), Sequelize);
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error running migration:', error);
    process.exit(1);
  }
}

runMigration();
