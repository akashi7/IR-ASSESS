const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

class CertificateGenerator {
  constructor() {
    this.outputDir = path.join(__dirname, '../../uploads/certificates');
    this.ensureDirectoryExists();
  }

  ensureDirectoryExists() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generate a unique certificate number
   */
  generateCertificateNumber() {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `CERT-${timestamp}-${random}`;
  }

  /**
   * Generate a digital signature for the certificate
   * This combines certificate data with a secret to create a unique hash
   */
  generateSignature(certificateData) {
    const dataString = JSON.stringify(certificateData);
    return crypto
      .createHmac('sha256', process.env.JWT_SECRET)
      .update(dataString)
      .digest('hex');
  }

  /**
   * Generate a verification token (QR code data)
   */
  generateVerificationToken(certificateId, signature) {
    return Buffer.from(`${certificateId}:${signature}`).toString('base64');
  }

  /**
   * Generate PDF certificate from template and data
   */
  async generatePDF(template, data, certificateNumber, verificationToken) {
    return new Promise((resolve, reject) => {
      try {
        const filename = `${certificateNumber}.pdf`;
        const filepath = path.join(this.outputDir, filename);
        const doc = new PDFDocument({
          size: template.content.layout?.orientation === 'landscape' ? [792, 612] : 'A4',
          margin: 50
        });

        const stream = fs.createWriteStream(filepath);
        doc.pipe(stream);

        // Add certificate title
        doc.fontSize(24)
           .font('Helvetica-Bold')
           .text(template.content.title || 'Certificate', {
             align: 'center'
           });

        doc.moveDown(2);

        // Add certificate fields
        const fields = template.content.fields || [];
        doc.fontSize(14).font('Helvetica');

        fields.forEach(field => {
          const value = data[field.key] || '';
          doc.moveDown(0.5);
          doc.font('Helvetica-Bold').text(`${field.label}: `, {
            continued: true
          });
          doc.font('Helvetica').text(value);
        });

        // Add certificate number
        doc.moveDown(2);
        doc.fontSize(10)
           .font('Helvetica')
           .text(`Certificate Number: ${certificateNumber}`, {
             align: 'center'
           });

        // Add generation date
        doc.moveDown(0.5);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, {
          align: 'center'
        });

        // Add security watermark
        doc.fontSize(10)
           .fillColor('#cccccc')
           .text('This certificate is digitally signed and verifiable', {
             align: 'center'
           });

        doc.end();

        stream.on('finish', () => {
          resolve(filepath);
        });

        stream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Verify a certificate signature
   */
  verifyCertificate(certificateData, signature) {
    const computedSignature = this.generateSignature(certificateData);
    return computedSignature === signature;
  }
}

module.exports = new CertificateGenerator();
