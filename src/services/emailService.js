import Email from '../utils/email.js';
import { promisify } from 'util';
import crypto from 'crypto';

// Promisify crypto.randomBytes
const randomBytes = promisify(crypto.randomBytes);

// Create URL with proper API prefix
const createApiUrl = (type, path = '') => {
  const baseUrl = (process.env.FRONTEND_URL || 'http://localhost:3006').replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  
  switch(type) {
    case 'auth':
      return `${baseUrl}/api/auth/${cleanPath}`;
    case 'restaurants':
      return `${baseUrl}/api/restaurants/${cleanPath}`;
    default:
      return `${baseUrl}/${cleanPath}`;
  }
};

// Send verification email
export const sendVerificationEmail = async (user, token) => {
  try {
    const url = createApiUrl('auth', `verify-email/${token}`);
    const email = new Email(user, url);
    await email.sendEmailVerification();
    console.log(`Verification email sent to ${user.email}`, { url });
    return true;
  } catch (error) {
    console.error('Error sending verification email:', error);
    return false;
  }
};

// Send password reset email
export const sendPasswordResetEmail = async (user, token) => {
  try {
    const url = createApiUrl('auth', `reset-password?token=${token}`);
    const email = new Email(user, url);
    await email.sendPasswordReset();
    console.log(`Password reset email sent to ${user.email}`, { url });
    return true;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    return false;
  }
};

// Send restaurant approval/rejection email
export const sendRestaurantApprovalEmail = async (user, restaurant) => {
  try {
    const url = createApiUrl('restaurants', restaurant.id);
    const email = new Email(user, url);
    
    if (restaurant.status === 'approved') {
      await email.sendRestaurantApproval(restaurant);
      console.log(`Approval email sent to ${user.email}`, { url });
    } else {
      await email.sendRestaurantRejection(restaurant, restaurant.rejectionReason);
      console.log(`Rejection email sent to ${user.email}`, { url });
    }
    
    return true;
  } catch (error) {
    console.error('Error sending restaurant email:', error);
    return false;
  }
};

// Notify admin about new restaurant submission
export const sendAdminApprovalRequest = async (admin, restaurant, submittedBy) => {
  try {
    const url = createApiUrl('restaurants', `${restaurant.id}/review`);
    const email = new Email(admin, url);
    await email.sendAdminApprovalRequest(restaurant, submittedBy);
    console.log(`Admin notification sent to ${admin.email}`, { url });
    return true;
  } catch (error) {
    console.error('Error sending admin notification:', error);
    return false;
  }
};