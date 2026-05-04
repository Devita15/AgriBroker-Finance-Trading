// src/services/receiptService.js
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const moment = require('moment');

class ReceiptService {
  async generateReceiptPDF(purchase, farmer, vendor, lines) {
    return new Promise((resolve, reject) => {
      const fileName = `receipt_${purchase.receiptNumber}_${Date.now()}.pdf`;
      const filePath = path.join(__dirname, '../../uploads/receipts', fileName);
      
      // Ensure directory exists
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      const doc = new PDFDocument({ margin: 50 });
      const writeStream = fs.createWriteStream(filePath);
      
      doc.pipe(writeStream);
      
      // Header
      doc.fontSize(20).text(vendor.businessName, { align: 'center' });
      doc.fontSize(12).text(vendor.address || '', { align: 'center' });
      doc.fontSize(12).text(`GST: ${vendor.gstNumber || 'N/A'}`, { align: 'center' });
      doc.moveDown();
      
      doc.fontSize(16).text('PURCHASE RECEIPT', { align: 'center', underline: true });
      doc.moveDown();
      
      // Receipt Info
      doc.fontSize(10);
      doc.text(`Receipt No: ${purchase.receiptNumber}`);
      doc.text(`Date: ${moment(purchase.purchaseDate).format('DD-MMM-YYYY HH:mm')}`);
      doc.moveDown();
      
      // Farmer & Vendor Info
      doc.text(`Farmer Name: ${farmer.name}`);
      doc.text(`Farmer Mobile: ${farmer.mobile}`);
      doc.moveDown();
      
      // Product Table Header
      const tableTop = doc.y;
      doc.text('Product', 50, tableTop);
      doc.text('Qty', 250, tableTop);
      doc.text('Unit', 320, tableTop);
      doc.text('Rate (₹)', 380, tableTop);
      doc.text('Amount (₹)', 450, tableTop);
      doc.moveDown();
      
      // Product Lines
      let currentY = doc.y;
      lines.forEach((line, index) => {
        doc.text(line.productName, 50, currentY + (index * 20));
        doc.text(line.billedQty.toFixed(2), 250, currentY + (index * 20));
        doc.text(line.actualQtyUnit, 320, currentY + (index * 20));
        doc.text(line.rate.toFixed(2), 380, currentY + (index * 20));
        doc.text(line.lineTotal.toFixed(2), 450, currentY + (index * 20));
      });
      
      doc.moveDown(2);
      
      // Deductions
      doc.text('Deductions:', 50, doc.y);
      doc.text(`Transport: ₹${purchase.deductionTransport || 0}`, 100, doc.y);
      doc.text(`Labour: ₹${purchase.deductionLabour || 0}`, 100, doc.y);
      doc.text(`Commission: ₹${purchase.deductionCommission || 0}`, 100, doc.y);
      doc.text(`Storage: ₹${purchase.deductionStorage || 0}`, 100, doc.y);
      doc.text(`Advance Adjusted: ₹${purchase.advanceAdjusted || 0}`, 100, doc.y);
      doc.text(`Return Value: ₹${purchase.returnValue || 0}`, 100, doc.y);
      doc.moveDown();
      
      // Total
      doc.fontSize(14);
      doc.text(`Gross Total: ₹${purchase.grossTotal.toFixed(2)}`, 350, doc.y - 40);
      doc.text(`Final Payable: ₹${purchase.finalPayable.toFixed(2)}`, 350, doc.y);
      
      if (purchase.amountPaid > 0) {
        doc.text(`Amount Paid: ₹${purchase.amountPaid.toFixed(2)}`, 350, doc.y + 20);
        doc.text(`Due Amount: ₹${purchase.amountDue.toFixed(2)}`, 350, doc.y + 40);
      }
      
      doc.moveDown(3);
      doc.fontSize(10);
      doc.text('Thank you for your business!', { align: 'center' });
      doc.text(`Generated on: ${moment().format('DD-MMM-YYYY HH:mm:ss')}`, { align: 'center', fontSize: 8 });
      
      doc.end();
      
      writeStream.on('finish', () => {
        resolve(filePath);
      });
      
      writeStream.on('error', reject);
    });
  }
}

module.exports = new ReceiptService();