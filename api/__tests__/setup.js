const { sequelize } = require('../src/models');

beforeAll(async () => {
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret';

  await sequelize.sync({ force: true });
});

afterAll(async () => {
  await sequelize.close();
});

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
  
  customer.plainApiSecret = overrides.apiSecret || plainApiSecret;
  
  return customer;
}

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
