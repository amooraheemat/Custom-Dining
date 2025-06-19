import UserProfile from '../models/userProfile.js';
import Meal from '../models/meal.js';
import { Op } from 'sequelize';

// Create User Profile
export const createUserProfile = async (req, res) => {
  try {
    const { healthGoal, dietaryRestrictions, preferredMealTags } = req.body;
    const userId = req.user.id;

    // Checks if profile already exists
    const existingProfile = await UserProfile.findOne({ where: { userId } });
    if (existingProfile) {
      return res.status(400).json({ message: 'Profile already exists.' });
    }

    const profile = await UserProfile.create({
      userId,
      healthGoal,
      dietaryRestrictions,
      preferredMealTags,
    });

    res.status(201).json({ 
      message: 'Profile created successfully', 
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
    const { dietaryRestrictions, preferredMealTags } = profile;

    if (!preferredMealTags || !dietaryRestrictions) {
  return res.status(400).json({message: 'User preference is incomplete.' });
    }

   

    const meals = await Meal.findAll({
      where: {
        dietaryTags: {
          [Op.contains]: preferredMealTags,
        },
      },
    });

    const filteredMeals = meals.filter(meal => {
      return !dietaryRestrictions.some(restriction =>
        meal.dietaryTags.includes(restriction)
      );
    });

    res.status(200).json({
      message: 'Filtered meals successfully retrieved',
      meals: filteredMeals 
    });
  }
  catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
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
