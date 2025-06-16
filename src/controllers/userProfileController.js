//User Profile Controller

export const getProfile = async (req, res) => {
  try {

    const user = await user.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'resetToken'] }
    });

    if (!user) {
      return res.status(404).json({
        success: false, 
        message: 'User not found'
      });
    }

    return res.status(200).json({
      success: true,
      data: user
    });
  }
  catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


export const updateProfile = async (req, res) => {
  try {
    const updates = {
      firstName: req.body.firstName,
      lastName: req.body.lastName,
      bio: req.body.bio,
      avatarUrl: req.body.avatarUrl,
    };

    const [updated] = await User.update(updates, {
      where: { id: req.user.id }
    });

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const updatedUser = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password', 'resetToken'] }
    });

    return res.status(200).json({
      success: true,
      data: updatedUser
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Server error: Unable to get user profile'
    });
  }
};

