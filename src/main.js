import { generateMap } from './map.js';
import { createUnit, moveUnit } from './unit.js';
import { createCity } from './city.js';
import { endTurn } from './game.js';

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

const ui = document.getElementById('unit-info');

const map = generateMap(WORLD_WIDTH, WORLD_HEIGHT);
const units = [
  createUnit(
    'settler',
    Math.floor(WORLD_WIDTH / 2),
    Math.floor(WORLD_HEIGHT / 2),
    'player'
  )
];
let selected = 0;
let turn = 1;
let cameraX = 0;
let cameraY = 0;
let shake = 0;

let audioCtx;
function playTone(freq, duration) {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.value = freq;
  osc.start();
  osc.stop(audioCtx.currentTime + duration);
}

function playMoveSound() {
  playTone(440, 0.1);
}

function playAttackSound() {
  playTone(220, 0.2);
}

// spawn a few barbarian enemies
for (let i = 0; i < 5; i++) {
  let x, y;
  do {
    x = Math.floor(Math.random() * WORLD_WIDTH);
    y = Math.floor(Math.random() * WORLD_HEIGHT);
  } while (map[y][x].type === 'water' || map[y][x].type === 'mountain');
  units.push(createUnit('barbarian', x, y, 'barbarian'));
}

canvas.addEventListener('click', (e) => {
  const rect = canvas.getBoundingClientRect();
  const tx = Math.floor((e.clientX - rect.left) / TILE_SIZE) + cameraX;
  const ty = Math.floor((e.clientY - rect.top) / TILE_SIZE) + cameraY;
  const clicked = units.findIndex((u) => u.x === tx && u.y === ty);
  if (clicked !== -1) {
    selected = clicked;
  } else {
    const unit = units[selected];
    const dx = tx - unit.x;
    const dy = ty - unit.y;
    if (Math.abs(dx) + Math.abs(dy) === 1) {
      const res = moveUnit(unit, dx, dy, map, units);
      handleAction(res);
    }
  }
});

window.addEventListener('keydown', (e) => {
  const unit = units[selected];
  switch (e.key) {
    case 'ArrowUp':
      handleAction(moveUnit(unit, 0, -1, map, units));
      break;
    case 'ArrowDown':
      handleAction(moveUnit(unit, 0, 1, map, units));
      break;
    case 'ArrowLeft':
      handleAction(moveUnit(unit, -1, 0, map, units));
      break;
    case 'ArrowRight':
      handleAction(moveUnit(unit, 1, 0, map, units));
      break;
    case 'c': // found city
      if (unit.type === 'settler') {
        map[unit.y][unit.x].city = createCity(unit.owner);
        units.splice(selected, 1);
        const defender = createUnit('warrior', unit.x, unit.y, unit.owner);
        units.push(defender);
        selected = units.length - 1;
      }
      break;
    case 'u': // create warrior
      units.push(createUnit('warrior', unit.x, unit.y, 'player'));
      break;
    case 'n':
    case 'Enter':
      endTurn(map, units);
      turn++;
      break;
    case 'Tab':
      selected = (selected + 1) % units.length;
      e.preventDefault();
      break;
    default:
      return;
  }
  if (selected >= units.length) selected = units.length - 1;
});

function handleAction(res) {
  if (res === 'move') playMoveSound();
  else if (res === 'attack') {
    playAttackSound();
    shake = 5;
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updateVisibility();

  for (const u of units) {
    u.fx += (u.x - u.fx) * 0.2;
    u.fy += (u.y - u.fy) * 0.2;
  }

  const focus = units[selected];
  cameraX = Math.max(
    0,
    Math.min(Math.floor(focus.fx) - Math.floor(VIEW_WIDTH / 2), WORLD_WIDTH - VIEW_WIDTH)
  );
  cameraY = Math.max(
    0,
    Math.min(Math.floor(focus.fy) - Math.floor(VIEW_HEIGHT / 2), WORLD_HEIGHT - VIEW_HEIGHT)
  );

  let offsetX = 0;
  let offsetY = 0;
  if (shake > 0) {
    offsetX = (Math.random() * 2 - 1) * shake;
    offsetY = (Math.random() * 2 - 1) * shake;
    shake *= 0.9;
  }

  ctx.save();
  ctx.translate(offsetX, offsetY);

  for (let y = 0; y < VIEW_HEIGHT; y++) {
    for (let x = 0; x < VIEW_WIDTH; x++) {
      const mapX = cameraX + x;
      const mapY = cameraY + y;
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

  for (const u of units) {
    const tile = map[u.y][u.x];
    if (!tile.visible) continue;
    const posX = (u.fx - cameraX) * TILE_SIZE;
    const posY = (u.fy - cameraY) * TILE_SIZE;
    drawUnit(u, posX, posY);
    if (u === units[selected]) {
      ctx.strokeStyle = '#ffffff';
      ctx.strokeRect(posX + 2, posY + 2, TILE_SIZE - 4, TILE_SIZE - 4);
    }
  }

  ctx.restore();

  updateUI();
  requestAnimationFrame(draw);
}

function updateVisibility() {
  for (const row of map) {
    for (const tile of row) {
      tile.visible = false;
    }
  }
  for (const u of units) {
    for (let dy = -VISION_RADIUS; dy <= VISION_RADIUS; dy++) {
      for (let dx = -VISION_RADIUS; dx <= VISION_RADIUS; dx++) {
        const nx = u.x + dx;
        const ny = u.y + dy;
        if (nx >= 0 && nx < WORLD_WIDTH && ny >= 0 && ny < WORLD_HEIGHT) {
          const tile = map[ny][nx];
          tile.visible = true;
          tile.seen = true;
        }
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

function drawUnit(unit, x, y) {
  switch (unit.type) {
    case 'settler':
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.arc(
        x + TILE_SIZE / 2,
        y + TILE_SIZE / 2,
        TILE_SIZE / 3,
        0,
        Math.PI * 2
      );
      ctx.fill();
      break;
    case 'warrior':
      ctx.fillStyle = '#0000ff';
      ctx.fillRect(x + 8, y + 8, TILE_SIZE - 16, TILE_SIZE - 16);
      break;
    case 'barbarian':
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(x + 8, y + 8, TILE_SIZE - 16, TILE_SIZE - 16);
      break;
  }
}

function updateUI() {
  const unit = units[selected];
  ui.textContent = `Turn ${turn} - Selected: ${unit.type} (${unit.owner})`;
}

requestAnimationFrame(draw);
