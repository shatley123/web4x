export const UNIT_TYPES = {
  settler: { strength: 0, speed: 2, health: 10 },
  warrior: { strength: 2, speed: 2, health: 10 },
  scout: { strength: 1, speed: 3, health: 10 },
  barbarian: { strength: 1, speed: 2, health: 10 },
  archer: { strength: 2, speed: 2, health: 10 },
  horseman: { strength: 3, speed: 4, health: 10 },
};

export const TILE_MOVEMENT_COST = {
  water: Infinity,
  mountain: Infinity,
  grass: 1,
  desert: 1,
  forest: 2,
};

export function createUnit(type, x, y, owner) {
  const { speed, health } = UNIT_TYPES[type];
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
  };
}

export function moveUnit(unit, dx, dy, map, units) {
  if (unit.moves <= 0) return false;
  const nx = unit.x + dx;
  const ny = unit.y + dy;
  if (ny < 0 || ny >= map.length || nx < 0 || nx >= map[0].length) return false;
  const tile = map[ny][nx];
  const cost = TILE_MOVEMENT_COST[tile.type] ?? 1;
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
