import express from 'express';
import { body } from 'express-validator';
import {
  register,
  login,
  forgotPassword,
  resetPassword,
  changePassword,
  verifyEmail,
  resendVerificationEmail
} from '../controllers/authController.js';
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

// Ensure database is connected
const checkDbConnection = async (req, res, next) => {
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
};

const router = express.Router();

// Add database middleware to all auth routes
router.use(addDbToRequest);
router.use(checkDbConnection);

// Add database middleware to all auth routes
router.use(addDbToRequest);
router.use(checkDbConnection);

// Validation middleware
const registerValidation = [
  body('username')
    .trim()
    .notEmpty().withMessage('Username is required')
    .bail()
    .notEmpty().withMessage('Username is required')
    .bail()
    .isLength({ min: 3, max: 30 })
    .withMessage('Username must be between 3 and 30 characters'),
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['user', 'admin', 'moderator', 'restaurant'])
    .isIn(['user', 'admin', 'moderator', 'restaurant'])
    .withMessage('Invalid role specified')
];

const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const emailValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
];

// Password validation - keep it simple and let the model handle complex validation
const emailValidation = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email')
];

// Password validation - keep it simple and let the model handle complex validation
const passwordValidation = [
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isString()
    .withMessage('Password must be a string')
    .notEmpty()
    .withMessage('Password is required')
    .isString()
    .withMessage('Password must be a string')
];

const changePasswordValidation = [
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('currentPassword')
    .notEmpty()
    .withMessage('Please enter your current password'),
];

// Public routes
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               role:
 *                 type: string
 *                 enum: [user, admin, moderator, restaurant]
 *                 default: user
 *     responses:
 *       201:
 *         description: User registered successfully. Please check your email to verify your account.
 *       400:
 *         description: Validation error or user already exists
 */
router.post('/register', registerValidation, register);

/**
 * @swagger
 * /auth/verify-email/{token}:
 *   get:
 *     summary: Verify email address
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
// Handle both query parameter and URL parameter for backward compatibility
router.get('/verify-email/:token?', (req, res, next) => {
  // If token is in query params, use that, otherwise use URL param
  req.params.token = req.params.token || req.query.token;
  return verifyEmail(req, res, next);
});

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification email sent successfully
 *       400:
 *         description: Email is already verified or invalid email
 *       404:
 *         description: User not found
 */
router.post('/resend-verification', emailValidation, resendVerificationEmail);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', loginValidation, login);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset email sent
 *       404:
 *         description: User not found
 */
router.post('/forgot-password', forgotPassword);

/**
 * @swagger
 * /auth/reset-password/{token}:
 *   post:
 *     summary: Reset password
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 */
// Handle both URL parameter and query parameter for reset password
const handleResetPassword = [
  // Handle token from query or URL param
  (req, res, next) => {
    if (req.query.token && !req.params.token) {
      req.params.token = req.query.token;
    }
    next();
  },
  // Password validation
  ...passwordValidation,
  // Reset password handler
  resetPassword
];

router.post('/reset-password/:token?', handleResetPassword);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change password (authenticated)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Current password is incorrect
 */
router.post('/change-password', protect, changePasswordValidation, changePassword);

/**
 * @swagger
 * /auth/test-auth:
 *   get:
 *     summary: Test protected route
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully authenticated
 *       401:
 *         description: Not authorized
 */
router.get('/test-auth', protect, (req, res) => {
  res.json({
    status: 'success',
    message: 'You are authenticated',
    user: req.user
  });
});

/**
 * @swagger
 * /auth/admin-only:
 *   get:
 *     summary: Admin only route
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin access granted
 *       403:
 *         description: Not authorized (non-admin user)
 */
router.get('/admin-only', protect, authorize('admin'), (req, res) => {
  res.json({
    status: 'success',
    message: 'You have admin access',
    user: req.user
  });
});

// Handle method not allowed for all auth routes
router.all('*', (req, res, next) => {
  const err = new Error('Method Not Allowed');
  err.status = 405;
  err.allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
  next(err);
});
// Public routes
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 maxLength: 30
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *               role:
 *                 type: string
 *                 enum: [user, admin, moderator, restaurant]
 *                 default: user
 *     responses:
 *       201:
 *         description: User registered successfully. Please check your email to verify your account.
 *       400:
 *         description: Validation error or user already exists
 */
router.post('/register', registerValidation, register);

/**
 * @swagger
 * /auth/verify-email/{token}:
 *   get:
 *     summary: Verify email address
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *         description: Email verification token
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired token
 */
// Handle both query parameter and URL parameter for backward compatibility
router.get('/verify-email/:token?', (req, res, next) => {
  // If token is in query params, use that, otherwise use URL param
  req.params.token = req.params.token || req.query.token;
  return verifyEmail(req, res, next);
});

/**
 * @swagger
 * /auth/resend-verification:
 *   post:
 *     summary: Resend verification email
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Verification email sent successfully
 *       400:
 *         description: Email is already verified or invalid email
 *       404:
 *         description: User not found
 */
router.post('/resend-verification', emailValidation, resendVerificationEmail);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', loginValidation, login);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Reset email sent
 *       404:
 *         description: User not found
 */
router.post('/forgot-password', forgotPassword);

/**
 * @swagger
 * /auth/reset-password/{token}:
 *   post:
 *     summary: Reset password
 *     tags: [Authentication]
 *     parameters:
 *       - in: path
 *         name: token
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Invalid or expired token
 */
// Handle both URL parameter and query parameter for reset password
const handleResetPassword = [
  // Handle token from query or URL param
  (req, res, next) => {
    if (req.query.token && !req.params.token) {
      req.params.token = req.query.token;
    }
    next();
  },
  // Password validation
  ...passwordValidation,
  // Reset password handler
  resetPassword
];

router.post('/reset-password/:token?', handleResetPassword);

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change password (authenticated)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       401:
 *         description: Current password is incorrect
 */
router.post('/change-password', protect, changePasswordValidation, changePassword);

/**
 * @swagger
 * /auth/test-auth:
 *   get:
 *     summary: Test protected route
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully authenticated
 *       401:
 *         description: Not authorized
 */
router.get('/test-auth', protect, (req, res) => {
  res.json({
    status: 'success',
    message: 'You are authenticated',
    user: req.user
  });
});

/**
 * @swagger
 * /auth/admin-only:
 *   get:
 *     summary: Admin only route
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin access granted
 *       403:
 *         description: Not authorized (non-admin user)
 */
router.get('/admin-only', protect, authorize('admin'), (req, res) => {
  res.json({
    status: 'success',
    message: 'You have admin access',
    user: req.user
  });
});

// Handle method not allowed for all auth routes
router.all('*', (req, res, next) => {
  const err = new Error('Method Not Allowed');
  err.status = 405;
  err.allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'];
  next(err);
});

export default router;
