import { Favorite } from '../models/favorite.js';
import { Meal } from '../models/meal.js';


//Adds a meal to the User's Favorite List
export const addFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mealId } = req.body;

    if (!mealId) {
      return res.status(400).json({ message: 'Meal ID required' });
    }
   
    //checks if Meal still exists 
    const meal = await Meal.findByPk(mealId);
    if (!meal) {
      return res.status(404).json({ message: 'Meal does not exist' });
    }

    // Checks if the meal is already favorited
    const existingFavorite = await Favorite.findOne({ where: { userId, mealId } });
    if (existingFavorite) {
      return res.status(400).json({ message: 'Meal already saved' });
    }
    const favorite = await Favorite.create({ userId, mealId });

    res.status(201).json({ 
        message: 'Meal added to favorites', 
        favorite 
    });
  }
  catch (error) {
    res.status(500).json({ 
        message: 'Server Error, Please try again later', 
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Get All Favorited Meals
export const getAllFavorites = async (req, res) => {
    const limit = parseInt(req.query.limit) || 10;  // Default is 10
    const offset = parseInt(req.query.offset) || 0;

  try {
    const userId = req.user.id;
    const total = await Favorite.count({ where: { userId } });


    const favorites = await Favorite.findAll({
      where: { userId },
      include: [
        { model: Meal, 
        attributes: ['id', 'title', 'nutritionalInfo', 'dietaryTags'] }
      ],
      limit,
      offset
    });

    res.status(200).json({ 
        message: 'Favorite meals retrieved successfully', 
        count: favorites.length,
        total,
        favorites 
    });
  }
  catch (error) {
    res.status(500).json({ 
        message: 'Server Error, Please try again later', 
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Remove a Meal from Favorites
export const removeFavorite = async (req, res) => {
  try {
    const userId = req.user.id;
    const { mealId } = req.params;

    const favorite = await Favorite.findOne({ where: { userId, mealId } });

    if (!favorite) {
      return res.status(404).json({ message: 'Favorite not found' });
    }

    await favorite.destroy();
    res.status(200).json({ message: 'Meal removed from favorites' });

  }
  catch (error) {
    res.status(500).json({
        message: 'Server Error, Please try again later', 
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};
