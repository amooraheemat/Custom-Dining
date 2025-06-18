import Restaurant from "../models/restaurant.js";
import User from "../models/user.js";

export const approveRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findByPk(id);

    if (restaurant) {
      return res.status(404).json({ message: "Restaurant not found" });
    }

    restaurant.isApproved = true;
    await restaurant.save();

    res.status(200).json({
      message: "Restaurant approved",
      restaurant,
    });
  } catch (error) {
    res.status(500).json({ message: "Error approving restaurant", error });
  }
}

export const rejectRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findByPk(id);

    if (restaurant) {
      return res.status(404).json({ message: "No restaurant found" });
    }

    restaurant.isApproved = false;
    await restaurant.save();

    res.status(200).json({
      message: "Restaurant rejected",
      restaurant,
    });
  } catch (error) {
    res.status(500).json({ message: "Error rejecting restaurant", error });
  }
}

//Get All Users
export const getAllUsers = async (req,res) => {

  const limit = parseInt(req.query.limit) || 10;  // Default is 10
  const offset = parseInt(req.query.offset) || 0;

  try{
    const users = await User.findAll({
      attributes: {exclude: ['password', 'email', 'resetToken'] },
      limit,
      offset
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
  }
  catch (error) {
    console.error( 'Unable to get Users', error);

    return res.status(500).json({
      success: false,
      message: 'Server Error: Unable to get all Users'
    });
  }
}