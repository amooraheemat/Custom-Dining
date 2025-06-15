import express from 'express';
import { approveRestaurant, rejectRestaurant } from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';


const router = express.Router();

router.patch('/approve/:id', protect, approveRestaurant);

router.patch('/reject/:id', protect, rejectRestaurant);

export default router;
