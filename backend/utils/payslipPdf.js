import { Prisma } from '@prisma/client';
import PDFDocument from 'pdfkit';

/**
 * Render a payslip PDF buffer.
 * @param {object} payslip - Payslip with lines and related employee/payrun data
 * @returns {Promise<Buffer>}
 */
export function renderPayslipPdf(payslip) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const employee = payslip.employee;
    const payrun = payslip.payrun;

    doc.fontSize(18).text('PeoplePay360', { align: 'center' });
    doc.fontSize(14).text('Payslip', { align: 'center' });
    doc.moveDown();

    doc.fontSize(10);
    doc.text(`Reference: ${payslip.reference}`);
    doc.text(`Employee: ${employee.fullName} (${employee.employeeCode})`);
    doc.text(`Email: ${employee.workEmail}`);
    doc.text(`Period: ${payslip.periodLabel} (${formatDate(payslip.periodStart)} – ${formatDate(payslip.periodEnd)})`);
    doc.text(`Payrun: ${payrun.name} (${payrun.reference})`);
    doc.text(`Status: ${payslip.status}`);
    doc.text(`Currency: ${payslip.currency}`);
    doc.moveDown();

    doc.fontSize(12).text('Earnings & Deductions', { underline: true });
    doc.moveDown(0.5);

    const lines = [...(payslip.lines ?? [])].sort((a, b) => a.sequence - b.sequence);
    const colCode = 50;
    const colLabel = 130;
    const colAmount = 450;

    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Code', colCode, doc.y, { continued: false });
    const headerY = doc.y - 12;
    doc.text('Description', colLabel, headerY);
    doc.text('Amount', colAmount, headerY, { align: 'right', width: 100 });
    doc.moveDown(0.5);

    doc.font('Helvetica');
    for (const line of lines) {
      const y = doc.y;
      doc.text(line.code, colCode, y);
      doc.text(line.label, colLabel, y, { width: 280 });
      doc.text(formatMoney(line.amount), colAmount, y, { align: 'right', width: 100 });
      doc.moveDown(0.4);
    }

    doc.moveDown();
    doc.font('Helvetica-Bold');
    doc.text(`Gross: ${formatMoney(payslip.grossAmount)}`, { align: 'right' });
    doc.text(`Net Pay: ${formatMoney(payslip.netAmount)}`, { align: 'right' });

    if (employee.bankAccountNumber) {
      doc.moveDown();
      doc.font('Helvetica').fontSize(9);
      doc.text('Bank Details', { underline: true });
      doc.text(`Account: ${employee.bankAccountName ?? employee.fullName}`);
      doc.text(`Number: ${maskAccount(employee.bankAccountNumber)}`);
      doc.text(`IFSC: ${employee.bankIfscCode ?? '—'}`);
      doc.text(`Bank: ${employee.bankName ?? '—'}`);
    }

    doc.end();
  });
}

function formatDate(value) {
  return new Date(value).toISOString().slice(0, 10);
}

function formatMoney(value) {
  if (value instanceof Prisma.Decimal) return value.toFixed(2);
  return Number(value ?? 0).toFixed(2);
}

function maskAccount(num) {
  const s = String(num);
  if (s.length <= 4) return s;
  return `${'*'.repeat(s.length - 4)}${s.slice(-4)}`;
}
