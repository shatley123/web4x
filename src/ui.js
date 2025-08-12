// Track the last known build option for each city so we only update the
// <select> element when the city's production choice actually changes. This
// prevents the UI from resetting the user's pending selection when they move
// focus to another control (e.g. clicking the "Set Production" button).
const lastBuild = new WeakMap();

export function updateBuildSelect(city, buildSelect, doc = document) {
  const prev = lastBuild.get(city);
  // Only sync the select when the city's build value has changed, and avoid
  // overriding any in-progress user selection.
  if (prev !== city.build && doc.activeElement !== buildSelect) {
    buildSelect.value = city.build || '';
  }
  lastBuild.set(city, city.build);
}
