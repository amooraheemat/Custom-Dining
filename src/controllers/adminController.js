import Restaurant from "../models/restaurant";

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

