import assert from 'assert';
import { updateBuildSelect } from '../src/ui.js';

// Stub elements and document
const buildSelect = { value: '' };
const doc = { activeElement: null };
const city = { build: 'warrior' };

updateBuildSelect(city, buildSelect, doc);
assert.strictEqual(buildSelect.value, 'warrior');

doc.activeElement = buildSelect;
buildSelect.value = 'scout';
city.build = 'settler';
updateBuildSelect(city, buildSelect, doc);
assert.strictEqual(buildSelect.value, 'scout');

doc.activeElement = null;
updateBuildSelect(city, buildSelect, doc);
assert.strictEqual(buildSelect.value, 'settler');

console.log('UI tests passed');
