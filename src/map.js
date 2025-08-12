// available terrain types
export const TILE_TYPES = ["water", "grass", "mountain", "desert", "forest"];
<<<<<<< HEAD
<<<<<<< HEAD
=======
>>>>>>> origin/codex/create-4x-web-game-inspired-by-civilization-1

/**
 * Generate a map of given width and height.
 * Each tile is an object { type: string, city: boolean, seen: boolean, visible: boolean }
<<<<<<< HEAD
=======
export const RESOURCE_TYPES = ["wheat", "iron"];

/**
 * Generate a map of given width and height.
 * Each tile is an object { type: string, resource: string|null, city: boolean, seen: boolean, visible: boolean, claimedBy: string|null }
>>>>>>> origin/20nj2x-codex/create-4x-web-game-inspired-by-civilization-1
=======
>>>>>>> origin/codex/create-4x-web-game-inspired-by-civilization-1
 * @param {number} width
 * @param {number} height
 * @returns {Array<Array<{type:string, city:boolean}>>}
 */
export function generateMap(width, height) {
  const map = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
<<<<<<< HEAD
<<<<<<< HEAD
      row.push({ type: randomTile(), city: false, seen: false, visible: false });
=======
      const type = randomTile();
      row.push({
        type,
        resource: randomResource(type),
        city: null,
        seen: false,
        visible: false,
        claimedBy: null
      });
>>>>>>> origin/20nj2x-codex/create-4x-web-game-inspired-by-civilization-1
=======
      row.push({ type: randomTile(), city: false, seen: false, visible: false });
>>>>>>> origin/codex/create-4x-web-game-inspired-by-civilization-1
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
<<<<<<< HEAD
<<<<<<< HEAD
=======

function randomResource(type) {
  if (type === "water" || type === "mountain") return null;
  const r = Math.random();
  if (r < 0.05) return "wheat";
  if (r < 0.1) return "iron";
  return null;
}
>>>>>>> origin/20nj2x-codex/create-4x-web-game-inspired-by-civilization-1
=======
>>>>>>> origin/codex/create-4x-web-game-inspired-by-civilization-1
