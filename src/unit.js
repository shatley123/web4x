export const UNIT_TYPES = {
  settler: { strength: 0, speed: 2, health: 10, range: 1 },
  warrior: { strength: 2, speed: 2, health: 10, range: 1 },
  scout: { strength: 1, speed: 3, health: 10, range: 1 },
  barbarian: { strength: 1, speed: 2, health: 10, range: 1 },
  archer: { strength: 2, speed: 2, health: 10, range: 2 },
  horseman: { strength: 3, speed: 4, health: 10, range: 1 },
  ship: { strength: 3, speed: 3, health: 10, range: 1 },
};

export const TILE_MOVEMENT_COST = {
  water: Infinity,
  mountain: Infinity,
  grass: 1,
  desert: 1,
  forest: 2,
};

export function createUnit(type, x, y, owner) {
  const { speed, health, range } = UNIT_TYPES[type];
  return {
    type,
    x,
    y,
    owner,
    moves: speed,
    speed,
    fx: x,
    fy: y,
    health,
    maxHealth: health,
    range,
    queue: [],
  };
}

export function moveUnit(unit, dx, dy, map, units) {
  if (unit.moves <= 0) return false;
  const nx = unit.x + dx;
  const ny = unit.y + dy;
  if (ny < 0 || ny >= map.length || nx < 0 || nx >= map[0].length) return false;
  const tile = map[ny][nx];
  let cost = TILE_MOVEMENT_COST[tile.type] ?? 1;
  if (unit.type === 'ship') {
    if (tile.type !== 'water') return false;
    cost = 1;
  }
  if (!isFinite(cost) || cost > unit.moves) return false;

  const target = units.find(u => u.x === nx && u.y === ny);
  if (target) {
    if (target.owner === unit.owner) return false;
    resolveCombat(unit, target, units);
    if (!units.includes(unit)) return false;
    if (!units.includes(target)) {
      unit.fx = unit.x;
      unit.fy = unit.y;
      unit.x = nx;
      unit.y = ny;
      unit.moves -= cost;
      return 'attack';
    }
    unit.moves = 0;
    return 'attack';
  }

  unit.fx = unit.x;
  unit.fy = unit.y;
  unit.x = nx;
  unit.y = ny;
  unit.moves -= cost;
  return 'move';
}

export function attackUnit(attacker, defender, units) {
  if (attacker.moves <= 0) return false;
  const dist = Math.abs(attacker.x - defender.x) + Math.abs(attacker.y - defender.y);
  if (dist > attacker.range) return false;
  if (dist === 1) {
    resolveCombat(attacker, defender, units);
  } else {
    defender.health -= UNIT_TYPES[attacker.type].strength;
    if (defender.health <= 0) {
      units.splice(units.indexOf(defender), 1);
    }
  }
  attacker.moves = 0;
  return 'attack';
}

export function resolveCombat(attacker, defender, units) {
  defender.health -= UNIT_TYPES[attacker.type].strength;
  attacker.health -= UNIT_TYPES[defender.type].strength;
  if (defender.health <= 0) {
    units.splice(units.indexOf(defender), 1);
  }
  if (attacker.health <= 0) {
    units.splice(units.indexOf(attacker), 1);
  }
}

export function findPath(unit, tx, ty, map, units) {
  const width = map[0].length;
  const height = map.length;
  const dist = Array.from({ length: height }, () => Array(width).fill(Infinity));
  const prev = Array.from({ length: height }, () => Array(width).fill(null));
  const queue = [{ x: unit.x, y: unit.y, cost: 0 }];
  dist[unit.y][unit.x] = 0;
  const dirs = [
    [0, -1],
    [0, 1],
    [-1, 0],
    [1, 0],
  ];
  while (queue.length) {
    queue.sort((a, b) => a.cost - b.cost);
    const { x, y, cost } = queue.shift();
    if (x === tx && y === ty) break;
    for (const [dx, dy] of dirs) {
      const nx = x + dx;
      const ny = y + dy;
      if (ny < 0 || ny >= height || nx < 0 || nx >= width) continue;
      const tile = map[ny][nx];
      let moveCost = TILE_MOVEMENT_COST[tile.type] ?? 1;
      if (unit.type === 'ship') {
        if (tile.type !== 'water') continue;
        moveCost = 1;
      } else if (tile.type === 'water') {
        continue;
      }
      if (!isFinite(moveCost)) continue;
      if (units.some((u) => u.x === nx && u.y === ny && u !== unit)) continue;
      const newCost = cost + moveCost;
      if (newCost < dist[ny][nx]) {
        dist[ny][nx] = newCost;
        prev[ny][nx] = { x, y };
        queue.push({ x: nx, y: ny, cost: newCost });
      }
    }
  }
  if (dist[ty][tx] === Infinity) return null;
  const path = [];
  let cx = tx;
  let cy = ty;
  while (!(cx === unit.x && cy === unit.y)) {
    path.unshift({ x: cx, y: cy });
    const p = prev[cy][cx];
    if (!p) break;
    cx = p.x;
    cy = p.y;
  }
  return path;
}

export function processUnitQueue(unit, map, units) {
  while (unit.moves > 0 && unit.queue && unit.queue.length) {
    const next = unit.queue[0];
    const dx = next.x - unit.x;
    const dy = next.y - unit.y;
    const res = moveUnit(unit, dx, dy, map, units);
    if (!res || res === 'attack') {
      unit.queue = [];
      return;
    }
    unit.queue.shift();
  }
}
