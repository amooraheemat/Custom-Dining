const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);

async function convertMigrations() {
  try {
    const migrationsDir = path.join(__dirname, 'src', 'migrations');
    const files = await readdir(migrationsDir);
    
    for (const file of files) {
      if (file.endsWith('.js')) {
        const filePath = path.join(migrationsDir, file);
        const content = await readFile(filePath, 'utf8');
        
        // Convert ES module export to CommonJS
        const newContent = content
          .replace(/^export default /m, 'module.exports = ')
          .replace(/import (.*?) from (['"])(.*?)\2/g, 'const $1 = require($2$3$2)');
        
        // Write new .cjs file
        const newFilePath = filePath.replace(/\.js$/, '.cjs');
        await writeFile(newFilePath, newContent);
        
        // Remove old .js file
        await unlink(filePath);
        
        console.log(`Converted ${file} to ${path.basename(newFilePath)}`);
      }
    }
    
    console.log('Migration files converted successfully!');
  } catch (error) {
    console.error('Error converting migration files:', error);
    process.exit(1);
  }
}

convertMigrations();
