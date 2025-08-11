import { generateMap } from './map.js';

const TILE_SIZE = 32;
const WORLD_WIDTH = 100;
const WORLD_HEIGHT = 100;
const VIEW_WIDTH = 20;
const VIEW_HEIGHT = 15;
const VISION_RADIUS = 2;

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_WIDTH * TILE_SIZE;
canvas.height = VIEW_HEIGHT * TILE_SIZE;

const map = generateMap(WORLD_WIDTH, WORLD_HEIGHT);
const player = { x: Math.floor(WORLD_WIDTH / 2), y: Math.floor(WORLD_HEIGHT / 2) };

draw();

window.addEventListener('keydown', (e) => {
  switch (e.key) {
    case 'ArrowUp':
      if (player.y > 0) player.y--;
      break;
    case 'ArrowDown':
      if (player.y < WORLD_HEIGHT - 1) player.y++;
      break;
    case 'ArrowLeft':
      if (player.x > 0) player.x--;
      break;
    case 'ArrowRight':
      if (player.x < WORLD_WIDTH - 1) player.x++;
      break;
    case 'c': // found city
      map[player.y][player.x].city = true;
      break;
    default:
      return;
  }
  draw();
});

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updateVisibility();

  const camX = Math.max(0, Math.min(player.x - Math.floor(VIEW_WIDTH / 2), WORLD_WIDTH - VIEW_WIDTH));
  const camY = Math.max(0, Math.min(player.y - Math.floor(VIEW_HEIGHT / 2), WORLD_HEIGHT - VIEW_HEIGHT));

  for (let y = 0; y < VIEW_HEIGHT; y++) {
    for (let x = 0; x < VIEW_WIDTH; x++) {
      const mapX = camX + x;
      const mapY = camY + y;
      const tile = map[mapY][mapX];
      const posX = x * TILE_SIZE;
      const posY = y * TILE_SIZE;
      if (tile.seen) {
        drawTile(tile.type, posX, posY);
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

  // draw player relative to camera
  ctx.fillStyle = '#ffff00';
  ctx.beginPath();
  ctx.arc(
    (player.x - camX) * TILE_SIZE + TILE_SIZE / 2,
    (player.y - camY) * TILE_SIZE + TILE_SIZE / 2,
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
      if (nx >= 0 && nx < WORLD_WIDTH && ny >= 0 && ny < WORLD_HEIGHT) {
        const tile = map[ny][nx];
        tile.visible = true;
        tile.seen = true;
      }
    }
  }
}

function drawTile(type, x, y) {
  switch (type) {
    case 'water':
      ctx.fillStyle = '#1e90ff';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      ctx.strokeStyle = '#add8e6';
      ctx.beginPath();
      ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE / 4, 0, Math.PI);
      ctx.stroke();
      break;
    case 'grass':
      ctx.fillStyle = '#228b22';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      ctx.strokeStyle = '#32cd32';
      for (let i = 0; i < 4; i++) {
        const gx = x + i * (TILE_SIZE / 4) + TILE_SIZE / 8;
        ctx.beginPath();
        ctx.moveTo(gx, y + TILE_SIZE - 4);
        ctx.lineTo(gx, y + TILE_SIZE / 2);
        ctx.stroke();
      }
      break;
    case 'mountain':
      ctx.fillStyle = '#a9a9a9';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#696969';
      ctx.beginPath();
      ctx.moveTo(x + TILE_SIZE / 2, y + 4);
      ctx.lineTo(x + 4, y + TILE_SIZE - 4);
      ctx.lineTo(x + TILE_SIZE - 4, y + TILE_SIZE - 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x + TILE_SIZE / 2, y + 4);
      ctx.lineTo(x + TILE_SIZE / 2 - 6, y + TILE_SIZE / 2);
      ctx.lineTo(x + TILE_SIZE / 2 + 6, y + TILE_SIZE / 2);
      ctx.closePath();
      ctx.fill();
      break;
    case 'desert':
      ctx.fillStyle = '#edc9af';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#deb887';
      ctx.beginPath();
      ctx.moveTo(x + 4, y + TILE_SIZE - 4);
      ctx.lineTo(x + TILE_SIZE / 2, y + TILE_SIZE / 2);
      ctx.lineTo(x + TILE_SIZE - 4, y + TILE_SIZE - 4);
      ctx.closePath();
      ctx.fill();
      break;
    case 'forest':
      ctx.fillStyle = '#006400';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
      ctx.fillStyle = '#228b22';
      ctx.beginPath();
      ctx.moveTo(x + TILE_SIZE / 2, y + 6);
      ctx.lineTo(x + 6, y + TILE_SIZE - 6);
      ctx.lineTo(x + TILE_SIZE - 6, y + TILE_SIZE - 6);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(x + TILE_SIZE / 2 - 2, y + TILE_SIZE - 10, 4, 6);
      break;
    default:
      ctx.fillStyle = '#ff00ff';
      ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  }
}
