import express from 'express';
import meal from '../models/meal.js';
import mealController from '../controllers/mealController.js';

// Express router
const router = express.Router();

router.get('/', mealController.getFilteredMeals);

// GET /api/meals?tags = low-carb, diabetic-friendly&exclude=peanuts
router.get('/', async (req, res) => {
    try {
        const { tags, exclude } = req.query;

        let fliter = {};

        // meal tags filter (AND logic)
        if (tags) {
            const tagsArray = tags.split(','); // e.g., ['low-carb', 'low-sugar', 'high-protein']
            fliter.tags = { $all: tagsArray };
        }


        // Exclude meals with certain allergens
        if (exclude) {
            const excludeArray = exclude.split(','); // e.g., ['peanuts']
            fliter.allergens = { $not: { $in: excludeArray } };
        }

        const meals = await meal.find(filter);
        res.json(meals);
    } catch (err) {
        res.status(500).json({ error: err.message('Internal Server Error') });
    }
});

export default router;