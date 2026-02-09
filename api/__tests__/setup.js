const { sequelize } = require('../src/models');

// Setup before all tests
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';

  // Sync database
  await sequelize.sync({ force: true });
});

// Cleanup after all tests
afterAll(async () => {
  await sequelize.close();
});

// Helper to create test customer
async function createTestCustomer(overrides = {}) {
  const { Customer } = require('../src/models');
  const { generateApiKey, generateApiSecret } = require('../src/utils/apiKeyGenerator');

  const plainApiSecret = generateApiSecret();
  
  const defaults = {
    companyName: 'Test Company',
    email: 'test@example.com',
    password: 'password123',
    apiKey: generateApiKey(),
    apiSecret: plainApiSecret
  };

  const customer = await Customer.create({ ...defaults, ...overrides });
  
  // Attach plain secret for testing
  customer.plainApiSecret = overrides.apiSecret || plainApiSecret;
  
  return customer;
}

// Helper to generate JWT token
function generateTestToken(customer) {
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    { id: customer.id, email: customer.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

module.exports = {
  createTestCustomer,
  generateTestToken
};
