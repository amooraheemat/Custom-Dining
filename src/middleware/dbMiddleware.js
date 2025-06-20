import { db } from '../config/database.js';

/**
 * Middleware to attach database models to the request object
 */
const attachDb = (req, res, next) => {
  req.db = db;
  next();
};

export default attachDb;
