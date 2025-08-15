import fetch from 'node-fetch';

export default async function handler(req, res) {
  // -------------------------
  // CORS для всех (можно ограничить потом)
  // -------------------------
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Idempotence-Key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, email } = req.body;
  if (!amount || Number(amount) <= 0 || !email || !email.includes('@')) {
    return res.status(400).json({ error: 'Invalid data' });
  }

  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;
  const idempotenceKey = Date.now() + '-' + Math.random().toString(36).substr(2, 9);

  try {
    const paymentData = {
      amount: { value: amount.toFixed(2), currency: 'RUB' },
      payment_method_data: { type: 'sbp' },
      confirmation: { type: 'qr', locale: 'ru_RU' }, // QR-код
      capture: true,
      description: `Оплата енотов, ${email}`,
      receipt: {
        customer: { email },
        items: [
          {
            description: 'Запись к енотам',
            quantity: '1.00',
            amount: { value: amount.toFixed(2), currency: 'RUB' },
            vat_code: 4
          }
        ]
      }
    };

    const response = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${shopId}:${secretKey}`).toString('base64'),
        'Idempotence-Key': idempotenceKey
      },
      body: JSON.stringify(paymentData)
    });

    const data = await response.json();

    if (data.confirmation) {
      // Возвращаем данные на фронтенд
      return res.status(200).json({
        url: data.confirmation.confirmation_url,
        qr: data.confirmation.qr_code // если нужно
      });
    }

    return res.status(500).json({ error: 'Payment creation failed', details: data });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
}
