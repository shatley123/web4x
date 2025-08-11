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
moveUnit(units[0], 1, 0, map, units);
assert.strictEqual(units.length, 1, 'defender removed after combat');
assert.strictEqual(units[0].x, 1, 'warrior moved into tile');
assert.strictEqual(units[0].moves, 0, 'movement consumed');
assert.strictEqual(units[0].type, 'warrior', 'warrior survives');

// movement blocked by water
const map2 = [[{ type: 'grass' }, { type: 'water' }]];
const units2 = [createUnit('warrior', 0, 0, 'player')];
const moved = moveUnit(units2[0], 1, 0, map2, units2);
assert.strictEqual(moved, false, 'cannot move into water');
assert.strictEqual(units2[0].x, 0, 'position unchanged');

console.log('Unit tests passed');
