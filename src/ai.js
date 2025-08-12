import { createUnit, moveUnit } from './unit.js';
import { createCity } from './city.js';

export function runAI(map, units, resources) {
  const aiCities = [];
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[0].length; x++) {
      const tile = map[y][x];
      if (tile.city && tile.city.owner === 'ai') {
        aiCities.push(tile.city);
      }
    }
  }

  let settlerCount = units.filter(u => u.owner === 'ai' && u.type === 'settler').length;
  for (const city of aiCities) {
    if (city.production === 0) {
      if (settlerCount < aiCities.length) {
        city.build = 'settler';
        settlerCount++;
      } else {
        const options = ['warrior', 'scout', 'archer', 'horseman'];
        city.build = options[Math.floor(Math.random() * options.length)];
      }
    }
  }

  for (const unit of units.filter(u => u.owner === 'ai')) {
    if (unit.type === 'settler') {
      const tile = map[unit.y][unit.x];
      if (!tile.city) {
        tile.city = createCity('ai');
        units.splice(units.indexOf(unit), 1);
        units.push(createUnit('warrior', unit.x, unit.y, 'ai'));
        continue;
      }
    }
    const dirs = [
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ];
    const [dx, dy] = dirs[Math.floor(Math.random() * dirs.length)];
    moveUnit(unit, dx, dy, map, units);
  }
}
