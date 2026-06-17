// main.js — Brigade Stellaris · 360° Unit1 Viewer

// ─── CLOUDINARY THUMB ──────────────────────────────────────────────
function cloudThumb(url) {
  return url.replace('/upload/', '/upload/w_300,h_90,c_fill,q_auto,f_auto/');
}

// ─── ROOMS ─────────────────────────────────────────────────────────
const rooms = {
  foyer:                 { image: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1777702080/foyer_fuoeml.jpg',                   label: 'LOBBY',                   startYaw: 1.55  },
  foyertoliving1:        { image: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1777702030/foyertoliving1_zeafp8.jpg',         label: 'LOBBY TO LIVING',         startYaw: 0.9   },
  foyertoliving2:        { image: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1777702032/foyertoliving2_qzatxq.jpg',         label: 'LOBBY TO LIVING 2'                        },
  livingtokitchen:       { image: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1777702042/livingtokitchen_vbhgqf.jpg',        label: 'LIVING TO KITCHEN'                        },
  kitchen:               { image: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1777702040/kitchen_suq6ha.jpg',                label: 'KITCHEN'                                  },
  utility:               { image: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1777702071/utility_vu3sqz.jpg',                label: 'UTILITY'                                  },
  living:                { image: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1779279823/living_and_dining_zrf7nk.jpg',      label: 'LIVING AND DINING'                        },
  livingtobedroom:       { image: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1777702040/livingtobedrooms_teryyt.jpg',       label: 'LIVING TO BEDROOM'                        },
  masterbedroomcorridor: { image: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1777702058/masterbedroomcorridor_mta2l5.jpg',  label: 'MASTER BEDROOM CORRIDOR'                  },
  masterbedroom:         { image: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1777702049/masterbedroom_lzbzgq.jpg',          label: 'MASTER BEDROOM'                           },
  masterbedroomtoilet:   { image: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1777702061/masterbedroomtoilet_vr1qqf.jpg',    label: 'MASTER BEDROOM TOILET'                    },
  kidsbedroomcorridor:   { image: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1779279656/kids_bedroom_corridor_tprzwb.jpg',  label: 'KIDS BEDROOM CORRIDOR',   startYaw: 0.6   },
  kidsbedroom:           { image: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1779279741/kids_bedroom_lnnx20.jpg',           label: 'KIDS BEDROOM'                             },
  kidsbedroomtoilet:     { image: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1777702069/kidsbedroomtoilet_vohcxo.jpg',      label: 'KIDS BEDROOM TOILET'                      },
  guestbedroomcorridor:  { image: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1777702049/guestbedroomcorridor1_ikczlt.jpg',  label: 'GUEST BEDROOM CORRIDOR'                   },
  guestbedroom:          { image: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1777702038/guestbedroom1_l9wnvg.jpg',          label: 'GUEST BEDROOM'                            },
  guestbedroomtoilet:    { image: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1777702060/guestbedroomtoilet1_avdzas.jpg',    label: 'GUEST BEDROOM TOILET',    startYaw: -0.9  },
  bedroom3corridor:      { image: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1777702072/guestbedroomcorridor2_b12rmu.jpg',  label: 'BEDROOM 3 CORRIDOR'                       },
  bedroom3:              { image: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1777702051/guestbedroom2_cdufxz.jpg',          label: 'BEDROOM 3'                                },
  bedroom3toilet:        { image: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1777702053/guestbedroomtoilet2_b0ae1w.jpg',    label: 'BEDROOM 3 TOILET'                         },
  staffroom:             { image: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1777702062/staffroom_sasyds.jpg',              label: "MAID'S ROOM"                              },
};

const thumbnails = Object.fromEntries(
  Object.entries(rooms).map(([key, val]) => [key, { image: cloudThumb(val.image) }])
);

// ─── HOTSPOTS ──────────────────────────────────────────────────────
const hotspots = {
  living: [
    { target: 'livingtokitchen', position: [-3.0, -2.2,  4.5] },
    { target: 'foyertoliving2',  position: [-5.0, -2.2, -3.0] },
  ],
  livingtobedroom: [
    { target: 'living',                position: [-5.5, -2.3,  0.10] },
    { target: 'masterbedroomcorridor', position: [ 4.5, -2.2,  0.0 ] },
    { target: 'kidsbedroomcorridor',   position: [ 2.0, -2.2, -4.5 ] },
    { target: 'bedroom3corridor',      position: [ 3.0, -2.2,  2.20] },
  ],
  masterbedroomcorridor: [
    { target: 'livingtobedroom',     position: [-5.15, -2.2,  0.8 ] },
    { target: 'masterbedroom',       position: [  1.9, -2.2, -9.0 ] },
    { target: 'masterbedroomtoilet', position: [  3.0, -2.2, -0.15] },
  ],
  masterbedroom: [
    { target: 'masterbedroomcorridor', position: [-1.3, -2.2, 8.0] },
  ],
  masterbedroomtoilet: [
    { target: 'masterbedroomcorridor', position: [3.0, -2.2, -1.0] },
  ],
  kidsbedroomcorridor: [
    { target: 'livingtobedroom',   position: [-5.0, -2.2, -0.2] },
    { target: 'kidsbedroom',       position: [ 5.0, -2.2, -2.0] },
    { target: 'kidsbedroomtoilet', position: [-1.0, -2.2, -2.2] },
  ],
  kidsbedroom: [
    { target: 'kidsbedroomcorridor', position: [-5.2, -2.2, 1.2] },
  ],
  kidsbedroomtoilet: [
    { target: 'kidsbedroomcorridor', position: [2.25, -2.2, -2.0] },
  ],
  guestbedroomcorridor: [
    { target: 'foyertoliving1',     position: [ 0.0,  -2.2,  4.0 ] },
    { target: 'guestbedroom',       position: [-2.5,  -2.2, -8.5 ] },
    { target: 'guestbedroomtoilet', position: [-2.50, -2.2,  1.50] },
  ],
  guestbedroom: [
    { target: 'guestbedroomcorridor', position: [1.30, -2.2, 6.50] },
  ],
  guestbedroomtoilet: [
    { target: 'guestbedroomcorridor', position: [2.0, -2.2, -1.50] },
  ],
  bedroom3corridor: [
    { target: 'livingtobedroom', position: [ 0.90, -2.2, -3.0] },
    { target: 'bedroom3',        position: [ 5.0,  -2.2,  3.0] },
    { target: 'bedroom3toilet',  position: [-1.2,  -2.2,  2.50] },
  ],
  bedroom3: [
    { target: 'bedroom3corridor', position: [-4.0, -2.2, -3.0] },
  ],
  bedroom3toilet: [
    { target: 'bedroom3corridor', position: [2.0, -2.2, -2.0] },
  ],
  foyer: [
    { target: 'foyertoliving1', position: [2.5, -2.2, -1.5] },
  ],
  foyertoliving1: [
    { target: 'foyertoliving2',       position: [ 3.5,  -2.2,  0.0 ] },
    { target: 'foyer',                position: [-2.5,  -2.2,  1.80] },
    { target: 'guestbedroomcorridor', position: [ 0.10, -2.2, -2.3 ] },
  ],
  foyertoliving2: [
    { target: 'living',          position: [ 4.8,  -2.5, -5.35] },
    { target: 'foyertoliving1',  position: [-4.0,  -2.2, -0.350] },
    { target: 'livingtokitchen', position: [ 5.35, -2.2,  0.40] },
  ],
  livingtokitchen: [
    { target: 'kitchen',         position: [ 0.75, -2.2,  4.5 ] },
    { target: 'foyertoliving2',  position: [-7.5,  -2.2,  0.40] },
    { target: 'livingtobedroom', position: [ 5.2,  -2.2,  0.70] },
    { target: 'living',          position: [-4.0,  -2.2, -3.0 ] },
  ],
  kitchen: [
    { target: 'utility',         position: [-6.8, -2.2, -1.50] },
    { target: 'livingtokitchen', position: [-0.4, -2.2, -4.2 ] },
  ],
  utility: [
    { target: 'kitchen',   position: [ 4.5, -2.2, -0.3] },
    { target: 'staffroom', position: [-3.0, -2.2,  4.1] },
  ],
  staffroom: [
    { target: 'utility', position: [3.1, -2.2, -4.0] },
  ],
};

// ─── INJECT PANEL STYLES ───────────────────────────────────────────
(function injectStyles() {
  const style = document.createElement('style');
  style.textContent = `
    @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; overflow: hidden; background: #0a0805; font-family: 'Syne', sans-serif; }
    canvas { display: block; position: fixed !important; top: 0; left: 0; width: 100% !important; height: 100% !important; z-index: 1; }
    #fade-overlay { position: fixed; inset: 0; z-index: 45; background: #0a0805; opacity: 0; pointer-events: none; transition: opacity 0.2s ease; }
    #loading { position: fixed; inset: 0; z-index: 200; background: #0a0805; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px; }
    #loading-ring { width: 40px; height: 40px; border: 2.5px solid rgba(200,190,154,.18); border-top-color: rgba(200,190,154,.85); border-radius: 50%; animation: spin360 0.72s linear infinite; }
    @keyframes spin360 { to { transform: rotate(360deg); } }
    #loading-text { font-family: 'Syne', sans-serif; font-size: 10px; font-weight: 600; letter-spacing: .22em; text-transform: uppercase; color: rgba(200,190,154,.35); }
    #side-panel { position: fixed; top: 0; left: 0; bottom: 0; width: 220px; z-index: 79; pointer-events: all; display: flex; flex-direction: column; background: #f5f1eb; border-right: 1px solid rgba(122,62,30,.15); transform: translateX(-100%); transition: transform .38s cubic-bezier(0.22,1,0.36,1); box-shadow: 4px 0 24px rgba(0,0,0,.18); }
    #side-panel.open { transform: translateX(0); }
    #panel-header { flex-shrink: 0; padding: 22px 18px 16px; border-bottom: 1px solid rgba(122,62,30,.12); }
    #panel-unit-type { font-family: 'Syne', sans-serif; font-size: 8.5px; font-weight: 700; letter-spacing: .22em; text-transform: uppercase; color: rgba(122,62,30,.60); margin-bottom: 6px; }
    #panel-title { font-family: 'Cormorant Garamond', serif; font-size: 20px; font-weight: 700; color: #1a1208; letter-spacing: .01em; line-height: 1.2; }
    #room-list { flex: 1; overflow-y: auto; overflow-x: hidden; padding: 4px 0; }
    #room-list::-webkit-scrollbar { width: 3px; }
    #room-list::-webkit-scrollbar-track { background: transparent; }
    #room-list::-webkit-scrollbar-thumb { background: rgba(122,62,30,.22); border-radius: 2px; }
    #room-list::-webkit-scrollbar-thumb:hover { background: rgba(122,62,30,.50); }
    .room-btn { display: flex; align-items: center; padding: 11px 18px; cursor: pointer; border-bottom: 1px solid rgba(122,62,30,.09); transition: background .18s; -webkit-tap-highlight-color: transparent; gap: 0; }
    .room-btn:hover { background: rgba(122,62,30,.06); }
    .room-btn.active { background: #7a3e1e; border-bottom-color: transparent; }
    .room-label-text { font-family: 'Syne', sans-serif; font-size: 10px; font-weight: 600; letter-spacing: .08em; text-transform: uppercase; color: rgba(30,18,6,.65); line-height: 1.3; transition: color .18s; }
    .room-btn:hover .room-label-text { color: rgba(30,18,6,.90); }
    .room-btn.active .room-label-text { color: #f5f0e8; }
    #panel-footer { flex-shrink: 0; padding: 10px 18px; border-top: 1px solid rgba(122,62,30,.10); font-family: 'Syne', sans-serif; font-size: 8.5px; font-weight: 600; letter-spacing: .18em; text-transform: uppercase; color: rgba(122,62,30,.35); }
    #toggle { position: fixed; top: 50%; left: 0; transform: translateY(-50%); z-index: 90; pointer-events: all; width: 28px; height: 52px; display: flex; align-items: center; justify-content: center; background: #f5f1eb; border: 1px solid rgba(122,62,30,.20); border-left: none; border-radius: 0 8px 8px 0; cursor: pointer; color: rgba(122,62,30,.70); font-size: 11px; line-height: 1; transition: background .22s, border-color .22s, left .38s cubic-bezier(0.22,1,0.36,1); -webkit-tap-highlight-color: transparent; box-shadow: 3px 0 10px rgba(0,0,0,.12); user-select: none; }
    #toggle:hover { background: rgba(122,62,30,.10); border-color: rgba(122,62,30,.45); }
    #toggle.open { left: 220px; }
    #room-label-wrap { position: fixed; bottom: 80px; left: 50%; transform: translateX(-50%); z-index: 60; pointer-events: none; }
    #room-label { font-family: 'Syne', sans-serif; font-size: 10px; font-weight: 700; letter-spacing: .18em; text-transform: uppercase; color: rgba(245,240,232,.60); background: rgba(10,8,5,.55); padding: 5px 14px; border-radius: 20px; border: 1px solid rgba(200,190,154,.12); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); white-space: nowrap; }
  `;
  document.head.appendChild(style);
})();

// ─── BUILD DOM ─────────────────────────────────────────────────────
(function buildDOM() {
  const fadeDiv = document.createElement('div');
  fadeDiv.id = 'fade-overlay';
  document.body.appendChild(fadeDiv);

  document.body.insertAdjacentHTML('beforeend', `
    <div id="loading">
      <div id="loading-ring"></div>
      <div id="loading-text">Loading Experience</div>
    </div>
  `);

  document.body.insertAdjacentHTML('beforeend', `
    <div id="side-panel">
      <div id="panel-header">
        <div id="panel-unit-type">3BHK Virtual Tour</div>
        <div id="panel-title">Select a Room</div>
      </div>
      <div id="room-list"></div>
      <div id="panel-footer"></div>
    </div>
    <div id="toggle">&#x276F;</div>
  `);

  document.body.insertAdjacentHTML('beforeend', `
    <div id="room-label-wrap">
      <div id="room-label">LOBBY</div>
    </div>
  `);
})();

// ─── THREE.JS SCENE ────────────────────────────────────────────────
const scene    = new THREE.Scene();
scene.add(new THREE.AmbientLight(0xffffff, 1.2));

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 0, 0.1);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.insertBefore(renderer.domElement, document.body.firstChild);

// ─── SPHERE ────────────────────────────────────────────────────────
const sGeo = new THREE.SphereGeometry(10, 64, 64);
sGeo.scale(-1, 1, 1);
const panoMaterial = new THREE.MeshBasicMaterial();
scene.add(new THREE.Mesh(sGeo, panoMaterial));

// ─── STATE ─────────────────────────────────────────────────────────
let currentRoom     = 'foyer';
let hotspotMeshes   = [];
let labelSprites    = [];
let camRX = 0, camRY = 0;
let isTransitioning = false;
const minFov = 30, maxFov = 90;

// ─── TEXTURE CACHE ─────────────────────────────────────────────────
const textureCache = {};
const loadingSet   = new Set();
const loader       = new THREE.TextureLoader();

function loadTexture(key, onDone) {
  if (!rooms[key]) { console.warn('loadTexture: unknown key', key); onDone && onDone(null); return; }
  if (textureCache[key]) { onDone && onDone(textureCache[key]); return; }
  if (loadingSet.has(key)) { return; }
  loadingSet.add(key);
  loader.load(
    rooms[key].image,
    (tex) => {
      tex.minFilter       = THREE.LinearFilter;
      tex.magFilter       = THREE.LinearFilter;
      tex.generateMipmaps = false;
      if (typeof THREE.SRGBColorSpace !== 'undefined') tex.colorSpace = THREE.SRGBColorSpace;
      textureCache[key] = tex;
      loadingSet.delete(key);
      onDone && onDone(tex);
    },
    undefined,
    (err) => {
      console.warn('Texture load failed:', rooms[key].image, err);
      loadingSet.delete(key);
      onDone && onDone(null);
    }
  );
}

function preloadInitial() {
  const priority = ['foyer', 'foyertoliving1', 'foyertoliving2', 'living', 'livingtobedroom', 'masterbedroomcorridor'];
  priority.forEach((k, i) => setTimeout(() => loadTexture(k), i * 150));
}

let preloadQueue = [], isPreloading = false;

function preloadConnected(key) {
  const connected = (hotspots[key] || []).map(h => h.target);
  connected.forEach(k => {
    if (!textureCache[k] && !loadingSet.has(k) && !preloadQueue.includes(k)) preloadQueue.unshift(k);
  });
  processPreloadQueue();
}

function processPreloadQueue() {
  if (isPreloading || preloadQueue.length === 0) return;
  isPreloading = true;
  const nextKey = preloadQueue.shift();
  setTimeout(() => {
    if (!textureCache[nextKey]) {
      loadTexture(nextKey, () => { isPreloading = false; processPreloadQueue(); });
    } else { isPreloading = false; processPreloadQueue(); }
  }, 400);
}

// ─── LABEL SPRITE ──────────────────────────────────────────────────
function makeLabelSprite(text) {
  const H = 80, FONT_SIZE = 36, ICON_W = 52, PAD_L = 20, PAD_R = 24;
  const tmp = document.createElement('canvas').getContext('2d');
  tmp.font  = `600 ${FONT_SIZE}px Arial`;
  const textW = tmp.measureText(text).width;
  const W = Math.ceil(ICON_W + textW + PAD_L + PAD_R);

  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');
  const r = H / 2;

  ctx.clearRect(0, 0, W, H);
  ctx.beginPath();
  ctx.moveTo(r, 0); ctx.lineTo(W - r, 0);
  ctx.quadraticCurveTo(W, 0, W, r); ctx.lineTo(W, H - r);
  ctx.quadraticCurveTo(W, H, W - r, H); ctx.lineTo(r, H);
  ctx.quadraticCurveTo(0, H, 0, H - r); ctx.lineTo(0, r);
  ctx.quadraticCurveTo(0, 0, r, 0); ctx.closePath();
  ctx.fillStyle = 'rgba(10,8,5,0.82)'; ctx.fill();
  ctx.strokeStyle = 'rgba(122,62,30,0.90)'; ctx.lineWidth = 4; ctx.stroke();

  ctx.fillStyle = '#c9a23a'; ctx.font = `bold ${FONT_SIZE + 4}px Arial`;
  ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
  ctx.fillText('\u2191', PAD_L, H / 2);

  ctx.fillStyle = '#f0ebe0'; ctx.font = `600 ${FONT_SIZE}px Arial`;
  ctx.fillText(text, PAD_L + ICON_W, H / 2 + 1);

  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set((H / H) * (W / H) * 0.55, 0.55, 1);
  return sprite;
}

// ─── FADE ──────────────────────────────────────────────────────────
function fadeOut(cb) {
  const ov = document.getElementById('fade-overlay');
  if (ov) { ov.style.transition = 'opacity 0.2s ease'; ov.style.opacity = '1'; ov.style.pointerEvents = 'all'; setTimeout(cb, 220); }
  else { cb(); }
}
function fadeIn() {
  const ov = document.getElementById('fade-overlay');
  if (ov) { ov.style.transition = 'opacity 0.25s ease'; ov.style.opacity = '0'; ov.style.pointerEvents = 'none'; }
}

// ─── LOAD ROOM ─────────────────────────────────────────────────────
function loadRoom(key) {
  if (!rooms[key]) { console.error('Invalid room key:', key); return; }
  if (isTransitioning) return;
  isTransitioning = true;
  const prevRoom = currentRoom;

  fadeOut(() => {
    currentRoom = key;
    camRX = 0;
    camRY = rooms[key].startYaw ?? 0;

    const labelEl = document.getElementById('room-label');
    if (labelEl) labelEl.innerText = rooms[key].label;

    document.querySelectorAll('.room-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.getElementById('btn-' + key);
    if (activeBtn) { activeBtn.classList.add('active'); activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }

    loadTexture(key, (tex) => {
      if (!tex) {
        currentRoom = prevRoom;
        document.querySelectorAll('.room-btn').forEach(b => b.classList.remove('active'));
        const prevBtn = document.getElementById('btn-' + prevRoom);
        if (prevBtn) prevBtn.classList.add('active');
        isTransitioning = false; fadeIn(); return;
      }
      panoMaterial.map = tex; panoMaterial.needsUpdate = true;
      const loading = document.getElementById('loading');
      if (loading) { loading.style.transition = 'opacity 0.5s'; loading.style.opacity = '0'; setTimeout(() => loading.parentNode?.removeChild(loading), 500); }
      createHotspots(key); preloadConnected(key); fadeIn(); isTransitioning = false;
    });
  });
}

// ─── CREATE HOTSPOTS ───────────────────────────────────────────────
function createHotspots(roomKey) {
  hotspotMeshes.forEach(h => { scene.remove(h); h.geometry?.dispose(); h.material?.dispose(); });
  labelSprites.forEach(s => { scene.remove(s); s.material?.map?.dispose(); s.material?.dispose(); });
  hotspotMeshes = []; labelSprites = [];

  const data = hotspots[roomKey];
  if (!data) return;

  data.forEach(h => {
    const [hx, hy, hz] = h.position;

    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.25, 0.42, 32),
      new THREE.MeshBasicMaterial({ color: 0xc9a23a, side: THREE.DoubleSide, transparent: true, opacity: 0.92 })
    );
    ring.position.set(hx, hy, hz); ring.rotation.x = -Math.PI / 2; ring.userData.target = h.target;
    scene.add(ring); hotspotMeshes.push(ring);

    const dot = new THREE.Mesh(
      new THREE.CircleGeometry(0.10, 24),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
    );
    dot.position.set(hx, hy + 0.001, hz); dot.rotation.x = -Math.PI / 2; dot.userData.target = h.target;
    scene.add(dot); hotspotMeshes.push(dot);

    const label  = rooms[h.target] ? rooms[h.target].label : h.target;
    const sprite = makeLabelSprite(label);
    const baseY  = hy + 0.95;
    sprite.position.set(hx, baseY, hz); sprite.userData.target = h.target; sprite.userData.baseY = baseY;
    scene.add(sprite); labelSprites.push(sprite);
  });
}

// ─── PANEL ─────────────────────────────────────────────────────────
function buildPanel() {
  const list   = document.getElementById('room-list');
  const footer = document.getElementById('panel-footer');
  if (!list) return;
  const keys = Object.keys(rooms);
  if (footer) footer.textContent = `${keys.length} Spaces`;
  keys.forEach((key, index) => {
    const btn = document.createElement('div');
    btn.className = 'room-btn' + (key === currentRoom ? ' active' : '');
    btn.id = 'btn-' + key;
    btn.innerHTML = `<span class="room-label-text">${String(index + 1).padStart(2, '0')}. ${rooms[key].label}</span>`;
    btn.addEventListener('click', () => { if (key === currentRoom) return; closePanel(); loadRoom(key); });
    list.appendChild(btn);
  });
}

// ─── PANEL TOGGLE ──────────────────────────────────────────────────
let _toggle = null;
let _panel  = null;

function closePanel() {
  if (!_panel || !_toggle) return;
  _panel.classList.remove('open');
  _toggle.classList.remove('open');
  _toggle.innerHTML = '\u276F';
}

function bindPanelToggle() {
  _toggle = document.getElementById('toggle');
  _panel  = document.getElementById('side-panel');
  if (!_toggle || !_panel) return;

  _toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = _panel.classList.toggle('open');
    _toggle.classList.toggle('open', isOpen);
    _toggle.innerHTML = isOpen ? '\u276E' : '\u276F';
  });

  let _lastTouch = 0;
  _toggle.addEventListener('touchend', (e) => {
    e.preventDefault(); e.stopPropagation();
    _lastTouch = Date.now();
    const isOpen = _panel.classList.toggle('open');
    _toggle.classList.toggle('open', isOpen);
    _toggle.innerHTML = isOpen ? '\u276E' : '\u276F';
  });

  document.addEventListener('click', (e) => {
    if (Date.now() - _lastTouch < 400) return;
    if (!_panel || !_toggle) return;
    if (!_panel.contains(e.target) && !_toggle.contains(e.target)) closePanel();
  });
}

// ─── RAYCASTER ─────────────────────────────────────────────────────
const raycaster  = new THREE.Raycaster();
const mouse      = new THREE.Vector2();
let   mouseMoved = false;
let   mouseDownX = 0, mouseDownY = 0;

renderer.domElement.addEventListener('mousedown', e => { mouseMoved = false; mouseDownX = e.clientX; mouseDownY = e.clientY; });
renderer.domElement.addEventListener('mousemove', e => { const dx = e.clientX - mouseDownX, dy = e.clientY - mouseDownY; if (Math.sqrt(dx*dx+dy*dy) > 4) mouseMoved = true; });
renderer.domElement.addEventListener('mouseup', (e) => {
  if (mouseMoved) return;
  if (e.target !== renderer.domElement) return;
  mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1;
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects([...hotspotMeshes, ...labelSprites]);
  if (hits.length > 0) { const target = hits[0].object.userData.target; if (target) { closePanel(); loadRoom(target); } }
});

// ─── DRAG ──────────────────────────────────────────────────────────
let isDown = false, px = 0, py = 0;
renderer.domElement.addEventListener('mousedown', e => { isDown = true; px = e.clientX; py = e.clientY; });
renderer.domElement.addEventListener('mouseup',    () => isDown = false);
renderer.domElement.addEventListener('mouseleave', () => isDown = false);
renderer.domElement.addEventListener('mousemove',  e => {
  if (!isDown) return;
  camRY += (e.clientX - px) * 0.003; camRX += (e.clientY - py) * 0.003;
  camRX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camRX));
  px = e.clientX; py = e.clientY;
});

// ─── TOUCH ─────────────────────────────────────────────────────────
let ttx = 0, tty = 0, tMoved = false;
renderer.domElement.addEventListener('touchstart', e => { ttx = e.touches[0].clientX; tty = e.touches[0].clientY; tMoved = false; });
renderer.domElement.addEventListener('touchmove', e => {
  e.preventDefault();
  const _dx = e.touches[0].clientX - ttx, _dy = e.touches[0].clientY - tty;
  if (Math.sqrt(_dx*_dx+_dy*_dy) > 4) tMoved = true;
  camRY += (e.touches[0].clientX - ttx) * 0.003; camRX += (e.touches[0].clientY - tty) * 0.003;
  camRX = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camRX));
  ttx = e.touches[0].clientX; tty = e.touches[0].clientY;
}, { passive: false });
renderer.domElement.addEventListener('touchend', e => {
  if (tMoved) return;
  if (e.target !== renderer.domElement) return;
  const touch = e.changedTouches[0];
  mouse.x =  (touch.clientX / window.innerWidth)  * 2 - 1;
  mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;
  raycaster.setFromCamera(mouse, camera);
  const hits = raycaster.intersectObjects([...hotspotMeshes, ...labelSprites]);
  if (hits.length > 0) { const target = hits[0].object.userData.target; if (target) loadRoom(target); }
});

// ─── PINCH ZOOM ────────────────────────────────────────────────────
let lastPinchDist = null;
renderer.domElement.addEventListener('touchstart', e => { if (e.touches.length === 2) lastPinchDist = null; }, { passive: true });
renderer.domElement.addEventListener('touchmove', e => {
  if (e.touches.length !== 2) return;
  const dx = e.touches[0].clientX - e.touches[1].clientX, dy = e.touches[0].clientY - e.touches[1].clientY;
  const dist = Math.sqrt(dx*dx + dy*dy);
  if (lastPinchDist !== null) { camera.fov = Math.max(minFov, Math.min(maxFov, camera.fov - (dist - lastPinchDist) * 0.1)); camera.updateProjectionMatrix(); }
  lastPinchDist = dist;
}, { passive: true });

// ─── SCROLL ZOOM ───────────────────────────────────────────────────
renderer.domElement.addEventListener('wheel', (e) => {
  camera.fov = Math.max(minFov, Math.min(maxFov, camera.fov + e.deltaY * 0.05));
  camera.updateProjectionMatrix();
}, { passive: true });

// ─── RESIZE ────────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─── ANIMATE ───────────────────────────────────────────────────────
let lastFrame = 0;
function animate(ts) {
  requestAnimationFrame(animate);
  if (ts - lastFrame > 33) {
    lastFrame = ts;
    const t = ts * 0.001;
    hotspotMeshes.forEach(h => {
      if (h.geometry.type === 'RingGeometry') { const s = 1 + Math.sin(t * 2) * 0.07; h.scale.set(s, s, s); h.material.opacity = 0.7 + Math.sin(t * 2) * 0.25; }
    });
    labelSprites.forEach((s, i) => {
      const offset = i * 0.8;
      s.position.y = s.userData.baseY + Math.sin(t * 1.8 + offset) * 0.04;
      s.material.opacity = 0.82 + Math.sin(t * 1.4 + offset) * 0.15;
    });
  }
  camera.rotation.order = 'YXZ';
  camera.rotation.y = -camRY;
  camera.rotation.x = -camRX;
  renderer.render(scene, camera);
}

// ─── INIT ──────────────────────────────────────────────────────────
buildPanel();
bindPanelToggle();
preloadInitial();
loadRoom('foyer');
animate(0);