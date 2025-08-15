const BASE = 'https://api.yclients.com/api/v1';

/**
 * Получаем будущие записи по телефону
 * @param {string} phone - номер телефона
 */
export async function getRecordsByPhone(phone) {
  const normalized = String(phone).replace(/\D/g, '');
  const companyId = process.env.YCLIENTS_COMPANY_ID;
  const token = process.env.YCLIENTS_BEARER;

  if (!companyId || !token) {
    throw new Error('Не указан YCLIENTS_COMPANY_ID или YCLIENTS_BEARER');
  }

  const url = `${BASE}/companies/${companyId}/visits?phone=${normalized}&future=1`;

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

/**
 * Отмечаем запись как оплачено
 * @param {string|number} recordId 
 * @param {string} comment 
 */
export async function markRecordPaid(recordId, comment = 'Оплачено онлайн') {
  const companyId = process.env.YCLIENTS_COMPANY_ID;
  const token = process.env.YCLIENTS_BEARER;

  if (!companyId || !token) {
    throw new Error('Не указан YCLIENTS_COMPANY_ID или YCLIENTS_BEARER');
  }

  const url = `${BASE}/companies/${companyId}/visits/${recordId}`;
  const body = { comment };

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
