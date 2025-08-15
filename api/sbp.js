import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { amount, email } = req.body;

  if (!amount || amount <= 0 || !email) {
    return res.status(400).json({ error: 'Некорректные данные' });
  }

  try {
    const paymentData = {
      amount: { value: amount.toFixed(2), currency: 'RUB' },
      confirmation: { type: 'qr', locale: 'ru_RU' }, // QR-код
      capture: true,
      description: `Оплата енотов, ${email}`,
      payment_method_data: { type: 'sbp' }, // только СБП
      receipt: {
        customer: { email },
        items: [
          {
            description: 'Запись к енотам',
            quantity: '1.00',
            amount: { value: amount.toFixed(2), currency: 'RUB' },
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
    res.status(500).json({ error: 'Серверная ошибка', details: err.message });
  }
}
