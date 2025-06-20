import { Op } from 'sequelize';
import {db} from '../config/database.js';

// Get models
const UserProfile = db.UserProfile;
const Meal = db.Meal;

// Create User Profile
export const createUserProfile = async (req, res) => {
  try {
    const { healthGoal, dietaryRestrictions, preferredMealTags } = req.body;
    const userId = req.user.id;

    console.log('Creating profile for user:', userId);
    console.log('Profile data:', { healthGoal, dietaryRestrictions, preferredMealTags });

    // Check if user exists
    const user = await db.User.findByPk(userId);
    if (!user) {
      console.error('User not found:', userId);
      return res.status(404).json({ 
        message: 'User not found',
        error: `User with ID ${userId} does not exist`
      });
    }

    // Check if profile already exists (including soft-deleted ones)
    const existingProfile = await UserProfile.findOne({
      where: { userId },
      paranoid: false // Include soft-deleted profiles
    });

    if (existingProfile) {
      if (existingProfile.deletedAt) {
        // Restore the soft-deleted profile
        console.log('Restoring soft-deleted profile for user:', userId);
        existingProfile.setDataValue('deletedAt', null);
        existingProfile.healthGoal = healthGoal || existingProfile.healthGoal;
        existingProfile.dietaryRestrictions = dietaryRestrictions || existingProfile.dietaryRestrictions;
        existingProfile.preferredMealTags = preferredMealTags || existingProfile.preferredMealTags;
        
        const updatedProfile = await existingProfile.save({ paranoid: false });
        
        return res.status(200).json({ 
          message: 'Profile restored successfully', 
          data: updatedProfile
        });
      }
      
      return res.status(400).json({ 
        message: 'Profile already exists',
        error: 'A profile already exists for this user'
      });
    }

    // Create new profile
    const profile = await UserProfile.create({
      userId,
      healthGoal: healthGoal || null,
      dietaryRestrictions: dietaryRestrictions || [],
      preferredMealTags: preferredMealTags || [],
    });

    console.log('Profile created successfully:', profile.id);
    
    res.status(201).json({ 
      message: 'Profile created successfully', 
      data: profile
    });
  }
  catch (error) {
    console.error('Error creating user profile:', error);
    
    // Handle validation errors
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map(err => ({
        field: err.path,
        message: err.message,
        value: err.value
      }));
      
      return res.status(400).json({
        message: 'Validation Error',
        errors: errors,
        originalError: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
    
    res.status(500).json({
      message: 'Server Error',
      error: process.env.NODE_ENV === 'development' ? error.message : 'An error occurred while creating the profile',
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  }
};

// Updates User Profile
export const updateUserProfile = async (req, res) => {
  try {
    const { healthGoal, dietaryRestrictions, preferredMealTags } = req.body;
    const userId = req.user.id;

    const profile = await UserProfile.findOne({ where: { userId } });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    profile.healthGoal = healthGoal || profile.healthGoal;
    profile.dietaryRestrictions = dietaryRestrictions || profile.dietaryRestrictions;
    profile.preferredMealTags = preferredMealTags || profile.preferredMealTags;

    await profile.save();

    res.status(200).json({ 
      message: 'Profile updated successfully',
      data: profile
    });
  }
  catch (error) {
    res.status(500).json({ 
      message: 'Server Error', 
      error: error.message 
    });
  }
};

// Gets User Profile
export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await UserProfile.findOne({ where: { userId } });

    if (!profile) {
      return res.status(404).json({ message: 'User profile not found' });
    }

    res.status(200).json({ 
       message: 'Profile retrieved sucesfully',
      data: {
        goal: profile.healthGoal,
        restrictions: profile.dietaryRestrictions,
        preferences: profile.preferredMealTags }
     });
  } catch (error) {
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
};

// Get Meals Based on User Preferences
export const getMealsForUser = async (req, res) => {
  try {
    const userId = req.user.id;
    const profile = await UserProfile.findOne({ where: { userId } });

    if (!profile) {
      return res.status(404).json({ message: 'User profile not found' });
    }
    
    let { dietaryRestrictions, preferredMealTags } = profile;
    
    // Ensure we're working with arrays
    if (typeof preferredMealTags === 'string') {
      try {
        preferredMealTags = JSON.parse(preferredMealTags);
      } catch (e) {
        preferredMealTags = [];
      }
    }
    
    if (typeof dietaryRestrictions === 'string') {
      try {
        dietaryRestrictions = JSON.parse(dietaryRestrictions);
      } catch (e) {
        dietaryRestrictions = [];
      }
    }

    if (!preferredMealTags || !Array.isArray(preferredMealTags) || preferredMealTags.length === 0) {
      return res.status(400).json({ message: 'No preferred meal tags found in profile' });
    }

    // Get all meals first
    const allMeals = await Meal.findAll();
    
    // Filter meals based on preferred tags and restrictions
    const filteredMeals = allMeals.filter(meal => {
      // Skip if meal has no tags
      if (!meal.dietaryTags) return false;
      
      // Parse meal tags if they're stored as string
      let mealTags = meal.dietaryTags;
      if (typeof mealTags === 'string') {
        try {
          mealTags = JSON.parse(mealTags);
        } catch (e) {
          return false; // Skip if tags can't be parsed
        }
      }
      
      // Check if meal has any of the preferred tags
      const hasPreferredTag = preferredMealTags.some(tag => 
        mealTags.includes(tag)
      );
      
      // Check if meal has any restricted tags
      const hasRestrictedTag = Array.isArray(dietaryRestrictions) && 
        dietaryRestrictions.some(restriction => 
          mealTags.includes(restriction)
        );
      
      return hasPreferredTag && !hasRestrictedTag;
    });

    res.status(200).json({
      message: 'Filtered meals successfully retrieved',
      meals: filteredMeals 
    });
  }
  catch (error) {
    console.error('Error in getMealsForUser:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Deletes user profile
export const deleteUserProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const profile = await UserProfile.findOne({ where: { userId } });

    if (!profile) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    await profile.destroy();

    res.status(200).json({ message: 'Profile deleted successfully' });
  }
  catch (error) {
    res.status(500).json({
      message: 'Server Error',
      error: error.message 
    });
  }
};
