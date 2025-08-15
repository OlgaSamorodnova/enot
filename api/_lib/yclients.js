const BASE = 'https://api.yclients.com/api/v1';

export async function getRecordsByPhone(phone) {
  // Нормализуем телефон, убираем всё кроме цифр (например 79xxxxxxxxx)
  const normalized = String(phone).replace(/\D/g, '');
  const companyId = process.env.YCLIENTS_COMPANY_ID;
  const token = process.env.YCLIENTS_BEARER;

  // Пример запроса: уточни при интеграции, формат фильтра может отличаться у YClients-аккаунтов
  const url = `${BASE}/records/${companyId}?phone=${normalized}&future=1`;

  const resp = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.yclients.v2+json',
      'Content-Type': 'application/json',
    }
  });
  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`YClients error ${resp.status}: ${t}`);
  }
  return resp.json();
}

export async function markRecordPaid(recordId, comment = 'Оплачено онлайн (ЮKassa)') {
  const companyId = process.env.YCLIENTS_COMPANY_ID;
  const token = process.env.YCLIENTS_BEARER;

  // Самый безопасный способ — дописать комментарий и/или кастомное поле (если есть).
  const url = `${BASE}/records/${companyId}/${recordId}`;
  const body = {
    // Если у вас есть кастомное поле "paid" — укажи здесь:
    // "custom_fields": { "paid": true },
    "comment": comment
  };

  const resp = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.yclients.v2+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`YClients PATCH error ${resp.status}: ${t}`);
  }
  return resp.json();
}
