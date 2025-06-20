import { Op } from 'sequelize';

// Helper function to process query parameters into arrays
const parseQueryParam = (param) => {
  if (!param) return [];
  return Array.isArray(param) ? param : [param];
};

// Helper function to build JSON array search condition with partial matching
const buildJsonArrayCondition = (req, values, field) => {
  if (!values || values.length === 0) return null;
  
  return {
    [Op.and]: values.map(value => ({
      [Op.and]: [
        req.db.sequelize.literal(`JSON_SEARCH(${field}, 'one', '%${value}%') IS NOT NULL`)
      ]
    }))
  };
};

// Helper function to build JSON array exclusion condition for MySQL JSON_CONTAINS
const buildJsonArrayExclusion = (req, values, field) => {
  if (!values || values.length === 0) return null;
  
  return {
    [Op.and]: values.map(value => ({
      [Op.not]: req.db.sequelize.literal(`JSON_CONTAINS(${field}, '\"${value}\"')`)
    }))
  };
};

/**
 * @swagger
 * /meals:
 *   get:
 *     summary: Get all meals with optional filtering
 *     tags: [Meals]
 *     parameters:
 *       - in: query
 *         name: dietaryTags
 *         schema:
 *           type: string
 *         description: Comma-separated list of dietary tags to filter by
 *       - in: query
 *         name: excludeAllergens
 *         schema:
 *           type: string
 *         description: Comma-separated list of allergens to exclude
 *     responses:
 *       200:
 *         description: List of meals
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Meal'
 */
const getFilteredMeals = async (req, res) => {
  try {
    let { dietaryTags, excludeAllergens, restaurantId } = req.query;
    const whereClause = {};
    const conditions = [];

    // Filter by restaurant if provided
    if (restaurantId) {
      whereClause.restaurantId = restaurantId;
    }

    // Convert comma-separated strings to arrays
    if (typeof dietaryTags === 'string') {
      dietaryTags = dietaryTags.split(',').map(tag => tag.trim().toLowerCase());
    }
    
    if (typeof excludeAllergens === 'string') {
      excludeAllergens = excludeAllergens.split(',').map(allergen => allergen.trim().toLowerCase());
    }

    // Filter by dietary tags
    if (dietaryTags && dietaryTags.length > 0) {
      
      const tagConditions = dietaryTags.map(tag => {
        return req.db.sequelize.literal(
          `JSON_CONTAINS(LOWER(\`Meal\`.\`dietaryTags\`), JSON_QUOTE(LOWER('${tag.replace(/'/g, "''")}')))`
        );
      });
      
      // Combine tag conditions with OR
      conditions.push({
        [Op.or]: tagConditions
      });
    }

    if (excludeAllergens && excludeAllergens.length > 0) {
      // For each allergen, add a condition to check it's not in the allergens array
      excludeAllergens.forEach(allergen => {
        conditions.push(
          req.db.sequelize.literal(
            `JSON_SEARCH(LOWER(\`allergens\`), 'one', LOWER('${allergen.replace(/'/g, "''")}')) IS NULL`
          )
        );
      });
    }

    // Combine all conditions with AND
    if (conditions.length > 0) {
      whereClause[Op.and] = conditions;
    }

    // First, get just the IDs to avoid circular references
    const mealIds = await req.db.Meal.findAll({
      attributes: ['id'],
      where: whereClause,
      order: [['createdAt', 'DESC']],
      raw: true
    });

    if (!mealIds.length) {
      return res.status(200).json({ 
        status: 'success',
        message: 'No meals found matching your criteria.',
        data: []
      });
    }

    // Then fetch the full data with associations
    const meals = await req.db.Meal.findAll({
      where: {
        id: mealIds.map(m => m.id)
      },
      include: [{
        model: req.db.Restaurant,
        as: 'restaurant',
        attributes: ['id', 'name', 'location']
      }],
      order: [['createdAt', 'DESC']],
      raw: true,
      nest: true
    });

    // Convert JSON strings to arrays if needed
    const processedMeals = meals.map(meal => {
      // Helper function to safely parse JSON fields
      const safeJsonParse = (value, defaultValue) => {
        try {
          if (Array.isArray(value)) return value;
          if (typeof value === 'string') {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : defaultValue;
          }
          return defaultValue;
        } catch (e) {
          return defaultValue;
        }
      };
      
      // Create a clean object with only the data we want to send
      const cleanMeal = {
        id: meal.id,
        name: meal.name,
        description: meal.description,
        price: meal.price,
        imageUrl: meal.imageUrl,
        isAvailable: meal.isAvailable,
        restaurantId: meal.restaurantId,
        createdAt: meal.createdAt,
        updatedAt: meal.updatedAt,
        dietaryTags: safeJsonParse(meal.dietaryTags, []),
        allergens: safeJsonParse(meal.allergens, []),
        nutritionalInfo: typeof meal.nutritionalInfo === 'object' 
          ? meal.nutritionalInfo 
          : (() => {
              try {
                return JSON.parse(meal.nutritionalInfo || '{}');
              } catch (e) {
                return {};
              }
            })(),
        restaurant: meal.restaurant
      };
      
      return cleanMeal;
    });

    if (processedMeals.length === 0) {
      return res.status(200).json({ 
        status: 'success',
        message: 'No meals found matching your criteria.',
        data: []
      });
    }

    res.status(200).json({
      status: 'success',
      results: processedMeals.length,
      data: processedMeals
    });
  } catch (error) {
    console.error('Error fetching meals:', error);
    
    // Extract a clean error message
    const errorMessage = error.message || 'An unknown error occurred';
    
    res.status(500).json({ 
      status: 'error',
      message: 'Failed to fetch meals',
      ...(process.env.NODE_ENV === 'development' && { error: errorMessage })
    });
  }
};

/**
 * @swagger
 * /meals:
 *   post:
 *     summary: Create a new meal (Restaurant owners and admins only)
 *     tags: [Meals]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Meal'
 *     responses:
 *       201:
 *         description: Meal created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Meal'
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized - User not authenticated
 *       403:
 *         description: Forbidden - User not authorized to create meals for this restaurant
 *       404:
 *         description: Restaurant not found
 */
const createMeal = async (req, res) => {
  const transaction = await req.db.sequelize.transaction();
  
  try {
    const { name, description, price, dietaryTags, nutritionalInfo, allergens, restaurantId } = req.body;
    let targetRestaurantId = restaurantId;
    
    // For restaurant users, get their restaurant ID automatically
    if (req.user.role === 'restaurant') {
      // Find the restaurant owned by this user
      const usersRestaurant = await req.db.Restaurant.findOne({
        where: { userId: req.user.id },
        attributes: ['id'],
        transaction
      });

      if (!usersRestaurant) {
        await transaction.rollback();
        return res.status(403).json({ 
          status: 'error',
          message: 'No restaurant found for this user' 
        });
      }
      
      // Use the user's restaurant ID
      targetRestaurantId = usersRestaurant.id;
      
      // If restaurantId was provided, verify it matches the user's restaurant
      if (restaurantId && restaurantId !== targetRestaurantId) {
        await transaction.rollback();
        return res.status(403).json({ 
          status: 'error',
          message: 'You can only create meals for your own restaurant' 
        });
      }
    } 
    // For admins, require restaurantId
    else if (req.user.role === 'admin') {
      if (!restaurantId) {
        await transaction.rollback();
        return res.status(400).json({
          status: 'error',
          message: 'restaurantId is required for admin users'
        });
      }
      
      // Verify the restaurant exists
      const restaurantExists = await req.db.Restaurant.findByPk(restaurantId, { transaction });
      if (!restaurantExists) {
        await transaction.rollback();
        return res.status(404).json({
          status: 'error',
          message: 'Restaurant not found'
        });
      }
    } 
    // No other roles should be able to create meals
    else {
      await transaction.rollback();
      return res.status(403).json({
        status: 'error',
        message: 'You do not have permission to create meals'
      });
    }

    const newMeal = await req.db.Meal.create({
      name,
      description,
      price,
      dietaryTags: dietaryTags || [],
      nutritionalInfo: nutritionalInfo || {},
      allergens: allergens || [],
      restaurantId: targetRestaurantId, // Use the resolved restaurant ID
      isAvailable: true
    }, { transaction });

    await transaction.commit();
    
    // Include restaurant details in the response
    const mealWithRestaurant = await req.db.Meal.findByPk(newMeal.id, {
      include: [{
        model: req.db.Restaurant,
        as: 'restaurant',
        attributes: ['id', 'name', 'location']
      }]
    });

    res.status(201).json(mealWithRestaurant);
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating meal:', error);
    
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        message: 'Validation error',
        errors: error.errors.map(e => e.message)
      });
    }
    
    res.status(500).json({ 
      message: 'Error creating meal', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * @swagger
 * /meals/{id}:
 *   get:
 *     summary: Get a meal by ID
 *     tags: [Meals]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Meal ID
 *     responses:
 *       200:
 *         description: Meal details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Meal'
 *       404:
 *         description: Meal not found
 */
const getMealById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const meal = await req.db.Meal.findByPk(id, {
      include: [{
        model: req.db.Restaurant,
        as: 'restaurant',
        attributes: ['id', 'name', 'location']
      }]
    });
    
    if (!meal) {
      return res.status(404).json({ message: 'Meal not found' });
    }
    
    res.status(200).json(meal);
  } catch (error) {
    console.error('Error fetching meal:', error);
    res.status(500).json({ 
      message: 'Error fetching meal', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export { getFilteredMeals, createMeal, getMealById };