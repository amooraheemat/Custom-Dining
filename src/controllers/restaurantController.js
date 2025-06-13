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

    // Check if a restaurant with this email already exists (case-insensitive)
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
    
    // Check if user has the right role (restaurant or admin)
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
    
    // For admins, require userId in the request body
    let targetUser;
    if (isAdmin) {
      if (!req.body.userId) {
        return res.status(400).json({
          status: 'error',
          message: 'userId is required when creating a restaurant as admin',
          field: 'userId'
        });
      }
      
      // Find the target user who will own the restaurant
      targetUser = await req.db.User.findOne({
        where: {
          id: req.body.userId,
          role: 'restaurant' // Ensure the target user is a restaurant owner
        }
      });
      
      if (!targetUser) {
        return res.status(404).json({
          status: 'error',
          message: 'Restaurant owner not found or not authorized to own a restaurant',
          field: 'userId'
        });
      }
    } else {
      // For non-admin users, they can only create restaurants for themselves
      targetUser = currentUser;
    }
    
    // Auto-approve if created by admin
    const status = isAdmin ? 'approved' : 'pending';
    const approvedBy = isAdmin ? currentUser.id : null;
    const approvedAt = isAdmin ? new Date() : null;

    try {
      // Create restaurant
      const newRestaurant = await req.db.Restaurant.create({ 
        name, 
        location, 
        description,
        contactEmail: contactEmail.toLowerCase(), // Ensure email is lowercase
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
        userId: targetUser.id,
        status: status,
        approvedBy: approvedBy,
        approvedAt: isAdmin ? new Date() : null,
        isActive: isAdmin
      });

      if (isAdmin) {
        // Notify the admin who created the restaurant
        await sendRestaurantApprovalEmail(targetUser, newRestaurant);
        
        return res.status(201).json({
          status: 'success',
          message: 'Restaurant created and approved successfully',
          data: {
            restaurantId: newRestaurant.id,
            restaurantName: newRestaurant.name,
            restaurantEmail: newRestaurant.contactEmail,
            restaurantContactNumber: newRestaurant.contactNumber,
            restaurantOwner: newRestaurant.userId,
          }
        });
      } else {
        // For non-admin users, notify admins for approval
        const adminUsers = await req.db.User.findAll({ where: { role: 'admin' } });
        
        // Send notification to each admin
        await Promise.all(adminUsers.map(admin => 
          sendAdminApprovalRequest(admin, newRestaurant, targetUser)
        ));
        
        return res.status(201).json({
          status: 'success',
          message: 'Restaurant created and pending approval',
          data: {
            restaurantId: newRestaurant.id,
            restaurantName: newRestaurant.name,
            restaurantEmail: newRestaurant.contactEmail,
            restaurantContactNumber: newRestaurant.contactNumber,
            restaurantOwner: newRestaurant.userId,
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
      console.error('Unexpected error creating restaurant:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Failed to create restaurant',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } catch (error) {
    next(error);
  }
};

// Get all approved restaurants
export const getAllRestaurants = async (req, res, next) => {
  try {
    const restaurants = await req.db.Restaurant.findAll({ 
      where: { 
        status: 'approved',
        isActive: true
      },
      include: [
        {
          model: req.db.User,
          as: 'owner',
          attributes: ['id', 'username', 'email'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    
    // Transform the response to include only the specified fields
    const response = {
      status: 'success',
      results: restaurants.length,
      data: {
        restaurants: restaurants.map(restaurant => ({
          restaurantId: restaurant.id,
          restaurantName: restaurant.name,
          location: restaurant.location,
          cuisineType: restaurant.cuisineType,
          contactEmail: restaurant.contactEmail
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
    
    // If not admin, only show approved restaurants
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
    
    // Transform the response
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
    
    // Transform the response
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

// Admin: Approve or reject restaurant
export const updateRestaurantStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;
    
    // Validate status
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Status must be either "approved" or "rejected"',
        errors: [{
          field: 'status',
          message: 'Must be either "approved" or "rejected"'
        }]
      });
    }
    
    // Check if rejection reason is provided when rejecting
    if (status === 'rejected' && !rejectionReason) {
      return res.status(400).json({
        status: 'error',
        message: 'Rejection reason is required when rejecting a restaurant',
        errors: [{
          field: 'rejectionReason',
          message: 'Please provide a reason for rejection'
        }]
      });
    }

    // Find the restaurant
    const restaurant = await req.db.Restaurant.findOne({
      where: { 
        id,
        status: 'pending',
        isActive: false
      },
      include: [{
        model: req.db.User,
        as: 'owner',
        attributes: ['id', 'email'],
        required: false
      }]
    });

    if (!restaurant) {
      return res.status(404).json({
        status: 'error',
        message: 'Restaurant not found or not pending approval'
      });
    }

    // Update the restaurant
    restaurant.status = status;
    restaurant.approvedBy = req.user.id;
    restaurant.approvedByUsername = req.user.username;
    restaurant.approvedAt = new Date();
    restaurant.isActive = status === 'approved';
    
    if (status === 'rejected') {
      restaurant.rejectionReason = rejectionReason;
    }

    await restaurant.save();

    // If approved and owner exists, update their role to 'restaurant' if not already
    if (status === 'approved' && restaurant.owner && restaurant.owner.role !== 'admin') {
      restaurant.owner.role = 'restaurant';
      await restaurant.owner.save();
    }

    // Send email notification to both restaurant contact email and owner's email if different
    const emailRecipients = new Set();
    
    // Add restaurant contact email if it exists
    if (restaurant.contactEmail) {
      emailRecipients.add(restaurant.contactEmail);
    }
    
    // Add owner's email if it exists and is different from contact email
    if (restaurant.owner?.email && restaurant.owner.email !== restaurant.contactEmail) {
      emailRecipients.add(restaurant.owner.email);
    }

    // Send email to all recipients
    for (const email of emailRecipients) {
      try {
        // Create a user object with the required properties for the email
        const recipientInfo = {
          email: email,
          username: email === restaurant.owner?.email 
            ? (restaurant.owner.username || 'Restaurant Owner')
            : 'Restaurant Contact',
          status: restaurant.status,
          rejectionReason: status === 'rejected' ? rejectionReason : undefined
        };
        
        console.log(`Sending ${status} notification to:`, email);
        
        await sendRestaurantApprovalEmail(
          recipientInfo,
          restaurant
        );
      } catch (emailError) {
        console.error(`Error sending email to ${email}:`, emailError);
        // Continue to next recipient even if one fails
      }
    }

    // Return success response
    res.status(200).json({
      status: 'success',
      message: `Restaurant ${status} successfully`,
      data: {
        restaurant: {
          id: restaurant.id,
          name: restaurant.name,
          status: restaurant.status,
          isActive: restaurant.isActive,
          approvedAt: restaurant.approvedAt,
          approvedBy: restaurant.approvedBy,
          approvedByUsername: restaurant.approvedByUsername,
          rejectionReason: restaurant.rejectionReason,
          owner: restaurant.owner ? {
            id: restaurant.owner.id,
            email: restaurant.owner.email,
            username: restaurant.owner.username
          } : null
        }
      }
    });
  } catch (error) {
    console.error('Error updating restaurant status:', error);
    
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
    
    next(error);
  }
};

// ... (rest of the code remains the same)
