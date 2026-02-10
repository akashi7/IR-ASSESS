const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Template = sequelize.define('Template', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  // Template content in JSON format defining the layout
  content: {
    type: DataTypes.JSONB,
    allowNull: false,
  },
  // Placeholders that need to be filled
  placeholders: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: false,
    defaultValue: []
  },
  // Background image or styling information
  styling: {
    type: DataTypes.JSONB,
    allowNull: true
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Customers',
      key: 'id'
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true
});

module.exports = Template;
