import { createUnit } from './unit.js';

export function createCity(owner) {
  return {
    owner,
    production: 0,
    build: 'warrior',
    buildings: [],
    population: 1,
  };
}

export const UNIT_COSTS = {
  warrior: 10,
  settler: 20,
  scout: 15,
  archer: 15,
  horseman: 25,
};

export const BUILDING_COSTS = {
  granary: 30,
};

export function processCity(city, x, y, map, units, resources) {
  city.population += 1;
  const radius = Math.floor(Math.sqrt(city.population));
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

  if (!resources[city.owner]) resources[city.owner] = {};
  if (!('gold' in resources[city.owner])) resources[city.owner].gold = 0;
  resources[city.owner].gold += city.population;

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
