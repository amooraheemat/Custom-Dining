import express from 'express';
import { getRestaurants, getRestaurantById, createRestaurant } from '../controllers/restaurantController.js';

const router = express.Router();
// Route to get all restaurants
router.get('/', getRestaurants);
// Route to get a restaurant by ID
router.get('/:id', getRestaurantById);
// Route to create a new restaurant
router.post('/', createRestaurant);


export default router;