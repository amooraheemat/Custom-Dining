
export const sendResetPasswordEmail = async (email, resetToken) => {
  // In development, just log the reset link
  console.log(`Password Reset Link for ${email}:`);
  console.log(`${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`);
  
};
