import express from 'express';
import { body } from 'express-validator';
import { 
  getAllRestaurants, 
  getRestaurantById, 
  createRestaurant,
  getPendingRestaurants,
  updateRestaurantStatus
} from '../controllers/restaurantController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';
import { db } from '../config/database.js';

// Add db to request object
const addDbToRequest = (req, res, next) => {
  // Ensure db is properly initialized
  if (!db || !db.sequelize) {
    console.error('Database not initialized');
    return res.status(500).json({
      status: 'error',
      message: 'Database not initialized'
    });
  }
  
  // Attach models to request
  req.db = {
    ...db,
    models: db.sequelize.models,
    sequelize: db.sequelize
  };
  
  next();
};

/**
 * @swagger
 * tags:
 *   name: Restaurants
 *   description: Restaurant management endpoints
 */

const router = express.Router();

// Add db to all requests
router.use(addDbToRequest);

// Ensure database is connected
router.use(async (req, res, next) => {
  try {
    await db.sequelize.authenticate();
    next();
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(503).json({
      status: 'error',
      message: 'Unable to connect to database',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Apply protect middleware to all routes that require authentication
router.use((req, res, next) => {
  // Skip protect middleware for public routes
  if (req.path === '/' && req.method === 'GET') {
    return next();
  }
  if (req.path === '/:id' && req.method === 'GET') {
    return next();
  }
  return protect(req, res, next);
});

// Validation middleware
const createRestaurantValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Restaurant name is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Restaurant name must be between 3 and 100 characters'),
  body('location')
    .trim()
    .notEmpty().withMessage('Location is required'),
  body('contactEmail')
    .trim()
    .notEmpty().withMessage('Contact email is required')
    .isEmail().withMessage('Please provide a valid email address'),
  body('description')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Description cannot exceed 1000 characters'),
  body('website')
    .optional()
    .isURL().withMessage('Please provide a valid website URL'),
  body('capacity')
    .optional()
    .isInt({ min: 1 }).withMessage('Capacity must be a positive number'),
  body('openingHours')
    .optional()
    .isString().withMessage('Opening hours must be a string'),
  body('contactNumber')
    .optional()
    .isString().withMessage('Contact number must be a string'),
  body('cuisineType')
    .optional()
    .isString().withMessage('Cuisine type must be a string'),
  body(['hasOutdoorSeating', 'hasParking', 'isVeganFriendly', 'isVegetarianFriendly', 'isGlutenFreeFriendly', 'isHalal'])
    .optional()
    .isBoolean().withMessage('Must be a boolean value')
];

const updateStatusValidation = [
  body('status')
    .isIn(['approved', 'rejected'])
    .withMessage('Status must be either approved or rejected'),
  body('adminId')
    .isUUID()
    .withMessage('Valid admin ID is required'),
  body('rejectionReason')
    .optional()
    .isString()
    .withMessage('Rejection reason must be a string')
    .isLength({ max: 500 })
    .withMessage('Rejection reason cannot exceed 500 characters')
];

/**
 * @swagger
 * /restaurants:
 *   get:
 *     summary: Get all approved restaurants
 *     tags: [Restaurants]
 *     responses:
 *       200:
 *         description: List of approved restaurants
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Restaurant'
 */
// Public routes
router.get('/', getAllRestaurants);

/**
 * @swagger
 * /restaurants/pending:
 *   get:
 *     summary: Get all pending restaurants (Admin only)
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending restaurants
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Restaurant'
 *       401:
 *         description: Unauthorized - Authentication required
 *       403:
 *         description: Forbidden - Admin access required
 */
// Admin-only routes
router.get('/pending', authorize('admin'), getPendingRestaurants);

/**
 * @swagger
 * /restaurants/{id}:
 *   get:
 *     summary: Get a restaurant by ID
 *     tags: [Restaurants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Restaurant ID
 *     responses:
 *       200:
 *         description: Restaurant details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
 *       404:
 *         description: Restaurant not found or not approved
 */
/**
 * @swagger
 * /restaurants/{id}:
 *   get:
 *     summary: Get a restaurant by ID
 *     tags: [Restaurants]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Restaurant ID
 *     responses:
 *       200:
 *         description: Restaurant details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Restaurant'
 *       404:
 *         description: Restaurant not found or not approved
 */
// Public route
router.get('/:id', getRestaurantById);

/**
 * @swagger
 * /restaurants:
 *   post:
 *     summary: Create a new restaurant (requires authentication)
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - location
 *               - userId
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *               location:
 *                 type: string
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               userId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Restaurant created successfully (pending admin approval)
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Authentication required
 */
// Protected routes (require authentication)
router.post('/', createRestaurantValidation, createRestaurant);

/**
 * @swagger
 * /restaurants/{id}/status:
 *   patch:
 *     summary: Update restaurant status (Admin only)
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Restaurant ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *               - adminId
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *               adminId:
 *                 type: string
 *                 format: uuid
 *               rejectionReason:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Restaurant status updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Restaurant not found
 */
router.patch('/:id/status', authorize('admin'), updateStatusValidation, updateRestaurantStatus);

/**
 * @swagger
 * /restaurants:
 *   post:
 *     summary: Create a new restaurant (requires authentication)
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - location
 *               - userId
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 100
 *               location:
 *                 type: string
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               userId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Restaurant created successfully (pending admin approval)
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized - Authentication required
 */
// Protected routes (require authentication)
router.post('/', createRestaurantValidation, createRestaurant);

/**
 * @swagger
 * /restaurants/{id}/status:
 *   patch:
 *     summary: Update restaurant status (Admin only)
 *     tags: [Restaurants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Restaurant ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *               - adminId
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *               adminId:
 *                 type: string
 *                 format: uuid
 *               rejectionReason:
 *                 type: string
 *                 maxLength: 500
 *     responses:
 *       200:
 *         description: Restaurant status updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Restaurant not found
 */
router.patch('/:id/status', authorize('admin'), updateStatusValidation, updateRestaurantStatus);

export default router;