const BASE = 'https://api.yclients.com/api/v1';

/**
 * Получаем будущие записи по телефону
 * @param {string} phone - номер телефона
 * @param {number} daysAhead - сколько дней вперед искать записи
 */
export async function getRecordsByPhone(phone, daysAhead = 60) {
  const normalized = String(phone).replace(/\D/g, '');
  const companyId = process.env.YCLIENTS_COMPANY_ID;
  const partnerToken = process.env.YCLIENTS_PARTNER_TOKEN;
  const userToken = process.env.YCLIENTS_BEARER;

  if (!companyId || !partnerToken || !userToken) {
    throw new Error('Не указан YCLIENTS_COMPANY_ID, YCLIENTS_PARTNER_TOKEN или YCLIENTS_BEARER');
  }

  const today = new Date().toISOString().split('T')[0]; // yyyy-mm-dd
  const toDate = new Date();
  toDate.setDate(toDate.getDate() + daysAhead);
  const to = toDate.toISOString().split('T')[0];

  const url = `${BASE}/company/${companyId}/clients/visits/search`;
  const body = {
    client_phone: normalized,
    from: today,
    to: to
  };

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${partnerToken}, User ${userToken}`,
      'Accept': 'application/vnd.yclients.v2+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body)
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`YClients error ${resp.status}: ${t}`);
  }

  const data = await resp.json();
  return data;
}

/**
 * Отмечаем запись как оплачено
 * @param {string|number} recordId
 * @param {string} comment
 */
export async function markRecordPaid(recordId, comment = 'Оплачено онлайн') {
  const companyId = process.env.YCLIENTS_COMPANY_ID;
  const partnerToken = process.env.YCLIENTS_PARTNER_TOKEN;
  const userToken = process.env.YCLIENTS_BEARER;

  if (!companyId || !partnerToken || !userToken) {
    throw new Error('Не указан YCLIENTS_COMPANY_ID, YCLIENTS_PARTNER_TOKEN или YCLIENTS_BEARER');
  }

  const url = `${BASE}/companies/${companyId}/visits/${recordId}`;
  const body = { comment };

  const resp = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${partnerToken}, User ${userToken}`,
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
