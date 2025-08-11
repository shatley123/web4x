// available terrain types
export const TILE_TYPES = ["water", "grass", "mountain", "desert", "forest"];

/**
 * Generate a map of given width and height.
 * Each tile is an object { type: string, city: boolean, seen: boolean, visible: boolean }
 * @param {number} width
 * @param {number} height
 * @returns {Array<Array<{type:string, city:boolean}>>}
 */
export function generateMap(width, height) {
  const map = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      row.push({ type: randomTile(), city: null, seen: false, visible: false });
    }
    map.push(row);
  }
  return map;
}

function randomTile() {
  const r = Math.random();
  if (r < 0.1) return "mountain"; // 10% mountains
  if (r < 0.3) return "water";    // additional 20% water
  if (r < 0.5) return "forest";   // 20% forest
  if (r < 0.6) return "desert";   // 10% desert
  return "grass";                 // remaining 40% grassland
}
