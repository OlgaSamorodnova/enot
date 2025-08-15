import { applyCors } from './_lib/cors';
import { getRecordsByPhone } from './_lib/yclients';
import { calcPricing } from './_lib/price';

export default async function handler(req, res) {
  if (applyCors(req, res)) return;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { phone } = req.body || {};
    if (!phone) {
      return res.status(400).json({ error: 'Телефон обязателен' });
    }

    const data = await getRecordsByPhone(phone);

    // Берём записи
    const visits = data?.data?.records || [];

    // Фильтруем будущие записи
    const future = visits
      .filter(r => {
        const dt = new Date(r.datetime || r.date || r.start_at);
        return !isNaN(dt) && dt.getTime() > Date.now();
      })
      .sort((a, b) => new Date(a.datetime || a.date || a.start_at) - new Date(b.datetime || b.date || b.start_at));

    if (!future.length) {
      return res.status(404).json({ error: 'Ближайших записей не найдено' });
    }

    const rec = future[0];
    const services = (rec.services || []).map(s => ({
      id: s.id || s.service_id,
      title: s.title || s.name,
      cost: s.cost_to_pay || s.cost || s.price || 0
    }));

    const { suggested, fullPrice, persons } = calcPricing(services);

    const typeTitle = services.map(s => s.title).join(' + ');
    const datetime = rec.datetime || rec.date || rec.start_at;

    return res.json({
      record_id: rec.id || rec.record_id,
      type: typeTitle,
      datetime,
      persons,
      price_suggested: suggested,
      price_full: fullPrice
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Ошибка поиска брони', details: e.message });
  }
}
