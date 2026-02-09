const request = require('supertest');
const express = require('express');
const { sequelize, Customer } = require('../src/models');
const authController = require('../src/controllers/auth.controller');
const { authenticate } = require('../src/middleware/auth');
const { createTestCustomer, generateTestToken } = require('./setup');

const app = express();
app.use(express.json());

// Setup routes
app.post('/api/auth/register', authController.register);
app.post('/api/auth/login', authController.login);
app.get('/api/auth/profile', authenticate, authController.getProfile);

describe('Authentication Controller', () => {
  beforeEach(async () => {
    await sequelize.sync({ force: true });
  });

  describe('POST /api/auth/register', () => {
    it('should register a new customer successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          companyName: 'Test Corp',
          email: 'newuser@example.com',
          password: 'SecurePass123',
          contactPerson: 'John Doe',
          phone: '+1234567890'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Customer registered successfully');
      expect(response.body).toHaveProperty('customer');
      expect(response.body.customer).toHaveProperty('id');
      expect(response.body.customer).toHaveProperty('companyName', 'Test Corp');
      expect(response.body.customer).toHaveProperty('email', 'newuser@example.com');
      expect(response.body.customer).toHaveProperty('apiKey');
      expect(response.body.customer).toHaveProperty('apiSecret');
      expect(response.body).toHaveProperty('token');
    });

    it('should not register with duplicate email', async () => {
      await createTestCustomer({ email: 'duplicate@example.com' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          companyName: 'Another Corp',
          email: 'duplicate@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Customer with this email already exists');
    });

    it('should hash the password', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          companyName: 'Hash Test',
          email: 'hash@example.com',
          password: 'plaintext123'
        });

      const customer = await Customer.findOne({ where: { email: 'hash@example.com' } });
      expect(customer.password).not.toBe('plaintext123');
      expect(customer.password.length).toBeGreaterThan(20); // Bcrypt hash length
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const customer = await createTestCustomer({
        email: 'login@example.com',
        password: 'password123'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('customer');
      expect(response.body.customer.email).toBe('login@example.com');
      expect(response.body).toHaveProperty('token');
    });

    it('should reject invalid email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should reject invalid password', async () => {
      await createTestCustomer({
        email: 'valid@example.com',
        password: 'correctpassword'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'valid@example.com',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should reject inactive customer', async () => {
      await createTestCustomer({
        email: 'inactive@example.com',
        password: 'password123',
        isActive: false
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'inactive@example.com',
          password: 'password123'
        });

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Account is deactivated');
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should get profile with valid token', async () => {
      const customer = await createTestCustomer({
        companyName: 'Profile Test',
        email: 'profile@example.com'
      });
      const token = generateTestToken(customer);

      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('customer');
      expect(response.body.customer.companyName).toBe('Profile Test');
      expect(response.body.customer).not.toHaveProperty('password');
      expect(response.body.customer).not.toHaveProperty('apiSecret');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Authentication required');
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid authentication token');
    });
  });
});
