import fs from 'fs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function runSqlFile(filePath) {
  // Read the SQL file
  const sql = fs.readFileSync(filePath, 'utf8');
  
  // Create a connection to the database
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'custom_dining_db',
    multipleStatements: true
  });

  try {
    console.log('Executing SQL file...');
    
    // Split the SQL file into individual statements
    const statements = sql.split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0);
    
    // Execute each statement
    for (const statement of statements) {
      try {
        console.log(`Executing: ${statement.substring(0, 100)}...`);
        await connection.query(statement);
      } catch (err) {
        console.error(`Error executing statement: ${err.message}`);
        throw err;
      }
    }
    
    console.log('SQL file executed successfully');
  } catch (error) {
    console.error('Error executing SQL file:', error);
    throw error;
  } finally {
    // Close the connection
    await connection.end();
  }
}

// Get the SQL file path from command line arguments
const sqlFilePath = process.argv[2];
if (!sqlFilePath) {
  console.error('Please provide the path to the SQL file');
  process.exit(1);
}

runSqlFile(sqlFilePath)
  .then(() => console.log('Done'))
  .catch(err => {
    console.error('Script failed:', err);
    process.exit(1);
  });
