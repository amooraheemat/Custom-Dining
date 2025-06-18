import { sequelize } from '../src/config/database.js';
import createUserModel from '../src/models/user.js';

async function checkUser() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');
    
    // Initialize the User model
    const User = createUserModel(sequelize);
    
    const user = await User.findOne({ 
      where: { email: 'test@example.com' },
      attributes: ['id', 'email', 'password', 'isTemporaryPassword', 'temporaryPasswordExpires']
    });
    
    console.log('User:', JSON.stringify(user, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

checkUser();
