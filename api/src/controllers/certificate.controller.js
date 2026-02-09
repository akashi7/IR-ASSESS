const { Certificate, Template } = require('../models');
const certificateGenerator = require('../utils/certificateGenerator');

// Simulate certificate generation (preview without saving)
exports.simulateCertificate = async (req, res) => {
  try {
    const { templateId, data } = req.body;

    const template = await Template.findOne({
      where: {
        id: templateId,
        customerId: req.customerId
      }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Validate that all required placeholders are provided
    const missingFields = template.placeholders.filter(
      placeholder => !data[placeholder]
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missingFields
      });
    }

    // Generate preview data
    const previewData = {
      templateName: template.name,
      data,
      preview: true,
      estimatedOutput: {
        title: template.content.title,
        fields: template.content.fields.map(field => ({
          label: field.label,
          value: data[field.key]
        }))
      }
    };

    res.json({
      message: 'Certificate simulation successful',
      preview: previewData
    });
  } catch (error) {
    console.error('Simulate certificate error:', error);
    res.status(500).json({ error: 'Failed to simulate certificate' });
  }
};

// Generate a single certificate
exports.generateCertificate = async (req, res) => {
  try {
    const { templateId, data } = req.body;

    const template = await Template.findOne({
      where: {
        id: templateId,
        customerId: req.customerId
      }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Validate required fields
    const missingFields = template.placeholders.filter(
      placeholder => !data[placeholder]
    );

    if (missingFields.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missingFields
      });
    }

    // Generate certificate number and signature
    const certificateNumber = certificateGenerator.generateCertificateNumber();
    const signature = certificateGenerator.generateSignature({
      templateId,
      data,
      certificateNumber,
      customerId: req.customerId
    });
    const verificationToken = certificateGenerator.generateVerificationToken(
      certificateNumber,
      signature
    );

    // Generate PDF
    const filePath = await certificateGenerator.generatePDF(
      template,
      data,
      certificateNumber,
      verificationToken
    );

    // Save certificate to database
    const certificate = await Certificate.create({
      certificateNumber,
      templateId,
      customerId: req.customerId,
      data,
      signature,
      verificationToken,
      filePath,
      status: 'generated',
      issuedAt: new Date()
    });

    res.status(201).json({
      message: 'Certificate generated successfully',
      certificate: {
        id: certificate.id,
        certificateNumber: certificate.certificateNumber,
        verificationToken: certificate.verificationToken,
        status: certificate.status,
        issuedAt: certificate.issuedAt
      }
    });
  } catch (error) {
    console.error('Generate certificate error:', error);
    res.status(500).json({ error: 'Failed to generate certificate' });
  }
};

// Batch generate certificates (for high performance)
exports.batchGenerateCertificates = async (req, res) => {
  try {
    const { templateId, certificates } = req.body;

    if (!Array.isArray(certificates) || certificates.length === 0) {
      return res.status(400).json({ error: 'Certificates array is required' });
    }

    const template = await Template.findOne({
      where: {
        id: templateId,
        customerId: req.customerId
      }
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const results = [];
    const errors = [];

    // Process certificates in parallel for better performance
    const promises = certificates.map(async (certData, index) => {
      try {
        const certificateNumber = certificateGenerator.generateCertificateNumber();
        const signature = certificateGenerator.generateSignature({
          templateId,
          data: certData,
          certificateNumber,
          customerId: req.customerId
        });
        const verificationToken = certificateGenerator.generateVerificationToken(
          certificateNumber,
          signature
        );

        const filePath = await certificateGenerator.generatePDF(
          template,
          certData,
          certificateNumber,
          verificationToken
        );

        const certificate = await Certificate.create({
          certificateNumber,
          templateId,
          customerId: req.customerId,
          data: certData,
          signature,
          verificationToken,
          filePath,
          status: 'generated',
          issuedAt: new Date()
        });

        results.push({
          index,
          certificateId: certificate.id,
          certificateNumber: certificate.certificateNumber
        });
      } catch (error) {
        errors.push({
          index,
          error: error.message
        });
      }
    });

    await Promise.all(promises);

    res.status(201).json({
      message: `Batch generation completed. ${results.length} successful, ${errors.length} failed`,
      results,
      errors
    });
  } catch (error) {
    console.error('Batch generate certificates error:', error);
    res.status(500).json({ error: 'Failed to batch generate certificates' });
  }
};

// Get all certificates for the authenticated customer
exports.getCertificates = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const offset = (page - 1) * limit;

    const where = { customerId: req.customerId };
    if (status) {
      where.status = status;
    }

    const { count, rows: certificates } = await Certificate.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [{
        model: Template,
        as: 'template',
        attributes: ['id', 'name']
      }]
    });

    res.json({
      certificates,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get certificates error:', error);
    res.status(500).json({ error: 'Failed to get certificates' });
  }
};

// Get a single certificate
exports.getCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      where: {
        id: req.params.id,
        customerId: req.customerId
      },
      include: [{
        model: Template,
        as: 'template',
        attributes: ['id', 'name', 'description']
      }]
    });

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    res.json({ certificate });
  } catch (error) {
    console.error('Get certificate error:', error);
    res.status(500).json({ error: 'Failed to get certificate' });
  }
};

// Download certificate PDF
exports.downloadCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      where: {
        id: req.params.id,
        customerId: req.customerId
      }
    });

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    if (!certificate.filePath) {
      return res.status(404).json({ error: 'Certificate file not found' });
    }

    res.download(certificate.filePath, `${certificate.certificateNumber}.pdf`);
  } catch (error) {
    console.error('Download certificate error:', error);
    res.status(500).json({ error: 'Failed to download certificate' });
  }
};

// Verify certificate
exports.verifyCertificate = async (req, res) => {
  try {
    const { verificationToken } = req.params;

    const certificate = await Certificate.findOne({
      where: { verificationToken },
      include: [{
        model: Template,
        as: 'template',
        attributes: ['name']
      }]
    });

    if (!certificate) {
      return res.status(404).json({
        valid: false,
        error: 'Certificate not found'
      });
    }

    // Verify signature
    const isValid = certificateGenerator.verifyCertificate(
      {
        templateId: certificate.templateId,
        data: certificate.data,
        certificateNumber: certificate.certificateNumber,
        customerId: certificate.customerId
      },
      certificate.signature
    );

    if (!isValid) {
      return res.status(400).json({
        valid: false,
        error: 'Certificate signature is invalid'
      });
    }

    res.json({
      valid: true,
      certificate: {
        certificateNumber: certificate.certificateNumber,
        templateName: certificate.template.name,
        issuedAt: certificate.issuedAt,
        status: certificate.status,
        data: certificate.data
      }
    });
  } catch (error) {
    console.error('Verify certificate error:', error);
    res.status(500).json({ error: 'Failed to verify certificate' });
  }
};

// Revoke certificate
exports.revokeCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      where: {
        id: req.params.id,
        customerId: req.customerId
      }
    });

    if (!certificate) {
      return res.status(404).json({ error: 'Certificate not found' });
    }

    await certificate.update({
      status: 'revoked',
      revokedAt: new Date()
    });

    res.json({
      message: 'Certificate revoked successfully',
      certificate: {
        id: certificate.id,
        status: certificate.status,
        revokedAt: certificate.revokedAt
      }
    });
  } catch (error) {
    console.error('Revoke certificate error:', error);
    res.status(500).json({ error: 'Failed to revoke certificate' });
  }
};
