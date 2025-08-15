import { getServicePrice } from './yclients';

/**
 * Рассчёт частичной и полной стоимости и участников
 * @param {Array} services - [{id, title, cost, amount}]
 * @returns {Promise<{suggested, fullPrice, persons}>}
 */
export async function calcPricing(services) {
  if (!Array.isArray(services)) services = [];

  const fullPrice = services.reduce((sum, s) => sum + Number(s.cost || 0), 0);

  let persons = 0;
  let suggested = 0;

  // Проверяем наличие еноторелаксаций
  const relaxServices = services.filter(s => /енотораслакс/i.test(s.title) || /релакс/i.test(s.title));
  const normalServices = services.filter(s => !relaxServices.includes(s));

  if (normalServices.length > 0) {
    // Количество участников — максимум количества одинаковых услуг
    persons = Math.max(...normalServices.map(s => s.amount || 1));

    // Частичная оплата — стоимость одной услуги
    const minCostService = normalServices.reduce((min, s) => {
      const c = Number(s.cost || 0);
      return min === null ? c : Math.min(min, c);
    }, null);
    suggested = minCostService || 0;
  }

  if (relaxServices.length > 0) {
    persons = 0;
    // Берём цену через API для каждой услуги
    suggested = 0;
    for (const s of relaxServices) {
      const cost = await getServicePrice(s.id);
      suggested += cost;
      persons = 3; // по умолчанию "до 3 чел"
    }
  }

  return { suggested, fullPrice, persons };
}
