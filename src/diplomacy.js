export const diplomacy = {};

export function setDiplomacy(a, b, state) {
  if (!diplomacy[a]) diplomacy[a] = {};
  if (!diplomacy[b]) diplomacy[b] = {};
  diplomacy[a][b] = state;
  diplomacy[b][a] = state;
}

export function getDiplomacy(a, b) {
  return (diplomacy[a] && diplomacy[a][b]) || 'neutral';
}

export function trade(from, to, amount, resources) {
  if (amount <= 0) return false;
  if (getDiplomacy(from, to) !== 'peace') return false;
  if (!resources[from] || !resources[to]) return false;
  const srcGold = resources[from].gold || 0;
  if (srcGold < amount) return false;
  resources[from].gold = srcGold - amount;
  resources[to].gold = (resources[to].gold || 0) + amount;
  return true;
}
