const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Certificate = sequelize.define('Certificate', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  certificateNumber: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  templateId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Templates',
      key: 'id'
    }
  },
  customerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'Customers',
      key: 'id'
    }
  },
  // Data used to fill the template
  data: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  // Digital signature/hash to prevent fraud
  signature: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  // Verification token
  verificationToken: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  // PDF file path or storage reference
  filePath: {
    type: DataTypes.STRING,
    allowNull: true
  },
  // Status: draft, generated, issued, revoked
  status: {
    type: DataTypes.ENUM('draft', 'generated', 'issued', 'revoked'),
    defaultValue: 'draft'
  },
  issuedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  revokedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  metadata: {
    type: DataTypes.JSONB,
    allowNull: true
  }
}, {
  timestamps: true,
  indexes: [
    {
      fields: ['certificateNumber']
    },
    {
      fields: ['verificationToken']
    },
    {
      fields: ['customerId']
    },
    {
      fields: ['templateId']
    }
  ]
});

module.exports = Certificate;
