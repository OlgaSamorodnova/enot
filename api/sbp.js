export default async function handler(req, res) {
  // -------------------------
  // CORS
  // -------------------------
  res.setHeader('Access-Control-Allow-Origin', 'https://enotsburg.ru'); // без слеша!
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Обрабатываем preflight (OPTIONS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // -------------------------
  // Проверка метода
  // -------------------------
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // -------------------------
  // Получаем сумму
  // -------------------------
  const { amount } = req.body;
  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ error: 'Invalid amount' });
  }

  // -------------------------
  // Настройки ЮKassa
  // -------------------------
  const shopId = process.env.YOOKASSA_SHOP_ID;
  const secretKey = process.env.YOOKASSA_SECRET_KEY;

  // Генерируем уникальный Idempotence-Key
  const idempotenceKey = Date.now() + '-' + Math.random().toString(36).substr(2, 9);

  try {
    const response = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + Buffer.from(`${shopId}:${secretKey}`).toString('base64'),
        'Idempotence-Key': idempotenceKey
      },
      body: JSON.stringify({
        amount: { value: amount, currency: 'RUB' },
        payment_method_data: { type: 'sbp' },
        confirmation: { type: 'redirect', return_url: 'https://enotsburg.ru' },
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
