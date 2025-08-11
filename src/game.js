import { moveUnit } from './unit.js';
import { processCity } from './city.js';

export function endTurn(map, units) {
  // Reset movement and move barbarians
  for (const unit of [...units]) {
    unit.moves = 1;
    if (unit.owner === 'barbarian') {
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

  // Process cities
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[0].length; x++) {
      const tile = map[y][x];
      if (tile.city) {
        processCity(tile.city, x, y, map, units);
      }
    }
  }
}
