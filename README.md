
# 🍽️ Custom Dining - Health-Focused Restaurant Companion

**Empowering Nigerians with dietary restrictions to dine out safely and confidently.**


[![Postman](https://img.shields.io/badge/API-Postman-orange)](https://www.postman.com/)
[![Figma](https://img.shields.io/badge/Design-Figma-purple)](https://figma.com/)

## Features

- User Authentication & Authorization
- Restaurant Management
- Meal Management
- Dietary Preferences
- Favorites System
- Admin Controls

## 📌 Table of Contents
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Installation](#-installation)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Team](#-team)
- [License](#-license)

## 🌟 Features
### For Users:
- Personalized meal recommendations (Diabetic/Weight Loss/Health-Conscious)
- Nigerian restaurant directory with dietary filters
- Save favorite meals

### For Restaurants:
- Register and list health-friendly meals
- Get visibility from targeted customers

### For Admin:
- Approve/reject restaurant submissions
- Manage meal tags

## 🛠️ Tech Stack
| Layer          | Technology               |
|----------------|--------------------------|
| **Frontend**   | Reactjs                  |
| **Backend**    | Node.js + Express        |
| **Database**   | MySQL                    |
| **Auth**       | JWT Tokens               |
| **Designer**   | Figma                    |

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8 or higher)
- npm or yarn

## 🚀 Installation
### Backend Setup
```bash
# Clone repo
cd backend

1. Clone the repository
git clone https://github.com/amooraheemat/Custom-Dining.git
2. Install dependencies:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env` and update the values:
   ```bash
   cp .env.example .env
   ```
4. Create the MySQL database:
   ```sql
   CREATE DATABASE custom_dining_db;
   ```
5. Start the development server:
   ```bash
   npm run dev
   ```



# Custom Dining API

A RESTful API for dietary-specific restaurant discovery and meal management.
