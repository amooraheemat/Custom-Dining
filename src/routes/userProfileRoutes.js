import express from 'express';
import {
  createUserProfile,
  updateUserProfile,
  getUserProfile,
  getMealsForUser,
  deleteUserProfile
} from '../controllers/userProfileController.js';
import { isAuthenticated } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Create a user profile
router.post('/profile', isAuthenticated, createUserProfile);

// Update existing user profile
router.put('/profile', isAuthenticated, updateUserProfile);

// Gets a particular user's profile
router.get('/profile', isAuthenticated, getUserProfile);

//Deletes a user's profile
router.delete('/profile', isAuthenticated, deleteUserProfile);

//Gets meals based on users's prference
router.get('/meals', isAuthenticated, getMealsForUser);

export default router;
