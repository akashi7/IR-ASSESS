const { sequelize } = require('../config/database');
const Customer = require('./Customer');
const Template = require('./Template');
const Certificate = require('./Certificate');

// Define relationships
Customer.hasMany(Template, {
  foreignKey: 'customerId',
  as: 'templates',
  onDelete: 'CASCADE'
});

Template.belongsTo(Customer, {
  foreignKey: 'customerId',
  as: 'customer'
});

Customer.hasMany(Certificate, {
  foreignKey: 'customerId',
  as: 'certificates',
  onDelete: 'CASCADE'
});

Certificate.belongsTo(Customer, {
  foreignKey: 'customerId',
  as: 'customer'
});

Template.hasMany(Certificate, {
  foreignKey: 'templateId',
  as: 'certificates',
  onDelete: 'RESTRICT'
});

Certificate.belongsTo(Template, {
  foreignKey: 'templateId',
  as: 'template'
});

module.exports = {
  sequelize,
  Customer,
  Template,
  Certificate
};
