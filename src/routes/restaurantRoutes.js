import express from 'express';
import { getAllRestaurants, getRestaurantById, createRestaurant } from '../controllers/restaurantController.js';

const router = express.Router();
// Route to get all restaurants
router.get('/', getAllRestaurants);
// Route to get a restaurant by ID
router.get('/:id', getRestaurantById);
// Route to create a new restaurant
router.post('/', createRestaurant);


export default router;