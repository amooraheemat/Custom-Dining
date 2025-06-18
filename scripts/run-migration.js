import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';
import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import fs from 'fs';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Get migration files
const migrationsPath = path.join(__dirname, '../src/migrations');
const migrationFiles = fs.readdirSync(migrationsPath)
  .filter(file => file.endsWith('.js'))
  .sort(); // Ensure migrations run in order

// Initialize Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASS,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: process.env.DB_DIALECT || 'mysql',
    logging: console.log,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    // Uncomment for production with SSL
    // dialectOptions: {
    //   ssl: {
    //     ca: fs.readFileSync(path.join(__dirname, '../src/config/ca.pem'))
    //   }
    // }
  }
);

// Create migrations table if it doesn't exist
async function ensureMigrationsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS SequelizeMeta (
      name VARCHAR(255) NOT NULL,
      PRIMARY KEY (name),
      UNIQUE KEY name (name)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `;
  
  await sequelize.query(query);
}

// Get list of completed migrations
async function getCompletedMigrations() {
  await ensureMigrationsTable();
  const [results] = await sequelize.query('SELECT name FROM SequelizeMeta');
  return results.map(row => row.name);
}

// Run a single migration
async function runMigration(migrationName) {
  console.log(`Running migration: ${migrationName}`);
  
  // Determine if it's a .cjs or .js file
  const isCJS = migrationName.endsWith('.cjs');
  const migrationPath = `../src/migrations/${migrationName}`;
  
  let migration;
  
  if (isCJS) {
    // Use require for CommonJS modules
    const require = createRequire(import.meta.url);
    migration = require(migrationPath);
  } else {
    // Use import for ES modules
    const migrationModule = await import(migrationPath);
    migration = migrationModule.default || migrationModule;
  }
  
  // Run the migration
  if (migration && typeof migration.up === 'function') {
    await migration.up(sequelize.getQueryInterface(), Sequelize);
  } else if (typeof migration === 'function') {
    // Handle direct function exports (legacy)
    await migration(sequelize.getQueryInterface(), Sequelize);
  } else {
    throw new Error(`Invalid migration format in ${migrationName}`);
  }
  
  // Record the migration
  await sequelize.query('INSERT INTO SequelizeMeta (name) VALUES (?)', {
    replacements: [migrationName]
  });
  
  console.log(`Migration ${migrationName} completed successfully`);
}

// Main function
async function runMigrations() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    const completedMigrations = await getCompletedMigrations();
    console.log(`Found ${completedMigrations.length} completed migrations`);
    
    let migrationsRun = 0;
    
    for (const file of migrationFiles) {
      if (!completedMigrations.includes(file)) {
        await runMigration(file);
        migrationsRun++;
      }
    }
    
    if (migrationsRun === 0) {
      console.log('No new migrations to run.');
    } else {
      console.log(`Successfully ran ${migrationsRun} migration(s).`);
    }
    
  } catch (error) {
    console.error('Error running migrations:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

// Run the migrations
runMigrations();
