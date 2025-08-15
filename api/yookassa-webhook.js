import { sendTickets } from './_lib/mailer';
import { markRecordPaid } from './_lib/yclients';
import { makeTicketPDF, genCode } from './_lib/tickets';

export const config = {
  api: { bodyParser: { sizeLimit: '1mb' } }
};

export default async function handler(req, res) {
  // Вебхуки приходят от ЮKassa → обычно CORS не нужен
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const event = req.body;

    // Защитная проверка: подтверждаем статус платежа через API ЮKassa
    const paymentId = event?.object?.id || event?.object?.payment?.id || event?.object?.payment_id;
    if (!paymentId) {
      return res.status(200).json({ ok: true }); // игнорим шум
    }

    const shopId = process.env.YOOKASSA_SHOP_ID;
    const secretKey = process.env.YOOKASSA_SECRET_KEY;

    const check = await fetch(`https://api.yookassa.ru/v3/payments/${paymentId}`, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${shopId}:${secretKey}`).toString('base64')
      }
    });
    const payment = await check.json();

    if (payment.status !== 'succeeded') {
      return res.status(200).json({ ok: true }); // ждём успех
    }

    const meta = payment.metadata || {};
    const email = meta.email;
    const recordId = meta.record_id;
    const type = meta.type || 'Экскурсия';
    const datetime = meta.datetime || '';
    const persons = Number(meta.persons || 1);
    const fullPayment = !!meta.full_payment;
    const price = payment.amount?.value || '';

    // Генерим билеты
    const attachments = [];
    if (fullPayment && persons > 1) {
      for (let i = 1; i <= persons; i++) {
        const code = genCode('ENOT');
        const pdf = await makeTicketPDF({
          code,
          type,
          datetime,
          price
        });
        attachments.push({ filename: `ticket_${i}.pdf`, content: pdf, contentType: 'application/pdf' });
      }
    } else {
      const label = (!fullPayment && persons > 1) ? `Группа: ${persons} чел.` : '';
      const code = genCode('ENOT');
      const pdf = await makeTicketPDF({
        code,
        type,
        datetime,
        price,
        personsLabel: label
      });
      attachments.push({ filename: `ticket.pdf`, content: pdf, contentType: 'application/pdf' });
    }

    // Письмо клиенту
    if (email) {
      await sendTickets(
        email,
        'Ваш билет — Енот-парк',
        `<p>Спасибо за оплату!</p>
         <p>Тип: <b>${type}</b><br/>
         Дата/время: <b>${datetime}</b><br/>
         Сумма: <b>${price} ₽</b></p>
         <p>Билет(ы) во вложении.</p>`,
        attachments
      );
    }

    // Помечаем запись оплаченной в YClients
    if (recordId) {
      await markRecordPaid(recordId);
    }

    res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Webhook error:', e);
    res.status(200).json({ ok: true }); // ЮKassa требует 200, чтобы не ретраить бесконечно
  }
}
