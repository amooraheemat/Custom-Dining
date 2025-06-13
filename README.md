
# Custom Dining - Restaurant Finder App

A simple web application to help people find restaurants that cater to specific dietary needs.

## Table of Contents
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Setup Instructions](#setup-instructions)
- [How to Run](#how-to-run)
- [Project Structure](#project-structure)

## Features

- User registration and login
- View list of restaurants
- Search for restaurants by name or cuisine
- View restaurant details and menu
- User reviews and ratings
- Simple admin panel to manage restaurants

## Technologies Used

- **Frontend**: HTML, CSS, JavaScript
- **Backend**: Node.js, Express
- **Database**: MySQL
- **Authentication**: JWT (JSON Web Tokens)
- **Other**: bcrypt for password hashing, express-validator for input validation

## Setup Instructions

1. Make sure you have Node.js installed (download from [nodejs.org](https://nodejs.org/))
2. Install MySQL if you don't have it already
3. Clone this repository
4. Install the required packages by running `npm install`

## How to Run

1. Create a `.env` file in the root directory with these variables:
   ```
   DB_HOST=localhost
   DB_USER=your_username
   DB_PASS=your_password
   DB_NAME=restaurant_db
   JWT_SECRET=your_jwt_secret
   PORT=3000
   ```

2. Start the MySQL server

3. Run the application:
   ```
   node app.js
   ```

4. Open your browser and go to `http://localhost:3000`

## Project Structure

```
/
├── config/           # Database configuration
├── controllers/      # Request handlers
├── middleware/       # Custom middleware
├── models/          # Database models
├── public/          # Static files
├── routes/          # Route definitions
├── uploads/         # File uploads
├── views/           # Template files
├── app.js           # Main application file
└── package.json     # Project dependencies
```

## How It Works

1. Users can sign up and log in
2. Browse restaurants by category or search by name
3. View restaurant details and menu items
4. Leave reviews and ratings
5. Admins can add/edit/delete restaurants and menu items

## Future Improvements

- Add user profiles
- Implement restaurant reservations
- Add payment integration
- Improve the user interface

## Note for Instructor

This project was developed as part of my learning journey with Node.js and Express. I've tried to keep the code simple and easy to understand.
