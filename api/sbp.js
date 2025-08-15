export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount } = req.body;

  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;

  try {
    const response = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
'Authorization': 'Basic ' + Buffer.from(`${shopId}:${secretKey}`).toString('base64')      },
      body: JSON.stringify({
        amount: { value: amount, currency: 'RUB' },
        payment_method_data: { type: 'sbp' },
        confirmation: { type: 'redirect', return_url: 'https://твойдомен.ru' },
        description: 'Предоплата за запись к енотам'
      })
    });

    const data = await response.json();

    if (data.confirmation && data.confirmation.confirmation_url) {
      res.status(200).json({ url: data.confirmation.confirmation_url });
    } else {
      res.status(500).json({ error: 'Payment creation failed', details: data });
    }
  } catch (error) {
    res.status(500).json({ error: 'Server error', details: error.message });
  }
}
