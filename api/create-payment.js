import { applyCors } from './_lib/cors';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;

  try {
    const { record_id, amount, email, type, datetime, full_payment, persons } = req.body || {};
    if (!record_id || !amount || !email) {
      return res.status(400).json({ error: 'record_id, amount, email обязательны' });
    }

    const idempotenceKey = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

    const paymentBody = {
      amount: { value: Number(amount).toFixed(2), currency: 'RUB' },
      payment_method_data: { type: 'sbp' },
      confirmation: { type: 'redirect', return_url: process.env.PUBLIC_ALLOWED_ORIGIN || 'https://enotsburg.ru' },
      description: `Билет: ${type || 'Экскурсия'} (${datetime || ''})`,
      capture: true,
      metadata: {
        record_id,
        email,
        type,
        datetime,
        full_payment: !!full_payment,
        persons: persons || 1
      },
      receipt: {
        customer: { email },
        items: [
          {
            description: `Билет: ${type || 'Экскурсия'}`,
            quantity: 1,
            amount: { value: Number(amount).toFixed(2), currency: 'RUB' },
            vat_code: 4
          }
        ]
      }
    };

    const resp = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${shopId}:${secretKey}`).toString('base64'),
        'Idempotence-Key': idempotenceKey
      },
      body: JSON.stringify(paymentBody)
    });

    const data = await resp.json();

    if (data?.confirmation?.confirmation_url) {
      return res.json({ url: data.confirmation.confirmation_url });
    }

    return res.status(500).json({ error: 'Не удалось создать платеж', details: data });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Server error', details: e.message });
  }
}
