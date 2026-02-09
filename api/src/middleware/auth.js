const jwt = require('jsonwebtoken');
const { Customer } = require('../models');

// JWT authentication middleware
const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const customer = await Customer.findByPk(decoded.id);

    if (!customer || !customer.isActive) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }

    req.customer = customer;
    req.customerId = customer.id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid authentication token' });
  }
};

// API Key authentication middleware
const authenticateApiKey = async (req, res, next) => {
  try {
    const apiKey = req.header('X-API-Key');
    const apiSecret = req.header('X-API-Secret');

    if (!apiKey || !apiSecret) {
      return res.status(401).json({ error: 'API credentials required' });
    }

    const customer = await Customer.findOne({ where: { apiKey } });

    if (!customer || !customer.isActive) {
      return res.status(401).json({ error: 'Invalid API credentials' });
    }

    const isValidSecret = await customer.validateApiSecret(apiSecret);

    if (!isValidSecret) {
      return res.status(401).json({ error: 'Invalid API credentials' });
    }

    req.customer = customer;
    req.customerId = customer.id;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid API credentials' });
  }
};

// Admin authentication (for Sec CERTIFICATE company)
const authenticateAdmin = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if this is an admin user (you can add an isAdmin field to Customer model)
    // For simplicity, checking against an env variable
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid authentication token' });
  }
};

module.exports = {
  authenticate,
  authenticateApiKey,
  authenticateAdmin
};
