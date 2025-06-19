import { sequelize, connectDB } from './src/config/database.js';

async function testConnection() {
  try {
    await connectDB();
    console.log('Database connection successful!');
    
    // Test UserProfile model
    const UserProfile = sequelize.models.UserProfile;
    console.log('UserProfile model exists:', UserProfile !== undefined);
    
    // Test associations
    console.log('UserProfile associations:', Object.keys(UserProfile.associations));
    
    process.exit(0);
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
}

testConnection();
