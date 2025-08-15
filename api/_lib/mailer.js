// /api/sendTicket.js
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, ticketCode, ticketType, dateTime, price } = req.body;

  if (!email || !ticketCode || !ticketType || !dateTime || !price) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // Настройки SMTP Яндекс
    const transporter = nodemailer.createTransport({
      host: 'smtp.yandex.ru',
      port: 465,
      secure: true,
      auth: {
        user: process.env.YANDEX_EMAIL,
        pass: process.env.YANDEX_PASSWORD, // пароль приложения
      },
    });

    // Формируем письмо
    const mailOptions = {
      from: `"Енотсбург" <${process.env.YANDEX_EMAIL}>`,
      to: email,
      subject: `Ваш билет на экскурсию "${ticketType}"`,
      html: `
        <h2>Спасибо за покупку!</h2>
        <p>Ваш билет:</p>
        <ul>
          <li><strong>Код:</strong> ${ticketCode}</li>
          <li><strong>Тип экскурсии:</strong> ${ticketType}</li>
          <li><strong>Дата и время:</strong> ${dateTime}</li>
          <li><strong>Цена:</strong> ${price} ₽</li>
        </ul>
        <p>Покажите этот билет на входе.</p>
      `,
    };

    await transporter.sendMail(mailOptions);

    return res.status(200).json({ message: 'Ticket sent successfully' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Failed to send ticket', details: err.message });
  }
}
