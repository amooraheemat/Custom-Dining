import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { Op } from 'sequelize';
import Email from '../utils/email.js';
import { 
  sendVerificationEmail
} from '../services/emailService.js';

// @desc    Logout user / clear cookie
// @route   POST /auth/logout
// @access  Public
export const logout = (req, res) => {
  try {
    // Clear the token cookie
    res.cookie('token', 'none', {
      expires: new Date(Date.now() + 10 * 1000), // Expires in 10 seconds
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    

    res.status(200).json({
      success: true,
      message: 'User logged out successfully'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging out',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

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

// Generate a secure, user-friendly temporary password
const generateTemporaryPassword = () => {
  const lowercase = 'abcdefghjkmnpqrstuvwxyz'; 
  const uppercase = 'ABCDEFGHJKMNPQRSTUVWXYZ'; 
  const numbers = '23456789'; 
  const symbols = '!@#$%^&*';
  
  // Ensure we have at least one character from each set
  const randomLower = lowercase[Math.floor(Math.random() * lowercase.length)];
  const randomUpper = uppercase[Math.floor(Math.random() * uppercase.length)];
  const randomNumber = numbers[Math.floor(Math.random() * numbers.length)];
  const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
  
  // Generate the rest of the password
  const allChars = lowercase + uppercase + numbers + symbols;
  let tempPassword = randomLower + randomUpper + randomNumber + randomSymbol;
  
  // Add more random characters to make it 12 characters long
  for (let i = 0; i < 8; i++) {
    tempPassword += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password to make it more random
  return tempPassword.split('').sort(() => 0.5 - Math.random()).join('');
};

// Generate token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRATION
  });
};

// Register
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
    const userData = {
      username,
      email,
      password,
      role,
      isActive: false,
      isEmailVerified: false,
      verificationToken: hashedToken,
      emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours from now
    };
    
    const user = await req.db.User.create(userData);

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

// Login
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

    // Find user with profile
    const user = await req.db.User.findOne({
      where: { email },
      include: [{
        model: req.db.UserProfile,
        as: 'profile',
        required: false
      }]
    });

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

    // Check if temporary password has expired
    if (user.isTemporaryPassword && new Date() > user.temporaryPasswordExpires) {
      return res.status(401).json({
        status: 'error',
        message: 'Your temporary password has expired. Please request a new password reset.'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token with additional data
    const tokenPayload = {
      id: user.id,
      forcePasswordChange: user.isTemporaryPassword || user.forcePasswordChange
    };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION
    });

    // Remove sensitive data before sending response
    user.password = undefined;

    // Check if password needs to be changed
    if (user.isTemporaryPassword || user.forcePasswordChange) {
      return res.status(200).json({
        status: 'success',
        token,
        forcePasswordChange: true,
        hasUserProfile: !!user.profile,
        message: 'Please change your temporary password.'
      });
    }

    res.status(200).json({
      status: 'success',
      token,
      forcePasswordChange: false,
      hasUserProfile: !!user.profile,
      role: user.role,
    });
  } catch (error) {
    next(error);
  }
};

// Verify email
export const verifyEmail = async (req, res, next) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        status: 'error',
        message: 'Verification token is required'
      });
    }

    // Hash the token from the URL
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // First find the user by token without checking expiration
    const user = await req.db.User.findOne({
      where: { verificationToken: hashedToken }
    });
    
    // Then check if the token has expired
    if (user && user.emailVerificationExpires < Date.now()) {
      return res.status(400).json({
        status: 'error',
        message: 'Verification token has expired. Please request a new one.'
      });
    }

    if (!user) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid or expired verification token'
      });
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.isActive = true;
    user.verificationToken = null;
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

// Resend verification email
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

    // Check if email is verified AND has no verification token
    if (user.isEmailVerified && !user.verificationToken) {
      return res.status(400).json({
        status: 'error',
        message: 'Email is already verified'
      });
    }

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    
    // Update only the verification token and expiration
    await req.db.User.update(
      {
        verificationToken: hashedToken,
        emailVerificationExpires: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
      },
      {
        where: { id: user.id },
        fields: ['verificationToken', 'emailVerificationExpires']
      }
    );

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

// Forgot password
export const forgotPassword = async (req, res, next) => {
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
      // Don't reveal that the email doesn't exist for security reasons
      return res.json({
        status: 'success',
        message: 'If an account with that email exists, a temporary password has been sent.'
      });
    }

    try {
      // Generate a more user-friendly temporary password
      const temporaryPassword = generateTemporaryPassword();
      
      // Set expiration to 24 hours from now
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      // Hash the password manually since we're bypassing hooks
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(temporaryPassword, salt);
      
      console.log('Updating user with temporary password:', {
        userId: user.id,
        passwordStartsWith: hashedPassword.substring(0, 10) + '...',
        expiresAt,
        hashedPasswordLength: hashedPassword.length
      });
      
      // Update user with the new temporary password using direct SQL
      try {
        await req.db.sequelize.query(
          'UPDATE `Users` ' +
          'SET `password` = ?, ' +
          '`isTemporaryPassword` = TRUE, ' +
          '`temporaryPasswordExpires` = ?, ' +
          '`forcePasswordChange` = TRUE, ' +
          '`updatedAt` = NOW() ' +
          'WHERE `id` = ?',
          {
            replacements: [hashedPassword, expiresAt, user.id],
            type: 'UPDATE'
          }
        );
        
        console.log('Successfully updated user with temporary password');
      } catch (dbError) {
        console.error('Database update error:', {
          message: dbError.message,
          sql: dbError.sql,
          parameters: dbError.parameters || dbError.bind,
          original: dbError.original
        });
        throw dbError; // Re-throw to be caught by the outer catch block
      }
      
      // Refresh the user object
      await user.reload();
      
      try {
        // Create email with the temporary password
        const emailService = new Email(user, process.env.FRONTEND_URL || 'http://localhost:3000');
        await emailService.sendTemporaryPassword(temporaryPassword);
        
        console.log(`Temporary password sent to ${user.email}`);

        return res.json({
          status: 'success',
          message: 'If an account with that email exists, a temporary password has been sent.'
        });
      } catch (emailError) {
        console.error('Failed to send password reset email:', emailError);
        
        // Don't reveal the error details to the client
        return res.status(500).json({
          status: 'error',
          message: 'Error sending email. Please try again later.'
        });
      }
    } catch (error) {
      // Log the full error for debugging
      console.error('Error in password reset process:', {
        message: error.message,
        name: error.name,
        code: error.code,
        // Include database error details if available
        ...(error.original && {
          originalMessage: error.original.message,
          originalCode: error.original.code,
          sqlState: error.original.sqlState,
          sqlMessage: error.original.sqlMessage
        }),
        // Include the SQL query if available
        ...(error.sql && { 
          sql: error.sql,
          parameters: error.parameters || error.bind
        }),
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });

      // Return appropriate error response
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred while processing your request. Please try again.',
        // Include more details in development
        ...(process.env.NODE_ENV === 'development' && { 
          error: error.message,
          code: error.code,
          ...(error.original && {
            originalError: error.original.message,
            sqlState: error.original.sqlState
          })
        })
      });
    }
  } catch (error) {
    next(error);
  }
};

// Reset password - Changes password for users with temporary passwords or when changing password
// This is used after login when forcePasswordChange is true
export const resetPassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // 1) Get user from the collection
    const user = await req.db.User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found.'
      });
    }
    
    // 2) Check if current password is correct
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({
        status: 'error',
        message: 'Your current password is incorrect.'
      });
    }
    
    // 3) Check if new password and confirm password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'New password and confirm password do not match.'
      });
    }
    
    // 4) Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Password does not meet requirements',
        errors: passwordValidation.errors
      });
    }
    
    // 5) Check if new password is the same as the current one
    if (await user.comparePassword(newPassword)) {
      return res.status(400).json({
        status: 'error',
        message: 'New password cannot be the same as the current password.'
      });
    }
    
    // 6) Update password and reset temporary flags using the model's save method
    // This ensures all hooks are triggered correctly
    console.log('Updating password for user:', user.id);
    
    // Update the password - this will trigger the beforeUpdate hook
    user.password = newPassword;
    user.isTemporaryPassword = false;
    user.forcePasswordChange = false;
    user.temporaryPasswordExpires = null;
    
    // Save the user - this will trigger the beforeUpdate hook to hash the password
    await user.save();
    
    console.log('Password updated successfully for user:', user.id);
    
    // 7) Generate new token without forcePasswordChange flag
    const tokenPayload = {
      id: user.id,
      forcePasswordChange: false
    };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION
    });
    
    // 8) Remove sensitive data from output
    user.password = undefined;
    
    res.status(200).json({
      status: 'success',
      message: 'Password updated successfully.',
      token,
      forcePasswordChange: false
    });
  } catch (error) {
    console.error('Error in resetPassword:', error);
    next(error);
  }
};

// Change password - For logged-in users who want to change their password
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // 1) Get user from the collection
    const user = await req.db.User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({
        status: 'error',
        message: 'User not found.'
      });
    }
    
    // 2) Check if current password is correct
    if (!(await user.comparePassword(currentPassword))) {
      return res.status(401).json({
        status: 'error',
        message: 'Your current password is incorrect.'
      });
    }
    
    // 3) Check if new password and confirm password match
    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        status: 'error',
        message: 'New password and confirm password do not match.'
      });
    }
    
    // 4) Validate new password
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        status: 'error',
        message: 'Password does not meet requirements',
        errors: passwordValidation.errors
      });
    }
    
    // 5) Check if new password is the same as the current one
    if (await user.comparePassword(newPassword)) {
      return res.status(400).json({
        status: 'error',
        message: 'New password cannot be the same as the current password.'
      });
    }
    
    // 6) Update password using the model's save method
    // This ensures all hooks are triggered correctly
    console.log('Changing password for user:', user.id);
    
    // Update the password - this will trigger the beforeUpdate hook
    user.password = newPassword;
    user.isTemporaryPassword = false;
    user.forcePasswordChange = false;
    user.temporaryPasswordExpires = null;
    
    // Save the user - this will trigger the beforeUpdate hook to hash the password
    await user.save();
    
    console.log('Password changed successfully for user:', user.id);
    
    // 7) Generate new token without forcePasswordChange flag
    const tokenPayload = {
      id: user.id,
      forcePasswordChange: false
    };
    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRATION
    });
    
    // 8) Remove sensitive data from output
    user.password = undefined;
    
    res.status(200).json({
      status: 'success',
      message: 'Password changed successfully.',
      token,
      forcePasswordChange: false
    });
  } catch (error) {
    next(error);
  }
};
