import express from 'express';
import { 
  updateRestaurantStatus,
  getAllUsers 
} from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Get all users with pagination
router.get('/users', protect, getAllUsers);

// Update restaurant status (approve/reject)
router.patch('/restaurants/:id/status', protect, updateRestaurantStatus);

export default router;
