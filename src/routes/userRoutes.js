import express from 'express';
import { body } from 'express-validator';
import { protect } from '../middleware/authMiddleware.js';
import { saveDietaryPreferences } from '../controllers/userProfileController.js';
import { saveFavoriteMeal } from '../controllers/favoriteController.js';

const router = express.Router();

// Validation middleware
const dietaryPreferencesValidation = [
  body('dietaryGoal').optional().isString(),
  body('restrictions').isArray().withMessage('Restrictions must be an array')
];

const favoriteValidation = [
  body('mealId').notEmpty().withMessage('Meal ID is required')
];

/**
 * @swagger
 * /users/profile:
 *   post:
 *     summary: Save user dietary preferences
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.post('/profile', protect, dietaryPreferencesValidation, saveDietaryPreferences);

/**
 * @swagger
 * /users/favorites:
 *   post:
 *     summary: Save favorite meal
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 */
router.post('/favorites', protect, favoriteValidation, saveFavoriteMeal);

export default router;
