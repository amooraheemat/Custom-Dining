import { Op } from 'sequelize';
import meal from '../models/meal.js';

getFilteredMeals = async (req, res) => {
    try {

        const { tags, exclude } = req.query;

        let whereClause = {};

        // TAG Filtering (e.g., low-carb, high-protein)
        if (tags) {
            const tagsArray = tags.split(',').map(tag => tag.trim());

            // Ensure all tags present (AND logic)
            whereClause.tags = {
                [Op.and]: tagsArray.map(tag => {
                    return { [Op.substring]: tag }; // tag exists in tags string
                }),
            };
        }

        // ALLERGEN EXCLUSION (e,g., exclude=peanuts, gluten)
        if (exclude) {
            const excludeArray = exclude.split(',').map(allergen => allergen.trim());

            whereClause.allergens = {
                [Op.notRegexp]: excludeArray.join('|'), //excludes any matching allergen
            };
        }

        const meals = await meal.findAll({ where: whereClause });
        res.status(200).json(meals);
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'something went wrong!' });
    }
};

export default mealController;