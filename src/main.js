import { generateMap } from './map.js';

const TILE_SIZE = 32;
const MAP_WIDTH = 20;
const MAP_HEIGHT = 15;
const VISION_RADIUS = 2;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = MAP_WIDTH * TILE_SIZE;
canvas.height = MAP_HEIGHT * TILE_SIZE;

const map = generateMap(MAP_WIDTH, MAP_HEIGHT);
const player = { x: Math.floor(MAP_WIDTH / 2), y: Math.floor(MAP_HEIGHT / 2) };
const textures = createTextures();

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
  updateVisibility();
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      const tile = map[y][x];
      const posX = x * TILE_SIZE;
      const posY = y * TILE_SIZE;
      if (tile.seen) {
        ctx.drawImage(textures[tile.type], posX, posY);
        if (!tile.visible) {
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(posX, posY, TILE_SIZE, TILE_SIZE);
        }
        if (tile.city) {
          ctx.fillStyle = '#ff0000';
          ctx.fillRect(posX + 8, posY + 8, TILE_SIZE - 16, TILE_SIZE - 16);
        }
      } else {
        ctx.fillStyle = '#000000';
        ctx.fillRect(posX, posY, TILE_SIZE, TILE_SIZE);
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

function updateVisibility() {
  for (const row of map) {
    for (const tile of row) {
      tile.visible = false;
    }
  }
  for (let dy = -VISION_RADIUS; dy <= VISION_RADIUS; dy++) {
    for (let dx = -VISION_RADIUS; dx <= VISION_RADIUS; dx++) {
      const nx = player.x + dx;
      const ny = player.y + dy;
      if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT) {
        const tile = map[ny][nx];
        tile.visible = true;
        tile.seen = true;
      }
    }
  }
}

function createTextures() {
  return {
    water: createTexture('#3399ff', (p) => {
      p.strokeStyle = '#88ccff';
      p.lineWidth = 2;
      p.beginPath();
      p.moveTo(0, TILE_SIZE / 2);
      p.lineTo(TILE_SIZE, TILE_SIZE / 2);
      p.stroke();
    }),
    grass: createTexture('#339933', (p) => {
      p.fillStyle = '#33aa33';
      for (let i = 0; i < 5; i++) {
        p.fillRect((i * 6) % TILE_SIZE, (i * 2) % TILE_SIZE, 4, 4);
      }
    }),
    mountain: createTexture('#777777', (p) => {
      p.fillStyle = '#999999';
      p.beginPath();
      p.moveTo(TILE_SIZE / 2, 4);
      p.lineTo(4, TILE_SIZE - 4);
      p.lineTo(TILE_SIZE - 4, TILE_SIZE - 4);
      p.closePath();
      p.fill();
    })
  };
}

function createTexture(baseColor, patternFn) {
  const c = document.createElement('canvas');
  c.width = TILE_SIZE;
  c.height = TILE_SIZE;
  const p = c.getContext('2d');
  p.fillStyle = baseColor;
  p.fillRect(0, 0, TILE_SIZE, TILE_SIZE);
  patternFn(p);
  return c;
}
