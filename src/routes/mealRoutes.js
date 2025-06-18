import express from 'express';
import { getFilteredMeals, createMeal, getMealById } from '../controllers/mealController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Meals
 *   description: Meal management endpoints
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Meal:
 *       type: object
 *       required:
 *         - name
 *         - description
 *         - price
 *         - restaurantId
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The auto-generated ID of the meal
 *         name:
 *           type: string
 *           description: The name of the meal
 *         description:
 *           type: string
 *           description: A detailed description of the meal
 *         price:
 *           type: number
 *           format: float
 *           description: The price of the meal
 *         imageUrl:
 *           type: string
 *           format: uri
 *           description: URL to the meal's image
 *         dietaryTags:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of dietary tags (e.g., ["vegan", "gluten-free"])
 *         nutritionalInfo:
 *           type: object
 *           description: Nutritional information object
 *           properties:
 *             calories:
 *               type: number
 *             protein:
 *               type: number
 *             carbs:
 *               type: number
 *             fat:
 *               type: number
 *         allergens:
 *           type: array
 *           items:
 *             type: string
 *           description: Array of allergens (e.g., ["peanuts", "dairy"])
 *         isAvailable:
 *           type: boolean
 *           default: true
 *         restaurantId:
 *           type: string
 *           format: uuid
 *           description: ID of the restaurant this meal belongs to
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *       example:
 *         id: 123e4567-e89b-12d3-a456-426614174000
 *         name: "Vegan Burger"
 *         description: "Delicious plant-based burger with all the fixings"
 *         price: 12.99
 *         imageUrl: "https://example.com/images/vegan-burger.jpg"
 *         dietaryTags: ["vegan", "plant-based", "vegetarian"]
 *         nutritionalInfo: { calories: 650, protein: 22, carbs: 75, fat: 28 }
 *         allergens: ["gluten", "soy"]
 *         isAvailable: true
 *         restaurantId: 123e4567-e89b-12d3-a456-426614174001
 *         createdAt: "2023-01-01T12:00:00Z"
 *         updatedAt: "2023-01-01T12:00:00Z"
 */

// Public routes [Unprotected]
router.get('/', getFilteredMeals);
router.get('/:id', getMealById);

// Protected routes (require authentication)
router.use(protect);

// Restaurant users and admins can create meals
router.post('/', authorize(['admin', 'restaurant']), createMeal);

export default router;