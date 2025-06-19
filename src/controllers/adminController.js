import Restaurant from "../models/restaurant.js";
import User from "../models/user.js";
import { sendRestaurantApprovalEmail } from "../services/emailService.js";



// Update restaurant status (approve/reject)
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
    
    // Ensure rejection reason is provided when rejecting
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
        
        await sendRestaurantApprovalEmail(
          recipientInfo,
          restaurant
        );
      } catch (emailError) {
        console.error(`Error sending email to ${email}:`, emailError);
        // Continue to next recipient even if one fails
      }
    }

    // Response body
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

// Get all users
export const getAllUsers = async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const offset = parseInt(req.query.offset) || 0;

  try {
    const users = await req.db.User.findAll({
      attributes: { exclude: ['password', 'email', 'resetToken'] },
      limit,
      offset,
      raw: true
    });

    return res.status(200).json({
      success: true,
      count: users.length,
      data: users,
      message: users.length === 0 ? 'No Users found' : undefined,
      pagination: {
        limit,
        offset
      }
    });
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    return res.status(500).json({
      success: false,
      message: 'Server Error: Unable to get all Users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}