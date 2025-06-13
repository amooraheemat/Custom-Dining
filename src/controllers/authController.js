import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { Op } from 'sequelize';
import { 
  sendVerificationEmail,
  sendPasswordResetEmail
} from '../services/emailService.js';

// Password validation helper function
const validatePassword = (password) => {
  const errors = [];
  
  if (!password || typeof password !== 'string') {
    errors.push('Password must be a valid string');
    return { isValid: false, errors };
  }
  
  const length = password.length;
  
  if (length < 8 || length > 30) {
    errors.push(`Password must be between 8 and 30 characters (got ${length})`);
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/(?=.*[\W_])/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRATION
  });
};

export const register = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    // Check for missing fields
    const missingFields = [];
    if (!username) missingFields.push({ field: 'username', message: 'Username is required' });
    if (!email) missingFields.push({ field: 'email', message: 'Email is required' });
    if (!password) {
      missingFields.push({ field: 'password', message: 'Password is required' });
    } else {
      // Password validation
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(password)) {
        missingFields.push({
          field: 'password',
          message: 'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character'
        });
      }
    }

    if (missingFields.length > 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors: missingFields
      });
    }

    // Check if email already exists
    const existingEmail = await req.db.User.findOne({ where: { email } });
    if (existingEmail) {
      return res.status(400).json({
        status: 'error',
        message: 'Email already exists',
        errors: [{
          field: 'email',
          message: 'This email is already registered'
        }]
      });
    }

    // Check if username already exists
    const existingUsername = await req.db.User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(400).json({
        status: 'error',
        message: 'Username already exists',
        errors: [{
          field: 'username',
          message: 'This username is already taken'
        }]
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    
    // Create user with verification token
    const user = await req.db.User.create({
      username,
      email,
      password,
      role: role || 'user',
      isActive: false,
      emailVerificationToken: hashedToken,
      emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
    });

    // Send verification email
    try {
      await sendVerificationEmail(user, verificationToken);
    } catch (emailError) {
      console.error('Error sending verification email:', emailError);
      // Continue with the response even if email fails
    }

    res.status(201).json({
      status: 'success',
      message: 'Registration successful! Please check your email to verify your account.'
    });

  } catch (error) {
    console.error('Registration error:', error);
    
    // Handle Sequelize validation errors
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      const errors = error.errors.map(err => ({
        field: err.path,
        message: err.message
      }));
      
      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors
      });
    }

    // Handle other errors
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check if email and password exist
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide email and password'
      });
    }

    // Find user
    const user = await req.db.User.findOne({ where: { email } });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        status: 'error',
        message: 'Incorrect email or password'
      });
    }

    // Check if email is verified
    if (!user.isEmailVerified) {
      return res.status(403).json({
        status: 'error',
        message: 'Please verify your email before logging in. Check your email for the verification link.'
      });
    }


    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user.id);

    // Remove sensitive data before sending response
    user.password = undefined;

    res.status(200).json({
      status: 'success',
      token,
    });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        status: 'error',
        message: 'Verification token is required'
      });
    }

    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await req.db.User.findOne({
      where: {
        emailVerificationToken: hashedToken,
        emailVerificationExpires: { [Op.gt]: Date.now() }
      }
    });

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired verification token'
      });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.isActive = true;
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    res.status(200).json({
      status: 'success',
      message: 'Email verified successfully. You can now log in.'
    });
  } catch (error) {
    next(error);
  }
};

export const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is required'
      });
    }

    const user = await req.db.User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'Email is not associated with any user'
      });
    }

    if (user.isEmailVerified) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is already verified'
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    
    // Save verification token to user
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    await user.save();

    // Send verification email with token
    await sendVerificationEmail(user, verificationToken);

    res.status(200).json({
      status: 'success',
      message: 'Verification email sent. Please check your inbox.'
    });
  } catch (error) {
    console.error('Error in resendVerificationEmail:', error);
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await req.db.User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'No user found with that email'
      });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    await user.save();

    try {
      await sendPasswordResetEmail(user, resetToken);

      res.json({
        status: 'success',
        message: 'Password reset link sent to your email'
      });
    } catch (error) {
      console.error('Password reset email error:', error);
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      await user.save();

      return res.status(500).json({
        status: 'error',
        message: 'Error sending email. Please try again later.'
      });
    }
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    console.log('Reset password request received');
    console.log('Request params:', req.params);
    console.log('Request body:', req.body);
    
    const { token } = req.params;
    const { password } = req.body;

    if (!token) {
      console.error('No token provided');
      return res.status(400).json({
        status: 'error',
        message: 'Token is required'
      });
    }

    if (!password) {
      console.error('No password provided');
      return res.status(400).json({
        status: 'error',
        message: 'Password is required'
      });
    }

    // Hash the token
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    console.log('Looking for user with token:', resetPasswordToken);
    
    const user = await req.db.User.findOne({
      where: {
        resetPasswordToken,
        resetPasswordExpires: { [Op.gt]: Date.now() }
      }
    });

    if (!user) {
      console.error('User not found or token expired');
      return res.status(400).json({
        status: 'error',
        message: 'Token is invalid or has expired'
      });
    }


    try {
      // Validate password before updating
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        return res.status(400).json({
          status: 'error',
          message: 'Password validation failed',
          errors: passwordValidation.errors
        });
      }

      // Update password
      console.log('Updating password for user:', user.id);
      user.password = password;
      user.resetPasswordToken = null;
      user.resetPasswordExpires = null;
      
      console.log('Saving user...');
      await user.save();
      console.log('User saved successfully');

      // Generate new token
      const newToken = generateToken(user.id);

      res.json({
        status: 'success',
        message: 'Password reset successfully'
      });
    } catch (saveError) {
      console.error('Error saving user:', saveError);
      if (saveError.name === 'SequelizeValidationError') {
        const messages = saveError.errors.map(err => ({
          field: err.path,
          message: err.message
        }));
        return res.status(400).json({
          status: 'error',
          message: 'Validation error',
          errors: messages
        });
      }
      throw saveError;
    }
  } catch (error) {
    console.error('Unexpected error in resetPassword:', error);
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await req.db.User.findByPk(req.user.id);

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({
        status: 'error',
        message: 'Current password is incorrect'
      });
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Password validation failed',
        errors: passwordValidation.errors
      });
    }

    user.password = newPassword;
    await user.save();

    res.json({
      status: 'success',
      message: 'Password updated successfully'
    });
  } catch (error) {
    next(error);
  }
};
