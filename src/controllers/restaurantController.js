import Restaurant from "../models/restaurant.js";

//create a new restaurant
export const createRestaurant = async (req, res) => {
  try {
    const { name, location, meals } = req.body;
    const newRestaurant = await Restaurant.create({ name, location, meals });
    res.status(201).json({ message: "Restaurant created successfully", restaurant: newRestaurant });
  } catch (error) {
    res.status(500).json({ message: "Error creating restaurant", error });
  }
};

//get all restaurants
export const getAllRestaurants = async (req, res) => {
  try {
    const restaurants = await Restaurant.findAll();
    res.status(200).json(restaurants);
  } catch (error) {
    res.status(500).json({ message: "Error fetching restaurants", error });
  }
};

//get a restaurant by id
export const getRestaurantById = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findByPk(id);
    if (!restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }
    res.status(200).json(restaurant);
  } catch (error) {
    res.status(500).json({ message: "Error fetching restaurant", error });
  }
};


