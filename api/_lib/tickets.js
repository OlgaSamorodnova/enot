import PDFDocument from 'pdfkit';
import { randomBytes } from 'crypto';

export function genCode(prefix = 'ENOT') {
  const rnd = randomBytes(3).toString('hex').toUpperCase();
  return `${prefix}-${rnd}`;
}

export function makeTicketPDF({ code, type, datetime, price, personsLabel = '' }) {
  const doc = new PDFDocument({ size: 'A6', margin: 18 }); // компактный билет
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  doc.on('end', () => {});

  doc.fontSize(16).text('Енот-парк — Билет', { align: 'center' });
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Тип: ${type}`);
  doc.text(`Дата/время: ${datetime}`);
  if (personsLabel) doc.text(personsLabel);
  doc.text(`Цена: ${price} ₽`);
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Код: ${code}`, { align: 'center' });

  doc.end();
  return new Promise((resolve) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
  });
}
