// Правила расчёта:
export function calcPricing(services) {
  if (!Array.isArray(services)) services = [];

  const fullPrice = services.reduce(
    (sum, s) => sum + (Number(s.cost || s.cost_to_pay || 0) * (s.amount || 1)),
    0
  );

  // --- Расчёт участников ---
  let persons = 0;
  const relaxService = services.find(s => /ено(торелаксация)/i.test(s.title));
  if (relaxService) {
    persons = 3; // базовое значение для еноторелаксации
    const plusOneServices = services.filter(s => /\+1/.test(s.title));
    if (plusOneServices.length) {
      persons += plusOneServices.reduce((sum, s) => sum + (s.amount || 1), 0);
    }
    persons = `до ${persons} человек`;
  } else {
    // стандартные услуги: сумма amount всех услуг
    persons = services.reduce((sum, s) => sum + (s.amount || 1), 0);
  }

  // --- Расчёт частичной суммы (suggested) ---
  let suggested = 0;
  if (relaxService) {
    // частичная оплата = стоимость еноторелаксации без +1
    suggested = relaxService.cost_to_pay || relaxService.cost || 0;
  } else if (services.length) {
    // стандартные услуги: цена одной единицы первой услуги
    suggested = services[0].cost_to_pay || services[0].cost || 0;
  }

  return {
    suggested,   // сумма к оплате по умолчанию
    fullPrice,   // полная стоимость визита
    persons      // число участников
  };
}
