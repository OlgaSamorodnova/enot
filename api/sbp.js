import fetch from 'node-fetch';

export default async function handler(req, res) {
  // --- CORS ---
  res.setHeader('Access-Control-Allow-Origin', '*'); // можно заменить на 'https://enotsburg.ru'
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Idempotence-Key');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // --- Парсим тело ---
  let body;
  try {
    body = JSON.parse(req.body || '{}');
  } catch {
    return res.status(400).json({ error: 'Некорректный JSON' });
  }

  const { amount, email } = body;

  if (!amount || amount <= 0 || !email) {
    return res.status(400).json({ error: 'Введите email и сумму' });
  }

  try {
    const paymentData = {
      amount: { value: parseFloat(amount).toFixed(2), currency: 'RUB' },
      confirmation: { type: 'qr', locale: 'ru_RU' },
      capture: true,
      description: `Оплата енотов, ${email}`,
      payment_method_data: { type: 'sbp' },
      receipt: {
        customer: { email },
        items: [
          {
            description: 'Запись к енотам',
            quantity: '1.00',
            amount: { value: parseFloat(amount).toFixed(2), currency: 'RUB' },
            vat_code: 4 // НДС 0%
          }
        ]
      }
    };

    const response = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${process.env.SHOP_ID}:${process.env.API_KEY}`).toString('base64'),
        'Idempotence-Key': `${Date.now()}-${Math.random()}`
      },
      body: JSON.stringify(paymentData)
    });

    const data = await response.json();

    if (data.confirmation && data.confirmation.confirmation_url) {
      return res.status(200).json({ url: data.confirmation.confirmation_url });
    }

    return res.status(500).json({ error: 'Не удалось создать платеж', details: data });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'Серверная ошибка', details: err.message });
  }
}
