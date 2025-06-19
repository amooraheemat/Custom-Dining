import { Op } from 'sequelize';
import { sendAdminApprovalRequest, sendRestaurantApprovalEmail } from "../services/emailService.js";

/**
 * @swagger
 * components:
 *   schemas:
 *     CreateRestaurantRequest:
 *       type: object
 *       required:
 *         - name
 *         - location
 *         - contactEmail
 *       properties:
 *         name:
 *           type: string
 *           description: Name of the restaurant
 *         location:
 *           type: string
 *           description: Physical address of the restaurant
 *         description:
 *           type: string
 *           description: Detailed description of the restaurant
 *         contactEmail:
 *           type: string
 *           format: email
 *           description: Contact email for the restaurant
 *         openingHours:
 *           type: string
 *           description: Restaurant operating hours
 *         contactNumber:
 *           type: string
 *           description: Contact phone number
 *         website:
 *           type: string
 *           format: uri
 *           description: Restaurant website URL
 *         cuisineType:
 *           type: string
 *           description: Type of cuisine served
 *         capacity:
 *           type: integer
 *           description: Maximum seating capacity
 *         hasOutdoorSeating:
 *           type: boolean
 *           default: false
 *         hasParking:
 *           type: boolean
 *           default: false
 *         isVeganFriendly:
 *           type: boolean
 *           default: false
 *         isVegetarianFriendly:
 *           type: boolean
 *           default: false
 *         isGlutenFreeFriendly:
 *           type: boolean
 *           default: false
 *         isHalal:
 *           type: boolean
 *           default: false
 */

// Create a new restaurant (pending admin approval)
// Create a new restaurant (pending admin approval)
export const createRestaurant = async (req, res, next) => {
  try {
    const { 
      name, 
      location, 
      description, 
      contactEmail,
      openingHours,
      contactNumber,
      website,
      cuisineType,
      capacity,
      hasOutdoorSeating,
      hasParking,
      isVeganFriendly,
      isVegetarianFriendly,
      isGlutenFreeFriendly,
      isHalal
    } = req.body;
    
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }
    
    // Check if a restaurant with this email already exists 
    const existingRestaurant = await req.db.Restaurant.findOne({
      where: req.db.sequelize.where(
        req.db.sequelize.fn('LOWER', req.db.sequelize.col('contactEmail')),
        '=',
        contactEmail.toLowerCase()
      )
    });

    if (existingRestaurant) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already in use',
        errors: [{
          field: 'contactEmail',
          message: 'This email is already registered to another restaurant'
        }]
      });
    }
    
    // Check if user has the right role (Only restaurant and admin user can create restaurants)
    if (!['restaurant', 'admin'].includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Only restaurant owners or admins can create restaurants'
      });
    }
    
    // Get the authenticated user
    const currentUser = await req.db.User.findByPk(req.user.id);
    
    if (!currentUser) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Authenticated user not found' 
      });
    }
    
    // Determine if the requester is an admin
    const isAdmin = currentUser.role === 'admin';
    
    // For non-admin users, they can only create restaurants for themselves
    const targetUserId = isAdmin ? (req.body.userId || currentUser.id) : currentUser.id;
    
    // Auto-approve if created by admin
    const status = isAdmin ? 'approved' : 'pending';
    const approvedBy = isAdmin ? currentUser.id : null;
    const approvedAt = isAdmin ? new Date() : null;

    // Create the restaurant
    const newRestaurant = await req.db.Restaurant.create({
      name,
      location,
      description,
      contactEmail: contactEmail.toLowerCase(),
      openingHours,
      contactNumber,
      website,
      cuisineType,
      capacity,
      hasOutdoorSeating: hasOutdoorSeating || false,
      hasParking: hasParking || false,
      isVeganFriendly: isVeganFriendly || false,
      isVegetarianFriendly: isVegetarianFriendly || false,
      isGlutenFreeFriendly: isGlutenFreeFriendly || false,
      isHalal: isHalal || false,
      userId: targetUserId,
      status,
      approvedBy,
      approvedAt,
      isActive: isAdmin // Auto-activate if created by admin
    });

    // Send appropriate response based on admin/restaurant user
    if (isAdmin) {
      // Notify the restaurant owner
      await sendRestaurantApprovalEmail(currentUser, newRestaurant);
      
      return res.status(201).json({
        status: 'success',
        message: 'Restaurant created and approved successfully',
        data: {
          restaurant: {
            id: newRestaurant.id,
            name: newRestaurant.name,
            contactEmail: newRestaurant.contactEmail,
            status: newRestaurant.status,
            isActive: newRestaurant.isActive
          }
        }
      });
    } else {
      // For regular restaurant users, notify admins for approval
      const adminUsers = await req.db.User.findAll({ 
        where: { role: 'admin' },
        attributes: ['id', 'email', 'username']
      });
      
      // Send notification to each admin (fire and forget)
      try {
        await Promise.all(adminUsers.map(admin => 
          sendAdminApprovalRequest(admin, newRestaurant, currentUser)
        ));
      } catch (emailError) {
        console.error('Failed to send admin approval email:', emailError);
        // Continue even if email fails
      }

      return res.status(201).json({
        status: 'success',
        message: 'Restaurant created successfully and pending admin approval',
        data: {
          restaurant: {
            id: newRestaurant.id,
            name: newRestaurant.name,
            contactEmail: newRestaurant.contactEmail,
            status: newRestaurant.status,
            isActive: newRestaurant.isActive
          }
        }
      });
    }
  } catch (error) {
    console.error('Error creating restaurant:', error);
    
    // Handle validation errors
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors ? error.errors.map(err => ({
        field: err.path,
        message: err.message
      })) : [{ message: 'A validation error occurred' }];
      
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: errors
      });
    }
    
    // Handle other errors
    next(error);
  }
};

// Get all approved restaurants
export const getAllRestaurants = async (req, res, next) => {
  try {
    const restaurants = await req.db.Restaurant.unscoped().findAll({
      include: [
        {
          model: req.db.User,
          as: 'owner',
          attributes: ['id', 'username', 'email'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
    });
    
    // Response body
    const response = {
      status: 'success',
      results: restaurants.length,
      data: {
        restaurants: restaurants.map(restaurant => ({
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          location: restaurant.location,
          cuisineType: restaurant.cuisineType,
          contactEmail: restaurant.contactEmail,
          status: restaurant.status,
          isActive: restaurant.isActive,
          owner: restaurant.owner
        }))
      }
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    next(error); // Pass to the error handling middleware
  }
};

// Get restaurant by ID (only approved restaurants)
export const getRestaurantById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user && req.user.role === 'admin';
    
    // Base where condition
    const whereCondition = { id };
    
    // Only show approved restaurants if the user is and ADMIN
    if (!isAdmin) {
      whereCondition.status = 'approved';
      whereCondition.isActive = true;
    }
    
    const restaurant = await req.db.Restaurant.findOne({
      where: whereCondition,
      include: [
        {
          model: req.db.User,
          as: 'owner',
          attributes: ['id', 'username'],
          required: false
        },
        {
          model: req.db.User,
          as: 'approvedByAdmin',
          attributes: ['id', 'username'],
          required: false
        }
      ]
    });
    
    if (!restaurant) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Restaurant not found' + (isAdmin ? '' : ' or not approved') 
      });
    }
    
    // Response body
    const response = {
      status: 'success',
      data: {
        restaurant: {
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          location: restaurant.location,
          cuisineType: restaurant.cuisineType,
          contactEmail: restaurant.contactEmail,
          owner: restaurant.owner || null,
          approvedByAdmin: restaurant.approvedByAdmin || null
        }
      }
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    next(error);
  }
};

// Admin: Get all pending restaurants
export const getPendingRestaurants = async (req, res, next) => {
  try {
    const restaurants = await req.db.Restaurant.findAll({ 
      where: { 
        status: 'pending',
        isActive: false 
      },
      include: [
        {
          model: req.db.User,
          as: 'owner',
          attributes: ['username', 'email'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // Response body
    const response = {
      status: 'success',
      results: restaurants.length,
      data: {
        restaurants: restaurants.map(restaurant => ({
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          location: restaurant.location,
          cuisineType: restaurant.cuisineType,
          contactEmail: restaurant.contactEmail,
          owner: restaurant.owner || null
        }))
      }
    };
    
    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching pending restaurants:', error);
    next(error);
  }
};
