import jwt from 'jsonwebtoken';

/**
 * Protect routes - verifies JWT token and checks if user is authenticated
 */
export const protect = async (req, res, next) => {
  try {
    let token;
    
    // Get token from header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Get token from cookie if not in header
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized to access this route. Please log in.'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from the token
      const user = await req.db.User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] } // Don't include password
      });

      if (!user) {
        return res.status(401).json({
          status: 'error',
          message: 'Invalid token. Please log in again.'
        });
      }

      // Debug: Log user's active status and type
      console.log('User active status check:', {
        userId: user.id,
        isActive: user.isActive,
        isActiveType: typeof user.isActive,
        userData: {
          ...user.get({ plain: true }),
          password: undefined // Don't log password
        }
      });

      // Debug: Log complete user object before isActive check
      console.log('User object before isActive check:', {
        id: user.id,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        isActiveType: typeof user.isActive,
        rawData: user.get ? user.get({ plain: true }) : 'No get() method',
        dataValues: user.dataValues || 'No dataValues'
      });

      // Check if user is active
      if (user.isActive === false) {
        console.log('User account is inactive:', user.id, user.email);
        return res.status(401).json({
          status: 'error',
          message: 'This account has been deactivated. Please contact support.',
          debug: process.env.NODE_ENV === 'development' ? {
            userId: user.id,
            isActive: user.isActive,
            isActiveType: typeof user.isActive
          } : undefined
        });
      }

      // Check if email is verified (except for email verification routes)
      if (!user.isEmailVerified && !req.path.includes('verify-email') && !req.path.includes('resend-verification')) {
        return res.status(403).json({
          status: 'error',
          message: 'Please verify your email address before accessing this resource.',
          code: 'EMAIL_NOT_VERIFIED'
        });
      }

      // Grant access to protected route
      req.user = user;
      next();
    } catch (error) {
      // Handle different JWT errors
      let message = 'Not authorized, token failed';
      
      if (error.name === 'TokenExpiredError') {
        message = 'Your session has expired. Please log in again.';
      } else if (error.name === 'JsonWebTokenError') {
        message = 'Invalid token. Please log in again.';
      }
      
      return res.status(401).json({
        status: 'error',
        message,
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * Authorize roles - checks if user has required role(s)
 * @param {...string} allowedRoles - Roles that are allowed to access the route
 */
export const authorize = (allowedRoles) => {
  return (req, res, next) => {
    // Check if user has required role
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: `User role ${req.user.role} is not authorized to access this route.`
      });
    }
    next();
  };
};

/**
 * Middleware to check if user is the owner of a resource or an admin
 * @param {string} model - The model name to check ownership against
 * @param {string} paramName - The name of the parameter containing the resource ID
 */
export const checkOwnership = (model, paramName = 'id') => {
  return async (req, res, next) => {
    try {
      const resource = await req.db[model].findByPk(req.params[paramName]);
      
      if (!resource) {
        return res.status(404).json({
          status: 'error',
          message: 'Resource not found'
        });
      }
      
      // Allow if user is admin or owner of the resource
      if (req.user.role !== 'admin' && resource.userId !== req.user.id) {
        return res.status(403).json({
          status: 'error',
          message: 'You do not have permission to perform this action'
        });
      }
      
      // Attach resource to request for use in the route handler
      req.resource = resource;
      next();
    } catch (error) {
      next(error);
    }
  };
};
