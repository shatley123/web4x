import assert from 'node:assert';
import { generateMap } from '../src/map.js';
import { createUnit } from '../src/unit.js';
import { createCity } from '../src/city.js';
import { endTurn } from '../src/game.js';

const map = generateMap(3, 3);
for (const row of map) {
  for (const tile of row) tile.resource = null;
}
map[1][1].type = 'grass';
map[1][1].city = createCity('player');
map[0][1].resource = 'wheat';
const units = [createUnit('warrior', 0, 0, 'player')];
units[0].moves = 0;
const resources = { player: {}, barbarian: {} };

endTurn(map, units, resources);
assert.strictEqual(units[0].moves, 2, 'unit moves reset on end turn');
assert.strictEqual(resources.player.wheat, 1, 'resource claimed');

// advance production to spawn a warrior
for (let i = 0; i < 2; i++) endTurn(map, units, resources);
assert.ok(
  units.some(u => u.x === 1 && u.y === 1 && u.type === 'warrior'),
  'city produced warrior'
);
// remove produced warrior to free tile
const warriorIndex = units.findIndex(u => u.x === 1 && u.y === 1 && u.type === 'warrior');
units.splice(warriorIndex, 1);

// switch to producing scout
const city = map[1][1].city;
city.build = 'scout';
for (let i = 0; i < 2; i++) endTurn(map, units, resources);
assert.ok(
  units.some(u => u.x === 1 && u.y === 1 && u.type === 'scout'),
  'city produced scout'
);

// produce a building
city.build = 'granary';
for (let i = 0; i < 6; i++) endTurn(map, units, resources);
assert.ok(city.buildings.includes('granary'), 'city constructed granary');

console.log('Game loop tests passed');
