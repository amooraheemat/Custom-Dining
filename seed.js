import { sequelize } from './src/config/database.js';
import User from './src/models/user.js';
import Restaurant from './src/models/restaurant.js';

const seedDatabase = async () => {
  try {
    // Sync all models
    await sequelize.sync({ force: true });
    console.log('Database synced!');

    // Create test users
    const adminUser = await User.create({
      username: 'adminuser123',
      email: 'admin@example.com',
      password: 'Admin@123',
      role: 'admin',
      isEmailVerified: true,
      isActive: true
    });

    const restaurantOwner = await User.create({
      username: 'restaurantowner1',
      email: 'owner@example.com',
      password: 'Owner@123',
      role: 'restaurant',
      isEmailVerified: true,
      isActive: true
    });

    const customer = await User.create({
      username: 'testcustomer1',
      email: 'customer@example.com',
      password: 'Customer@123',
      role: 'user',
      isEmailVerified: true,
      isActive: true
    });

    // Create test restaurants
    const restaurant1 = await Restaurant.create({
      name: 'Tasty Bites',
      location: '123 Food St, Cuisine City',
      description: 'A cozy restaurant serving delicious meals',
      userId: restaurantOwner.id,
      status: 'approved',
      cuisineType: 'American',
      priceRange: '$$',
      openingHours: '9:00 AM - 10:00 PM',
      contactNumber: '123-456-7890',
      website: 'https://tastybites.com',
      isVeganFriendly: true,
      isVegetarianFriendly: true,
      isGlutenFreeFriendly: true,
      isHalal: false,
      isKosher: false
    });

    const restaurant2 = await Restaurant.create({
      name: 'Pizza Palace',
      location: '456 Pizza Ave, Foodie Town',
      description: 'The best pizza in town!',
      userId: restaurantOwner.id,
      status: 'approved',
      cuisineType: 'Italian',
      priceRange: '$$$',
      openingHours: '11:00 AM - 11:00 PM',
      contactNumber: '987-654-3210',
      website: 'https://pizzapalace.com',
      isVeganFriendly: true,
      isVegetarianFriendly: true,
      isGlutenFreeFriendly: false,
      isHalal: true,
      isKosher: false
    });

    console.log('Database seeded successfully!');
    console.log('Admin user created:');
    console.log(`Email: admin@example.com`);
    console.log(`Password: password123`);
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDatabase();
