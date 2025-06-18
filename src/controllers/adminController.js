import Restaurant from "../models/restaurant";

export const approveRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const restaurant = await Restaurant.findByPk(id);

    if (!restaurant) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Restaurant not found' 
      });
    }

    if (restaurant.isApproved) {
      return res.status(400).json({
        status: 'error',
        message: 'Restaurant is already approved'
      });
    }

    restaurant.isApproved = true;
    restaurant.status = 'active'; // Assuming you have a status field
    await restaurant.save();

    res.status(200).json({
      status: 'success',
      message: 'Restaurant approved successfully',
      data: {
        restaurant
      }
    });
  } catch (error) {
    console.error('Error approving restaurant:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Error approving restaurant',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

export const rejectRestaurant = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const restaurant = await Restaurant.findByPk(id);

    if (!restaurant) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Restaurant not found' 
      });
    }

    if (!restaurant.isApproved) {
      return res.status(400).json({
        status: 'error',
        message: 'Restaurant is already in pending or rejected state'
      });
    }

    restaurant.isApproved = false;
    restaurant.status = 'rejected';
    if (reason) {
      restaurant.rejectionReason = reason;
    }
    
    await restaurant.save();

    res.status(200).json({
      status: 'success',
      message: 'Restaurant rejected successfully',
      data: {
        restaurant
      }
    });
  } catch (error) {
    console.error('Error rejecting restaurant:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Error rejecting restaurant',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

