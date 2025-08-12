import { generateMap } from './map.js';
import { createUnit, moveUnit, TILE_MOVEMENT_COST } from './unit.js';
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

const textures = {};

function createPattern(drawFn) {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const cctx = c.getContext('2d');
  drawFn(cctx);
  return ctx.createPattern(c, 'repeat');
}

function initTextures() {
  textures.water = createPattern((cctx) => {
    cctx.fillStyle = '#1e90ff';
    cctx.fillRect(0, 0, 32, 32);
    cctx.strokeStyle = '#add8e6';
    cctx.beginPath();
    cctx.arc(16, 16, 8, 0, Math.PI);
    cctx.stroke();
  });
  textures.grass = createPattern((cctx) => {
    cctx.fillStyle = '#228b22';
    cctx.fillRect(0, 0, 32, 32);
    cctx.strokeStyle = '#32cd32';
    for (let i = 0; i < 4; i++) {
      const gx = i * 8 + 4;
      cctx.beginPath();
      cctx.moveTo(gx, 28);
      cctx.lineTo(gx, 16);
      cctx.stroke();
    }
  });
  textures.mountain = createPattern((cctx) => {
    cctx.fillStyle = '#a9a9a9';
    cctx.fillRect(0, 0, 32, 32);
    cctx.fillStyle = '#696969';
    cctx.beginPath();
    cctx.moveTo(16, 4);
    cctx.lineTo(4, 28);
    cctx.lineTo(28, 28);
    cctx.closePath();
    cctx.fill();
  });
  textures.desert = createPattern((cctx) => {
    cctx.fillStyle = '#edc9af';
    cctx.fillRect(0, 0, 32, 32);
    cctx.fillStyle = '#deb887';
    cctx.beginPath();
    cctx.moveTo(4, 28);
    cctx.lineTo(16, 16);
    cctx.lineTo(28, 28);
    cctx.closePath();
    cctx.fill();
  });
  textures.forest = createPattern((cctx) => {
    cctx.fillStyle = '#006400';
    cctx.fillRect(0, 0, 32, 32);
    cctx.fillStyle = '#228b22';
    cctx.beginPath();
    cctx.moveTo(16, 6);
    cctx.lineTo(6, 26);
    cctx.lineTo(26, 26);
    cctx.closePath();
    cctx.fill();
    cctx.fillStyle = '#8b4513';
    cctx.fillRect(14, 22, 4, 6);
  });
}

initTextures();

const info = document.getElementById('info');
const hoverInfo = document.getElementById('hover-info');
const endTurnBtn = document.getElementById('end-turn');
const nextUnitBtn = document.getElementById('next-unit');
const createWarriorBtn = document.getElementById('create-warrior');
const foundCityBtn = document.getElementById('found-city');
const resourcesDiv = document.getElementById('resources');
const civsDiv = document.getElementById('civs');
const cityPanel = document.getElementById('city-panel');
const buildSelect = document.getElementById('build-select');
const setBuildBtn = document.getElementById('set-build');

const map = generateMap(WORLD_WIDTH, WORLD_HEIGHT);

function findPlayerStart() {
  const cx = Math.floor(WORLD_WIDTH / 2);
  const cy = Math.floor(WORLD_HEIGHT / 2);
  const max = Math.max(WORLD_WIDTH, WORLD_HEIGHT);
  for (let r = 0; r < max; r++) {
    for (let dy = -r; dy <= r; dy++) {
      for (let dx = -r; dx <= r; dx++) {
        const nx = cx + dx;
        const ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= WORLD_WIDTH || ny >= WORLD_HEIGHT)
          continue;
        const type = map[ny][nx].type;
        if (TILE_MOVEMENT_COST[type] !== Infinity) return { x: nx, y: ny };
      }
    }
  }
  return { x: cx, y: cy };
}

const start = findPlayerStart();
const units = [createUnit('settler', start.x, start.y, 'player')];
const resources = { player: {}, barbarian: {} };
let selected = 0;
let selectedCity = null;
let turn = 1;
let cameraX = 0;
let cameraY = 0;
let shake = 0;
let panX = 0;
let panY = 0;
let isPanning = false;
let lastMouseX = 0;
let lastMouseY = 0;

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
  const clicked = units.findIndex(
    (u) => u.x === tx && u.y === ty && u.owner === 'player'
  );
  if (clicked !== -1) {
    selected = clicked;
    selectedCity = null;
    resetPan();
  } else if (map[ty][tx].city && map[ty][tx].city.owner === 'player') {
    selectedCity = map[ty][tx].city;
    selectedCity.x = tx;
    selectedCity.y = ty;
    resetPan();
  } else if (!selectedCity) {
    const unit = units[selected];
    if (unit && unit.owner === 'player') {
      const dx = tx - unit.x;
      const dy = ty - unit.y;
      if (Math.abs(dx) + Math.abs(dy) === 1) {
        const res = moveUnit(unit, dx, dy, map, units);
        handleAction(res);
      }
    }
  }
});

canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const tx = Math.floor((e.clientX - rect.left) / TILE_SIZE) + cameraX;
  const ty = Math.floor((e.clientY - rect.top) / TILE_SIZE) + cameraY;
  const tile = map[ty] && map[ty][tx];
  if (tile && tile.seen) {
    let text = `Tile: ${tile.type}`;
    if (tile.resource) text += `, ${tile.resource}`;
    if (tile.city) text += `, City (${tile.city.owner})`;
    hoverInfo.textContent = text;
  } else {
    hoverInfo.textContent = '';
  }
});

canvas.addEventListener('mouseleave', () => {
  hoverInfo.textContent = '';
});

canvas.addEventListener('contextmenu', (e) => e.preventDefault());

canvas.addEventListener('mousedown', (e) => {
  if (e.button !== 0) {
    isPanning = true;
    lastMouseX = e.clientX;
    lastMouseY = e.clientY;
    e.preventDefault();
  }
});

window.addEventListener('mousemove', (e) => {
  if (!isPanning) return;
  const dx = e.clientX - lastMouseX;
  const dy = e.clientY - lastMouseY;
  panX -= dx / TILE_SIZE;
  panY -= dy / TILE_SIZE;
  lastMouseX = e.clientX;
  lastMouseY = e.clientY;
});

window.addEventListener('mouseup', () => {
  isPanning = false;
});

window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  switch (key) {
    case 'w':
      panY -= 1;
      e.preventDefault();
      return;
    case 's':
      panY += 1;
      e.preventDefault();
      return;
    case 'a':
      panX -= 1;
      e.preventDefault();
      return;
    case 'd':
      panX += 1;
      e.preventDefault();
      return;
  }
  if (selectedCity) {
    if (key === 'n' || e.key === 'Enter') {
      endTurn(map, units, resources);
      turn++;
    } else if (e.key === 'Tab') {
      nextPlayerUnit();
      e.preventDefault();
    }
    return;
  }
  const unit = units[selected];
  if (!unit || unit.owner !== 'player') return;
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
        selected = units.findIndex((u) => u.owner === 'player');
        resetPan();
      }
      break;
    case 'u': // create warrior
      units.push(createUnit('warrior', unit.x, unit.y, 'player'));
      break;
    case 'n':
    case 'Enter':
      endTurn(map, units, resources);
      turn++;
      break;
    case 'Tab':
      nextPlayerUnit();
      e.preventDefault();
      break;
    default:
      return;
  }
  if (selected >= units.length || units[selected].owner !== 'player') {
    nextPlayerUnit();
  }
});

endTurnBtn.addEventListener('click', () => {
  endTurn(map, units, resources);
  turn++;
});

nextUnitBtn.addEventListener('click', () => {
  nextPlayerUnit();
  updateUI();
});

createWarriorBtn.addEventListener('click', () => {
  const unit = units[selected];
  if (unit && unit.owner === 'player') {
    units.push(createUnit('warrior', unit.x, unit.y, 'player'));
    updateUI();
  }
});

foundCityBtn.addEventListener('click', () => {
  const unit = units[selected];
  if (unit && unit.owner === 'player' && unit.type === 'settler') {
    map[unit.y][unit.x].city = createCity(unit.owner);
    units.splice(selected, 1);
    const defender = createUnit('warrior', unit.x, unit.y, unit.owner);
    units.push(defender);
    selected = units.findIndex((u) => u.owner === 'player');
    resetPan();
    updateUI();
  }
});

setBuildBtn.addEventListener('click', () => {
  if (selectedCity) {
    selectedCity.build = buildSelect.value;
    updateUI();
  }
});

function handleAction(res) {
  if (res === 'move') playMoveSound();
  else if (res === 'attack') {
    playAttackSound();
    shake = 5;
  }
}

function resetPan() {
  panX = 0;
  panY = 0;
}

function nextPlayerUnit() {
  const indices = units.map((u, i) => i).filter((i) => units[i].owner === 'player');
  if (indices.length === 0) {
    selected = -1;
    return;
  }
  const pos = indices.indexOf(selected);
  const next = indices[(pos + 1) % indices.length];
  selected = next;
  selectedCity = null;
  resetPan();
}


function getAvailableMoves(unit, map, units) {
  const dirs = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ];
  const moves = [];
  for (const [dx, dy] of dirs) {
    const nx = unit.x + dx;
    const ny = unit.y + dy;
    if (ny < 0 || ny >= map.length || nx < 0 || nx >= map[0].length) continue;
    const tile = map[ny][nx];
    const cost = TILE_MOVEMENT_COST[tile.type] ?? 1;
    if (!isFinite(cost) || cost > unit.moves) continue;
    if (units.some((u) => u.x === nx && u.y === ny && u.owner === unit.owner)) continue;
    moves.push({ x: nx, y: ny });
  }
  return moves;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updateVisibility();

  for (const u of units) {
    u.fx += (u.x - u.fx) * 0.2;
    u.fy += (u.y - u.fy) * 0.2;
  }

  const focus = selectedCity ? { fx: selectedCity.x, fy: selectedCity.y } : units[selected] || { fx: 0, fy: 0 };
  let targetX = Math.max(
    0,
    Math.min(Math.floor(focus.fx) - Math.floor(VIEW_WIDTH / 2), WORLD_WIDTH - VIEW_WIDTH)
  );
  let targetY = Math.max(
    0,
    Math.min(Math.floor(focus.fy) - Math.floor(VIEW_HEIGHT / 2), WORLD_HEIGHT - VIEW_HEIGHT)
  );
  cameraX = Math.max(0, Math.min(targetX + Math.round(panX), WORLD_WIDTH - VIEW_WIDTH));
  cameraY = Math.max(0, Math.min(targetY + Math.round(panY), WORLD_HEIGHT - VIEW_HEIGHT));
  panX = cameraX - targetX;
  panY = cameraY - targetY;

  let moveSet = new Set();
  const unit = units[selected];
  if (!selectedCity && unit && unit.owner === 'player' && unit.moves > 0) {
    moveSet = new Set(
      getAvailableMoves(unit, map, units).map((p) => `${p.x},${p.y}`)
    );
  }

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
        const key = `${mapX},${mapY}`;
        if (moveSet.has(key) && tile.visible) {
          ctx.fillStyle = 'rgba(0, 150, 255, 0.35)';
          ctx.fillRect(posX, posY, TILE_SIZE, TILE_SIZE);
        }
        if (tile.resource) drawResource(tile.resource, posX, posY);
        if (tile.city) {
          drawCity(tile.city, posX, posY);
        }
        if (!tile.visible) {
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(posX, posY, TILE_SIZE, TILE_SIZE);
        }
        if (tile.claimedBy) {
          const colors = { player: '#00bfff', barbarian: '#ff6347' };
          ctx.strokeStyle = colors[tile.claimedBy] || '#ffffff';
          ctx.lineWidth = 2;
          ctx.strokeRect(posX + 1, posY + 1, TILE_SIZE - 2, TILE_SIZE - 2);
          ctx.lineWidth = 1;
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
    if (!selectedCity && u === units[selected]) {
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
  const pattern = textures[type];
  if (pattern) {
    ctx.fillStyle = pattern;
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  } else {
    ctx.fillStyle = '#ff00ff';
    ctx.fillRect(x, y, TILE_SIZE, TILE_SIZE);
  }
}

function drawResource(res, x, y) {
  switch (res) {
    case 'wheat':
      ctx.fillStyle = '#fff200';
      ctx.beginPath();
      ctx.arc(x + TILE_SIZE / 2, y + TILE_SIZE / 2, TILE_SIZE / 6, 0, Math.PI * 2);
      ctx.fill();
      break;
    case 'iron':
      ctx.fillStyle = '#555555';
      ctx.fillRect(
        x + TILE_SIZE / 3,
        y + TILE_SIZE / 3,
        TILE_SIZE / 3,
        TILE_SIZE / 3
      );
      break;
  }
}

function drawCity(city, x, y) {
  ctx.fillStyle = '#d3d3d3';
  ctx.fillRect(x + 6, y + 6, TILE_SIZE - 12, TILE_SIZE - 12);
  ctx.fillStyle = '#808080';
  ctx.fillRect(x + 8, y + 8, TILE_SIZE / 2 - 10, TILE_SIZE / 2 - 10);
  ctx.fillRect(x + TILE_SIZE / 2, y + 8, TILE_SIZE / 2 - 10, TILE_SIZE / 2 - 10);
  ctx.fillRect(x + 8, y + TILE_SIZE / 2, TILE_SIZE - 16, TILE_SIZE / 2 - 10);
  const colors = { player: '#00bfff', barbarian: '#ff6347' };
  ctx.strokeStyle = colors[city.owner] || '#000000';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 6, y + 6, TILE_SIZE - 12, TILE_SIZE - 12);
  ctx.lineWidth = 1;
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
      ctx.fillStyle = '#ccc';
      ctx.fillRect(x + TILE_SIZE / 2 - 2, y + 4, 4, TILE_SIZE - 12);
      ctx.fillStyle = '#d4af37';
      ctx.fillRect(x + TILE_SIZE / 2 - 6, y + TILE_SIZE - 12, 12, 4);
      ctx.fillStyle = '#8b4513';
      ctx.fillRect(x + TILE_SIZE / 2 - 4, y + TILE_SIZE - 8, 8, 4);
      break;
    case 'scout':
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(x + TILE_SIZE / 2, y + 4);
      ctx.quadraticCurveTo(
        x + TILE_SIZE - 4,
        y + TILE_SIZE / 2,
        x + TILE_SIZE / 2,
        y + TILE_SIZE - 4
      );
      ctx.quadraticCurveTo(
        x + 4,
        y + TILE_SIZE / 2,
        x + TILE_SIZE / 2,
        y + 4
      );
      ctx.fill();
      ctx.strokeStyle = '#dddddd';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + TILE_SIZE / 2, y + 4);
      ctx.lineTo(x + TILE_SIZE / 2, y + TILE_SIZE - 4);
      ctx.stroke();
      break;
    case 'barbarian':
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(x + 8, y + 8, TILE_SIZE - 16, TILE_SIZE - 16);
      break;
  }
}

function formatResources(obj) {
  return Object.entries(obj)
    .map(([k, v]) => `${k}:${v}`)
    .join(' ') || 'none';
}

function updateUI() {
  if (selectedCity) {
    info.innerHTML =
      `Turn ${turn}<br/>City (${selectedCity.owner})<br/>Production: ${selectedCity.production}<br/>Producing: ${selectedCity.build || 'none'}<br/>Buildings: ${selectedCity.buildings.join(', ') || 'none'}`;
    cityPanel.style.display = 'block';
    buildSelect.value = selectedCity.build || '';
  } else {
    const unit = units[selected];
    if (unit) {
      const tile = map[unit.y][unit.x];
      info.innerHTML = `Turn ${turn}<br/>Selected: ${unit.type} (${unit.owner})<br/>Moves: ${unit.moves}<br/>Tile: ${tile.type}`;
    } else {
      info.innerHTML = `Turn ${turn}`;
    }
    cityPanel.style.display = 'none';
  }
  resourcesDiv.textContent = 'Resources: ' + formatResources(resources.player);
  const civs = new Set();
  for (const u of units) civs.add(u.owner);
  for (const row of map) {
    for (const tile of row) {
      if (tile.city) civs.add(tile.city.owner);
    }
  }
  civsDiv.textContent = 'Civs: ' + Array.from(civs).join(', ');
}

requestAnimationFrame(draw);
