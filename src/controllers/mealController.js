import { Op, where } from 'sequelize';
import meal from '../models/meal.js';

// Helper function to process comma-separated string to array
const parseQueryParam = (param) => {
    if (!param) return [];
    return param.split(',').map(item => item.trim().toLowerCase()).filter(item => item !=="");
};


const getFilteredMeals = async (req, res) => {
    try {

        const { tags, excludeAllergens } = req.query;

        const whereClause = {};

        // // TAG Filtering (e.g., low-carb, high-protein)
        // if (tags) {
        //     const tagsArray = tags.split(',').map(tag => tag.trim());

        //     // Ensure all tags present (AND logic)
        //     whereClause.tags = {
        //         [Op.and]: tagsArray.map(tag => {
        //             return { [Op.substring]: tag }; // tag exists in tags string
        //         }),
        //     };
        // }


        // Filter by Dietary Tags
        const requestedTags = parseQueryParam(tags);
        if (requestedTags.length > 0) {
            whereClause[Op.and] = requestedTags.map(tag => ({
                dietaryTags: {
                    [Op.like]: `%"${tag}"%` // Matchs if the tag string is present in the JSON array string
                }
            }));
        }


        // ALLERGEN EXCLUSION (e,g., exclude=peanuts, gluten)
        
        const allergensToExclude = parseQueryParam(excludeAllergens);
        if (allergensToExclude.length > 0) {
            // Find meals where NONE of the excluded allergens are present in allergens array
            whereClause.allergens = {
                [Op.not]: {
                    [Op.like]: allergensToExclude.map (allergens => `%"${allergens}"%`)// Matches if any allergen string is present
                // The Op.not with LIKE will exclude if ANY of them match.
                }
            };

            
        }    /////////////
            const meals = await meal.findAll({
                where: { whereClause,
                    limit: 10,
                    offset: 0,
                    order: [['name', 'ASC']]
                }
            });

            if(meals.length === 0) {
                return res.status(404).json({ maeeage: 'No meals found matching your criteria.'});
            }

        res.status(200).json(meals);

    } catch (error) {
        console.error('Error fetching meals:', error);
        res.status(500).json({ message: 'Internal server error', error:error.message });
    }
};

const createMeal = async (req, res) => {
    try {
        const { name, description, imageUrl, dietaryTags, nutritionallnfo, allergens } = req.body;
        const newMeal = await meal.create({
            name,
            description,
            imageUrl,
            dietaryTags, // Sequelize will use the setter to stringify
            nutritionallnfo, // Sequelize will use the setter to stringify
            allergens // Sequelize will use the setter to stringify
        });

        res.status(201).json(newMeal);
    } catch (error) {
        console.error('Error creating meal:', error);
        res.status(500).json({ message: 'Error creating meal', error: error.message });
    }
};

const getMealById = async (req, res) => {
    try {
        const meal = await meal.findByPk(req.parrams.id);
        if (!meal) {
            return res.status(404).json({ message: 'Meal not found.' });
        }
        res.status(200).json(meal);
    } catch (error) {
        console.error('Error fetching meal by ID:', error);
        res.status(500).json({ message: 'Internal server error', error: error.message});
    }
};


export { getFilteredMeals, createMeal, getMealById };