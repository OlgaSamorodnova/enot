import { getServicePrice } from './yclients';

/**
 * Рассчитываем стоимость и количество участников
 * @param {Array} services - [{id, title, cost, amount, datetime}]
 */
export async function calcPricing(services) {
  if (!Array.isArray(services)) services = [];

  let fullPrice = 0;
  let suggested = 0;
  let persons = 0;

  for (const s of services) {
    const title = s.title || '';
    const amount = Number(s.amount || 1);
    let cost = Number(s.cost || 0);

    // Эноторелаксация требует отдельного запроса
    if (/еноторелаксация/i.test(title)) {
      try {
        const priceData = await getServicePrice(s.id, s.datetime);
        cost = Number(priceData?.data?.first_cost || cost);
      } catch (e) {
        console.error('Ошибка получения цены релаксации', e);
      }

      // Определяем участников
      persons = 3; // базово "до 3 человек"
      const addonCount = services.filter(x => /\+1/.test(x.title)).reduce((sum, x) => sum + Number(x.amount || 0), 0);
      if (addonCount > 0) persons += addonCount;

      // Частичная оплата — только стоимость самой услуги
      suggested += cost;
      fullPrice += cost * amount; // полная сумма = cost * количество услуг
    } else {
      // Обычная услуга
      persons = Math.max(persons, amount);
      suggested += cost; // частичная оплата = цена одной услуги
      fullPrice += cost * amount;
    }
  }

  return { suggested, fullPrice, persons };
}
