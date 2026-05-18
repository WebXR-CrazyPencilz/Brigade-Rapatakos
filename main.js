/**
 * main.js — Clean GLB viewer
 * • Strips all cameras & lights from the GLB (we own them here)
 * • Camera follows closed spline loop
 * • Live light controls via console: lights.setAmbient(v) etc.
 */
(() => {
  const canvasWrap  = document.getElementById('canvas-wrap');
  const loader      = document.getElementById('loader');
  const progressBar = document.getElementById('progress-bar');
  const badge       = document.getElementById('badge');
  const btnReset    = document.getElementById('btn-reset');

  /* ══════════════════════════════
     Renderer
  ══════════════════════════════ */
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x0a0a0a, 1);
  canvasWrap.appendChild(renderer.domElement);

  /* ══════════════════════════════
     Scene & Camera
  ══════════════════════════════ */
  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.001, 10000);

  /* ══════════════════════════════
     Spline  — defined here so render loop can use it immediately
  ══════════════════════════════ */
  const points = [
    new THREE.Vector3(30,   50,  0),
    new THREE.Vector3(21,   50,  21),
    new THREE.Vector3(0,    50,  30),
    new THREE.Vector3(-21,  50,  21),
    new THREE.Vector3(-30,  50,  0),
    new THREE.Vector3(-21,  50, -21),
    new THREE.Vector3(0,    50, -30),
    new THREE.Vector3(21,   50, -30),
  ];
  const spline = new THREE.CatmullRomCurve3(points, true); // true = closed loop

  
  /* ══════════════════════════════
     Lighting  (all owned here — nothing from GLB)
  ══════════════════════════════ */
  const ambient = new THREE.AmbientLight(0xffffff, 0.7);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(5, 10, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xaaccff, 0.3);
  fill.position.set(-5, 3, -5);
  scene.add(fill);

  /* ── Live light controls ── */
  window.lights = {
    setAmbient(v)     { ambient.intensity = v;       console.log('%cAmbient → ' + v,   'color:#ffcc44'); },
    setSun(v)         { sun.intensity     = v;       console.log('%cSun → '     + v,   'color:#ffcc44'); },
    setFill(v)        { fill.intensity    = v;       console.log('%cFill → '    + v,   'color:#ffcc44'); },
    setSunColor(hex)  { sun.color.set(hex);          console.log('%cSun color → ' + hex,  'color:#ffcc44'); },
    setFillColor(hex) { fill.color.set(hex);         console.log('%cFill color → ' + hex, 'color:#ffcc44'); },
    setSunPos(x,y,z)  { sun.position.set(x, y, z);  console.log('%cSun pos →', 'color:#ffcc44', x, y, z); },
  };

  /* ══════════════════════════════
     Controls  (kept for reset button)
  ══════════════════════════════ */
  const controls = buildOrbitControls(camera, renderer.domElement);

  /* ══════════════════════════════
     Resize
  ══════════════════════════════ */
  function onResize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  onResize();
  window.addEventListener('resize', onResize);

  /* ══════════════════════════════
     Render loop — camera follows spline
  ══════════════════════════════ */
  let t = 0;
  let paused = false;
  let pauseTimer = null;

  (function animate() {
    requestAnimationFrame(animate);

    if (!paused) {
      t += 0.0003;
      if (t > 1) t -= 1;

      const pos = spline.getPoint(t);
      camera.position.copy(pos);
      camera.lookAt(0, 36, 0);
    }

    renderer.render(scene, camera);
  })();


    renderer.domElement.addEventListener('pointerdown', () => {
    paused = true;
    clearTimeout(pauseTimer);
  });

  renderer.domElement.addEventListener('pointerup', () => {
    clearTimeout(pauseTimer);
    pauseTimer = setTimeout(() => {
      paused = false;
    }, 4000);
  });
  /* ══════════════════════════════
     Fit camera (sets near/far based on model size)
  ══════════════════════════════ */
  function fitCamera(model) {
    const box    = new THREE.Box3().setFromObject(model);
    const size   = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const fov    = camera.fov * (Math.PI / 180);
    const dist   = (maxDim / (2 * Math.tan(fov / 2))) * 1.5;

    model.position.y -= box.min.y;

    camera.near = dist * 0.001;
    camera.far  = dist * 100;
    camera.updateProjectionMatrix();

    // Also scale spline points to match model size
    console.log('%c📐 Model maxDim: ' + maxDim.toFixed(2) + ' — adjust spline point values to match', 'color:#888');
  }

  /* ══════════════════════════════
     Strip cameras & lights from GLB
  ══════════════════════════════ */
  function stripGLBCamerasAndLights(model) {
    const toRemove = [];
    model.traverse((node) => {
      if (node.isCamera || node.isLight) toRemove.push(node);
    });
    toRemove.forEach((node) => {
      if (node.parent) node.parent.remove(node);
    });
    if (toRemove.length) {
      console.log('%c🗑 Stripped ' + toRemove.length + ' camera/light node(s) from GLB', 'color:#888');
    }
  }

  /* ══════════════════════════════
     Load GLB
  ══════════════════════════════ */
  function loadScene() {
    const s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js';
    s.onload = () => {
      const loader3d = new THREE.GLTFLoader();
      loader3d.load(
        'scene.glb',
        (gltf) => {
          const model = gltf.scene;
          stripGLBCamerasAndLights(model);
          model.traverse((c) => {
            if (c.isMesh) { c.castShadow = true; c.receiveShadow = true; }
          });
          scene.add(model);
          fitCamera(model);

          const meshes = [];
          model.traverse((n) => { if (n.isMesh) meshes.push(n.name || '(unnamed)'); });
          console.log('%c══ GLB Loaded ══', 'color:#c8f135;font-size:14px;font-weight:bold');
          console.log('%c Meshes (' + meshes.length + ')', 'color:#aaffaa;font-weight:bold', meshes);
          console.log('%c💡 lights.setAmbient / setSun / setFill / setSunColor / setSunPos', 'color:#ffcc44');

          progressBar.style.width = '100%';
          setTimeout(() => {
            loader.classList.add('hidden');
            badge.classList.add('visible');
            btnReset.classList.add('visible');
          }, 500);
        },
        (e) => { if (e.total) progressBar.style.width = Math.round(e.loaded / e.total * 95) + '%'; },
        (err) => { console.error(err); loader.classList.add('hidden'); alert('Could not load scene.glb'); }
      );
    };
    document.head.appendChild(s);
  }

  loadScene();

  /* ── Reset button ── */
  btnReset.addEventListener('click', () => {
    clearTimeout(pauseTimer);
    paused = false;
    t = 0;
  });

  /* ══════════════════════════════
     Inline OrbitControls  (used only for reset)
  ══════════════════════════════ */
  function buildOrbitControls(cam, el) {
    let defPos = cam.position.clone(), defTarget = new THREE.Vector3();
    const s = {
      down: false, btn: -1, px: 0, py: 0,
      target: new THREE.Vector3(),
      sph: new THREE.Spherical(),
      dSph: new THREE.Spherical(),
      scale: 1,
      pan: new THREE.Vector3(),
    };
    s.sph.setFromVector3(cam.position.clone().sub(s.target));

    el.addEventListener('contextmenu', e => e.preventDefault());
    el.addEventListener('pointerup', () => s.down = false);

    const v = new THREE.Vector3();
    return {
      target: s.target,
      update() {},
      saveDefault() {
        defPos    = cam.position.clone();
        defTarget = s.target.clone();
        s.sph.setFromVector3(cam.position.clone().sub(s.target));
        s.dSph.set(0,0,0);
      },
      resetToDefault() {
        cam.position.copy(defPos);
        s.target.copy(defTarget);
        s.sph.setFromVector3(cam.position.clone().sub(s.target));
        s.dSph.set(0,0,0); s.scale = 1; s.pan.set(0,0,0);
      }
    };
  }
})();