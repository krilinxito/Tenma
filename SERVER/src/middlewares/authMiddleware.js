const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(401).json({ error: 'Invalid token' });
  }
};

const isDoctor = (req, res, next) => {
  if (!req.user || req.user.cargo !== 'doctor') {
    return res.status(403).json({ error: 'Access denied. Doctors only.' });
  }
  next();
};

const isEmployee = (req, res, next) => {
  if (!req.user || req.user.cargo !== 'empleado') {
    return res.status(403).json({ error: 'Access denied. Employees only.' });
  }
  next();
};

module.exports = {
  authenticateToken,
  isDoctor,
  isEmployee
}; 