import assert from 'node:assert';
import { generateMap, TILE_TYPES } from '../src/map.js';

const width = 5;
const height = 3;
const map = generateMap(width, height);

// Test dimensions
assert.strictEqual(map.length, height, 'map height');
assert.strictEqual(map[0].length, width, 'map width');

// Test all tiles have valid types and default flags
for (const row of map) {
  for (const tile of row) {
    assert.ok(TILE_TYPES.includes(tile.type), 'valid tile type');
    assert.strictEqual(tile.city, null, 'city flag default');
    assert.strictEqual(tile.seen, false, 'seen flag default');
    assert.strictEqual(tile.visible, false, 'visible flag default');
  }
}

console.log('Map generation tests passed');
