const { Customer } = require('../models');
const { generateApiKey, generateApiSecret } = require('../utils/apiKeyGenerator');

exports.getAllCustomers = async (req, res) => {
  try {
    const customers = await Customer.findAll({
      attributes: { exclude: ['password', 'apiSecret'] }
    });

    res.json({ customers });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to get customers' });
  }
};

exports.getCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id, {
      attributes: { exclude: ['password', 'apiSecret'] }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    res.json({ customer });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ error: 'Failed to get customer' });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.params.id);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const { companyName, contactPerson, phone, isActive } = req.body;

    await customer.update({
      companyName: companyName || customer.companyName,
      contactPerson: contactPerson || customer.contactPerson,
      phone: phone || customer.phone,
      isActive: isActive !== undefined ? isActive : customer.isActive
    });

    res.json({
      message: 'Customer updated successfully',
      customer: {
        id: customer.id,
        companyName: customer.companyName,
        email: customer.email,
        isActive: customer.isActive
      }
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ error: 'Failed to update customer' });
  }
};

exports.regenerateApiCredentials = async (req, res) => {
  try {
    const customer = await Customer.findByPk(req.customerId);

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const apiKey = generateApiKey();
    const apiSecret = generateApiSecret();

    await customer.update({
      apiKey,
      apiSecret
    });

    res.json({
      message: 'API credentials regenerated successfully',
      apiKey,
      apiSecret // Return plain secret only once
    });
  } catch (error) {
    console.error('Regenerate API credentials error:', error);
    res.status(500).json({ error: 'Failed to regenerate API credentials' });
  }
};
