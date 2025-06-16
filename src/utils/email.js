import nodemailer from 'nodemailer';
import pug from 'pug';
import juice from 'juice';
import { htmlToText } from 'html-to-text';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory path in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class Email {
  constructor(user, url = '') {
    this.to = user.email;
    this.firstName = user.username || 'User';
    this.url = url;
    this.from = process.env.EMAIL_FROM
      ? process.env.EMAIL_FROM
      : `Custom Dining <${process.env.EMAIL_USERNAME}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === 'production') {
      // Use SendGrid in production
      return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USERNAME,
          pass: process.env.EMAIL_PASSWORD,
        }
      });
    }

    // Use Gmail for development with explicit configuration
    return nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
      },
      debug: true, // show debug output
      logger: true, // log information in console
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  // Send the actual email
  async send(template, subject, templateVars = {}) {
    try {
      // 1) Render HTML based on a pug template
      const templatePath = path.join(
        __dirname,
        `../views/emails/${template}.pug`
      );
      
      // Add common variables to templateVars
      const html = pug.renderFile(templatePath, {
        firstName: this.firstName,
        email: this.to,
        url: this.url,
        subject,
        ...templateVars
      });

      // 2) Generate HTML with inlined CSS
      const inlinedHtml = juice(html);

      // 3) Define email options
      const mailOptions = {
        from: this.from,
        to: this.to,
        subject,
        html: inlinedHtml,
        text: htmlToText(inlinedHtml, {
          wordwrap: 130
        })
      };

      // 4) Log email in development
      if (process.env.NODE_ENV !== 'production') {
        console.log('Sending email with options:', {
          to: mailOptions.to,
          subject: mailOptions.subject,
          url: this.url
        });
      }

      // 5) Create a transport and send email
      const transport = this.newTransport();
      await transport.sendMail(mailOptions);
      
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      throw error;
    }
  }

  // Specific email methods
  async sendWelcome() {
    await this.send('welcome', 'Welcome to Custom Dining!');
  }

  async sendPasswordReset() {
    await this.send(
      'passwordReset',
      'Your password reset token (valid for 10 minutes)'
    );
  }

  async sendEmailVerification() {
    await this.send(
      'emailVerification',
      'Please verify your email address'
    );
  }

  async sendRestaurantApproval(restaurant) {
    await this.send(
      'restaurantApproved',
      `Your restaurant "${restaurant.name}" has been approved`,
      { restaurantName: restaurant.name }
    );
  }

  async sendRestaurantRejection(restaurant, reason) {
    await this.send(
      'restaurantRejected',
      `Update on your restaurant "${restaurant.name}"`,
      { 
        restaurantName: restaurant.name,
        rejectionReason: reason || 'No reason provided.'
      }
    );
  }

  async sendAdminApprovalRequest(restaurant, submittedBy) {
    await this.send(
      'adminApprovalRequest',
      `New Restaurant Pending: ${restaurant.name}`,
      {
        restaurantName: restaurant.name,
        restaurantLocation: restaurant.location,
        restaurantDescription: restaurant.description || 'No description provided',
        submittedBy: submittedBy?.name || 'A user',
        submittedByEmail: submittedBy?.email || 'Unknown email'
      }
    );
  }
}

export default Email;
