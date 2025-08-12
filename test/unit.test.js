import assert from 'node:assert';
import { createUnit, moveUnit, findPath, processUnitQueue, attackUnit, getAttackableTiles } from '../src/unit.js';

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
assert.strictEqual(units.length, 2, 'both units survive initial combat');
assert.strictEqual(units[0].x, 0, 'warrior stays in place when defender survives');
assert.strictEqual(units[0].health, 9, 'warrior takes damage');
assert.strictEqual(units[1].health, 8, 'barbarian takes damage');
assert.strictEqual(units[0].moves, 0, 'movement consumed on attack');

// continue combat until defender defeated
while (units.length > 1) {
  units[0].moves = units[0].speed;
  moveUnit(units[0], 1, 0, map, units);
}
assert.strictEqual(units.length, 1, 'defender removed after repeated combat');
assert.strictEqual(units[0].x, 1, 'warrior moved into tile after victory');
assert.strictEqual(units[0].health, 5, 'warrior health reduced appropriately');
assert.strictEqual(units[0].moves, 1, 'movement cost applied after moving into tile');

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

// scout properties
const scout = createUnit('scout', 0, 0, 'player');
assert.strictEqual(scout.speed, 3, 'scout has increased speed');
assert.strictEqual(scout.moves, 3, 'scout starts with full moves');

// new unit properties
const archer = createUnit('archer', 0, 0, 'player');
assert.strictEqual(archer.speed, 2, 'archer has expected speed');
assert.strictEqual(archer.moves, 2, 'archer starts with full moves');
assert.strictEqual(archer.health, 10, 'archer starts with full health');
assert.strictEqual(archer.range, 2, 'archer has range 2');

const horseman = createUnit('horseman', 0, 0, 'player');
assert.strictEqual(horseman.speed, 4, 'horseman has increased speed');
assert.strictEqual(horseman.moves, 4, 'horseman starts with full moves');
assert.strictEqual(horseman.health, 10, 'horseman starts with full health');

// archer ranged attack
const rangeUnits = [
  createUnit('archer', 0, 0, 'player'),
  createUnit('barbarian', 2, 0, 'barbarian'),
];
const rangedRes = attackUnit(rangeUnits[0], rangeUnits[1], rangeUnits);
assert.strictEqual(rangedRes, 'attack', 'ranged attack returns attack result');
assert.strictEqual(rangeUnits[1].health, 8, 'target takes damage from ranged attack');
assert.strictEqual(rangeUnits[0].health, 10, 'archer takes no damage at range');
assert.strictEqual(rangeUnits[0].moves, 0, 'archer movement consumed on ranged attack');
assert.strictEqual(rangeUnits.length, 2, 'both units remain after ranged attack');

// ship movement
const waterMap = [
  [{ type: 'water' }, { type: 'water' }],
  [{ type: 'grass' }, { type: 'grass' }],
];
const ship = createUnit('ship', 0, 0, 'player');
const shipMove = moveUnit(ship, 1, 0, waterMap, [ship]);
assert.strictEqual(shipMove, 'move', 'ship moves across water');
ship.moves = ship.speed;
const shipBlocked = moveUnit(ship, 0, 1, waterMap, [ship]);
assert.strictEqual(shipBlocked, false, 'ship cannot move onto land');
assert.strictEqual(ship.x, 1, 'ship position unchanged after failed land move');

// pathfinding and queued movement
const pathMap = [
  [{ type: 'grass' }, { type: 'grass' }, { type: 'grass' }],
  [{ type: 'grass' }, { type: 'water' }, { type: 'grass' }],
  [{ type: 'grass' }, { type: 'grass' }, { type: 'grass' }],
];
const queuedUnit = createUnit('warrior', 0, 0, 'player');
const path = findPath(queuedUnit, 2, 2, pathMap, [queuedUnit]);
assert.ok(path && path.length > 0, 'findPath finds a path');
const originalPath = [...path];
queuedUnit.queue = path;
processUnitQueue(queuedUnit, pathMap, [queuedUnit]);
const expectedPos = originalPath[Math.min(queuedUnit.speed, originalPath.length) - 1];
assert.deepStrictEqual(
  { x: queuedUnit.x, y: queuedUnit.y },
  expectedPos,
  'unit follows queue for available moves'
);
queuedUnit.moves = queuedUnit.speed;
processUnitQueue(queuedUnit, pathMap, [queuedUnit]);
assert.deepStrictEqual(
  { x: queuedUnit.x, y: queuedUnit.y },
  { x: 2, y: 2 },
  'unit completes movement queue'
);
assert.strictEqual(queuedUnit.queue.length, 0, 'queue cleared after reaching destination');

// attackable tiles
const attackMap = Array.from({ length: 5 }, () =>
  Array.from({ length: 5 }, () => ({ type: 'grass' }))
);
const archer2 = createUnit('archer', 2, 2, 'player');
const tiles = getAttackableTiles(archer2, attackMap);
assert.strictEqual(tiles.length, 12, 'archer has 12 attackable tiles at range 2');
assert.ok(
  tiles.some((t) => t.x === 4 && t.y === 2),
  'attack range includes distant tile'
);

console.log('Unit tests passed');
