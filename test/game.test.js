import assert from 'node:assert';
import { generateMap } from '../src/map.js';
import { createUnit } from '../src/unit.js';
import { createCity } from '../src/city.js';
import { endTurn } from '../src/game.js';

const map = generateMap(3, 3);
map[1][1].type = 'grass';
map[1][1].city = createCity('player');
const units = [createUnit('warrior', 0, 0, 'player')];
units[0].moves = 0;

endTurn(map, units);
assert.strictEqual(units[0].moves, 1, 'unit moves reset on end turn');

// advance production to spawn a warrior
for (let i = 0; i < 2; i++) endTurn(map, units);
assert.ok(units.some(u => u.x === 1 && u.y === 1 && u.type === 'warrior'), 'city produced warrior');

console.log('Game loop tests passed');
