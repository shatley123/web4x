/* Basic Roman RTS Prototype */

////////////////////////////////////////////////////////////////////////////////
// 1. Initialization
////////////////////////////////////////////////////////////////////////////////
const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf4f4f4);

const camera = new THREE.PerspectiveCamera(
  60,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 50, 70);
camera.lookAt(0, 0, 0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Optional orbit controls for debugging.
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enablePan = true;
controls.target.set(0, 0, 0);

////////////////////////////////////////////////////////////////////////////////
// 2. Lighting
////////////////////////////////////////////////////////////////////////////////
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
dirLight.position.set(50, 100, 50);
dirLight.castShadow = true;
scene.add(dirLight);

////////////////////////////////////////////////////////////////////////////////
// 3. Terrain (2D Line Art as texture on a plane)
////////////////////////////////////////////////////////////////////////////////
function makeTerrainTexture() {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#e6e2d3'; // base tone
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = '#444';
  ctx.lineWidth = 2;

  // Sample contour/elevation lines
  for (let i = 0; i < 10; i++) {
    const y = (i / 10) * size;
    ctx.beginPath();
    ctx.moveTo(0, y + 20 * Math.sin(i * 0.5));
    ctx.lineTo(size, y - 20 * Math.sin(i * 0.5));
    ctx.stroke();
  }

  // Simple river/environment line
  ctx.strokeStyle = '#3a78c2';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(size * 0.2, 0);
  ctx.lineTo(size * 0.3, size * 0.4);
  ctx.lineTo(size * 0.6, size);
  ctx.stroke();

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(1, 1);
  return tex;
}

const terrainGeo = new THREE.PlaneGeometry(200, 200, 1, 1);
const terrainMat = new THREE.MeshLambertMaterial({
  map: makeTerrainTexture(),
  side: THREE.DoubleSide
});
const terrain = new THREE.Mesh(terrainGeo, terrainMat);
terrain.rotation.x = -Math.PI / 2;
terrain.receiveShadow = true;
scene.add(terrain);

////////////////////////////////////////////////////////////////////////////////
// 4. Units (simple rectangles with unit symbols)
////////////////////////////////////////////////////////////////////////////////
const unitTextureCache = {};

function createUnitTexture(symbol) {
  const key = symbol;
  if (unitTextureCache[key]) return unitTextureCache[key];

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  ctx.strokeRect(0, 0, size, size);

  ctx.fillStyle = '#000000';
  ctx.font = '60px serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(symbol, size / 2, size / 2);

  const tex = new THREE.CanvasTexture(canvas);
  tex.magFilter = THREE.NearestFilter;
  tex.minFilter = THREE.LinearMipMapLinearFilter;

  unitTextureCache[key] = tex;
  return tex;
}

function createUnit(x, z, symbol = 'I') {
  const geo = new THREE.BoxGeometry(6, 2, 10);
  const mat = new THREE.MeshLambertMaterial({
    map: createUnitTexture(symbol),
    transparent: false
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.set(x, 1, z);
  mesh.castShadow = true;
  mesh.userData = {
    selected: false,
    target: null,
    speed: 10 // units per second
  };
  scene.add(mesh);
  return mesh;
}

const units = [
  createUnit(-20, 0, 'I'), // Legion I
  createUnit(-30, -10, 'II'), // Legion II
];

////////////////////////////////////////////////////////////////////////////////
// 5. Input + Selection + Movement
////////////////////////////////////////////////////////////////////////////////
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
let selectedUnit = null;

function onMouseDown(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);

  // Check units first
  const intersectsUnits = raycaster.intersectObjects(units);
  if (intersectsUnits.length > 0) {
    if (selectedUnit) {
      selectedUnit.userData.selected = false;
    }
    selectedUnit = intersectsUnits[0].object;
    selectedUnit.userData.selected = true;
    return;
  }

  // If ground clicked and a unit is selected, set target
  const intersectsTerrain = raycaster.intersectObject(terrain);
  if (intersectsTerrain.length > 0 && selectedUnit) {
    selectedUnit.userData.target = intersectsTerrain[0].point;
  }
}

window.addEventListener('mousedown', onMouseDown);

////////////////////////////////////////////////////////////////////////////////
// 6. Game Loop
////////////////////////////////////////////////////////////////////////////////
let clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();

  // Move selected units toward their target
  units.forEach(u => {
    const target = u.userData.target;
    if (target) {
      const pos = u.position;
      const dir = target.clone().sub(pos);
      const dist = dir.length();
      const move = u.userData.speed * dt;

      if (move >= dist) {
        pos.copy(target);
        u.userData.target = null;
      } else {
        dir.normalize();
        pos.add(dir.multiplyScalar(move));
      }
    }

    // Highlight if selected
    u.material.emissive = u.userData.selected
      ? new THREE.Color(0x444444)
      : new THREE.Color(0x000000);
  });

  renderer.render(scene, camera);
}

animate();

////////////////////////////////////////////////////////////////////////////////
// 7. Responsive canvas
////////////////////////////////////////////////////////////////////////////////
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
