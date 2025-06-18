import 'dotenv/config';
import { sequelize, connectDB } from './src/config/database.js';
import { db } from './src/config/database.js';
import createUserModel from './src/models/user.js';
import createRestaurantModel from './src/models/restaurant.js';
import createMealModel from './src/models/meal.js';
import { QueryTypes } from 'sequelize';
import bcrypt from 'bcrypt';

// Initialize models
const User = createUserModel(db.sequelize);
const Restaurant = createRestaurantModel(db.sequelize);
const Meal = createMealModel(db.sequelize);

// Store models in sequelize.models
db.sequelize.models = {
  User,
  Restaurant,
  Meal
};

async function checkDatabase() {
  try {
    await connectDB();
    console.log('Database connection successful');

    // Create admin user if not exists
    const existingAdmin = await User.findOne({ where: { email: 'admin@example.com' } });
    if (!existingAdmin) {
      await sequelize.query(
        `INSERT INTO Users (id, username, email, password, role, isEmailVerified, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        { 
          replacements: [
            '90fc9914-65c6-4ea0-acc8-3a0070f6f447',
            'adminuser',
            'admin@example.com',
            await bcrypt.hash('adminpassword', 10),
            'admin',
            true
          ]
        }
      );
    }

    // Create restaurant owner if not exists
    const existingRestaurantOwner = await User.findOne({ where: { email: 'owner@example.com' } });
    if (!existingRestaurantOwner) {
      await sequelize.query(
        `INSERT INTO Users (id, username, email, password, role, isEmailVerified, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        { 
          replacements: [
            '5a6ee844-ba84-4295-8909-4481a5cd74be',
            'restaurantowner',
            'owner@example.com',
            await bcrypt.hash('ownerpassword', 10),
            'restaurant',
            true
          ]
        }
      );
    }

    // Get admin user
    const adminUser = await User.findOne({
      where: { email: 'admin@example.com' }
    });

    if (adminUser) {
      console.log('Admin user found:', {
        id: adminUser.id,
        username: adminUser.username,
        email: adminUser.email,
        role: adminUser.role,
        isEmailVerified: adminUser.isEmailVerified
      });
    } else {
      console.log('Admin user not found');
    }

    // Get restaurant owner
    const restaurantOwnerUser = await User.findOne({
      where: { email: 'owner@example.com' }
    });

    if (restaurantOwnerUser) {
      console.log('Restaurant owner found:', {
        id: restaurantOwnerUser.id,
        username: restaurantOwnerUser.username,
        email: restaurantOwnerUser.email,
        role: restaurantOwnerUser.role,
        isEmailVerified: restaurantOwnerUser.isEmailVerified
      });
    } else {
      console.log('Restaurant owner not found');
    }

    // Check if there are any pending restaurants using raw SQL
    const pendingRestaurants = await sequelize.query(
      `SELECT r.*, u.id as owner_id, u.username as owner_username, u.email as owner_email, u.role as owner_role 
       FROM Restaurants r 
       LEFT JOIN Users u ON r.userId = u.id 
       WHERE r.status = 'pending'`,
      { type: QueryTypes.SELECT }
    );

    if (pendingRestaurants.length > 0) {
      console.log('Pending restaurants:', pendingRestaurants.length);
      console.log('Details of pending restaurants:');
      pendingRestaurants.forEach(restaurant => {
        console.log(`- ${restaurant.name} (${restaurant.contactEmail}) owned by ${restaurant.owner_username} (${restaurant.owner_email})`);
        console.log(`  Restaurant ID: ${restaurant.id}`);
        console.log(`  Owner ID: ${restaurant.owner_id}`);
        console.log(`  Owner Role: ${restaurant.owner_role}`);
      });
    } else {
      console.log('No pending restaurants');
    }
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    await sequelize.close();
  }
}

checkDatabase();
