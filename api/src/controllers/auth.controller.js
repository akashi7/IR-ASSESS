const jwt = require('jsonwebtoken');
const { Customer } = require('../models');
const { generateApiKey, generateApiSecret } = require('../utils/apiKeyGenerator');

const generateToken = (customer) => {
  return jwt.sign(
    { id: customer.id, email: customer.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
};

exports.register = async (req, res) => {
  try {
    const { companyName, email, password, contactPerson, phone } = req.body;

    const existingCustomer = await Customer.findOne({
      where: { email }
    });

    if (existingCustomer) {
      return res.status(400).json({ error: 'Customer with this email already exists' });
    }

    const apiKey = generateApiKey();
    const apiSecret = generateApiSecret();

    const customer = await Customer.create({
      companyName,
      email,
      password,
      apiKey,
      apiSecret,
      contactPerson,
      phone
    });

    const token = generateToken(customer);

    res.status(201).json({
      message: 'Customer registered successfully',
      customer: {
        id: customer.id,
        companyName: customer.companyName,
        email: customer.email,
        apiKey: customer.apiKey,
        apiSecret: apiSecret 
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register customer' });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const customer = await Customer.findOne({ where: { email } });

    if (!customer) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await customer.validatePassword(password);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (!customer.isActive) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    const token = generateToken(customer);

    res.json({
      message: 'Login successful',
      customer: {
        id: customer.id,
        companyName: customer.companyName,
        email: customer.email,
        apiKey: customer.apiKey
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.customerId, {
      attributes: { exclude: ['password', 'apiSecret'] }
    });

    res.json({ customer });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};
