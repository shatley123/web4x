import { generateMap } from './map.js';

const TILE_SIZE = 32;
const MAP_WIDTH = 20;
const MAP_HEIGHT = 15;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = MAP_WIDTH * TILE_SIZE;
canvas.height = MAP_HEIGHT * TILE_SIZE;

const map = generateMap(MAP_WIDTH, MAP_HEIGHT);
const player = { x: Math.floor(MAP_WIDTH / 2), y: Math.floor(MAP_HEIGHT / 2) };

draw();

window.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowUp':
      if (player.y > 0) player.y--;
      break;
    case 'ArrowDown':
      if (player.y < MAP_HEIGHT - 1) player.y++;
      break;
    case 'ArrowLeft':
      if (player.x > 0) player.x--;
      break;
    case 'ArrowRight':
      if (player.x < MAP_WIDTH - 1) player.x++;
      break;
    case 'c': // found city
      const tile = map[player.y][player.x];
      tile.city = true;
      break;
    default:
      return;
  }
  draw();
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      const tile = map[y][x];
      ctx.fillStyle = colorForTile(tile);
      ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
      if (tile.city) {
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(x * TILE_SIZE + 8, y * TILE_SIZE + 8, TILE_SIZE - 16, TILE_SIZE - 16);
      }
    }
  }
  // draw player
  ctx.fillStyle = '#ffff00';
  ctx.beginPath();
  ctx.arc(
    player.x * TILE_SIZE + TILE_SIZE / 2,
    player.y * TILE_SIZE + TILE_SIZE / 2,
    TILE_SIZE / 3,
    0,
    Math.PI * 2
  );
  ctx.fill();
}

function colorForTile(tile) {
  switch (tile.type) {
    case 'water':
      return '#3399ff';
    case 'mountain':
      return '#777777';
    default:
      return '#339933'; // grass
  }
}
