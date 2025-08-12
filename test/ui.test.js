import assert from 'assert';
import { updateBuildSelect } from '../src/ui.js';

// Stub elements and document
const buildSelect = { value: '' };
const other = {}; // represents another focused element
const doc = { activeElement: null };
const city = { build: 'warrior' };

// Initially syncs to the city's build choice
updateBuildSelect(city, buildSelect, doc);
assert.strictEqual(buildSelect.value, 'warrior');

// User changes selection while focused on the select element
doc.activeElement = buildSelect;
buildSelect.value = 'scout';
updateBuildSelect(city, buildSelect, doc);
assert.strictEqual(buildSelect.value, 'scout');

// User moves focus elsewhere without confirming; selection should persist
doc.activeElement = other;
updateBuildSelect(city, buildSelect, doc);
assert.strictEqual(buildSelect.value, 'scout');

// City build is updated (e.g. after clicking a button); select reflects change
city.build = 'settler';
updateBuildSelect(city, buildSelect, doc);
assert.strictEqual(buildSelect.value, 'settler');

console.log('UI tests passed');
