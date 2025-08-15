export async function calcPricing(services) {
  if (!Array.isArray(services)) services = [];

  const fullPrice = services.reduce((sum, s) => sum + Number(s.cost || 0), 0);

  let persons = 0;
  let suggested = 0;

  const relaxServices = services.filter(s => /енотораслакс/i.test(s.title) || /релакс/i.test(s.title));
  const normalServices = services.filter(s => !relaxServices.includes(s));

  if (normalServices.length > 0) {
    // Количество участников — максимум количества одинаковых услуг
    persons = Math.max(...normalServices.map(s => s.amount || 1));

    // Частичная оплата = общая стоимость / количество участников
    const totalCost = normalServices.reduce((sum, s) => sum + Number(s.cost || 0), 0);
    suggested = persons > 0 ? totalCost / persons : totalCost;
  }

  if (relaxServices.length > 0) {
    persons = 0;
    suggested = 0;
    for (const s of relaxServices) {
      const cost = await getServicePrice(s.id);
      suggested += cost;
      persons = 3; // "до 3 чел"
    }
  }

  return { suggested, fullPrice, persons };
}
