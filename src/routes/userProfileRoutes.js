import express from 'express';
import {
  createUserProfile,
  updateUserProfile,
  getUserProfile,
  getMealsForUser,
  deleteUserProfile
} from '../controllers/userProfileController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Create a user profile
router.post('/profile', protect, createUserProfile);

// Update existing user profile
router.put('/profile', protect, updateUserProfile);

// Gets a particular user's profile
router.get('/profile', protect, getUserProfile);

//Deletes a user's profile
router.delete('/profile', protect, deleteUserProfile);

//Gets meals based on users's prference
router.get('/meals', protect, getMealsForUser);

export default router;
