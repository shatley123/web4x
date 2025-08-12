// available terrain types
export const TILE_TYPES = ["water", "grass", "mountain", "desert", "forest"];
export const RESOURCE_TYPES = ["wheat", "iron"];

/**
 * Generate a map with continents and biomes.
 * Each tile is an object { type, resource, city, seen, visible, claimedBy }
 * @param {number} width
 * @param {number} height
 * @returns {Array<Array<object>>}
 */
export function generateMap(width, height) {
  // start as all water
  const map = [];
  for (let y = 0; y < height; y++) {
    const row = [];
    for (let x = 0; x < width; x++) {
      row.push({
        type: "water",
        resource: null,
        city: null,
        seen: false,
        visible: false,
        claimedBy: null,
      });
    }
    map.push(row);
  }

  // create a few continents using flood fill from random seeds
  const continents = Math.max(1, Math.floor(Math.min(width, height) / 20));
  for (let i = 0; i < continents; i++) {
    const targetSize = (width * height) / (continents + 1);
    const startX = Math.floor(Math.random() * width);
    const startY = Math.floor(Math.random() * height);
    const queue = [[startX, startY]];
    let carved = 0;
    while (queue.length && carved < targetSize) {
      const [cx, cy] = queue.shift();
      if (cy < 0 || cy >= height || cx < 0 || cx >= width) continue;
      const tile = map[cy][cx];
      if (tile.type !== "water") continue;
      tile.type = "grass"; // base land
      carved++;
      const dirs = [
        [0, -1],
        [0, 1],
        [-1, 0],
        [1, 0],
      ];
      for (const [dx, dy] of dirs) {
        if (Math.random() < 0.8) queue.push([cx + dx, cy + dy]);
      }
    }
  }

  // assign biomes and resources
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const tile = map[y][x];
      if (tile.type === "water") continue;
      const r = Math.random();
      if (r < 0.1) tile.type = "mountain";
      else if (r < 0.3) tile.type = "forest";
      else if (r < 0.4) tile.type = "desert";
      else tile.type = "grass";
      tile.resource = randomResource(tile.type);
    }
  }

  return map;
}

function randomResource(type) {
  if (type === "water" || type === "mountain") return null;
  const r = Math.random();
  if (r < 0.05) return "wheat";
  if (r < 0.1) return "iron";
  return null;
}

