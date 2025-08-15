const BASE = 'https://api.yclients.com/api/v1';

/**
 * Получаем все будущие записи по телефону с учетом пагинации
 * @param {string} phone - номер телефона
 */
export async function getRecordsByPhone(phone) {
  const normalized = String(phone).replace(/\D/g, '');
  const companyId = process.env.YCLIENTS_COMPANY_ID;
  const partnerToken = process.env.YCLIENTS_PARTNER_TOKEN;
  const userToken = process.env.YCLIENTS_BEARER;

  if (!companyId || !partnerToken || !userToken) {
    throw new Error('Не указан YCLIENTS_COMPANY_ID, YCLIENTS_PARTNER_TOKEN или YCLIENTS_BEARER');
  }

  let allRecords = [];
  let from = null;
  let to = null;

  do {
    const url = new URL(`${BASE}/company/${companyId}/clients/visits/search`);
    url.searchParams.set('client_phone', normalized);
    url.searchParams.set('future', '1');
    if (from) url.searchParams.set('from', from);
    if (to) url.searchParams.set('to', to);

    const resp = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${partnerToken}, User ${userToken}`,
        'Accept': 'application/vnd.yclients.v2+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({})
    });

    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`YClients error ${resp.status}: ${t}`);
    }

    const result = await resp.json();
    const records = result?.data?.records || [];
    allRecords.push(...records);

    // Обновляем курсор для следующей страницы
    const cursor = result?.meta?.dateCursor?.next;
    from = cursor?.from || null;
    to = cursor?.to || null;
  } while (from && to);

  return { data: { records: allRecords } };
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
