import assert from 'node:assert';
import { generateMap } from '../src/map.js';
import { createUnit } from '../src/unit.js';
import { createCity, MAX_POPULATION } from '../src/city.js';
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
assert.strictEqual(map[1][1].city.population, 2, 'city population grows');
assert.strictEqual(resources.player.gold, 2, 'gold generated');

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

// expansion based on population
const map2 = [];
for (let y = 0; y < 5; y++) {
  const row = [];
  for (let x = 0; x < 5; x++) {
    row.push({ type: 'grass', resource: null, city: null, seen: false, visible: false, claimedBy: null });
  }
  map2.push(row);
}
map2[2][2].city = createCity('player');
map2[2][4].resource = 'iron';
const resources2 = { player: {}, barbarian: {} };
for (let i = 0; i < 3; i++) endTurn(map2, [], resources2);
assert.strictEqual(resources2.player.iron, 1, 'distant resource claimed after growth');

// population cap
const capMap = [[{ type: 'grass', resource: null, city: createCity('player'), seen: false, visible: false, claimedBy: null }]];
const capResources = { player: {}, barbarian: {} };
for (let i = 0; i < MAX_POPULATION + 5; i++) endTurn(capMap, [], capResources);
assert.strictEqual(capMap[0][0].city.population, MAX_POPULATION, 'city population capped');

// ship production
const coastMap = [
  [
    { type: 'water', resource: null, city: null, seen: false, visible: false, claimedBy: null },
    { type: 'grass', resource: null, city: null, seen: false, visible: false, claimedBy: null },
  ],
  [
    { type: 'grass', resource: null, city: createCity('player'), seen: false, visible: false, claimedBy: null },
    { type: 'grass', resource: null, city: null, seen: false, visible: false, claimedBy: null },
  ],
];
const coastUnits = [];
const coastResources = { player: {}, barbarian: {} };
coastMap[1][0].city.build = 'ship';
for (let i = 0; i < 6; i++) endTurn(coastMap, coastUnits, coastResources);
assert.ok(
  coastUnits.some((u) => u.type === 'ship' && u.x === 0 && u.y === 0),
  'coastal city produced ship on adjacent water'
);

const inlandMap = [
  [
    { type: 'grass', resource: null, city: null, seen: false, visible: false, claimedBy: null },
    { type: 'grass', resource: null, city: null, seen: false, visible: false, claimedBy: null },
  ],
  [
    { type: 'grass', resource: null, city: createCity('player'), seen: false, visible: false, claimedBy: null },
    { type: 'grass', resource: null, city: null, seen: false, visible: false, claimedBy: null },
  ],
];
const inlandUnits = [];
const inlandResources = { player: {}, barbarian: {} };
inlandMap[1][0].city.build = 'ship';
for (let i = 0; i < 6; i++) endTurn(inlandMap, inlandUnits, inlandResources);
assert.ok(
  !inlandUnits.some((u) => u.type === 'ship'),
  'inland city cannot produce ship'
);

console.log('Game loop tests passed');
