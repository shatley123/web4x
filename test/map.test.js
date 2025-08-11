import assert from 'node:assert';
import { generateMap, TILE_TYPES } from '../src/map.js';

const width = 5;
const height = 3;
const map = generateMap(width, height);

// Test dimensions
assert.strictEqual(map.length, height, 'map height');
assert.strictEqual(map[0].length, width, 'map width');

// Test all tiles have valid types and city flag
for (const row of map) {
  for (const tile of row) {
    assert.ok(TILE_TYPES.includes(tile.type), 'valid tile type');
    assert.strictEqual(tile.city, false, 'city flag default');
  }
}

console.log('Map generation tests passed');
