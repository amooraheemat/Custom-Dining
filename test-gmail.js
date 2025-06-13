import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Email configuration
const emailConfig = {
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
  debug: true, // show debug output
  logger: true // log information in console
};

// Create a test user object
const testUser = {
  email: 'admintestar1@yopmail.com',
  name: 'Test User'
};

console.log('Testing Gmail SMTP connection...');
console.log('Using email:', process.env.EMAIL_USERNAME);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Create a transporter
const transporter = nodemailer.createTransport(emailConfig);

// Verify connection configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('❌ Error verifying email configuration:', error);
  } else {
    console.log('✅ Server is ready to take our messages');
    
    // Send test email
    const mailOptions = {
      from: `"Custom Dining" <${process.env.EMAIL_USERNAME}>`,
      to: testUser.email,
      subject: 'Test Email from Custom Dining',
      text: 'This is a test email from Custom Dining.',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Test Email</h2>
          <p>This is a test email from Custom Dining.</p>
          <p>If you received this email, the email service is working correctly!</p>
          <p>Time: ${new Date().toISOString()}</p>
        </div>
      `
    };

    console.log('\nSending test email...');
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('❌ Error sending email:', error);
        
        // Provide specific guidance based on error
        if (error.code === 'EAUTH') {
          console.log('\n🔑 Authentication failed. Please check:');
          console.log('1. Your email and password are correct');
          console.log('2. You\'ve enabled "Less secure app access" or created an App Password');
          console.log('3. If using 2FA, you need to create an App Password');
        } else if (error.code === 'ECONNECTION') {
          console.log('\n🔌 Connection error. Please check:');
          console.log('1. Your internet connection');
          console.log('2. If your network allows SMTP connections (port 465 or 587)');
          console.log('3. If your firewall is blocking the connection');
        }
      } else {
        console.log('✅ Email sent successfully!');
        console.log('📧 Message ID:', info.messageId);
        console.log('👀 Preview URL:', nodemailer.getTestMessageUrl(info));
      }
    });
  }
});
