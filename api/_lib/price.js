// Правила расчёта:
export function calcPricing(services) {
  // services: [{id, title, cost}]
  if (!Array.isArray(services)) services = [];

  const fullPrice = services.reduce((sum, s) => sum + Number(s.cost || 0), 0);

  // Группируем по id (одинаковые услуги)
  const byId = services.reduce((acc, s) => {
    const key = s.id ?? s.title;
    acc[key] = acc[key] || { item: s, count: 0 };
    acc[key].count += 1;
    return acc;
  }, {});

  // persons = максимум количества одинаковых
  const persons = Object.values(byId).reduce((m, g) => Math.max(m, g.count), 1);

  // эвристика для "доп. человек": названия с "доп", "доп.", "дополнитель"
  const isAddon = (title = '') => /доп\.?|дополнитель/i.test(title);

  const baseServices = services.filter(s => !isAddon(s.title));
  const addonServices = services.filter(s => isAddon(s.title));

  // кейс 1: 4 одинаковых услуги → брать цену одной
  let suggested = null;
  const maxGroup = Object.values(byId).sort((a,b)=>b.count-a.count)[0];
  if (maxGroup && maxGroup.count >= 2) {
    suggested = Number(maxGroup.item.cost || 0);
  }

  // кейс 2: индивидуальная + доп.чел → брать минимальную базовую
  if (addonServices.length > 0 && baseServices.length > 0) {
    const minBase = Math.min(...baseServices.map(s => Number(s.cost || 0)));
    suggested = (suggested == null) ? minBase : Math.min(suggested, minBase);
  }

  // по умолчанию — если ничего из правил не сработало, берём цену самой дешёвой услуги
  if (suggested == null) {
    suggested = services.length ? Math.min(...services.map(s => Number(s.cost || 0))) : 0;
  }

  return {
    suggested,     // сумма к оплате по умолчанию
    fullPrice,     // полная стоимость
    persons        // число участников по эвристике
  };
}
