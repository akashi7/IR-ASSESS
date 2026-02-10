const request = require('supertest');
const express = require('express');
const { sequelize, Template } = require('../src/models');
const templateController = require('../src/controllers/template.controller');
const { authenticate } = require('../src/middleware/auth');
const { createTestCustomer, generateTestToken } = require('./setup');

const app = express();
app.use(express.json());

app.post('/api/templates', authenticate, templateController.createTemplate);
app.get('/api/templates', authenticate, templateController.getTemplates);
app.get('/api/templates/:id', authenticate, templateController.getTemplate);
app.put('/api/templates/:id', authenticate, templateController.updateTemplate);
app.delete('/api/templates/:id', authenticate, templateController.deleteTemplate);

describe('Template Controller', () => {
  let customer1, customer2, token1, token2;

  beforeEach(async () => {
    await sequelize.sync({ force: true });

    customer1 = await createTestCustomer({
      email: 'customer1@example.com',
      companyName: 'Company 1'
    });
    customer2 = await createTestCustomer({
      email: 'customer2@example.com',
      companyName: 'Company 2'
    });

    token1 = generateTestToken(customer1);
    token2 = generateTestToken(customer2);
  });

  describe('POST /api/templates', () => {
    it('should create a new template', async () => {
      const templateData = {
        name: 'Completion Certificate',
        description: 'Certificate for course completion',
        content: {
          title: 'Certificate of Completion',
          layout: { orientation: 'landscape' },
          fields: [
            { key: 'recipientName', label: 'Recipient Name', type: 'text' },
            { key: 'courseName', label: 'Course Name', type: 'text' },
            { key: 'completionDate', label: 'Completion Date', type: 'date' }
          ]
        },
        placeholders: ['recipientName', 'courseName', 'completionDate']
      };

      const response = await request(app)
        .post('/api/templates')
        .set('Authorization', `Bearer ${token1}`)
        .send(templateData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Template created successfully');
      expect(response.body).toHaveProperty('template');
      expect(response.body.template.name).toBe('Completion Certificate');
      expect(response.body.template.customerId).toBe(customer1.id);
    });

    it('should extract placeholders from content if not provided', async () => {
      const templateData = {
        name: 'Auto Placeholder Template',
        content: {
          title: 'Certificate',
          fields: [
            { key: 'name', label: 'Name', type: 'text' },
            { key: 'date', label: 'Date', type: 'date' }
          ]
        }
      };

      const response = await request(app)
        .post('/api/templates')
        .set('Authorization', `Bearer ${token1}`)
        .send(templateData);

      expect(response.status).toBe(201);
      expect(response.body.template.placeholders).toEqual(['name', 'date']);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/templates')
        .send({ name: 'Test Template' });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/templates', () => {
    it('should get only templates owned by customer', async () => {
      // Create templates for customer1
      await Template.create({
        name: 'Template 1',
        customerId: customer1.id,
        content: { title: 'Test' },
        placeholders: []
      });
      await Template.create({
        name: 'Template 2',
        customerId: customer1.id,
        content: { title: 'Test' },
        placeholders: []
      });

      await Template.create({
        name: 'Template 3',
        customerId: customer2.id,
        content: { title: 'Test' },
        placeholders: []
      });

      const response = await request(app)
        .get('/api/templates')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('templates');
      expect(response.body.templates).toHaveLength(2);
      expect(response.body.templates.every(t => t.customerId === customer1.id)).toBe(true);
    });

    it('should return empty array if no templates', async () => {
      const response = await request(app)
        .get('/api/templates')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.templates).toEqual([]);
    });
  });

  describe('GET /api/templates/:id', () => {
    it('should get template by id', async () => {
      const template = await Template.create({
        name: 'Test Template',
        customerId: customer1.id,
        content: { title: 'Test Certificate' },
        placeholders: ['name']
      });

      const response = await request(app)
        .get(`/api/templates/${template.id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body.template.name).toBe('Test Template');
    });

    it('should not get template from another customer', async () => {
      const template = await Template.create({
        name: 'Customer 2 Template',
        customerId: customer2.id,
        content: { title: 'Test' },
        placeholders: []
      });

      const response = await request(app)
        .get(`/api/templates/${template.id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Template not found');
    });

    it('should return 404 for non-existent template', async () => {
      const response = await request(app)
        .get('/api/templates/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/templates/:id', () => {
    it('should update template', async () => {
      const template = await Template.create({
        name: 'Original Name',
        customerId: customer1.id,
        content: { title: 'Original' },
        placeholders: []
      });

      const response = await request(app)
        .put(`/api/templates/${template.id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({
          name: 'Updated Name',
          description: 'Updated description'
        });

      expect(response.status).toBe(200);
      expect(response.body.template.name).toBe('Updated Name');
      expect(response.body.template.description).toBe('Updated description');
    });

    it('should not update another customer\'s template', async () => {
      const template = await Template.create({
        name: 'Customer 2 Template',
        customerId: customer2.id,
        content: { title: 'Test' },
        placeholders: []
      });

      const response = await request(app)
        .put(`/api/templates/${template.id}`)
        .set('Authorization', `Bearer ${token1}`)
        .send({ name: 'Hacked Name' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/templates/:id', () => {
    it('should delete template', async () => {
      const template = await Template.create({
        name: 'To Delete',
        customerId: customer1.id,
        content: { title: 'Test' },
        placeholders: []
      });

      const response = await request(app)
        .delete(`/api/templates/${template.id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Template deleted successfully');

      const deletedTemplate = await Template.findByPk(template.id);
      expect(deletedTemplate).toBeNull();
    });

    it('should not delete another customer\'s template', async () => {
      const template = await Template.create({
        name: 'Customer 2 Template',
        customerId: customer2.id,
        content: { title: 'Test' },
        placeholders: []
      });

      const response = await request(app)
        .delete(`/api/templates/${template.id}`)
        .set('Authorization', `Bearer ${token1}`);

      expect(response.status).toBe(404);

      const stillExists = await Template.findByPk(template.id);
      expect(stillExists).not.toBeNull();
    });
  });
});
