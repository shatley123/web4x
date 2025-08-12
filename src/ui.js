export function updateBuildSelect(city, buildSelect, doc = document) {
  if (doc.activeElement !== buildSelect) {
    buildSelect.value = city.build || '';
  }
}
