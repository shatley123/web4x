import assert from 'node:assert';
import { generateMap } from '../src/map.js';
import { createUnit } from '../src/unit.js';
import { createCity } from '../src/city.js';
import { endTurn } from '../src/game.js';

const map = generateMap(3, 3);
map[1][1].type = 'grass';
map[1][1].city = createCity('player');
map[0][1].resource = 'wheat';
const units = [createUnit('warrior', 0, 0, 'player')];
units[0].moves = 0;
const resources = { player: {}, barbarian: {} };

endTurn(map, units, resources);
assert.strictEqual(units[0].moves, 1, 'unit moves reset on end turn');
assert.strictEqual(resources.player.wheat, 1, 'resource claimed');

// advance production to spawn a warrior
for (let i = 0; i < 2; i++) endTurn(map, units, resources);
assert.ok(
  units.some(u => u.x === 1 && u.y === 1 && u.type === 'warrior'),
  'city produced warrior'
);

console.log('Game loop tests passed');
