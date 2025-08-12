import assert from 'node:assert';
import { createUnit, moveUnit } from '../src/unit.js';

const map = [
  [{ type: 'grass' }, { type: 'grass' }],
  [{ type: 'water' }, { type: 'grass' }]
];

const units = [
  createUnit('warrior', 0, 0, 'player'),
  createUnit('barbarian', 1, 0, 'barbarian')
];

// combat: warrior vs barbarian
const res = moveUnit(units[0], 1, 0, map, units);
assert.strictEqual(res, 'attack', 'combat returns attack result');
assert.strictEqual(units.length, 1, 'defender removed after combat');
assert.strictEqual(units[0].x, 1, 'warrior moved into tile');
assert.strictEqual(units[0].moves, 1, 'movement consumed');
assert.strictEqual(units[0].type, 'warrior', 'warrior survives');

// movement blocked by water
const map2 = [[{ type: 'grass' }, { type: 'water' }]];
const units2 = [createUnit('warrior', 0, 0, 'player')];
const moved = moveUnit(units2[0], 1, 0, map2, units2);
assert.strictEqual(moved, false, 'cannot move into water');
assert.strictEqual(units2[0].x, 0, 'position unchanged');

// normal move into empty tile
const map3 = [[{ type: 'grass' }, { type: 'grass' }]];
const units3 = [createUnit('warrior', 0, 0, 'player')];
const moved2 = moveUnit(units3[0], 1, 0, map3, units3);
assert.strictEqual(moved2, 'move', 'move returns move result');
assert.strictEqual(units3[0].x, 1, 'unit moved to empty tile');
assert.strictEqual(units3[0].moves, 1, 'movement cost applied');

console.log('Unit tests passed');
