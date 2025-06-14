import meal from '../models/meal.js';
import sequelize from '../config/database.js';// Import connectDB to ensure DB is ready
import { connectDB } from '../config/database.js';

const seedMeals = async () => {
    await connectDB(); // Ensure DB is connected before seeding

    try {
        const meals = [
            {
               name: 'Grilled Chicken Salad',
               description: 'Fresh salad with grilled chicken breast.',
               imageUrl: 'http://example.com/chicken-salad.jpg',
               dietaryTags: ['low-carb', 'high-protein'],
               nutritionallnfo: { calories: 350, protein: 40, carbs: 10, fat:15},
               allergens: ['celery', 'mustard']
            },
            {
                name: 'Vegetable Stir-fry with Tofu',
                description: 'Colourful stir-fry with mixed vegetables and tofu.',
                imageUrl: 'https://example.com/stir-fry.jpg',
                dietaryTags: ['low-carb', 'diabetic-friendly'],
                nutritionallnfo: { calories: 300, protein: 25, carbs: 20, fat: 12 },
                allergens: ['soy']
            },
            {
                name: 'Salmon with Asparagus',
                description: 'Baked salmon with steamed asparagus.',
                imageUrl: 'https://example.com/salmon.jpg',
                dietaryTags: ['high-protein', 'low-sugar'],
                nutritionallnfo: { calories: 400, protein: 35, carbs: 5, fat: 25 },
                allergens: ['fish']
            },
            {
                name: 'Whole Wheat Pasta with Lean Meat Sauce',
                description: 'Hearty pasta dish with lean ground beef.',
                imageUrl: 'https://example.com/pasta.jpg',
                dietaryTags: ['high-protein'],
                nutritionallnfo: { calories: 550, protein: 45, carbs: 60, fat: 20 },
                allergens: ['glutten']
           },
           {
                name: 'Lentil Soup',
                description: 'Nutritious and filling lentil soup.',
                imageUrl: 'https://example.com/beef-stew.jpg',
                dietaryTags: ['low-fat', 'diabetic-friendly'],
                nutritionallnfo: { calories: 280, protein: 18, carbs: 40, fat: 5 },
                allergens: ['Peanut']
           },
           {
                name: 'Beef Stew',
                description: 'Classic beef stew with vegetables.',
                imageUrl: 'https://example.com/beef-stew.jpg',
                dietaryTags: ['high-protein'],
                nutritionallnfo: { calories: 450, Protein: 30, carbs: 30, fat: 25 },
                allergens: ['celery']
           },
           {
                name: 'Gluten-Free Chicken Curry',
                description: 'Spicy chicken curry with coconut milk, no gluten.',
                imageUrl: 'https://example.com/gf-chicken-curry.jpg',
                dietaryTags: ['low-carb'],
                nutritionallnfo: { calories: 420, protein: 38, carbs: 15, fat:28 },
                allergens: ['nuts']// Example for an allergen
           },
           {
                name: 'Almond Flour Pancakes',
                description: 'Delicious pancakes made with almond flour.',
                imageUrl: 'http://example.com/almond-pancakes.jpg',
                dietaryTags: ['low-carb', 'high-protein', 'diabetic-friendly'],
                nutritionallnfo: { calories: 300, protein: 20, carbs: 10, fat: 20 },
                allergens: ['nuts', 'eggs']
           }
           
        ];

        await meal.bulkCreate(meals);
        console.log('Meals seeded successfully!');
    } catch (error) {
        console.log('Error seeding meals:', error);
    } finally {
        await sequelize.close(); // close connection after seeding
    }
}

seedMeals();