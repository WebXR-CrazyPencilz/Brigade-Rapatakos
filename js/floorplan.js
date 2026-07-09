// floorplan.js — 3-Level Floor Plan Viewer
// Level 0 → Sitemap (default) — 4 tower SVG polygon tiles overlaid
// Level 1 → Tower Cluster image — ODD/EVEN toggle + GLTF mesh zones
// Level 2 → Unit plan — Top View / Isometric toggle
//
// ─── ALIGNMENT SYSTEM ──────────────────────────────────────────────────────
// Each unit mesh is positioned using the CENTROID of its polygon points
// (the same points used by the SVG fallback overlay). This makes the
// floorplan image the single source of truth:
//
//   polygon points  →  centroid (0-100 space)
//      ↓
//   normalised to frustum coords  (centroid / 100 → 0..1, then mapped to frustum)
//      ↓
//   mesh.position  set to that frustum coordinate
//
// The camera uses an aspect-ratio-aware frustum so 1 scene unit = H canvas
// pixels on BOTH axes, meaning the coordinate mapping is:
//
//   sceneX = (cx/100 - 0.5) * aspect         [left=-aspect/2, right=+aspect/2]
//   sceneY = -(cy/100 - 0.5)                 [top=+0.5, bottom=-0.5, Y flipped]
//
// On every resize, syncToImage() recomputes W/H/aspect, resizes the renderer
// and canvas, updates the camera frustum, and repositions+rescales all meshes
// so positions are always locked to the image — never floating.
//
// ─── BROWSER BACK BUTTON (mobile) ──────────────────────────────────────────
// Every drill-down (open → cluster → unit) pushes a history entry.
// popstate steps back through the viewer (unit → cluster → sitemap → close)
// instead of leaving the page. On-screen back / swipe-back call
// history.back() so both paths stay in sync.
// ───────────────────────────────────────────────────────────────────────────

window.FloorplanModule = (function () {

  const IK_BASE = 'https://ik.imagekit.io/pwzaetheh';
  function IK(path) { return `${IK_BASE}/${path}`; }

  // ─── LEVEL 0 — SITEMAP ────────────────────────────────────────
  const SITEMAP = {
    image: IK('Cluster/sitemap.jpg'),
    towerTiles: [
      { id: 'tower-A', label: 'Tower A', points: '42,8 57.8,8 57.8,31 42,31' },
      { id: 'tower-B', label: 'Tower B', points: '46.5,36 63,36 63,59.5 46.75,59.75' },
      { id: 'tower-C', label: 'Tower C', points: '24,53.25 44.65,53.25 44.65,78.5 24,78.5' },
      { id: 'tower-D', label: 'Tower D', points: '24.1,28 40.45,28 40.45,50.35 24.1,50.35' },
    ],
  };

  const TOWERS = {

    // ══════════════════════════════════════════════════════════
    // TOWER A
    // ══════════════════════════════════════════════════════════
    'tower-A': {
      label: 'Tower A',
      odd:  { image: IK('Cluster/Brigade_raptakose_Cluster_Floorplan/typical_odd_tower_01.jpg')  },
      even: { image: IK('Cluster/Brigade_raptakose_Cluster_Floorplan/typical_even_tower_01.jpg') },
      oddUnits: [
        { unitId:'A-odd-01', top:IK('Dimension/unit03_4bhk_(c)_tower_01.jpg'),       iso:IK('Isometric/unit03_4bhk_(c)_tower_01.jpg'),       points:'59,07.5 78,07.5 78,45 59,45' },
        { unitId:'A-odd-02', top:IK('Dimension/unit06_3bhk_l(d)_tower_02.jpg'),      iso:IK('Isometric/unit06_3bhk_l(d)_tower_02.jpg'),      points:'26,63 41.75,63 41.75,91.4 26,91.4' },
        { unitId:'A-odd-03', top:IK('Dimension/unit05_3bhk_s(a)_tower_02.jpg'),      iso:IK('Isometric/unit05_3bhk_s(a)_tower_02.jpg'),      points:'43.8,62.5 62,62.5 62,94.5 43.8,94.5' },
        { unitId:'A-odd-04', top:IK('Dimension/unit01_3bhk_l(c)_podium_tower_02.jpg'),     points:'19.5,24.3 35.5,24.3 35.5,56.5 19.5,56.5' },
        { unitId:'A-odd-05', top:IK('Dimension/unit02_3bhk_l(b)_tower_02.jpg'),      points:'37.5,13.5 56.5,13.5 56.5,41.5 37.5,41.5' },
        { unitId:'A-odd-06', top:IK('Dimension/unit04_4bhk_(e)_odd_tower_04.jpg'),      points:'62.5,46 80,46 80,88.5 62.5,88.5' },
      ],
      evenUnits: [
        { unitId:'A-even-01', top:IK('Dimension/unit01_3bhk_l(c)_podium_tower_02.jpg'),  iso:IK('Isometric/unit01_3bhk_l(c)_podium_tower_02.jpg'),   points:'19.5,24.3 35.5,24.3 35.5,56.5 19.5,56.5' },
        { unitId:'A-even-02', top:IK('Dimension/unit02_3bhk_l(b)_tower_02.jpg'),          iso:IK('Isometric/unit02_3bhk_l(b)_tower_02.jpg'),         points:'37.5,13.5 56.5,13.5 56.5,41.5 37.5,41.5' },
        { unitId:'A-even-03', top:IK('Dimension/unit06_3bhk_l(d)_tower_02.jpg'),          iso:IK('Isometric/unit06_3bhk_l(d)_tower_02.jpg'),         points:'26,63 41.75,63 41.75,91.4 26,91.4' },
        { unitId:'A-even-04', top:IK('Dimension/unit05_3bhk_s(a)_tower_02.jpg'),          iso:IK('Isometric/unit05_3bhk_s(a)_tower_02.jpg'),         points:'43.8,62.5 62,62.5 62,94.5 43.8,94.5' },
        { unitId:'A-even-05', top:IK('Dimension/unit03_4bhk_(c)_even_tower_01.jpg'),         points:'59,06 78,06 78,43 59,43' },
        { unitId:'A-even-06', top:IK('Dimension/unit04_4bhk_(e)_odd_tower_04.jpg'),          points:'62.5,46 80,46 80,87.5 62.5,87.5' },
      ],
    },

    // ══════════════════════════════════════════════════════════
    // TOWER B
    // ══════════════════════════════════════════════════════════
    'tower-B': {
      label: 'Tower B',
      odd:  { image: IK('Cluster/Brigade_raptakose_Cluster_Floorplan/typical_odd_tower_02.jpg')  },
      even: { image: IK('Cluster/Brigade_raptakose_Cluster_Floorplan/typical_even_tower_02.jpg') },
      oddUnits: [
        { unitId:'B-odd-01', top:IK('Dimension/unit03_4bhk_(c)_tower_01.jpg'),  iso:IK('Isometric/unit03_4bhk_(c)_tower_01.jpg'),  points:'58.25,3 80.25,3 80.25,41 58.25,41' },
        { unitId:'B-odd-02', top:IK('Dimension/unit06_3bhk_l(d)_tower_02.jpg'), iso:IK('Isometric/unit06_3bhk_l(d)_tower_02.jpg'), points:'19.5,65 37.5,65 37.5,97.7 19.5,97.7' },
        { unitId:'B-odd-03', top:IK('Dimension/unit05_3bhk_s(a)_podium_tower_02.jpg'), iso:IK('Isometric/unit05_3bhk_s(a)_tower_02.jpg'), points:'40,67.5 61,67.5 61,97.4 40,97.4' },
        { unitId:'B-odd-04', top:IK('Dimension/unit02_3bhk_l(b)_tower_02.jpg'),                                                    points:'34,7.5 56,7.5 56,41 34,41' },
        { unitId:'B-odd-05', top:IK('Dimension/unit01_3bhk_l(c)_podium_tower_02.jpg'), iso:IK('Isometric/unit01_3bhk_l(c)_podium_tower_02.jpg'), points:'13.1,22.3 31.5,22.3 31.5,59.5 13.1,59.5' },
        { unitId:'B-odd-06', top:IK('Dimension/unit04_4bhk_(d)_odd_tower_02.jpg'),                                                    points:'63.5,43 85.5,43 85.5,84.5 63.5,84.5' },
      ],
      evenUnits: [
        { unitId:'B-even-01', top:IK('Dimension/unit01_3bhk_l(c)_podium_tower_02.jpg'), iso:IK('Isometric/unit01_3bhk_l(c)_podium_tower_02.jpg'),  points:'13.3,22.3 31.5,22.3 31.5,59.5 13.3,59.5' },
        { unitId:'B-even-02', top:IK('Dimension/unit02_3bhk_l(b)_tower_02.jpg'),         iso:IK('Isometric/unit02_3bhk_l(b)_tower_02.jpg'),        points:'34,7.5 55.5,7.5 55.5,41 34,41' },
        { unitId:'B-even-03', top:IK('Dimension/unit06_3bhk_l(d)_tower_02.jpg'),         iso:IK('Isometric/unit06_3bhk_l(d)_tower_02.jpg'),        points:'19.5,65 37.5,65 37.5,97.7 19.5,97.7' },
        { unitId:'B-even-04', top:IK('Dimension/unit05_3bhk_s(a)_podium_tower_02.jpg'),         iso:IK('Isometric/unit05_3bhk_s(a)_tower_02.jpg'),        points:'40,67.5 61,67.5 61,97 40,97' },
        { unitId:'B-even-05', top:IK('Dimension/unit04_4bhk_(d)_tower_02.jpg'),          iso:IK('Isometric/unit04_4bhk_(d)_tower_02.jpg'),         points:'63.5,43 85.25,43 85.25,84.5 63.5,84.5' },
        { unitId:'B-even-06', top:IK('Dimension/unit03_4bhk_(c)_even_tower_01.jpg'),        points:'58.25,0.35 80.25,.35 80.25,39 58.25,39' },
      ],
    },

    // ══════════════════════════════════════════════════════════
    // TOWER C
    // ══════════════════════════════════════════════════════════
    'tower-C': {
      label: 'Tower C',
      odd:  { image: IK('Cluster/Brigade_raptakose_Cluster_Floorplan/typical_odd_tower_03.jpg')  },
      even: { image: IK('Cluster/Brigade_raptakose_Cluster_Floorplan/typical_even_tower_03.jpg') },
      oddUnits: [
        { unitId:'C-odd-01', top:IK('Dimension/unit06_3bhk_l(g)_tower_03.jpg'),  iso:IK('Isometric/unit06_3bhk_l(g)_tower_03.jpg'), points:'43,60 65,60 65,92 43,92' },
        { unitId:'C-odd-02', top:IK('Dimension/unit02_3bhk_s(b)_odd_tower_03.jpg'),                                                     points:'52,16.6 72,16.6 72,50 52,50' },
        { unitId:'C-odd-03', top:IK('Dimension/unit02_3bhk_s(b)_odd_tower_03.jpg'),                                                     points:'29.5,11 49.5,11 49.5,39.5 29.5,39.5' },
        { unitId:'C-odd-04', top:IK('Dimension/unit04_3bhk_l(f)_odd_tower_03.jpg'),                                                     points:'74,22.5 91.5,22.5 91.5,55.5 74,55.5' },
        { unitId:'C-odd-05', top:IK('Dimension/unit01_4bhk_g_odd_tower_03.jpg'),                                                        points:'10,12 27.5,12 27.5,56.5 10,56.5' },
        { unitId:'C-odd-06', top:IK('Dimension/unit05_3bhk_l(e)_odd_tower_03.jpg'),                                                     points:'66.6,60 86,60 86,91.6 66.6,91.6' },
        { unitId:'C-odd-07', top:IK('Dimension/unit07_4bhk_(f)_odd_tower_03.jpg'),                                                  points:'15.5,59.5 41,59.5 41,92 15.5,92' },
      ],
      evenUnits: [
        { unitId:'C-even-01', top:IK('Dimension/unit01_4bhk_(g)_tower_03.jpg'),      iso:IK('Isometric/unit01_4bhk_(g)_tower_03.jpg'),      points:'10,12 27.5,12 27.5,56.5 10,56.5' },
        { unitId:'C-even-02', top:IK('Dimension/unit02_3bhk_s(b)_tower_03.jpg'),     iso:IK('Isometric/unit02_3bhk_s(b)_tower_03.jpg'),     points:'30,11 49.5,11 49.5,39.5 30,39.5' },
        { unitId:'C-even-03', top:IK('Dimension/unit02_3bhk_s(b)_tower_03.jpg'),     iso:IK('Isometric/unit03_3bhk_s(b)_tower_03.jpg'),     points:'52,16.6 72,16.6 72,50 52,50' },
        { unitId:'C-even-04', top:IK('Dimension/unit04_3bhk_l(f)_tower_03.jpg'),     iso:IK('Isometric/unit04_3bhk_l(f)_tower_03.jpg'),     points:'74,25 91.5,25 91.5,55.5 74,55.5' },
        { unitId:'C-even-05', top:IK('Dimension/unit06_3bhk_l(g)_tower_03.jpg'),    iso:IK('Isometric/unit06_3bhk_l(g)_tower_03.jpg'),     points:'43.5,60 64,60 64,93 43.5,93' },
        { unitId:'C-even-06', top:IK('Dimension/unit05_3bhk_l(e)_tower_03.jpg'),     iso:IK('Isometric/unit05_3bhk_l(e)_tower_03.jpg'),     points:'66.6,60 86,60 86,91.6 66.6,91.6' },
        { unitId:'C-even-07', top:IK('Dimension/unit07_4bhk_(f)_even_tower_03.jpg'),iso:IK('Isometric/unit07_4bhk_(f)_even_tower_03.jpg'), points:'15.5,60 41,60 41,92 15.5,92' },
      ],
    },

    // ══════════════════════════════════════════════════════════
    // TOWER D
    // ══════════════════════════════════════════════════════════
    'tower-D': {
      label: 'Tower D',
      odd:  { image: IK('Cluster/Brigade_raptakose_Cluster_Floorplan/typical_odd_tower_04.jpg')  },
      even: { image: IK('Cluster/Brigade_raptakose_Cluster_Floorplan/typical_even_tower_04.jpg') },
      oddUnits: [
        { unitId:'D-odd-01', top:IK('Dimension/unit03_3bhk_l(a)_tower_04.jpg'), iso:IK('Isometric/unit03_3bhk_l(a)_tower_04.jpg'), points:'60.5,7 76.5,7 76.5,38 60.5,38' },
        { unitId:'D-odd-02', top:IK('Dimension/unit05_3bhk_s(a)_tower_02.jpg'), iso:IK('Isometric/unit05_3bhk_s(a)_tower_02.jpg'), points:'43.3,61 61,61 61,85.5 43.3,85.5' },
        { unitId:'D-odd-03', top:IK('Dimension/unit01_4bhk_(a)_odd_tower_04.jpg'),                                                    points:'18,21.5 37,21.5 37,59 18,59' },
        { unitId:'D-odd-04', top:IK('Dimension/unit02_3bhk_l(b)_odd_tower_01.jpg'),                                                   points:'39.5,9 58.5,9 58.5,37 39.5,37' },
        { unitId:'D-odd-05', top:IK('Dimension/unit04_4bhk_(e)_odd_tower_04.jpg'),                                                    points:'62,41 79.5,41 79.5,84 62,84' },
        { unitId:'D-odd-06', top:IK('Dimension/unit06_4bhk_(b)_tower_04.jpg'),  iso:IK('Isometric/unit06_4bhk_(b)_tower_04.jpg'), points:'22,58.5 41,58.5 41,92 22,92' },
      ],
      evenUnits: [
        { unitId:'D-even-01', top:IK('Dimension/unit01_4bhk_(a)_tower_04.jpg'),  iso:IK('Isometric/unit01_4bhk_(a)_tower_04.jpg'),  points:'18,21.5 37,21.5 37,59 18,59' },
        { unitId:'D-even-02', top:IK('Dimension/unit02_3bhk_l(b)_tower_02.jpg'), iso:IK('Isometric/unit02_3bhk_l(b)_tower_02.jpg'), points:'39.5,9 58.5,9 58.5,37 39.5,37' },
        { unitId:'D-even-03', top:IK('Dimension/unit03_3bhk_l(a)_tower_04.jpg'), iso:IK('Isometric/unit03_3bhk_l(a)_tower_04.jpg'), points:'60.5,7 76.5,7 76.5,38 60.5,38' },
        { unitId:'D-even-04', top:IK('Dimension/unit06_4bhk_(b)_tower_04.jpg'),  iso:IK('Isometric/unit06_4bhk_(b)_tower_04.jpg'),  points:'22,59 41,59 41,92 22,92' },
        { unitId:'D-even-05', top:IK('Dimension/unit05_3bhk_s(a)_tower_02.jpg'), iso:IK('Isometric/unit05_3bhk_s(a)_tower_02.jpg'), points:'43.3,61 61,61 61,85.5 43.3,85.5' },
        { unitId:'D-even-06', top:IK('Dimension/unit04_4bhk_(e)_tower_04.jpg'),  iso:IK('Isometric/unit04_4bhk_(e)_tower_04.jpg'),  points:'62,41 79,41 79,84 62,84' },
      ],
    },
  };

  // ─── PER-TOWER GLB FILE TABLE ─────────────────────────────────
  const TOWER_UNIT_MESHES = {
    'tower-A': {
      odd: [
        { file:'./assets/typical_odd_tower_01/4BHK-C.glb',    unitId:'A-odd-01' },
        { file:'./assets/typical_odd_tower_01/3BHK(L)-D.glb', unitId:'A-odd-02' },
        { file:'./assets/typical_odd_tower_01/3BHK(S)-A.glb', unitId:'A-odd-03' },
        { file:'./assets/typical_odd_tower_01/3BHK(L)-C.glb', unitId:'A-odd-04' },
        { file:'./assets/typical_odd_tower_01/3BHK(L)-B.glb', unitId:'A-odd-05' },
        { file:'./assets/typical_odd_tower_01/4BHK-E.glb',    unitId:'A-odd-06' },
      ],
      even: [
        { file:'./assets/typical_even_tower_01/3BHK(L)-C.glb', unitId:'A-even-01' },
        { file:'./assets/typical_even_tower_01/3BHK(L)-B.glb', unitId:'A-even-02' },
        { file:'./assets/typical_even_tower_01/3BHK(L)-D.glb', unitId:'A-even-03' },
        { file:'./assets/typical_even_tower_01/3BHK(S)-A.glb', unitId:'A-even-04' },
        { file:'./assets/typical_even_tower_01/4BHK-C.glb',    unitId:'A-even-05' },
        { file:'./assets/typical_even_tower_01/4BHK-E.glb',    unitId:'A-even-06' },
      ],
    },
    'tower-B': {
      odd: [
        { file:'./assets/typical_odd_tower_02/4BHK-C.glb',    unitId:'B-odd-01' },
        { file:'./assets/typical_odd_tower_02/3BHK(L)-D.glb', unitId:'B-odd-02' },
        { file:'./assets/typical_odd_tower_02/3BHK(S)-A.glb', unitId:'B-odd-03' },
        { file:'./assets/typical_odd_tower_02/3BHK(L)-B.glb', unitId:'B-odd-04' },
        { file:'./assets/typical_odd_tower_02/3BHK(L)-C.glb', unitId:'B-odd-05' },
        { file:'./assets/typical_odd_tower_02/4BHK-D.glb',    unitId:'B-odd-06' },
      ],
      even: [
        { file:'./assets/typical_even_tower_02/3BHK(L)-C.glb', unitId:'B-even-01' },
        { file:'./assets/typical_even_tower_02/3BHK(L)-B.glb', unitId:'B-even-02' },
        { file:'./assets/typical_even_tower_02/3BHK(L)-D.glb', unitId:'B-even-03' },
        { file:'./assets/typical_even_tower_02/3BHK(S)-A.glb', unitId:'B-even-04' },
        { file:'./assets/typical_even_tower_02/4BHK-D.glb',    unitId:'B-even-05' },
        { file:'./assets/typical_even_tower_02/4BHK-C.glb',    unitId:'B-even-06' },
      ],
    },
    'tower-C': {
      odd: [
        { file:'./assets/typical_odd_tower_03/3BHK(L)-G.glb', unitId:'C-odd-01' },
        { file:'./assets/typical_odd_tower_03/3BHK(S)-B.glb', unitId:'C-odd-02' },
        { file:'./assets/typical_odd_tower_03/3BHK(S)-B.glb', unitId:'C-odd-03' },
        { file:'./assets/typical_odd_tower_03/3BHK(L)-F.glb', unitId:'C-odd-04' },
        { file:'./assets/typical_odd_tower_03/4BHK-G.glb',    unitId:'C-odd-05' },
        { file:'./assets/typical_odd_tower_03/3BHK(L)-E.glb', unitId:'C-odd-06' },
        { file:'./assets/typical_odd_tower_03/4BHK-F.glb',    unitId:'C-odd-07' },
      ],
      even: [
        { file:'./assets/typical_even_tower_03/4BHK-G.glb',    unitId:'C-even-01' },
        { file:'./assets/typical_even_tower_03/3BHK(S)-B.glb', unitId:'C-even-02' },
        { file:'./assets/typical_even_tower_03/3BHK(S)-B.glb', unitId:'C-even-03' },
        { file:'./assets/typical_even_tower_03/3BHK(L)-F.glb', unitId:'C-even-04' },
        { file:'./assets/typical_even_tower_03/3BHK(L)-G.glb', unitId:'C-even-05' },
        { file:'./assets/typical_even_tower_03/3BHK(L)-E.glb', unitId:'C-even-07' },
        { file:'./assets/typical_even_tower_03/4BHK-F.glb',    unitId:'C-even-06' },
      ],
    },
    'tower-D': {
      odd: [
        { file:'./assets/typical_odd_tower_04/3BHK(L)-A.glb', unitId:'D-odd-01' },
        { file:'./assets/typical_odd_tower_04/3BHK(S)-A.glb', unitId:'D-odd-02' },
        { file:'./assets/typical_odd_tower_04/4BHK-A.glb',    unitId:'D-odd-03' },
        { file:'./assets/typical_odd_tower_04/3BHK(L)-B.glb', unitId:'D-odd-04' },
        { file:'./assets/typical_odd_tower_04/4BHK-E.glb',    unitId:'D-odd-05' },
        { file:'./assets/typical_odd_tower_04/4BHK-B.glb',    unitId:'D-odd-06' },
      ],
      even: [
        { file:'./assets/typical_even_tower_04/4BHK-A.glb',    unitId:'D-even-01' },
        { file:'./assets/typical_even_tower_04/3BHK(L)-B.glb', unitId:'D-even-02' },
        { file:'./assets/typical_even_tower_04/3BHK(L)-A.glb', unitId:'D-even-03' },
        { file:'./assets/typical_even_tower_04/4BHK-B.glb',    unitId:'D-even-04' },
        { file:'./assets/typical_even_tower_04/3BHK(S)-A.glb', unitId:'D-even-05' },
        { file:'./assets/typical_even_tower_04/4BHK-E.glb',    unitId:'D-even-06' },
      ],
    },
  };

  // ─── POLYGON HELPERS ──────────────────────────────────────────
  function parsePoints(str) {
    return str.trim().split(/\s+/).map(p => {
      const [x, y] = p.split(',').map(Number);
      return { x, y };
    });
  }

  function polyCentroid(pts) {
    const cx = pts.reduce((s, p) => s + p.x, 0) / pts.length;
    const cy = pts.reduce((s, p) => s + p.y, 0) / pts.length;
    return { cx, cy };
  }

  function polyBBox(pts) {
    const xs = pts.map(p => p.x);
    const ys = pts.map(p => p.y);
    return {
      minX: Math.min(...xs), maxX: Math.max(...xs),
      minY: Math.min(...ys), maxY: Math.max(...ys),
    };
  }

  function centroidToScene(cx, cy, aspect) {
    return {
      sx: (cx / 100 - 0.5) * aspect,
      sy: -(cy / 100 - 0.5),
    };
  }

  function bboxToSceneSize(bbox, aspect) {
    const w = (bbox.maxX - bbox.minX) / 100 * aspect;
    const h = (bbox.maxY - bbox.minY) / 100;
    return { sw: w, sh: h };
  }

  // ─── LEVEL 2 — UNIT IMAGE ────────────────────────────────────
  function unitImagePath(unitData, view) {
    return view === 'iso' ? unitData.iso : unitData.top;
  }

  // ─── STATE ───────────────────────────────────────────────────
  let level          = 0;
  let activeTower    = null;
  let activeUnit     = null;
  let floorParity    = 'odd';
  let viewMode       = 'top';
  let overlayOpen    = false;
  let _transitioning = false;
  let unitEnteredAt  = 0; // timestamp when activeUnit became visible — used for dwell-time tracking

  // ─── HELPERS ─────────────────────────────────────────────────
  function isOdd(n) { return n % 2 !== 0; }
  function getUnits(towerId, parity) {
    const t = TOWERS[towerId]; if (!t) return [];
    return parity === 'odd' ? t.oddUnits : t.evenUnits;
  }
  function getClusterImage(towerId, parity) {
    const t = TOWERS[towerId]; if (!t) return '';
    return parity === 'odd' ? t.odd.image : t.even.image;
  }

  // ─── INJECT HTML & STYLES ────────────────────────────────────
  function injectHTML() {
    if (document.getElementById('fp-overlay')) return;

    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap');

      #fp-overlay {
        position: fixed;
        top: 0; left: 0; right: 0;
        bottom: calc(62px + env(safe-area-inset-bottom, 0px));
        z-index: 200; background: #eeebe6;
        display: flex; flex-direction: column;
        opacity: 0; pointer-events: none;
        transform: translateY(6px);
        transition: opacity 0.38s ease, transform 0.38s cubic-bezier(0.22,1,0.36,1);
        font-family: 'Syne', sans-serif; overflow: hidden;
        padding: 24px; box-sizing: border-box;
      }
      #fp-overlay.open   { opacity: 1; pointer-events: all; transform: translateY(0); }
      #fp-overlay.hidden { display: none; }

      #fp-card {
        flex: 1; border-radius: 12px; overflow: hidden;
        box-shadow: 0 4px 24px rgba(0,0,0,.10);
        background: #ffffff;
        display: flex; flex-direction: column;
        position: relative;
      }

      :root { --fp-topbar-h: 56px; }

      @media (max-width: 480px) {
        #fp-toggles-row { position: static; transform: none; flex: 1; justify-content: center; }
        #fp-topbar { flex-wrap: nowrap; padding: 8px; gap: 6px; }
        .fp-parity-btn, .fp-toggle-btn { padding: 6px 10px; font-size: 8px; }
      }

      #fp-content { flex: 1; position: relative; overflow: hidden; }

      #fp-topbar {
        flex-shrink: 0; display: flex; align-items: center;
        padding: 8px 12px;
        border-bottom: 1px solid rgba(122,62,30,.15);
        background: #ffffff;
        gap: 10px; position: relative; z-index: 2;
      }
      #fp-back {
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; opacity: 0; pointer-events: none;
        transition: opacity 0.22s ease; flex-shrink: 0;
        width: 32px;   /* fixed width so spacer can mirror it exactly */
      }
      #fp-back.visible { opacity: 1; pointer-events: all; }
      #fp-back-arrow {
        width: 32px; height: 32px; border-radius: 8px;
        border: 1px solid rgba(122,62,30,.30);
        background: rgba(122,62,30,.06);
        display: flex; align-items: center; justify-content: center;
        transition: background 0.2s, border-color 0.2s;
        -webkit-tap-highlight-color: transparent;
      }
      #fp-back:active #fp-back-arrow, #fp-back:hover #fp-back-arrow {
        background: rgba(122,62,30,.14); border-color: rgba(122,62,30,.60);
      }
      #fp-back-arrow svg {
        width:13px; height:13px; stroke: #7a3e1e;
        fill:none; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round;
      }

      /* #fp-title removed */

      #fp-toggles-row {
        flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
        position: relative;
      }

      #fp-parity-toggle, #fp-view-toggle {
        display: flex; background: #f0ede8;
        border: 1px solid rgba(122,62,30,.20); border-radius: 999px;
        padding: 3px; gap: 2px;
        opacity: 0; pointer-events: none; transition: opacity 0.28s;
        position: absolute; left: 50%; transform: translateX(-50%);
        white-space: nowrap;
      }
      #fp-parity-toggle.visible, #fp-view-toggle.visible { opacity: 1; pointer-events: all; }

      .fp-parity-btn, .fp-toggle-btn {
        padding: 6px 16px; font-family: 'Syne', sans-serif;
        font-size: 9px; font-weight: 700; letter-spacing: .13em; text-transform: uppercase;
        color: rgba(80,50,30,.50); cursor: pointer; background: transparent;
        border: none; outline: none; border-radius: 999px;
        transition: background 0.22s, color 0.22s;
        white-space: nowrap; min-height: 32px; display: flex; align-items: center;
        -webkit-tap-highlight-color: transparent;
      }
      .fp-parity-btn.active, .fp-toggle-btn.active {
        background: #7a3e1e;
        color: #f5f0e8; box-shadow: 0 2px 8px rgba(122,62,30,.25);
      }
      .fp-parity-btn:not(.active):hover, .fp-toggle-btn:not(.active):hover {
        color: #7a3e1e; background: rgba(122,62,30,.10);
      }

      /* Right spacer mirrors back button width so toggles stay perfectly centred */
      #fp-topbar-spacer { width: 32px; flex-shrink: 0; }

      .fp-panel {
        position: absolute; inset: 0; opacity: 0; pointer-events: none;
        transition: opacity 0.30s ease, transform 0.30s cubic-bezier(0.22,1,0.36,1);
      }
      .fp-panel.enter   { opacity: 1; pointer-events: all; transform: translateX(0) !important; }
      .fp-panel.exit-l  { opacity: 0; transform: translateX(-32px); }
      .fp-panel.exit-r  { opacity: 0; transform: translateX( 32px); }

      /* ── SITEMAP ── */
      #fp-panel-sitemap {
        display: flex; align-items: center; justify-content: center;
        background: #ffffff; transform: translateX(0);
      }
      #fp-sitemap-wrap { position: relative; display: inline-block; max-width: 100%; max-height: 100%; }
      #fp-sitemap-img {
        display: block; max-width: 100%;
        max-height: calc(100dvh - var(--fp-topbar-h) - 62px - 48px - env(safe-area-inset-bottom, 0px));
        object-fit: contain; border: 1px solid rgba(122,62,30,.12);
      }

      .fp-sitemap-svg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: visible; }
      .fp-tower-poly {
        fill: rgba(122,62,30,.15); stroke: rgba(122,62,30,.80); stroke-width: .15;
        stroke-linejoin: round; cursor: pointer;
        transition: fill 0.22s, stroke 0.22s;
      }
      .fp-tower-poly:hover, .fp-tower-poly.tapped {
        fill: rgba(122,62,30,.28); stroke: rgba(122,62,30,.95);
      }
      .fp-tower-label {
        font-family: 'Cormorant Garamond', serif; font-size: 3px; font-weight: 500;
        fill: rgba(245,242,235,.90); pointer-events: none; text-anchor: middle;
        dominant-baseline: middle;
      }
      .fp-tower-sub {
        font-family: 'Syne', sans-serif; font-size: 1.8px; font-weight: 700;
        letter-spacing: 0.08em; fill: rgba(200,185,165,.60);
        pointer-events: none; text-anchor: middle; dominant-baseline: middle;
      }

      #fp-sitemap-hint {
        position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
        font-family: 'Cormorant Garamond', serif; font-size: 11px; font-style: italic;
        color: rgba(80,50,30,.40); pointer-events: none; white-space: nowrap;
      }

      /* ── CLUSTER ── */
      #fp-panel-cluster {
        display: flex; align-items: center; justify-content: center;
        background: #ffffff; transform: translateX(32px);
      }
      #fp-cluster-wrap { position: relative; display: inline-block; max-width: 100%; max-height: 100%; }
      #fp-cluster-img {
        display: block; max-width: 100%;
        max-height: calc(100dvh - var(--fp-topbar-h) - 62px - 48px - env(safe-area-inset-bottom, 0px));
        object-fit: contain; border: 1px solid rgba(122,62,30,.12);
        transition: opacity 0.28s; pointer-events: none;
      }
      #fp-cluster-img.fading { opacity: 0; }

      #fp-zone-svg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: visible; }
      .fp-zone {
        fill: rgba(122,62,30,.08); stroke: rgba(122,62,30,.45); stroke-width: .2;
        cursor: pointer; pointer-events: all;
        transition: fill 0.20s, stroke 0.20s; stroke-linejoin: round;
      }
      .fp-zone:hover, .fp-zone.tapped { fill: rgba(122,62,30,.22); stroke: rgba(122,62,30,.90); }
      .fp-zone.selected { fill: rgba(122,62,30,.18); stroke: #7a3e1e; stroke-width: 1; }
      #fp-zone-tip {
        position: absolute; padding: 6px 12px;
        background: rgba(255,255,255,.95); border: 1px solid rgba(122,62,30,.30);
        border-radius: 4px; backdrop-filter: blur(8px);
        pointer-events: none; opacity: 0; transition: opacity 0.18s;
        z-index: 10; white-space: nowrap; max-width: calc(100vw - 24px);
        box-shadow: 0 4px 16px rgba(0,0,0,.10);
      }
      #fp-zone-tip.visible { opacity: 1; }
      #fp-zone-tip-name { font-family: 'Cormorant Garamond', serif; font-size: 14px; font-weight: 500; color: #2a1a0a; display: block; }
      #fp-zone-tip-type { font-family: 'Syne', sans-serif; font-size: 8.5px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: rgba(122,62,30,.70); display: block; margin-top: 2px; }

      /* ── UNIT PANEL ── */
      #fp-panel-unit { display: flex; flex-direction: column; transform: translateX(32px); background: #ffffff; }
      #fp-plan-area {
        flex: 1; display: flex; align-items: center; justify-content: center;
        position: relative; overflow: hidden; padding: 0; box-sizing: border-box;
        touch-action: none;
      }
      #fp-plan-img {
        position: absolute; inset: 0;
        width: 100%; height: 100%;
        object-fit: contain;
        object-position: center center;
        border: none; border-radius: 0; box-shadow: none;
        opacity: 1; transition: opacity 0.28s; background: #f8f6f3;
        transform-origin: center center; user-select: none; -webkit-user-select: none;
      }
      #fp-plan-img.fading { opacity: 0; }
      #fp-zoom-hint {
        position: absolute; bottom: 60px; left: 50%; transform: translateX(-50%);
        font-family: 'Syne', sans-serif; font-size: 8.5px; font-weight: 600;
        letter-spacing: .12em; text-transform: uppercase;
        color: rgba(80,50,30,.40); pointer-events: none;
        opacity: 0; transition: opacity 0.4s; white-space: nowrap;
      }
      #fp-zoom-hint.visible { opacity: 1; }
      #fp-unit-info { display: none; }
      #fp-unit-info.visible { display: none; }
      #fp-unit-info-name { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 300; font-style: italic; color: rgba(40,20,10,.75); line-height: 1.1; }
      #fp-unit-info-type { font-family: 'Syne', sans-serif; font-size: 9px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; color: rgba(122,62,30,.70); }
      #fp-unit-info-area { font-family: 'Syne', sans-serif; font-size: 9px; font-weight: 400; letter-spacing: .10em; color: rgba(80,50,30,.45); }

      /* ── SPINNER ── */
      #fp-spinner {
        position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
        background: rgba(255,255,255,.60); opacity: 0; pointer-events: none;
        transition: opacity 0.22s; z-index: 5;
      }
      #fp-spinner.visible { opacity: 1; }
      #fp-spinner-ring {
        width: 34px; height: 34px; border: 2px solid rgba(122,62,30,.20);
        border-top-color: rgba(122,62,30,.85); border-radius: 50%;
        animation: fpSpin 0.72s linear infinite;
      }
      @keyframes fpSpin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);

    document.body.insertAdjacentHTML('beforeend', `
      <div id="fp-overlay">
        <div id="fp-card">
          <div id="fp-topbar">
            <div id="fp-back">
              <div id="fp-back-arrow">
                <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
              </div>
            </div>
            <div id="fp-toggles-row">
              <div id="fp-parity-toggle">
                <button class="fp-parity-btn active" data-parity="odd">Odd</button>
                <button class="fp-parity-btn"        data-parity="even">Even</button>
              </div>
              <div id="fp-view-toggle">
                <button class="fp-toggle-btn active" data-view="top">Plan</button>
                <button class="fp-toggle-btn"        data-view="iso">ISO</button>
              </div>
            </div>
            <div id="fp-topbar-spacer"></div>
          </div>
          <div id="fp-content">
            <div id="fp-spinner"><div id="fp-spinner-ring"></div></div>
            <div id="fp-panel-sitemap" class="fp-panel">
              <div id="fp-sitemap-wrap">
                <img id="fp-sitemap-img" src="" alt="Site Plan" />
                <div id="fp-sitemap-hint">Select a tower to explore floor plans</div>
              </div>
            </div>
            <div id="fp-panel-cluster" class="fp-panel">
              <div id="fp-cluster-wrap">
                <img id="fp-cluster-img" src="" alt="Cluster Plan" />
                <svg id="fp-zone-svg" viewBox="0 0 100 100"></svg>
                <div id="fp-zone-tip">
                  <span id="fp-zone-tip-name"></span>
                  <span id="fp-zone-tip-type"></span>
                </div>
              </div>
            </div>
            <div id="fp-panel-unit" class="fp-panel">
              <div id="fp-plan-area">
                <img id="fp-plan-img" src="" alt="Unit Floor Plan" />
                <div id="fp-unit-info">
                  <div id="fp-unit-info-name"></div>
                  <div id="fp-unit-info-type"></div>
                  <div id="fp-unit-info-area"></div>
                </div>
                <div id="fp-zoom-hint">Pinch to zoom</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `);

    const sitemapImg = document.getElementById('fp-sitemap-img');
    if (sitemapImg) sitemapImg.src = SITEMAP.image;
  }

  // ─── TOPBAR HEIGHT TRACKER ────────────────────────────────────
  let _topbarRO = null;
  function watchTopbarHeight() {
    const bar = document.getElementById('fp-topbar');
    if (!bar) return;
    if (_topbarRO) _topbarRO.disconnect();
    _topbarRO = new ResizeObserver(() => {
      document.documentElement.style.setProperty('--fp-topbar-h', bar.offsetHeight + 'px');
    });
    _topbarRO.observe(bar);
  }

  // ─── PANEL TRANSITIONS ───────────────────────────────────────
  function showPanel(id, direction) {
    _transitioning = true;
    clearTimeout(showPanel._timer);
    showPanel._timer = setTimeout(() => { _transitioning = false; }, 350);
    ['fp-panel-sitemap','fp-panel-cluster','fp-panel-unit'].forEach(pid => {
      const el = document.getElementById(pid);
      if (!el) return;
      el.classList.remove('enter','exit-l','exit-r');
      el.classList.add(pid === id ? 'enter' : direction === 'forward' ? 'exit-l' : 'exit-r');
    });
  }

  function updateTitle() { /* fp-title removed — toggle row is centred via spacer */ }

  function resetToSitemap() {
    disposeGltfCanvas();
    disposeSitemapCanvas();
    if (_sitemapRO) { _sitemapRO.disconnect(); _sitemapRO = null; }
    level = 0; activeTower = null; activeUnit = null;
    viewMode = 'top'; floorParity = 'odd';
    const svg = document.getElementById('fp-zone-svg');
    if (svg) svg.innerHTML = '';
    const clusterImg = document.getElementById('fp-cluster-img');
    if (clusterImg) { clusterImg.classList.remove('fading'); clusterImg.removeAttribute('src'); }
    const planImg = document.getElementById('fp-plan-img');
    if (planImg) { planImg.classList.remove('fading'); planImg.removeAttribute('src'); planImg.style.transform = ''; }
    const unitInfo = document.getElementById('fp-unit-info');
    if (unitInfo) unitInfo.classList.remove('visible');
    const spinner = document.getElementById('fp-spinner');
    if (spinner) spinner.classList.remove('visible');
    const zoomHint = document.getElementById('fp-zoom-hint');
    if (zoomHint) zoomHint.classList.remove('visible');
    document.querySelectorAll('.fp-zone.selected').forEach(z => z.classList.remove('selected'));
    hideZoneTip();
    showPanel('fp-panel-sitemap', 'back');
    updateTopbar();
    updateTitle();
    // Only rebuild the sitemap canvas if the overlay is actually open (i.e. navigating
    // back to L0, not closing). When close() triggers resetToSitemap the overlay is
    // already marked closed, so we skip the wasteful GLB reload.
    if (overlayOpen) buildSitemapTiles();
  }

  // ─── SITEMAP GLTF TILES ──────────────────────────────────────
  // GLB files: assets/sitemap/TOWER A.glb … TOWER D.glb
  // Same approach as buildGltfZones: invisible fill + white glow edges,
  // glow only on hover. Falls back to SVG polygons if Three.js missing.
  // ─────────────────────────────────────────────────────────────

  // GLB file list — points derived from SITEMAP.towerTiles (single source of truth)
  const SITEMAP_MESH_FILES = {
    'tower-A': './assets/sitemap/TOWER A.glb',
    'tower-B': './assets/sitemap/TOWER B.glb',
    'tower-C': './assets/sitemap/TOWER C.glb',
    'tower-D': './assets/sitemap/TOWER D.glb',
  };
  const SITEMAP_MESHES = SITEMAP.towerTiles.map(t => ({
    file:    SITEMAP_MESH_FILES[t.id],
    towerId: t.id,
    label:   t.label,
    points:  t.points,
  }));

  let _sitemapRO        = null;
  let _sitemapROTimer   = null;
  let _sitemapRenderer  = null;
  let _sitemapAnimId    = null;
  let _sitemapGltfRO    = null;

  function disposeSitemapCanvas() {
    if (_sitemapAnimId)   { cancelAnimationFrame(_sitemapAnimId); _sitemapAnimId = null; }
    if (_sitemapGltfRO)   { _sitemapGltfRO.disconnect(); _sitemapGltfRO = null; }
    if (_sitemapRenderer) { _sitemapRenderer.dispose(); _sitemapRenderer = null; }
    const old = document.getElementById('fp-sitemap-canvas');
    if (old) old.remove();
  }

  function buildSitemapTiles() {
    disposeSitemapCanvas();
    const wrap = document.getElementById('fp-sitemap-wrap');
    const img  = document.getElementById('fp-sitemap-img');
    if (!wrap || !img) return;

    // Wait until the image has laid out before creating the canvas
    function tryBuild() {
      if (!img.offsetWidth || !img.offsetHeight) {
        requestAnimationFrame(tryBuild); return;
      }
      // Three.js available? → GLTF path. Otherwise → SVG fallback.
      if (typeof THREE !== 'undefined' && typeof THREE.GLTFLoader !== 'undefined') {
        _buildSitemapGltf(wrap, img);
      } else {
        _buildSitemapSvg(wrap, img);
      }
    }

    if (img.complete && img.naturalWidth > 0) tryBuild();
    else img.addEventListener('load', tryBuild, { once: true });

    // Keep canvas locked to image on resize
    _sitemapRO = new ResizeObserver(() => {
      clearTimeout(_sitemapROTimer);
      _sitemapROTimer = setTimeout(() => {
        if (_sitemapRenderer) _syncSitemapToImage(wrap, img);
      }, 60);
    });
    _sitemapRO.observe(wrap);
    _sitemapRO.observe(img);
  }

  // ── Precomputed polygon data for sitemap tiles ────────────────
  const _sitemapPolyData = {};
  SITEMAP_MESHES.forEach(m => {
    const pts        = parsePoints(m.points);
    const { cx, cy } = polyCentroid(pts);
    const bbox       = polyBBox(pts);
    _sitemapPolyData[m.towerId] = { cx, cy, bbox };
  });

  // Shared resize sync — same maths as syncToImage in buildGltfZones
  let _sitemapRootList  = [];
  let _sitemapMeshMap   = {};
  let _sitemapCamera    = null;
  let _sitemapCanvas    = null;

  function _syncSitemapToImage(wrap, img) {
    if (!_sitemapCamera || !_sitemapCanvas || !_sitemapRenderer) return;
    const imgRect  = img.getBoundingClientRect();
    const wrapRect = wrap.getBoundingClientRect();
    const W = Math.round(imgRect.width);
    const H = Math.round(imgRect.height);
    const imgLeft = Math.round(imgRect.left - wrapRect.left);
    const imgTop  = Math.round(imgRect.top  - wrapRect.top);
    if (W < 4 || H < 4) return;

    const aspect = W / H;
    _sitemapCanvas.width  = W;
    _sitemapCanvas.height = H;
    Object.assign(_sitemapCanvas.style, {
      top: imgTop + 'px', left: imgLeft + 'px',
      width: W + 'px',   height: H + 'px',
    });
    _sitemapRenderer.setSize(W, H, false);

    _sitemapCamera.left   = -aspect * 0.5;
    _sitemapCamera.right  =  aspect * 0.5;
    _sitemapCamera.top    =  0.5;
    _sitemapCamera.bottom = -0.5;
    _sitemapCamera.updateProjectionMatrix();

    _sitemapRootList.forEach(({ root, towerId }) => {
      const poly = _sitemapPolyData[towerId];
      if (!poly) return;

      const sc = centroidToScene(poly.cx, poly.cy, aspect);
      const sz = bboxToSceneSize(poly.bbox, aspect);

      root.scale.set(1, 1, 1);
      root.position.set(0, 0, 0);
      root.updateMatrixWorld(true);

      const box1  = new THREE.Box3().setFromObject(root);
      const size1 = new THREE.Vector3(); box1.getSize(size1);

      const scaleX = size1.x > 0.0001 ? sz.sw / size1.x : 1;
      const scaleY = size1.y > 0.0001 ? sz.sh / size1.y : 1;
      root.scale.set(scaleX, scaleY, Math.min(scaleX, scaleY));

      root.updateMatrixWorld(true);
      const box2 = new THREE.Box3().setFromObject(root);
      const ctr2 = new THREE.Vector3(); box2.getCenter(ctr2);
      root.position.set(sc.sx - ctr2.x, sc.sy - ctr2.y, 0);

      // Re-register children in meshMap
      root.traverse(child => {
        if (!child.isMesh) return;
        const existing = _sitemapMeshMap[child.uuid] || {};
        _sitemapMeshMap[child.uuid] = { ...existing, mesh: child, towerId };
      });
    });
  }

  function _buildSitemapGltf(wrap, img) {
    // ── Canvas ──────────────────────────────────────────────────
    const canvas = document.createElement('canvas');
    canvas.id = 'fp-sitemap-canvas';
    Object.assign(canvas.style, { position: 'absolute', pointerEvents: 'all', zIndex: '5' });
    wrap.appendChild(canvas);
    _sitemapCanvas = canvas;

    // ── Renderer ────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 0);
    _sitemapRenderer = renderer;

    // ── Camera ──────────────────────────────────────────────────
    const camera = new THREE.OrthographicCamera(-1, 1, 0.5, -0.5, 0.1, 1000);
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
    _sitemapCamera = camera;

    const scene     = new THREE.Scene();
    const raycaster = new THREE.Raycaster();
    const mouse     = new THREE.Vector2();
    _sitemapMeshMap  = {};
    _sitemapRootList = [];

    // ── Material factories (same as cluster zones) ───────────────
    function makeFill() {
      return new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, opacity: 0,
        side: THREE.DoubleSide, depthWrite: false,
      });
    }
    function makeEdge(opacity) {
      return new THREE.LineBasicMaterial({
        color: 0xffffff, transparent: true, opacity,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
    }

    // ── Load each tower GLB ──────────────────────────────────────
    const loader = new THREE.GLTFLoader();
    let loaded = 0, failed = 0;
    const total = SITEMAP_MESHES.length;

    SITEMAP_MESHES.forEach(({ file, towerId }) => {
      loader.load(file, (gltf) => {
        const root = gltf.scene;
        root.rotation.set(0, 0, 0);
        root.scale.set(1, 1, 1);
        root.position.set(0, 0, 0);
        root.updateMatrixWorld(true);

        // Flip flat XZ meshes upright
        const box0  = new THREE.Box3().setFromObject(root);
        const size0 = new THREE.Vector3(); box0.getSize(size0);
        if (size0.y < 0.01) { root.rotation.x = Math.PI / 2; root.updateMatrixWorld(true); }

        // Assign materials: invisible fill + 3-layer glow edges
        root.traverse(child => {
          if (!child.isMesh) return;
          child.material = makeFill();
          const edgesGeo = new THREE.EdgesGeometry(child.geometry);

          const e1 = new THREE.LineSegments(edgesGeo, makeEdge(0)); e1.renderOrder = 1; child.add(e1);
          const e2 = new THREE.LineSegments(edgesGeo, makeEdge(0)); e2.renderOrder = 1; child.add(e2);
          const e3 = new THREE.LineSegments(edgesGeo, makeEdge(0)); e3.renderOrder = 1; child.add(e3);

          _sitemapMeshMap[child.uuid] = { mesh: child, e1, e2, e3, towerId };
        });

        _sitemapRootList.push({ root, towerId });
        scene.add(root);
        loaded++;
        _syncSitemapToImage(wrap, img);
        console.log('[SITEMAP GLTF] ✔ ' + file.split('/').pop() + ' → ' + towerId);
        if (loaded + failed === total)
          console.log('[SITEMAP GLTF] DONE — Loaded:', loaded, '| Failed:', failed);

      }, undefined, (err) => {
        failed++;
        console.error('[SITEMAP GLTF] LOAD ERROR:', file, err);
        if (loaded + failed === total && loaded === 0) {
          disposeSitemapCanvas();
          _buildSitemapSvg(wrap, img);
        }
      });
    });

    // ── ResizeObserver ───────────────────────────────────────────
    _sitemapGltfRO = new ResizeObserver(() => _syncSitemapToImage(wrap, img));
    _sitemapGltfRO.observe(img);

    // ── Hover state ──────────────────────────────────────────────
    let hovered = null;

    function pick(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      mouse.x =  ((clientX - rect.left) / rect.width)  * 2 - 1;
      mouse.y = -((clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const meshes = Object.values(_sitemapMeshMap).map(v => v.mesh);
      const hits   = raycaster.intersectObjects(meshes, false);
      return hits.length ? _sitemapMeshMap[hits[0].object.uuid] : null;
    }

    function setHover(hit) {
      if (hovered) {
        hovered.mesh.material.opacity = 0;
        if (hovered.e1) hovered.e1.material.opacity = 0;
        if (hovered.e2) hovered.e2.material.opacity = 0;
        if (hovered.e3) hovered.e3.material.opacity = 0;
        hovered = null;
      }
      if (hit) {
        hit.mesh.material.opacity = 0.10;
        if (hit.e1) hit.e1.material.opacity = 1.0;
        if (hit.e2) hit.e2.material.opacity = 0.75;
        if (hit.e3) hit.e3.material.opacity = 0.50;
        hovered = hit;
      }
      canvas.style.cursor = hit ? 'pointer' : '';
    }

    // ── Mouse / touch events ─────────────────────────────────────
    canvas.addEventListener('mousemove',  e => setHover(pick(e.clientX, e.clientY)));
    canvas.addEventListener('mouseleave', () => setHover(null));
    canvas.addEventListener('click', e => {
      if (e.detail === 0) return;
      const hit = pick(e.clientX, e.clientY);
      if (hit) drillToCluster(hit.towerId);
    });

    let touchMoved = false, touchHit = null;
    canvas.addEventListener('touchstart', e => {
      touchMoved = false;
      touchHit   = pick(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    canvas.addEventListener('touchmove', () => { touchMoved = true; touchHit = null; }, { passive: true });
    canvas.addEventListener('touchend', e => {
      if (!touchMoved && touchHit) { e.preventDefault(); drillToCluster(touchHit.towerId); }
      touchHit = null;
    });

    // ── Render loop ──────────────────────────────────────────────
    (function loop() {
      _sitemapAnimId = requestAnimationFrame(loop);
      renderer.render(scene, camera);
    })();
  }

  // ── SVG fallback (original polygon approach) ──────────────────
  function _buildSitemapSvg(wrap, img) {
    const old = wrap.querySelector('.fp-sitemap-svg');
    if (old) old.remove();

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'fp-sitemap-svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;overflow:visible;pointer-events:none;';

    SITEMAP.towerTiles.forEach(tile => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.style.pointerEvents = 'all';

      const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      poly.setAttribute('class', 'fp-tower-poly');
      poly.setAttribute('points', tile.points);

      const pts = parsePoints(tile.points);
      const { cx, cy } = polyCentroid(pts);

      const labelEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      labelEl.setAttribute('class', 'fp-tower-label');
      labelEl.setAttribute('x', cx); labelEl.setAttribute('y', cy - 1.5);
      labelEl.textContent = tile.label;

      const subEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      subEl.setAttribute('class', 'fp-tower-sub');
      subEl.setAttribute('x', cx); subEl.setAttribute('y', cy + 2);
      subEl.textContent = 'Explore';

      poly.addEventListener('mouseenter', () => { poly.setAttribute('fill','rgba(212,175,55,.35)'); poly.setAttribute('stroke','rgba(212,175,55,1)'); });
      poly.addEventListener('mouseleave', () => { poly.setAttribute('fill','rgba(212,175,55,0.08)'); poly.setAttribute('stroke','rgba(212,175,55,0.50)'); });
      let tMoved = false;
      g.addEventListener('touchstart', () => { tMoved = false; poly.setAttribute('fill','rgba(212,175,55,.25)'); }, { passive: true });
      g.addEventListener('touchmove',  () => { tMoved = true;  poly.setAttribute('fill','rgba(212,175,55,0.08)'); }, { passive: true });
      g.addEventListener('touchend', e => { poly.setAttribute('fill','rgba(212,175,55,0.08)'); if (!tMoved) { e.preventDefault(); drillToCluster(tile.id); } });
      g.addEventListener('click', e => { if (e.detail === 0) return; drillToCluster(tile.id); });

      g.appendChild(poly); g.appendChild(labelEl); g.appendChild(subEl);
      svg.appendChild(g);
    });
    wrap.appendChild(svg);
  }

  // ─── SWAP PARITY ─────────────────────────────────────────────
  function swapParity(newParity) {
    if (!activeTower || newParity === floorParity || level !== 1) return;
    activeUnit  = null;
    floorParity = newParity;
    document.querySelectorAll('.fp-parity-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.parity === floorParity);
    });
    const img = document.getElementById('fp-cluster-img');
    const svg = document.getElementById('fp-zone-svg');
    if (!img || !svg) return;
    document.querySelectorAll('.fp-zone.selected').forEach(z => z.classList.remove('selected'));
    svg.innerHTML = '';
    img.classList.add('fading');
    const reqTower = activeTower, reqParity = floorParity;
    setTimeout(() => {
      let done = false;
      function finish() {
        if (done) return; done = true;
        if (activeTower !== reqTower || floorParity !== reqParity) return;
        img.classList.remove('fading');
        buildGltfZones(reqTower, reqParity);
      }
      img.addEventListener('load',  finish, { once: true });
      img.addEventListener('error', () => img.classList.remove('fading'), { once: true });
      img.src = getClusterImage(activeTower, floorParity);
      if (img.complete && img.naturalWidth > 0) finish();
    }, 220);
  }

  // ─── DRILL TO CLUSTER ────────────────────────────────────────
  function drillToCluster(towerId) {
    if (_transitioning) return;
    activeUnit = null; viewMode = 'top'; floorParity = 'odd';
    const unitInfo = document.getElementById('fp-unit-info');
    if (unitInfo) unitInfo.classList.remove('visible');
    const planImg = document.getElementById('fp-plan-img');
    if (planImg) { planImg.removeAttribute('src'); planImg.style.transform = ''; }
    document.querySelectorAll('.fp-zone.selected').forEach(z => z.classList.remove('selected'));
    activeTower = towerId;
    document.querySelectorAll('.fp-parity-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.parity === floorParity);
    });
    const img = document.getElementById('fp-cluster-img');
    const svg = document.getElementById('fp-zone-svg');
    if (!img || !svg) return;
    svg.innerHTML = '';
    img.classList.add('fading');
    const reqTower = towerId, reqParity = floorParity;
    setTimeout(() => {
      let done = false;
      function finish() {
        if (done) return; done = true;
        if (activeTower !== reqTower || floorParity !== reqParity) return;
        img.classList.remove('fading');
        setTimeout(() => {
          if (activeTower !== reqTower || floorParity !== reqParity) return;
          buildGltfZones(reqTower, reqParity);
        }, 350);
      }
      img.addEventListener('load',  finish, { once: true });
      img.addEventListener('error', () => img.classList.remove('fading'), { once: true });
      img.src = getClusterImage(towerId, floorParity);
      if (img.complete && img.naturalWidth > 0) finish();
    }, 220);
    level = 1;
    showPanel('fp-panel-cluster', 'forward');
    updateTopbar();
    updateTitle();
    if (!_poppingState) pushFpState();
  }

  // ─── GLTF MESH ZONE PICKER ───────────────────────────────────
  let _gltfRenderer = null;
  let _gltfAnimId   = null;
  let _gltfRO       = null;

  function disposeGltfCanvas() {
    if (_gltfAnimId)   { cancelAnimationFrame(_gltfAnimId); _gltfAnimId = null; }
    if (_gltfRO)       { _gltfRO.disconnect(); _gltfRO = null; }
    if (_gltfRenderer) { _gltfRenderer.dispose(); _gltfRenderer = null; }
    const old = document.getElementById('fp-gltf-canvas');
    if (old) old.remove();
    const dbg = document.getElementById('fp-debug-svg');
    if (dbg) dbg.remove();
  }

  function buildGltfZones(towerId, parity) {
    disposeGltfCanvas();

    const wrap = document.getElementById('fp-cluster-wrap');
    const img  = document.getElementById('fp-cluster-img');
    if (!wrap || !img) return;

    if (!img.offsetWidth) {
      requestAnimationFrame(() => buildGltfZones(towerId, parity));
      return;
    }

    const unitMeshList = (TOWER_UNIT_MESHES[towerId] || {})[parity];
    if (typeof THREE === 'undefined' || typeof THREE.GLTFLoader === 'undefined') {
      console.warn('FloorplanModule: Three.js or GLTFLoader missing — falling back to SVG');
      buildZones(towerId, parity); return;
    }
    if (!unitMeshList || unitMeshList.length === 0) {
      console.warn('FloorplanModule: no unit meshes defined for', towerId, parity, '— falling back to SVG');
      buildZones(towerId, parity); return;
    }

    // ── unitId → unitData lookup ──────────────────────────────────
    const unitById = {};
    getUnits(towerId, parity).forEach(u => { unitById[u.unitId] = u; });

    const DEBUG_MARKERS = false;

    // ── Precompute stable polygon data ──
    const unitPolyData = {};
    unitMeshList.forEach(({ unitId }) => {
      const ud = unitById[unitId] || null;
      if (!ud || !ud.points) return;
      const pts        = parsePoints(ud.points);
      const { cx, cy } = polyCentroid(pts);
      const bbox       = polyBBox(pts);
      unitPolyData[unitId] = { cx, cy, bbox };
    });

    // ── Create canvas ───────────────────────────────────────────
    const canvas = document.createElement('canvas');
    canvas.id = 'fp-gltf-canvas';
    Object.assign(canvas.style, {
      position: 'absolute',
      pointerEvents: 'all',
      zIndex: '5',
    });
    wrap.appendChild(canvas);

    // ── Renderer ─────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 0);
    _gltfRenderer = renderer;

    // ── Camera ───────────────────────────────────────────────────
    const camera = new THREE.OrthographicCamera(-1, 1, 0.5, -0.5, 0.1, 1000);
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);

    const scene     = new THREE.Scene();
    const raycaster = new THREE.Raycaster();
    const mouse     = new THREE.Vector2();

    // meshMap  : child.uuid → { mesh, edgeLines, unitData }
    // rootList : [{ root, unitData, idx }]
    const meshMap  = {};
    const rootList = [];

    // ── Material factories ────────────────────────────────────────
    // Fill: fully invisible, still raycasts
    function makeFillMaterial() {
      return new THREE.MeshBasicMaterial({
        color:       0xffffff,
        transparent: true,
        opacity:     0,           // completely invisible fill
        side:        THREE.DoubleSide,
        depthWrite:  false,
      });
    }

    // Edge: white glow via additive blending — invisible at rest, bright on hover
    function makeEdgeMaterial(glowing) {
      return new THREE.LineBasicMaterial({
        color:       0xffffff,
        transparent: true,
        opacity:     glowing ? 1.0 : 0.0,   // 0 = hidden at rest, full glow on hover
        blending:    THREE.AdditiveBlending,
        depthWrite:  false,
        linewidth:   1,
      });
    }

    // ── syncToImage ───────────────────────────────────────────────
    function syncToImage() {
      const imgRect  = img.getBoundingClientRect();
      const wrapRect = wrap.getBoundingClientRect();
      const W        = Math.round(imgRect.width);
      const H        = Math.round(imgRect.height);
      const imgLeft  = Math.round(imgRect.left - wrapRect.left);
      const imgTop   = Math.round(imgRect.top  - wrapRect.top);

      if (W < 4 || H < 4) return;

      const aspect = W / H;

      canvas.width  = W;
      canvas.height = H;
      Object.assign(canvas.style, {
        top:    imgTop  + 'px',
        left:   imgLeft + 'px',
        width:  W + 'px',
        height: H + 'px',
      });
      renderer.setSize(W, H, false);

      camera.left   = -aspect * 0.5;
      camera.right  =  aspect * 0.5;
      camera.top    =  0.5;
      camera.bottom = -0.5;
      camera.updateProjectionMatrix();

      rootList.forEach(({ root, unitData, idx }) => {
        if (!unitData || !unitData.points) return;
        const poly = unitPolyData[unitData.unitId];
        if (!poly) return;

        const sc = centroidToScene(poly.cx, poly.cy, aspect);
        const sz = bboxToSceneSize(poly.bbox, aspect);

        root.scale.set(1, 1, 1);
        root.position.set(0, 0, 0);
        root.updateMatrixWorld(true);

        const box1  = new THREE.Box3().setFromObject(root);
        const size1 = new THREE.Vector3(); box1.getSize(size1);

        const scaleX = size1.x > 0.0001 ? sz.sw / size1.x : 1;
        const scaleY = size1.y > 0.0001 ? sz.sh / size1.y : 1;
        root.scale.set(scaleX, scaleY, Math.min(scaleX, scaleY));

        root.updateMatrixWorld(true);
        const box2 = new THREE.Box3().setFromObject(root);
        const ctr2 = new THREE.Vector3(); box2.getCenter(ctr2);
        root.position.set(sc.sx - ctr2.x, sc.sy - ctr2.y, 0);

        root.traverse(child => {
          if (!child.isMesh) return;
          // Preserve edgeLines refs — only update unitData lookup
          const existing = meshMap[child.uuid] || {};
          meshMap[child.uuid] = { ...existing, mesh: child, unitData };
        });
      });

      // Rebuild debug SVG markers
      if (DEBUG_MARKERS) {
        const old = document.getElementById('fp-debug-svg');
        if (old) old.remove();

        const DEBUG_COLORS = [0xe74c3c, 0x2ecc71, 0x3498db, 0xe67e22, 0x9b59b6, 0x1abc9c, 0xf39c12];
        const debugSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        debugSvg.id = 'fp-debug-svg';
        debugSvg.setAttribute('viewBox', '0 0 100 100');
        debugSvg.setAttribute('preserveAspectRatio', 'none');
        Object.assign(debugSvg.style, {
          position: 'absolute', top: '0', left: '0',
          width: '100%', height: '100%',
          pointerEvents: 'none', zIndex: '6',
        });

        unitMeshList.forEach(({ unitId }, idx) => {
          const poly = unitPolyData[unitId];
          if (!poly) return;
          const { cx, cy } = poly;
          const col = DEBUG_COLORS[idx % DEBUG_COLORS.length].toString(16).padStart(6, '0');

          const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          hLine.setAttribute('x1', cx - 1.5); hLine.setAttribute('y1', cy);
          hLine.setAttribute('x2', cx + 1.5); hLine.setAttribute('y2', cy);
          hLine.setAttribute('stroke', '#' + col); hLine.setAttribute('stroke-width', '0.3');

          const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          vLine.setAttribute('x1', cx); vLine.setAttribute('y1', cy - 1.5);
          vLine.setAttribute('x2', cx); vLine.setAttribute('y2', cy + 1.5);
          vLine.setAttribute('stroke', '#' + col); vLine.setAttribute('stroke-width', '0.3');

          const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
          circle.setAttribute('cx', cx); circle.setAttribute('cy', cy); circle.setAttribute('r', '1');
          circle.setAttribute('fill', 'none'); circle.setAttribute('stroke', '#' + col);
          circle.setAttribute('stroke-width', '0.25');

          const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
          label.setAttribute('x', cx + 1.5); label.setAttribute('y', cy - 1);
          label.setAttribute('font-size', '2'); label.setAttribute('fill', '#' + col);
          label.textContent = unitId.split('-').pop();

          debugSvg.appendChild(hLine); debugSvg.appendChild(vLine);
          debugSvg.appendChild(circle); debugSvg.appendChild(label);
        });

        wrap.appendChild(debugSvg);
      }

      console.log('[GLTF] syncToImage — W:', W, 'H:', H, 'aspect:', aspect.toFixed(4));
    }

    // ── ResizeObserver ────────────────────────────────────────────
    _gltfRO = new ResizeObserver(() => syncToImage());
    _gltfRO.observe(img);

    // ── Load each unit GLB ────────────────────────────────────────
    console.log('[GLTF] Loading', unitMeshList.length, 'unit GLBs for', towerId);
    const loader = new THREE.GLTFLoader();
    let loaded = 0, failed = 0;
    const total = unitMeshList.length;

    unitMeshList.forEach(({ file, unitId }, idx) => {
      const unitData = unitById[unitId] || null;

      loader.load(file, (gltf) => {
        const root = gltf.scene;

        root.rotation.set(0, 0, 0);
        root.scale.set(1, 1, 1);
        root.position.set(0, 0, 0);
        root.updateMatrixWorld(true);

        // Flip flat XZ meshes upright
        const box0  = new THREE.Box3().setFromObject(root);
        const size0 = new THREE.Vector3(); box0.getSize(size0);
        if (size0.y < 0.01) {
          root.rotation.x = Math.PI / 2;
          root.updateMatrixWorld(true);
        }

        // ── Assign materials: invisible fill + white glowing edges ──
        root.traverse(child => {
          if (!child.isMesh) return;

          // Invisible fill — still receives raycasts
          child.material = makeFillMaterial();

          // Stack 3 LineSegments layers for a strong glow bloom effect.
          // Each layer uses additive blending so they accumulate brightness.
          const edgesGeo = new THREE.EdgesGeometry(child.geometry);
          const edgeLines = new THREE.LineSegments(edgesGeo, makeEdgeMaterial(false));
          edgeLines.renderOrder = 1;
          child.add(edgeLines);

          // Second + third layers for bloom width (additive accumulation)
          const edgeLines2 = new THREE.LineSegments(edgesGeo, makeEdgeMaterial(false));
          edgeLines2.renderOrder = 1;
          child.add(edgeLines2);

          const edgeLines3 = new THREE.LineSegments(edgesGeo, makeEdgeMaterial(false));
          edgeLines3.renderOrder = 1;
          child.add(edgeLines3);

          meshMap[child.uuid] = { mesh: child, edgeLines, edgeLines2, edgeLines3, unitData };
        });

        rootList.push({ root, unitData, idx });
        scene.add(root);

        loaded++;
        console.log('[GLTF] ✔ "' + file.split('/').pop() + '" → ' + unitId + (unitData ? ' (' + unitData.unitId + ')' : ' (no unitData)'));

        syncToImage();

        if (loaded + failed === total) {
          console.log('[GLTF] DONE — Loaded:', loaded, '| Failed:', failed, '| Total:', total);
        }

      }, (xhr) => {
        if (xhr.lengthComputable) {
          const pct = Math.round((xhr.loaded / xhr.total) * 100);
          console.log('[GLTF] ' + file.split('/').pop() + ' ' + pct + '%');
        }
      }, (err) => {
        failed++;
        console.error('[GLTF] LOAD ERROR:', file, err);
        if (loaded + failed === total && loaded === 0) {
          disposeGltfCanvas();
          buildZones(towerId, parity);
        }
      });
    });

    // ── Raycast helpers ───────────────────────────────────────────
    let hovered = null;

    function pick(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      mouse.x =  ((clientX - rect.left) / rect.width)  * 2 - 1;
      mouse.y = -((clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(Object.values(meshMap).map(v => v.mesh), false);
      return hits.length ? meshMap[hits[0].object.uuid] : null;
    }

    function setHover(hit) {
      // Restore previous hovered mesh to invisible
      if (hovered) {
        hovered.mesh.material.opacity = 0;
        if (hovered.edgeLines)  hovered.edgeLines.material.opacity  = 0;
        if (hovered.edgeLines2) hovered.edgeLines2.material.opacity = 0;
        if (hovered.edgeLines3) hovered.edgeLines3.material.opacity = 0;
        hovered = null;
      }
      if (hit) {
        // Faint fill tint so zone area reads as active
        hit.mesh.material.opacity = 0.10;
        // Three stacked additive layers = strong white bloom glow
        if (hit.edgeLines)  hit.edgeLines.material.opacity  = 1.0;
        if (hit.edgeLines2) hit.edgeLines2.material.opacity = 0.75;
        if (hit.edgeLines3) hit.edgeLines3.material.opacity = 0.50;
        hovered = hit;
      }
      canvas.style.cursor = hit ? 'pointer' : '';
    }

    // ── Mouse events ──────────────────────────────────────────────
    canvas.addEventListener('mousemove',  e => setHover(pick(e.clientX, e.clientY)));
    canvas.addEventListener('mouseleave', () => setHover(null));
    canvas.addEventListener('click', e => {
      if (e.detail === 0) return;
      const hit = pick(e.clientX, e.clientY);
      if (hit && hit.unitData) drillToUnit(hit.unitData);
    });

    // ── Touch events ──────────────────────────────────────────────
    let touchMoved = false, touchHit = null;
    canvas.addEventListener('touchstart', e => {
      touchMoved = false;
      touchHit   = pick(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    canvas.addEventListener('touchmove', () => { touchMoved = true; touchHit = null; }, { passive: true });
    canvas.addEventListener('touchend', e => {
      if (!touchMoved && touchHit && touchHit.unitData) {
        e.preventDefault();
        drillToUnit(touchHit.unitData);
      }
      touchHit = null;
    });

    // ── Render loop ───────────────────────────────────────────────
    (function loop() {
      _gltfAnimId = requestAnimationFrame(loop);
      renderer.render(scene, camera);
    })();
  }

  // ─── BUILD ZONES (SVG fallback) ──────────────────────────────
  function buildZones(towerId, parity) {
    const svg = document.getElementById('fp-zone-svg');
    svg.innerHTML = '';
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');

    getUnits(towerId, parity).forEach(u => {
      const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      poly.setAttribute('class', 'fp-zone');
      poly.setAttribute('points', u.points);
      poly.dataset.unitId = u.unitId;
      poly.addEventListener('mouseenter', (e) => showZoneTip(u, e));
      poly.addEventListener('mousemove',  (e) => moveZoneTip(e));
      poly.addEventListener('mouseleave', hideZoneTip);
      poly.addEventListener('click', (e) => { if (e.detail === 0) return; drillToUnit(u); });
      let touchMoved = false, tipHideTimer = null;
      poly.addEventListener('touchstart', (e) => {
        touchMoved = false; clearTimeout(tipHideTimer);
        showZoneTipTouch(u, e);
        tipHideTimer = setTimeout(hideZoneTip, 1200);
      }, { passive: true });
      poly.addEventListener('touchmove', () => {
        touchMoved = true; clearTimeout(tipHideTimer); hideZoneTip();
      }, { passive: true });
      poly.addEventListener('touchend', (e) => {
        clearTimeout(tipHideTimer);
        if (!touchMoved) { e.preventDefault(); hideZoneTip(); drillToUnit(u); }
      });
      svg.appendChild(poly);
    });
  }

  // ─── ZONE TOOLTIP ────────────────────────────────────────────
  function showZoneTip(u, e) {
    document.getElementById('fp-zone-tip-name').textContent = u.label || u.unitId;
    document.getElementById('fp-zone-tip-type').textContent = `${u.type || ''}${u.area ? '  ·  ' + u.area : ''}`;
    document.getElementById('fp-zone-tip').classList.add('visible');
    moveZoneTip(e);
  }
  function showZoneTipTouch(u, e) {
    document.getElementById('fp-zone-tip-name').textContent = u.label || u.unitId;
    document.getElementById('fp-zone-tip-type').textContent = `${u.type || ''}${u.area ? '  ·  ' + u.area : ''}`;
    const tip  = document.getElementById('fp-zone-tip');
    tip.classList.add('visible');
    const rect = document.getElementById('fp-cluster-wrap').getBoundingClientRect();
    const t    = e.touches[0];
    let left   = t.clientX - rect.left + 14;
    let top    = t.clientY - rect.top  - 40;
    const tw   = tip.offsetWidth || 120;
    if (left + tw > rect.width - 8) left = rect.width - tw - 8;
    if (left < 4) left = 4;
    if (top  < 4) top  = 4;
    tip.style.left = left + 'px'; tip.style.top = top + 'px';
  }
  function moveZoneTip(e) {
    const rect = document.getElementById('fp-cluster-wrap').getBoundingClientRect();
    const tip  = document.getElementById('fp-zone-tip');
    let left   = e.clientX - rect.left + 14;
    let top    = e.clientY - rect.top  - 14;
    const tw   = tip.offsetWidth || 120;
    if (left + tw > rect.width - 8) left = rect.width - tw - 8;
    tip.style.left = left + 'px'; tip.style.top = top + 'px';
  }
  function hideZoneTip() {
    const tip = document.getElementById('fp-zone-tip');
    if (tip) tip.classList.remove('visible');
  }

  // ─── DRILL TO UNIT ───────────────────────────────────────────
  // Reports how long the previously active unit was on screen, then resets
  // the timer. Call this right before switching away from a unit (back/close).
  function reportUnitDwell() {
    if (!unitEnteredAt || !activeUnit) return;
    const dwellMs = Date.now() - unitEnteredAt;
    if (typeof gtag === 'function' && dwellMs > 200) { // ignore accidental sub-200ms flicks
      gtag('event', 'unit_engagement', {
        unit_id: activeUnit.unitId,
        unit_label: activeUnit.label,
        unit_type: activeUnit.type,
        dwell_ms: dwellMs
      });
    }
  }

  function drillToUnit(unitData) {
    if (_transitioning) return;
    reportUnitDwell(); // in case a different unit was already open (rare, but be safe)
    activeUnit = unitData;
    viewMode   = 'top';

    // Track which specific unit type gets explored
    if (typeof gtag === 'function') {
      gtag('event', 'unit_view', {
        unit_id: unitData.unitId,
        unit_label: unitData.label,
        unit_type: unitData.type
      });
    }
    unitEnteredAt = Date.now(); // start the dwell-time clock for this unit
    document.querySelectorAll('.fp-toggle-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.view === 'top');
    });
    document.getElementById('fp-unit-info-name').textContent = unitData.label || '';
    document.getElementById('fp-unit-info-type').textContent = unitData.type || '';
    document.getElementById('fp-unit-info-area').textContent = unitData.area || '';
    document.getElementById('fp-unit-info').classList.add('visible');
    document.querySelectorAll('.fp-zone').forEach(z => z.classList.remove('selected'));
    const activeZone = document.querySelector(`.fp-zone[data-unit-id="${unitData.unitId}"]`);
    if (activeZone) activeZone.classList.add('selected');
    const planImg = document.getElementById('fp-plan-img');
    if (planImg) planImg.style.transform = '';
    level = 2;
    showPanel('fp-panel-unit', 'forward');
    updateTopbar();
    updateTitle();
    loadUnitImage();
    if (!_poppingState) pushFpState();
  }

  // ─── LOAD UNIT IMAGE ─────────────────────────────────────────
  function loadUnitImage() {
    if (!activeUnit) return;
    const img     = document.getElementById('fp-plan-img');
    const spinner = document.getElementById('fp-spinner');
    if (!img || !spinner) return;
    const src = unitImagePath(activeUnit, viewMode);
    if (!src || src.endsWith('/')) {
      img.removeAttribute('src'); spinner.classList.remove('visible'); return;
    }
    const reqUnit = activeUnit, reqView = viewMode;
    img.classList.add('fading'); spinner.classList.add('visible');
    setTimeout(() => {
      if (activeUnit !== reqUnit || viewMode !== reqView) {
        spinner.classList.remove('visible'); return;
      }
      img.addEventListener('load', () => {
        if (activeUnit !== reqUnit || viewMode !== reqView) return;
        img.classList.remove('fading'); spinner.classList.remove('visible');
      }, { once: true });
      img.addEventListener('error', () => {
        img.classList.remove('fading'); spinner.classList.remove('visible');
      }, { once: true });
      img.src = src;
    }, 280);
  }

  // ─── PINCH-ZOOM ──────────────────────────────────────────────
  function bindPinchZoom() {
    const area = document.getElementById('fp-plan-area');
    const img  = document.getElementById('fp-plan-img');
    if (!area || !img) return;
    let scale = 1, originX = 0, originY = 0, lastDist = null;
    let panStartX = 0, panStartY = 0, panOriginX = 0, panOriginY = 0, lastTap = 0;
    const MAX_SCALE = 4, MIN_SCALE = 1;
    const zoomHint = document.getElementById('fp-zoom-hint');
    function applyTransform() {
      img.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;
      if (zoomHint) {
        if (scale > 1.05) { zoomHint.textContent = 'Double-tap to reset'; zoomHint.classList.add('visible'); }
        else zoomHint.classList.remove('visible');
      }
    }
    function resetZoom() {
      scale = 1; originX = 0; originY = 0;
      img.style.transition = 'transform 0.25s ease';
      applyTransform();
      setTimeout(() => { img.style.transition = ''; }, 260);
      if (zoomHint) zoomHint.classList.remove('visible');
    }
    function dist(t) { return Math.sqrt((t[0].clientX-t[1].clientX)**2+(t[0].clientY-t[1].clientY)**2); }
    function mid(t)  { return { x:(t[0].clientX+t[1].clientX)/2, y:(t[0].clientY+t[1].clientY)/2 }; }
    area.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault(); lastDist = dist(e.touches);
      } else if (e.touches.length === 1) {
        const now = Date.now();
        if (now - lastTap < 300) { e.preventDefault(); resetZoom(); }
        lastTap = now;
        panStartX = e.touches[0].clientX; panStartY = e.touches[0].clientY;
        panOriginX = originX; panOriginY = originY;
      }
    }, { passive: false });
    area.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const d = dist(e.touches), m = mid(e.touches), rect = area.getBoundingClientRect();
        if (lastDist !== null) {
          const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * (d/lastDist)));
          const pivotX = m.x - rect.left - rect.width/2;
          const pivotY = m.y - rect.top  - rect.height/2;
          originX = pivotX + (originX - pivotX) * (newScale / scale);
          originY = pivotY + (originY - pivotY) * (newScale / scale);
          scale = newScale; applyTransform();
        }
        lastDist = d;
      } else if (e.touches.length === 1 && scale > 1) {
        e.preventDefault();
        originX = panOriginX + (e.touches[0].clientX - panStartX);
        originY = panOriginY + (e.touches[0].clientY - panStartY);
        applyTransform();
      }
    }, { passive: false });
    area.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) lastDist = null;
      if (scale <= MIN_SCALE + 0.05) resetZoom();
    }, { passive: true });
  }

  // ─── SWIPE-BACK ──────────────────────────────────────────────
  function bindSwipeBack() {
    const content = document.getElementById('fp-content');
    if (!content) return;
    let startX = 0, startY = 0, active = false;
    content.addEventListener('touchstart', (e) => {
      if (e.touches[0].clientX < 40) {
        startX = e.touches[0].clientX; startY = e.touches[0].clientY; active = true;
      }
    }, { passive: true });
    content.addEventListener('touchmove', (e) => {
      if (!active) return;
      if (Math.abs(e.touches[0].clientY - startY) > 30) active = false;
    }, { passive: true });
    content.addEventListener('touchend', (e) => {
      if (!active) return; active = false;
      if (e.changedTouches[0].clientX - startX > 60 && level > 0) requestBack();
    }, { passive: true });
  }

  // ─── BROWSER BACK BUTTON (mobile) ────────────────────────────
  // Each drill-down pushes a history entry, so the phone's hardware
  // back button / browser back gesture steps back through the viewer
  // (unit → cluster → sitemap → close) instead of leaving the page.
  //
  // requestBack() is the single entry point used by the on-screen back
  // arrow and swipe-back: it calls history.back() when we own a history
  // entry, which fires popstate, which runs goBack()/close(). This keeps
  // the history stack and the viewer state perfectly in sync.
  let _poppingState = false;
  let _fpHistoryDepth = 0; // how many history entries the viewer currently owns

  function pushFpState() {
    history.pushState({ fp: true, level }, '');
    _fpHistoryDepth++;
  }

  function requestBack() {
    if (_fpHistoryDepth > 0) {
      history.back();               // → popstate → goBack()/close()
    } else {
      // No history entry of ours (e.g. pushState unavailable) — navigate directly
      if (level > 0) goBack(); else close();
    }
  }

  function bindHistoryNav() {
    window.addEventListener('popstate', () => {
      if (!overlayOpen || _fpHistoryDepth === 0) return; // not our entry — let browser handle it
      _fpHistoryDepth--;
      _poppingState = true;
      if (level > 0) goBack();      // unit → cluster, or cluster → sitemap
      else close();                 // sitemap → close overlay, page stays
      _poppingState = false;
    });

    // ── Keyboard back (PC): Backspace / Escape ──
    window.addEventListener('keydown', (e) => {
      if (!overlayOpen) return;
      // Don't hijack Backspace while the user is typing in a form field
      const t = e.target;
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
      if (typing) return;
      if (e.key === 'Backspace' || e.key === 'Escape') {
        e.preventDefault();
        requestBack();
      }
    });
  }

  // ─── BACK NAV ────────────────────────────────────────────────
  function goBack() {
    if (_transitioning) return;
    if (level === 2) {
      reportUnitDwell();
      unitEnteredAt = 0;
      activeUnit = null; viewMode = 'top';
      document.querySelectorAll('.fp-zone.selected').forEach(z => z.classList.remove('selected'));
      const unitInfo = document.getElementById('fp-unit-info');
      if (unitInfo) unitInfo.classList.remove('visible');
      const spinner  = document.getElementById('fp-spinner');
      if (spinner)   spinner.classList.remove('visible');
      const planImg  = document.getElementById('fp-plan-img');
      if (planImg)   planImg.style.transform = '';
      showPanel('fp-panel-cluster', 'back');
      level = 1; updateTopbar(); updateTitle();
    } else if (level === 1) {
      resetToSitemap();
    }
  }

  // ─── UPDATE TOPBAR ───────────────────────────────────────────
  function updateTopbar() {
    const back         = document.getElementById('fp-back');
    const parityToggle = document.getElementById('fp-parity-toggle');
    const viewToggle   = document.getElementById('fp-view-toggle');
    if (!back || !parityToggle || !viewToggle) return;
    if (level === 0) {
      back.classList.remove('visible');
      parityToggle.classList.remove('visible');
      viewToggle.classList.remove('visible');
    } else if (level === 1) {
      back.classList.add('visible');
      parityToggle.classList.add('visible');
      viewToggle.classList.remove('visible');
    } else if (level === 2) {
      back.classList.add('visible');
      parityToggle.classList.remove('visible');
      const hasIso = !!(activeUnit && activeUnit.iso);
      viewToggle.classList.toggle('visible', hasIso);
    }
  }

  // ─── OPEN / CLOSE ────────────────────────────────────────────
  function open(floorNum) {
    if (overlayOpen) return;
    overlayOpen = true;
    const fpOverlay = document.getElementById('fp-overlay');
    if (!fpOverlay) return;

    // Track floorplan open in GA4 — real entry point since App.navigate()
    // is never called for the Floor Plan button.
    if (typeof gtag === 'function') {
      gtag('event', 'floorplan_open', { floor_num: floorNum ?? null });
    }
    fpOverlay.classList.remove('hidden');
    fpOverlay.style.pointerEvents = '';
    clearTimeout(_closeResetTimer);
    floorParity = (floorNum !== undefined) ? (isOdd(floorNum) ? 'odd' : 'even') : 'odd';
    document.querySelectorAll('.fp-parity-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.parity === floorParity);
    });
    showPanel('fp-panel-sitemap', 'forward');
    updateTopbar(); updateTitle();
    fpOverlay.classList.add('open');
    buildSitemapTiles();
    if (!_poppingState) pushFpState();
  }

  let _closeResetTimer = null;

  function close() {
    if (!overlayOpen) return;
    if (level === 2) { reportUnitDwell(); unitEnteredAt = 0; } // catch dwell if closed mid-unit-view
    overlayOpen = false;

    // If the app closed the overlay directly (✕ button, nav elsewhere) while
    // we still own history entries, unwind them silently so the browser back
    // button doesn't need extra presses later. popstate will fire but the
    // overlayOpen guard makes it a no-op.
    if (!_poppingState && _fpHistoryDepth > 0) {
      const n = _fpHistoryDepth;
      _fpHistoryDepth = 0;
      history.go(-n);
    }

    clearTimeout(_closeResetTimer);
    const overlay = document.getElementById('fp-overlay');
    if (!overlay) return;
    overlay.classList.remove('open');
    overlay.style.pointerEvents = 'none';
    _closeResetTimer = setTimeout(() => {
      if (!overlayOpen) {
        resetToSitemap();
        if (overlay) overlay.classList.add('hidden');
      }
    }, 420);
  }

  // ─── BIND EVENTS ─────────────────────────────────────────────
  function bindEvents() {
    const backBtn  = document.getElementById('fp-back');
    if (!backBtn) return;
    backBtn.addEventListener('click', requestBack);
    backBtn.addEventListener('touchend', (e) => { e.preventDefault(); requestBack(); });
    document.querySelectorAll('.fp-parity-btn').forEach(btn => {
      btn.addEventListener('click', () => swapParity(btn.dataset.parity));
    });
    document.querySelectorAll('.fp-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const v = btn.dataset.view;
        if (v === viewMode) return;
        viewMode = v;
        document.querySelectorAll('.fp-toggle-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.view === viewMode);
        });
        loadUnitImage();
      });
    });
    bindPinchZoom();
    bindSwipeBack();
    bindHistoryNav();
    watchTopbarHeight();
  }

  // ─── PUBLIC API ──────────────────────────────────────────────
  return {
    init() { injectHTML(); bindEvents(); },
    open,
    close,
    toggle() { overlayOpen ? close() : open(); },
    openTower(towerId, floorNum) {
      if (!overlayOpen) { open(floorNum); setTimeout(() => drillToCluster(towerId), 50); }
      else drillToCluster(towerId);
    },
    openUnit(towerId, unitData, floorNum) {
      if (!overlayOpen) {
        open(floorNum);
        setTimeout(() => { activeTower = towerId; drillToUnit(unitData); }, 50);
      } else {
        activeTower = towerId;
        drillToUnit(unitData);
      }
    },
    TOWERS,
    SITEMAP,
  };

})();