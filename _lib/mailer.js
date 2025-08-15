import nodemailer from 'nodemailer';

export function getTransport() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

export async function sendTickets(toEmail, subject, html, attachments) {
  const transporter = getTransport();
  const from = process.env.EMAIL_FROM || 'no-reply@example.com';
  await transporter.sendMail({
    from, to: toEmail, subject, html,
    attachments // [{filename, content (Buffer), contentType}]
  });
}
