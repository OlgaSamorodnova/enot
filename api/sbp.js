import fetch from 'node-fetch';

export default async function handler(req, res) {
  // --- CORS для preflight ---
  res.setHeader('Access-Control-Allow-Origin', 'https://enotsburg.ru'); // твой домен
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Idempotence-Key');

  // --- Обрабатываем preflight ---
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // --- Только POST ---
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  let body;
  try {
    body = JSON.parse(req.body || '{}');
  } catch {
    return res.status(400).json({ error: 'Некорректный JSON' });
  }

  const { amount, email } = body;
  if (!amount || !email) return res.status(400).json({ error: 'Введите сумму и email' });

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
            vat_code: 4
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
