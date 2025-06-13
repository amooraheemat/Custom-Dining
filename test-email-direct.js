import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

// Load environment variables
dotenv.config();

// Log the email configuration
console.log('Email Configuration:');
console.log('HOST:', process.env.EMAIL_HOST);
console.log('PORT:', process.env.EMAIL_PORT);
console.log('USER:', process.env.EMAIL_USERNAME);
console.log('FROM:', process.env.EMAIL_FROM);
console.log('NODE_ENV:', process.env.NODE_ENV);

// Create a test transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
  tls: {
    // Do not fail on invalid certs
    rejectUnauthorized: false
  }
});

// Verify connection configuration
transporter.verify(function(error, success) {
  if (error) {
    console.error('Error with email configuration:', error);
  } else {
    console.log('Server is ready to take our messages');
  }
});

// Test email options
const mailOptions = {
  from: `"${process.env.EMAIL_FROM_NAME || 'Test Sender'}" <${process.env.EMAIL_FROM || process.env.EMAIL_USERNAME}>`,
  to: 'ridtestar3@yopmail.com',
  subject: 'Test Email from Custom Dining',
  text: 'This is a test email from Custom Dining.',
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Test Email</h2>
      <p>This is a test email from Custom Dining.</p>
      <p>If you received this email, the email service is working correctly!</p>
    </div>
  `
};

// Send the email
console.log('\nSending test email...');
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('Error sending email:', error);
  } else {
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
  }
});
