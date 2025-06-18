import express from 'express';
import {
  addFavorite,
  getAllFavorites,
  removeFavorite
} from '../controllers/favoriteController.js';
import { isAuthenticated } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Adds a meal to the User's Favorite List
router.post('/', isAuthenticated, addFavorite);

// Get all favorited meals
router.get('/', isAuthenticated, getAllFavorites);

// Remove a Meal from Favorites
router.delete('/:mealId', isAuthenticated, removeFavorite);

export default router;
