const { Template } = require('../models');

exports.createTemplate = async (req, res) => {
  try {
    const { name, description, content, placeholders, styling } = req.body;

    const extractedPlaceholders = placeholders ||
      (content.fields ? content.fields.map(f => f.key) : []);

    const template = await Template.create({
      name,
      description,
      content,
      placeholders: extractedPlaceholders,
      styling,
      customerId: req.customerId
    });

    res.status(201).json({
      message: 'Template created successfully',
      template
    });
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
};

exports.getTemplates = async (req, res) => {
  try {
    const templates = await Template.findAll({
      where: { customerId: req.customerId }
    });

    res.json({ templates });
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to get templates' });
  }
};

exports.getTemplate = async (req, res) => {
  try {
    const template = await Template.findOne({
      where: {
        id: req.params.id,
        customerId: req.customerId 
      }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ template });
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Failed to get template' });
  }
};

// Update a template
exports.updateTemplate = async (req, res) => {
  try {
    const template = await Template.findOne({
      where: {
        id: req.params.id,
        customerId: req.customerId
      }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const { name, description, content, placeholders, styling, isActive } = req.body;

    await template.update({
      name: name || template.name,
      description: description !== undefined ? description : template.description,
      content: content || template.content,
      placeholders: placeholders || template.placeholders,
      styling: styling || template.styling,
      isActive: isActive !== undefined ? isActive : template.isActive
    });

    res.json({
      message: 'Template updated successfully',
      template
    });
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
};

// Delete a template
exports.deleteTemplate = async (req, res) => {
  try {
    const template = await Template.findOne({
      where: {
        id: req.params.id,
        customerId: req.customerId
      }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    await template.destroy();

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
};
