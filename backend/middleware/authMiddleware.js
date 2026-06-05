import jwt from 'jsonwebtoken';
import db from '../config/db.js';

export const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'cyberpunk-result-analysis-secret-key-2026!');

      // Fetch user from database
      const users = await db.query(
        'SELECT id, username, email, role, status FROM users WHERE id = ?',
        [decoded.id]
      );

      if (users.length === 0) {
        return res.status(401).json({ success: false, message: 'Not authorized, user not found' });
      }

      const user = users[0];
      if (user.status !== 'active') {
        return res.status(401).json({ success: false, message: 'User account is inactive' });
      }

      req.user = user;
      next();
    } catch (error) {
      console.error('Auth Middleware Error:', error.message);
      res.status(401).json({ success: false, message: 'Not authorized, token failed' });
    }
  } else {
    res.status(401).json({ success: false, message: 'Not authorized, no token' });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `User role '${req.user?.role || 'none'}' is not authorized to access this route`
      });
    }
    next();
  };
};
