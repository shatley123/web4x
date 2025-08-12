import { createUnit, moveUnit } from './unit.js';
import { createCity } from './city.js';

export function runAI(map, units, resources) {
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
