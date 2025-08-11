export function createCity(owner) {
  return { owner, production: 0 };
}

export const UNIT_COSTS = {
  warrior: 10,
};

export function processCity(city, x, y, map, units) {
  city.production += 5;
  const cost = UNIT_COSTS.warrior;
  if (city.production >= cost) {
    if (!units.some(u => u.x === x && u.y === y)) {
      units.push({ type: 'warrior', x, y, owner: city.owner, moves: 1 });
      city.production -= cost;
    }
  }
}
