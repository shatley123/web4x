export const UNIT_TYPES = {
  settler: { strength: 0 },
  warrior: { strength: 2 },
  barbarian: { strength: 1 }
};

export function createUnit(type, x, y, owner) {
  return { type, x, y, owner, moves: 1 };
}

export function moveUnit(unit, dx, dy, map, units) {
  if (unit.moves <= 0) return false;
  const nx = unit.x + dx;
  const ny = unit.y + dy;
  if (ny < 0 || ny >= map.length || nx < 0 || nx >= map[0].length) return false;
  const tile = map[ny][nx];
  if (tile.type === 'water' || tile.type === 'mountain') return false;

  const target = units.find(u => u.x === nx && u.y === ny);
  if (target) {
    if (target.owner === unit.owner) return false;
    resolveCombat(unit, target, units);
    if (units.includes(unit)) {
      unit.x = nx;
      unit.y = ny;
      unit.moves -= 1;
      return true;
    }
    return false;
  }

  unit.x = nx;
  unit.y = ny;
  unit.moves -= 1;
  return true;
}

export function resolveCombat(attacker, defender, units) {
  const a = UNIT_TYPES[attacker.type].strength;
  const d = UNIT_TYPES[defender.type].strength;
  if (a >= d) {
    units.splice(units.indexOf(defender), 1);
  } else {
    units.splice(units.indexOf(attacker), 1);
  }
}
