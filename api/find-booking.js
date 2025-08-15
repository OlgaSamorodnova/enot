export async function getRecordsByPhone(phone) {
  const normalized = String(phone).replace(/\D/g, '');
  const companyId = process.env.YCLIENTS_COMPANY_ID;
  const token = process.env.YCLIENTS_BEARER;

  if (!companyId || !token) {
    throw new Error('Не указан YCLIENTS_COMPANY_ID или YCLIENTS_BEARER');
  }

  const url = `https://api.yclients.com/api/v1/companies/${companyId}/visits/search`;

  const resp = await fetch(url, {
    method: 'POST', // <--- обязательно POST
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.yclients.v2+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      client_phone: normalized,
      future: 1
    })
  });

  if (!resp.ok) {
    const t = await resp.text();
    throw new Error(`YClients error ${resp.status}: ${t}`);
  }

  return resp.json();
}
