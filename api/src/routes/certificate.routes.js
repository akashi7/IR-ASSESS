const express = require('express');
const router = express.Router();
const certificateController = require('../controllers/certificate.controller');
const { authenticate, authenticateApiKey } = require('../middleware/auth');

// Public verification endpoint
router.get('/verify/:verificationToken', certificateController.verifyCertificate);

// UI routes (JWT authentication)
router.post('/simulate', authenticate, certificateController.simulateCertificate);
router.post('/generate-ui', authenticate, certificateController.generateCertificate);
router.get('/', authenticate, certificateController.getCertificates);
router.get('/:id', authenticate, certificateController.getCertificate);
router.get('/:id/download', authenticate, certificateController.downloadCertificate);
router.put('/:id/revoke', authenticate, certificateController.revokeCertificate);

// API routes (API key authentication for programmatic access)
router.post('/generate', authenticateApiKey, certificateController.generateCertificate);
router.post('/batch-generate', authenticateApiKey, certificateController.batchGenerateCertificates);

module.exports = router;
