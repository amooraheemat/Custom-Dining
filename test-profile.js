import { sequelize, db } from './src/config/database.js';

async function testProfile() {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Check if table exists
    const [results] = await sequelize.query("SHOW TABLES LIKE 'user_profiles'");
    console.log('User profiles table exists:', results.length > 0);

    // Try to find a test profile
    const testProfile = await db.UserProfile.findOne();
    console.log('Found profile:', testProfile ? 'Yes' : 'No');

    // If no profile exists, try to create one
    if (!testProfile) {
      console.log('Trying to create a test profile...');
      const newProfile = await db.UserProfile.create({
        userId: 'test-user-id', // This should be a valid UUID
        healthGoal: 'test',
        dietaryRestrictions: [],
        preferredMealTags: []
      });
      console.log('Created profile:', newProfile.toJSON());
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testProfile();
