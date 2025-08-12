import { createUnit } from './unit.js';

export function createCity(owner) {
  return { owner, production: 0, build: 'warrior', buildings: [] };
}

export const UNIT_COSTS = {
  warrior: 10,
  settler: 20,
  scout: 15,
};

export const BUILDING_COSTS = {
  granary: 30,
};

export function processCity(city, x, y, map, units, resources) {
  const radius = 1;
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const nx = x + dx;
      const ny = y + dy;
      if (ny < 0 || ny >= map.length || nx < 0 || nx >= map[0].length) continue;
      const tile = map[ny][nx];
      const alreadyOwned = tile.claimedBy === city.owner;
      tile.claimedBy = city.owner;
      if (tile.resource && !alreadyOwned) {
        if (!resources[city.owner][tile.resource]) resources[city.owner][tile.resource] = 0;
        resources[city.owner][tile.resource] += 1;
      }
    }
  }

  if (!city.build) return;

  city.production += 5;
  const unitCost = UNIT_COSTS[city.build];
  const buildingCost = BUILDING_COSTS[city.build];
  if (unitCost) {
    if (city.production >= unitCost) {
      if (!units.some(u => u.x === x && u.y === y)) {
        units.push(createUnit(city.build, x, y, city.owner));
        city.production -= unitCost;
      }
    }
  } else if (buildingCost) {
    if (city.production >= buildingCost) {
      if (!city.buildings.includes(city.build)) {
        city.buildings.push(city.build);
      }
      city.production -= buildingCost;
      city.build = null;
    }
  }
}
