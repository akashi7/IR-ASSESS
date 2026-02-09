const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const bcrypt = require('bcryptjs');

const Customer = sequelize.define('Customer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  companyName: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  apiKey: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  apiSecret: {
    type: DataTypes.STRING,
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  contactPerson: {
    type: DataTypes.STRING,
    allowNull: true
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (customer) => {
      if (customer.password) {
        customer.password = await bcrypt.hash(customer.password, 10);
      }
      if (customer.apiSecret) {
        customer.apiSecret = await bcrypt.hash(customer.apiSecret, 10);
      }
    },
    beforeUpdate: async (customer) => {
      if (customer.changed('password')) {
        customer.password = await bcrypt.hash(customer.password, 10);
      }
      if (customer.changed('apiSecret')) {
        customer.apiSecret = await bcrypt.hash(customer.apiSecret, 10);
      }
    }
  }
});

Customer.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

Customer.prototype.validateApiSecret = async function(secret) {
  return await bcrypt.compare(secret, this.apiSecret);
};

module.exports = Customer;
