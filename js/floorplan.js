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
  // Compass + "Site Plan" label overlays — loaded locally from assets/png.
  // NOTE: these two files were cropped to remove large transparent
  // padding around the artwork (originals were 873x960 canvases with
  // only a small logo/text in the middle) — replace the files at
  // these paths with the cropped versions provided.
  // NAV-PATCH: set to false once the 4 tower zones are correctly
  // positioned — draws a red 0–100 coordinate grid over the sitemap so
  // exact building corner coordinates can be read directly off the
  // screen instead of estimated from a screenshot.
  // NAV-PATCH: the one switch for GLB vs flat outline —
  //   true  = 3D GLB tiles (SITEMAP_GLB_TARGET_SIZE / SITEMAP_GLB_SCALE apply)
  //   false = flat SVG outline (simplest, matches SITEMAP.towerTiles points directly)
  const SITEMAP_USE_GLB = true;

  const SITEMAP_DEBUG_GRID = false;

  const SITEMAP_COMPASS_IMAGE = './assets/png/sitemapdirection.png';
  const SITEMAP_LABEL_IMAGE   = './assets/png/sitemaptext.png';

  const SITEMAP = {
    towerTiles: [
      { id: 'tower-A', label: 'Tower A', points: '48,10 56,10 56,49.5 48,49.5', labelX: 52,   labelY:5,
        pointsMobile: '49,28 57,28 57,64 49,64', labelXMobile: 65, labelYMobile: 33.5,
        pointsTablet: '22,9.5 83,9.5 83,82.5 22,82.5', labelXTablet: 65, labelYTablet: 33.5 },

      { id: 'tower-B', label: 'Tower B', points: '52.5,48 60,48 60,55 52.5,55', labelX: 65,   labelY: 72.5,
        pointsMobile: '46.5,46.7 68.5,46.7 68.5,57 46.5,57', labelXMobile: 65, labelYMobile: 72.5,
        pointsTablet: '24,43 90,43 90,60 24,60', labelXTablet: 65, labelYTablet: 72.5 },

      { id: 'tower-C', label: 'Tower C', points: '43,52.5 55,52.5 55,64.5 43,64.5', labelX: 41,   labelY: 72.5,
        pointsMobile: '41.5,49 58,49 58,68 41.5,68', labelXMobile: 41, labelYMobile: 72.5,
        pointsTablet: '43,52.5 57,52.5 57,64.5 43,64.5', labelXTablet: 41, labelYTablet: 72.5 },

      { id: 'tower-D', label: 'Tower D', points: '42,49 50,49 50,57 42,57', labelX: 41,   labelY: 33.5,
        pointsMobile: '45.5,45.3 48,45.3 48,60 45.5,60', labelXMobile: 41, labelYMobile: 33.5,
        pointsTablet: '41,47 53,47 53,58.5 41,58.5', labelXTablet: 41, labelYTablet: 33.5 },
    ],
  };

  const TOWERS = {

    // ══════════════════════════════════════════════════════════
    // TOWER A
    // ══════════════════════════════════════════════════════════
    'tower-A': {
      label: 'Tower A',
      odd:  { image: IK('Cluster/Brigade_raptakose_Cluster_Floorplan/typical_odd_tower01.jpg')  },
      even: { image: IK('Cluster/Brigade_raptakose_Cluster_Floorplan/typical_even_tower01.jpg') },
      oddUnits: [
        { unitId:'A-odd-01', top:IK('Dimension/unit03_4bhk_(c)_tower_01.jpg'),       iso:IK('Isometric/unit03_4bhk_(c)_tower_01.jpg'),       points:'64,16.5 93.5,16.5 93.5,46 64,46' },
        { unitId:'A-odd-02', top:IK('Dimension/unit06_3bhk_l(d)_tower_02.jpg'),      iso:IK('Isometric/unit06_3bhk_l(d)_tower_02.jpg'),      points:'12.1,67.8 36.9,67.8 36.9,95.5 12.1,95.5' },
        { unitId:'A-odd-03', top:IK('Dimension/unit05_3bhk_s(a)_tower_02.jpg'),      iso:IK('Isometric/unit05_3bhk_s(a)_tower_02.jpg'),      points:'40.15,63.5 68.9,63.5 68.9,102.5 40.15,102.5' },
        { unitId:'A-odd-04', top:IK('Dimension/unit01_3bhk_l(c)_odd_tower_01.jpg'),     points:'2.5,24.3 27,24.3 27,66 2.5,66' },
        { unitId:'A-odd-05', top:IK('Dimension/unit02_3bhk_l(b)_tower_02.jpg'),      points:'30.5,.25 60,.25 60,64 30.5,64' },
        { unitId:'A-odd-06', top:IK('Dimension/unit04_4bhk_(e)_odd_tower_04.jpg'),      points:'69.5,46 97,46 97,97 69.5,97' },
      ],
      evenUnits: [
        { unitId:'A-even-01', top:IK('Dimension/unit01_3bhk_l(c)_podium_tower_02.jpg'),  iso:IK('Isometric/unit01_3bhk_l(c)_podium_tower_02.jpg'),   points:'3.5,28.5 27.5,28.5 27.5,59 3.5,59' },
        { unitId:'A-even-02', top:IK('Dimension/unit02_3bhk_l(b)_tower_02.jpg'),          iso:IK('Isometric/unit02_3bhk_l(b)_tower_02.jpg'),         points:'30.5,11 60,11 60,52 30.5,52' },
        { unitId:'A-even-03', top:IK('Dimension/unit06_3bhk_l(d)_tower_02.jpg'),          iso:IK('Isometric/unit06_3bhk_l(d)_tower_02.jpg'),         points:'13,60 37.4,60 37.4,97 13,97' },
        { unitId:'A-even-04', top:IK('Dimension/unit05_3bhk_s(a)_tower_02.jpg'),          iso:IK('Isometric/unit05_3bhk_s(a)_tower_02.jpg'),         points:'40.15,61 67.5,61 67.5,98 40.15,98' },
        { unitId:'A-even-05', top:IK('Dimension/unit03_4bhk_(c)_even_tower_01.jpg'),         points:'63,13.4 92.5,13.4 92.5,44.7 63,44.7' },
        { unitId:'A-even-06', top:IK('Dimension/unit04_4bhk_(e)_tower_04.jpg'),          points:'69,49.5 95.5,49.5 95.5,88 69,88' },
      ],
    },

    // ══════════════════════════════════════════════════════════
    // TOWER B
    // ══════════════════════════════════════════════════════════
    'tower-B': {
      label: 'Tower B',
      odd:  { image: IK('Cluster/Brigade_raptakose_Cluster_Floorplan/typical_odd_tower_2.jpg')  },
      even: { image: IK('Cluster/Brigade_raptakose_Cluster_Floorplan/typical_even_tower02.jpg') },
      oddUnits: [
        { unitId:'B-odd-01', top:IK('Dimension/unit03_4bhk_(c)_tower_01.jpg'),  iso:IK('Isometric/unit03_4bhk_(c)_tower_01.jpg'),  points:'61.5,10 91,10 91,49 61.5,49' },
        { unitId:'B-odd-02', top:IK('Dimension/unit06_3bhk_l(d)_tower_02.jpg'), iso:IK('Isometric/unit06_3bhk_l(d)_tower_02.jpg'), points:'11,69 34.5,69 34.5,97.7 11,97.7' },
        { unitId:'B-odd-03', top:IK('Dimension/unit05_3bhk_s(a)_podium_tower_02.jpg'), iso:IK('Isometric/unit05_3bhk_s(a)_tower_02.jpg'), points:'38,72.5 65,72.5 65,96 38,96' },
        { unitId:'B-odd-04', top:IK('Dimension/unit02_3bhk_l(b)_tower_02.jpg'),                                                    points:'29.5,6 58,6 58,56.5 29.5,56.5' },
        { unitId:'B-odd-05', top:IK('Dimension/unit01_3bhk_l(c)_podium_tower_02.jpg'), iso:IK('Isometric/unit01_3bhk_l(c)_podium_tower_02.jpg'), points:'2.5,22 26,22 26,71 2.5,71' },
        { unitId:'B-odd-06', top:IK('Dimension/unit04_4bhk_(d)_odd_tower_02.jpg'),                                                    points:'68.5,36 98,36 98,98.5 68.5,98.5' },
      ],
      evenUnits: [
        { unitId:'B-even-01', top:IK('Dimension/unit01_3bhk_l(c)_podium_tower_02.jpg'), iso:IK('Isometric/unit01_3bhk_l(c)_podium_tower_02.jpg'),  points:'3.5,22.5 26,22.5 26,71 3.5,71' },
        { unitId:'B-even-02', top:IK('Dimension/unit02_3bhk_l(b)_tower_02.jpg'),         iso:IK('Isometric/unit02_3bhk_l(b)_tower_02.jpg'),        points:'29.5,10.5 57,10.5 57,54 29.5,54' },
        { unitId:'B-even-03', top:IK('Dimension/unit06_3bhk_l(d)_tower_02.jpg'),         iso:IK('Isometric/unit06_3bhk_l(d)_tower_02.jpg'),        points:'10.9,69 34,69 34,98 10.9,98' },
        { unitId:'B-even-04', top:IK('Dimension/unit05_3bhk_s(a)_podium_tower_02.jpg'),         iso:IK('Isometric/unit05_3bhk_s(a)_tower_02.jpg'),        points: '38.5,73 63.5,73 63.5,96 38.5,96' },
        { unitId:'B-even-05', top:IK('Dimension/unit04_4bhk_(d)_tower_02.jpg'),          iso:IK('Isometric/unit04_4bhk_(d)_tower_02.jpg'),         points:'67,36.5 95,36.5 95,99 67,99' },
        { unitId:'B-even-06', top:IK('Dimension/unit03_4bhk_(c)_even_tower_01.jpg'),        points:'60.5,6.5 89,6.5 89,49.5 60.5,49.5' },
      ],
    },

    // ══════════════════════════════════════════════════════════
    // TOWER C
    // ══════════════════════════════════════════════════════════
    'tower-C': {
      label: 'Tower C',
      odd:  { image: IK('Cluster/Brigade_raptakose_Cluster_Floorplan/typical_odd_tower_3.jpg')  },
      even: { image: IK('Cluster/Brigade_raptakose_Cluster_Floorplan/typical_even_tower03.jpg') },
      oddUnits: [
        { unitId:'C-odd-01', top:IK('Dimension/unit06_3bhk_l(g)_tower_03.jpg'),  iso:IK('Isometric/unit06_3bhk_l(g)_tower_03.jpg'), points:'41.15,60 65.5,60 65.5,95 41.15,95' },
        { unitId:'C-odd-02', top:IK('Dimension/unit02_3bhk_s(b)_odd_tower_03.jpg'),                                                     points:'51.5,10 74.5,10 74.5,62.5 51.5,62.5' },
        { unitId:'C-odd-03', top:IK('Dimension/unit02_3bhk_s(b)_odd_tower_03.jpg'),                                                     points:'25,11 48,11 48,44.5 25,44.5' },
        { unitId:'C-odd-04', top:IK('Dimension/unit04_3bhk_l(f)_odd_tower_03.jpg'),                                                     points:'77,23.5 98,23.5 98,59 77,59' },
        { unitId:'C-odd-05', top:IK('Dimension/unit01_4bhk_g_odd_tower_03.jpg'),                                                        points:'2,12.5 22.15,12.5 22.15,61 2,61' },
        { unitId:'C-odd-06', top:IK('Dimension/unit05_3bhk_l(e)_odd_tower_03.jpg'),                                                     points:'68.3,61.5 91.5,61.5 91.5,91.6 68.3,91.6' },
        { unitId:'C-odd-07', top:IK('Dimension/unit07_4bhk_(f)_odd_tower_03.jpg'),                                                  points:'8.5,61 37.9,61. 37.9,92 8.5,92' },
      ],
      evenUnits: [
        { unitId:'C-even-01', top:IK('Dimension/unit01_4bhk_(g)_tower_03.jpg'),      iso:IK('Isometric/unit01_4bhk_(g)_tower_03.jpg'),      points:'1.9,11 22.15,11 22.15,61 1.9,61' },
        { unitId:'C-even-02', top:IK('Dimension/unit02_3bhk_s(b)_tower_03.jpg'),     iso:IK('Isometric/unit02_3bhk_s(b)_tower_03.jpg'),     points:'51.5,8.2 74.5,8.2 74.5,62.5 51.5,62.5' },
        { unitId:'C-even-03', top:IK('Dimension/unit02_3bhk_s(b)_tower_03.jpg'),     iso:IK('Isometric/unit03_3bhk_s(b)_tower_03.jpg'),     points:'25,10.3 48,10.3 48,44.5 25,44.5' },
        { unitId:'C-even-04', top:IK('Dimension/unit04_3bhk_l(f)_tower_03.jpg'),     iso:IK('Isometric/unit04_3bhk_l(f)_tower_03.jpg'),     points:'77.5,25 98,25 98,59 77.5,59' },
        { unitId:'C-even-05', top:IK('Dimension/unit06_3bhk_l(g)_tower_03.jpg'),    iso:IK('Isometric/unit06_3bhk_l(g)_tower_03.jpg'),     points:'41.6,60 65.5,60 65.5,95 41.6,95' },
        { unitId:'C-even-06', top:IK('Dimension/unit05_3bhk_l(e)_tower_03.jpg'),     iso:IK('Isometric/unit05_3bhk_l(e)_tower_03.jpg'),     points:'69,60 91.5,60 91.5,92 69,92' },
        { unitId:'C-even-07', top:IK('Dimension/unit07_4bhk_(f)_even_tower_03.jpg'),iso:IK('Isometric/unit07_4bhk_(f)_even_tower_03.jpg'), points:'8.5,61 37.9,61. 37.9,92 8.5,92' },
      ],
    },

    // ══════════════════════════════════════════════════════════
    // TOWER D
    // ══════════════════════════════════════════════════════════
    'tower-D': {
      label: 'Tower D',
      odd:  { image: IK('Cluster/Brigade_raptakose_Cluster_Floorplan/typical_odd_tower04.jpg')  },
      even: { image: IK('Cluster/Brigade_raptakose_Cluster_Floorplan/typical_even_tower04.jpg') },
      oddUnits: [
        { unitId:'D-odd-01', top:IK('Dimension/unit03_3bhk_l(a)_tower_04.jpg'), iso:IK('Isometric/unit03_3bhk_l(a)_tower_04.jpg'), points:'68.5,-1 93,-1 93,58 68.5,58' },
        { unitId:'D-odd-02', top:IK('Dimension/unit05_3bhk_s(a)_tower_02.jpg'), iso:IK('Isometric/unit05_3bhk_s(a)_tower_02.jpg'), points:'41.2,50 69,50 69,105 41.2,105' },
        { unitId:'D-odd-03', top:IK('Dimension/unit01_4bhk_(a)_odd_tower_04.jpg'),                                                    points:'2,21 32,21 32,71 2,71' },
        { unitId:'D-odd-04', top:IK('Dimension/unit02_3bhk_l(b)_odd_tower_01.jpg'),                                                   points:'35.5,5 65,5 65,53 35.5,53' },
        { unitId:'D-odd-05', top:IK('Dimension/unit04_4bhk_(e)_odd_tower_04.jpg'),                                                    points:'70.5,41.5 97.5,41.5 97.5,93.5 70.5,93.5' },
        { unitId:'D-odd-06', top:IK('Dimension/unit06_4bhk_(b)_tower_04.jpg'),  iso:IK('Isometric/unit06_4bhk_(b)_tower_04.jpg'), points:'8,59 38,59 38,100.5 8,100.5' },
      ],
      evenUnits: [
        { unitId:'D-even-01', top:IK('Dimension/unit01_4bhk_(a)_tower_04.jpg'),  iso:IK('Isometric/unit01_4bhk_(a)_tower_04.jpg'),  points:'2,21.5 32,21.5 32,71 2,71' },
        { unitId:'D-even-02', top:IK('Dimension/unit02_3bhk_l(b)_tower_02.jpg'), iso:IK('Isometric/unit02_3bhk_l(b)_tower_02.jpg'), points:'35.5,7 65,7 65,53 35.5,53' },
        { unitId:'D-even-03', top:IK('Dimension/unit03_3bhk_l(a)_tower_04.jpg'), iso:IK('Isometric/unit03_3bhk_l(a)_tower_04.jpg'), points:'68.5,1 93,1 93,57.5 68.5,57.5' },
        { unitId:'D-even-04', top:IK('Dimension/unit06_4bhk_(b)_tower_04.jpg'),  iso:IK('Isometric/unit06_4bhk_(b)_tower_04.jpg'),  points:'7,60 38,60 38,99 7,99' },
        { unitId:'D-even-05', top:IK('Dimension/unit05_3bhk_s(a)_tower_02.jpg'), iso:IK('Isometric/unit05_3bhk_s(a)_tower_02.jpg'), points:'41.2,51.5 69,51.5 69,105 41.2,105' },
        { unitId:'D-even-06', top:IK('Dimension/unit04_4bhk_(e)_tower_04.jpg'),  iso:IK('Isometric/unit04_4bhk_(e)_tower_04.jpg'),  points:'70.5,41.5 97.5,41.5 97.5,93.5 70.5,93.5' },
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

      .fp-shine {
        position: absolute;
        inset: 0;
        overflow: hidden;
        pointer-events: none;
        z-index: 50;
      }
      .fp-shine.fp-shine--pill {
        border-radius: 999px;
      }
      .fp-shine .fp-shine-band {
        position: absolute;
        top: -60%;
        left: -60%;
        width: 55%;
        height: 220%;
        background: linear-gradient(
          100deg,
          rgba(255,255,255,0)    0%,
          rgba(255,255,255,0.35) 46%,
          rgba(255,255,255,0.60) 50%,
          rgba(255,255,255,0.35) 54%,
          rgba(255,255,255,0)    100%
        );
        animation: fpShineSweep 2s ease-in-out 1 forwards;
      }
      @keyframes fpShineSweep {
        from { top: -60%; left: -60%; }
        to   { top: 100%; left: 100%; }
      }
      @media (prefers-reduced-motion: reduce) {
        .fp-shine { display: none; }
      }

      :root { --fp-topbar-h: 56px; --fp-vh: 1vh; }

      @media (min-width: 481px) {
        .fp-parity-btn, .fp-toggle-btn { padding: 7px 14px; font-size: 9px; }
      }
      @media (max-width: 480px) {
        #fp-toggles-row { position: static; transform: none; flex: 1; justify-content: center; }
        #fp-topbar { flex-wrap: nowrap; padding: 8px; gap: 6px; }
        .fp-parity-btn, .fp-toggle-btn { padding: 6px 10px; font-size: 8px; }
      }
      @media (max-width: 360px) {
        .fp-parity-btn, .fp-toggle-btn { padding: 5px 8px; font-size: 7.5px; }
        #fp-back, #fp-back { width: 48px; min-width: 48px; }
        #fp-back-arrow { width: 48px; height: 30px; }
        #fp-topbar-spacer { width: 48px; }
      }

      #fp-content { flex: 1; position: relative; overflow: hidden; }

      #fp-topbar {
        flex-shrink: 0; display: flex; align-items: center;
        padding: 8px 12px;
        padding-left: calc(12px + env(safe-area-inset-left, 0px));
        padding-right: calc(12px + env(safe-area-inset-right, 0px));
        min-height: 48px;
        border-bottom: 1px solid rgba(122,62,30,.15);
        background: #ffffff;
        gap: 10px; position: relative; z-index: 20;
      }
      #fp-back {
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; opacity: 0; pointer-events: none;
        transition: opacity 0.22s ease; flex-shrink: 0;
        width: 56px; min-width: 56px;
      }
      #fp-back.visible { opacity: 1; pointer-events: all; }
      #fp-back-arrow {
        width: 56px; height: 34px; border-radius: 8px;
        border: 1px solid #7a3e1e;
        background: #7a3e1e;
        display: flex; align-items: center; justify-content: center;
        transition: background 0.2s, border-color 0.2s;
        -webkit-tap-highlight-color: transparent;
      }
      #fp-back:active #fp-back-arrow, #fp-back:hover #fp-back-arrow {
        background: #9a5327; border-color: #b56530;
      }
      #fp-back-arrow svg {
        width:16px; height:16px; stroke: #ffffff;
        fill:none; stroke-width:2; stroke-linecap:round; stroke-linejoin:round;
      }

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

      #fp-topbar-spacer { width: 56px; flex-shrink: 0; }

      .fp-panel {
        position: absolute; inset: 0; opacity: 0; pointer-events: none;
        transition: opacity 0.30s ease, transform 0.30s cubic-bezier(0.22,1,0.36,1);
      }
      .fp-panel.enter   { opacity: 1; pointer-events: all; transform: translateX(0) !important; }
      .fp-panel.exit-l  { opacity: 0; transform: translateX(-32px); }
      .fp-panel.exit-r  { opacity: 0; transform: translateX( 32px); }

      #fp-panel-sitemap {
        display: flex; align-items: center; justify-content: center;
        background: #ffffff; transform: translateX(0);
        overflow: hidden; touch-action: none;
      }
      #fp-sitemap-wrap { position: relative; display: inline-block; max-width: 100%; max-height: 100%; will-change: transform; }
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
      .fp-tower-tag { cursor: pointer; }
      .fp-tower-tag-leader {
        stroke: rgba(122,62,30,.55); stroke-width: .3;
        fill: none; pointer-events: none;
      }
      .fp-tower-tag-bg {
        fill: rgba(255,253,250,.94); stroke: rgba(122,62,30,.55);
        stroke-width: .3; transition: fill 0.22s, stroke 0.22s;
      }
      .fp-tower-tag:hover .fp-tower-tag-bg,
      .fp-tower-tag.tapped .fp-tower-tag-bg {
        fill: rgba(122,62,30,.92); stroke: rgba(122,62,30,1);
      }
      .fp-tower-tag-text {
        font-family: 'Syne', sans-serif; font-size: 2.6px; font-weight: 700;
        letter-spacing: 0.02em; fill: #4a2a14; pointer-events: none;
        text-anchor: middle; dominant-baseline: middle;
        transition: fill 0.22s;
      }
      .fp-tower-tag:hover .fp-tower-tag-text,
      .fp-tower-tag.tapped .fp-tower-tag-text {
        fill: #f5f0e8;
      }

      /* ── Desktop tower labels: pinned to left/right edge, leader line ── */
      .fp-glb-label {
        position: absolute; pointer-events: none; z-index: 6;
        transform: translateY(-50%);
        white-space: nowrap;
      }
      .fp-glb-label--left  { transform: translate(-100%, -50%); text-align: right; }
      .fp-glb-label--right { transform: translate(0, -50%);      text-align: left; }
      /* mobile/tablet fallback: tag centred above the tile (legacy layout) */
      /* mobile/tablet fallback: tag centred above the tile (legacy layout) */
      .fp-glb-label--above {
        transform: translate(-50%, -100%);
        text-align: center; display: flex; flex-direction: column; align-items: center;
      }
      /* mobile top/bottom stacked layout */
      .fp-glb-label--top    { transform: translate(-50%, -100%); text-align: center; }
      .fp-glb-label--bottom { transform: translate(-50%, 0);      text-align: center; }

      .fp-glb-tag {
        display: inline-flex; align-items: center; justify-content: center;
        padding: 7px 24px; border-radius: 999px;
        background: rgba(255,253,250,.95);
        border: 1px solid rgba(122,62,30,.55);
        box-shadow: 0 2px 10px rgba(0,0,0,.20);
        font-family: 'Syne', sans-serif; font-size: 14px; font-weight: 700;
        letter-spacing: .04em; color: #4a2a14;
        transition: background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
      }
      .fp-glb-leader {
        width: 1px; height: 44px;
        background: rgba(122,62,30,.55);
      }
      .fp-glb-label--flash .fp-glb-tag {
        background: rgba(122,62,30,.92);
        color: #f5f0e8;
        border-color: rgba(122,62,30,1);
      }
      #fp-sitemap-leader-svg {
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        pointer-events: none; z-index: 5; overflow: visible;
      }
      .fp-sitemap-leader-line {
        stroke: rgba(122,62,30,.55); stroke-width: 1.4;
        fill: none; transition: stroke 0.15s ease;
      }
      .fp-sitemap-leader-line--flash { stroke: rgba(255,253,250,.95); }
      @media (max-width: 480px) {
        .fp-glb-tag    { padding: 5px 12px; font-size: 11px; }
        .fp-glb-leader { height: 30px; }
      }

      .fp-unit-label {
        position: absolute; transform: translate(-50%, -50%);
        pointer-events: none; z-index: 6; text-align: center;
        white-space: nowrap;
      }
      .fp-unit-label-text {
        display: block; font-family: 'Cormorant Garamond', serif;
        font-size: 13px; font-weight: 600; font-style: italic;
        color: #c9803f;
        text-shadow: 0 1px 2px rgba(0,0,0,.55), 0 0 2px rgba(122,62,30,.7);
        transition: color 0.15s ease, text-shadow 0.15s ease;
      }
      .fp-unit-label--flash .fp-unit-label-text {
        color: #ffffff;
        text-shadow: 0 0 4px rgba(255,255,255,.85), 0 1px 2px rgba(0,0,0,.5);
      }
      @media (max-width: 480px) {
        .fp-unit-label-text { font-size: 10px; }
      }

      #fp-sitemap-hint {
        position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
        font-family: 'Cormorant Garamond', serif; font-size: 11px; font-style: italic;
        color: rgba(80,50,30,.40); pointer-events: none; white-space: nowrap;
      }

      #fp-sitemap-compass,
      #fp-sitemap-label {
        display: none;
        position: absolute; z-index: 35; pointer-events: none;
        background: rgba(255,253,250,.92);
        -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
        border-radius: 12px;
        box-shadow: 0 4px 14px rgba(0,0,0,.16);
        padding: 8px 12px;
      }
      #fp-card.fp-topbar--sitemap #fp-sitemap-compass,
      #fp-card.fp-topbar--sitemap #fp-sitemap-label {
        display: block;
      }
      #fp-sitemap-compass {
        top: 140px; right: 260px;
        height: 100px; width: auto;
      }
      #fp-sitemap-label {
        top: 85px; left: 575px;
        height: 70px; width: auto;
      }
      @media (max-width: 640px) {
        #fp-sitemap-compass {
    top: 18px; right: 18px;
    height: 76px; padding: 6px 10px;
  }
  #fp-sitemap-label {
    top: 10px; left: 10px;
    height: 55px; padding: 6px 10px;
  }
      }
      @media (max-width: 400px) {
       #fp-sitemap-compass {
    top: 14px; right: 14px;
    height: 60px; padding: 5px 8px;
  }
  #fp-sitemap-label {
    top: 8px; left: 8px;
    height: 46px; padding: 5px 8px;
  }
      }

      /* ── Desktop-only amenities legend, sits in the dead-map area to the
         left of the development footprint. Hidden on tablet/mobile. ── */
      #fp-sitemap-legend {
  display: none;
  position: absolute; z-index: 8;
  top: 50%; left: 22%; transform: translate(-50%, -50%);
  background: rgba(255,253,250,.95);
  -webkit-backdrop-filter: blur(8px); backdrop-filter: blur(8px);
  border: 2px solid rgba(122,62,30,.55);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,.12);
  padding: 22px 28px;
width: 280px;
pointer-events: none;
}
      #fp-card.fp-topbar--sitemap #fp-sitemap-legend {
        display: none;
      }
      @media (min-width: 1400px) {
        #fp-card.fp-topbar--sitemap #fp-sitemap-legend { display: block; }
      }
      #fp-sitemap-legend-title {
        font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
        letter-spacing: .14em; text-transform: uppercase;
        color: #7a3e1e; margin: 0 0 8px;
      }
    #fp-sitemap-legend ol {
  margin: 0; padding-left: 18px; list-style: decimal;
  font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 500;
  line-height: 1.9; color: #3a2410;
  columns: 1;
}
      #fp-sitemap-legend li { break-inside: avoid; padding-right: 4px; }
      .fp-sitemap-legend-osr {
        margin-top: 10px; padding-top: 8px;
        border-top: 1px dashed rgba(122,62,30,.45);
        font-family: 'Syne', sans-serif; font-size: 10px;
        color: rgba(80,50,30,.65); line-height: 1.5;
      }

      #fp-panel-cluster {
        display: flex; align-items: center; justify-content: center;
        background: #ffffff; transform: translateX(32px);
        overflow: hidden; touch-action: none;
      }
      #fp-cluster-wrap { position: relative; display: inline-block; max-width: 100%; max-height: 100%; will-change: transform; }
      #fp-cluster-img {
        display: block; max-width: 100%;
        max-height: calc(100dvh - var(--fp-topbar-h) - 62px - 48px - env(safe-area-inset-bottom, 0px));
        object-fit: contain; border: 1px solid rgba(122,62,30,.12);
        transition: opacity 0.28s; pointer-events: none;
        will-change: opacity;
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

      #fp-cluster-hint {
        position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
        font-family: 'Cormorant Garamond', serif; font-size: 11px; font-style: italic;
        color: rgba(80,50,30,.40); pointer-events: none; white-space: nowrap;
        opacity: 0; transition: opacity 0.4s;
      }
      #fp-cluster-hint.visible { opacity: 1; }

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
          <img id="fp-sitemap-label" src="" alt="Site Plan" />
          <img id="fp-sitemap-compass" src="" alt="North direction" />
          <div id="fp-sitemap-legend">
            <div id="fp-sitemap-legend-title">Amenities</div>
            <ol>
              <li>Drop – off</li>
              <li>Open Lawn</li>
              <li>Yoga Deck</li>
              <li>Outdoor Gym</li>
              <li>Outdoor Fitness</li>
              <li>Kids' Playground Area</li>
              <li>Security Kiosk</li>
              <li>Lobby</li>
              <li>Half Basketball Court</li>
              <li>BBQ Area</li>
              <li>Rain Garden</li>
              <li>Entry</li>
              <li>Exit</li>
              <li>Service Road Access</li>
              <li>Seating Area</li>
              <li>Lap Pool</li>
              <li>Kids' Lap Pool</li>
              <li>Pool Lounger</li>
              <li>Garden Pavilion</li>
              <li>Kids' Play Area</li>
            </ol>
            
          </div>
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
                <div id="fp-cluster-hint">Tap a unit to view its floor plan</div>
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

    const sitemapCompass = document.getElementById('fp-sitemap-compass');
    if (sitemapCompass) {
      sitemapCompass.src = SITEMAP_COMPASS_IMAGE;
      sitemapCompass.onerror = () => console.warn('Sitemap compass image failed to load:', SITEMAP_COMPASS_IMAGE);
    }

    const sitemapLabel = document.getElementById('fp-sitemap-label');
    if (sitemapLabel) {
      sitemapLabel.src = SITEMAP_LABEL_IMAGE;
      sitemapLabel.onerror = () => console.warn('Sitemap label image failed to load:', SITEMAP_LABEL_IMAGE);
    }
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
    const card = document.getElementById('fp-card');
    if (card) {
      card.classList.toggle('fp-topbar--sitemap', id === 'fp-panel-sitemap');
    }
  }

  function updateTitle() { /* fp-title removed — toggle row is centred via spacer */ }

  function resetToSitemap() {
    _flipToken++;
    disposeGltfCanvas();
    disposeSitemapCanvas();
    if (_sitemapRO) { _sitemapRO.disconnect(); _sitemapRO = null; }
    const clusterWrap = document.getElementById('fp-cluster-wrap');
    if (clusterWrap) clusterWrap.style.transform = '';
    level = 0; activeTower = null; activeUnit = null;
    viewMode = 'top'; floorParity = 'odd';
    const svg = document.getElementById('fp-zone-svg');
    if (svg) svg.innerHTML = '';
    const clusterImg = document.getElementById('fp-cluster-img');
    if (clusterImg) {
      clusterImg.classList.remove('fading');
      clusterImg.removeAttribute('src');
      clusterImg.style.transition = '';
      clusterImg.style.transform  = '';
      clusterImg.style.opacity    = '';
    }
    const planImg = document.getElementById('fp-plan-img');
    if (planImg) { planImg.classList.remove('fading'); planImg.removeAttribute('src'); planImg.style.transform = ''; }
    const unitInfo = document.getElementById('fp-unit-info');
    if (unitInfo) unitInfo.classList.remove('visible');
    const spinner = document.getElementById('fp-spinner');
    if (spinner) spinner.classList.remove('visible');
    const zoomHint = document.getElementById('fp-zoom-hint');
    if (zoomHint) zoomHint.classList.remove('visible');
    const clusterHint = document.getElementById('fp-cluster-hint');
    if (clusterHint) clusterHint.classList.remove('visible');
    document.querySelectorAll('.fp-zone.selected').forEach(z => z.classList.remove('selected'));
    hideZoneTip();
    showPanel('fp-panel-sitemap', 'back');
    updateTopbar();
    updateTitle();
    if (overlayOpen) buildSitemapTiles();
  }

  // ─── SITEMAP GLTF TILES ──────────────────────────────────────
  const SITEMAP_MESH_FILES = {
    'tower-A': './assets/sitemap/tower1.glb',
    'tower-B': './assets/sitemap/tower2.glb',
    'tower-C': './assets/sitemap/tower3.glb',
    'tower-D': './assets/sitemap/tower4.glb',
  };
  const SITEMAP_MESHES = SITEMAP.towerTiles.map(t => ({
    file:    SITEMAP_MESH_FILES[t.id],
    towerId: t.id,
    label:   t.label,
    points:  t.points,
    labelX:  t.labelX,
    labelY:  t.labelY,
  }));

  // NAV-PATCH: label side — which edge each tower's tag sits on. Applies to
  // both 'desktop' and 'tablet' breakpoints; 'mobile' keeps the original
  // above-tile label position untouched (smallest screen, no room to spare).
 const SITEMAP_LABEL_SIDE = {
    'tower-A': 'right',
    'tower-B': 'right',
    'tower-C': 'left',
    'tower-D': 'left',
  };
  // Mobile-only override: tags stack above/below the plan instead of
  // left/right of it (narrow screens don't have side-margin to spare).
  // Tower 1 (tower-A) & Tower 4 (tower-D) sit on top; Tower 2 (tower-B) &
  // Tower 3 (tower-C) sit on the bottom — matches the towers' actual
  // north/south position in the site plan.
  const SITEMAP_LABEL_SIDE_MOBILE = {
    'tower-A': 'top',
    'tower-B': 'bottom',
    'tower-C': 'bottom',
    'tower-D': 'top',
  };

  // How far outside the tower's own footprint (bbox edge) the tag sits, as a
  // fraction of the sitemap image width. Small = short leader line hugging
  // the building; this replaced pinning tags to the card's outer edge,
  // which produced very long lines over empty map area.
  const SITEMAP_LABEL_MARGIN = 0.08;
  // Tablet override — null falls back to SITEMAP_LABEL_MARGIN. Tablet cards
  // tend to be narrower, so a slightly smaller margin usually looks right;
  // tune independently here without touching the desktop value.
  const SITEMAP_LABEL_MARGIN_TABLET = 0.035;
  // Mobile override — cards are narrowest here, so tags need to sit further
  // out to clear the towers entirely, like the desktop/tablet edge layout.
  const SITEMAP_LABEL_MARGIN_MOBILE = 0.14;

  let _sitemapRO        = null;
  let _sitemapROTimer   = null;
  let _sitemapRenderer  = null;
  let _sitemapAnimId    = null;
  let _sitemapGltfRO    = null;

  function disposeSitemapCanvas() {
    if (_sitemapAnimId)   { cancelAnimationFrame(_sitemapAnimId); _sitemapAnimId = null; }
    if (_sitemapGltfRO)   { _sitemapGltfRO.disconnect(); _sitemapGltfRO = null; }
    if (_sitemapRenderer) { _sitemapRenderer.dispose(); _sitemapRenderer = null; }
    if (typeof stopSitemapBlink === 'function') stopSitemapBlink();
    const old = document.getElementById('fp-sitemap-canvas');
    if (old) old.remove();
    Object.values(_sitemapLabelEls).forEach(el => el.remove());
    _sitemapLabelEls = {};
    const leaderSvg = document.getElementById('fp-sitemap-leader-svg');
    if (leaderSvg) leaderSvg.innerHTML = '';
    const fallbackSvg = document.getElementById('fp-sitemap-poly-fallback');
    if (fallbackSvg) fallbackSvg.remove();
  }

  function buildSitemapTiles() {
    const wrap = document.getElementById('fp-sitemap-wrap');
    const img  = document.getElementById('fp-sitemap-img');
    if (!wrap || !img) return;

    const bp = getSitemapBreakpoint();

    const panel = document.getElementById('fp-panel-sitemap');
    const rect  = panel ? panel.getBoundingClientRect() : null;
    const containerAspect = (rect && rect.height > 0) ? (rect.width / rect.height) : 1.8;
    const fitted = fitSitemapForPCMaxZoom(containerAspect);
    const extraZoom = (bp === 'desktop') ? SITEMAP_PC_EXTRA_ZOOM : SITEMAP_EXTRA_ZOOM[bp];
    const region = SITEMAP_DEBUG_GRID
      ? { left: 0, top: 0, right: 100, bottom: 100 }
      : shrinkRegionAroundCenter(fitted, extraZoom);

    const targetUrl = buildSitemapImageUrl(region, computeSitemapDeliverWidth());

    if (targetUrl === _sitemapLoadedUrl && (_sitemapRenderer || wrap.querySelector('.fp-sitemap-svg'))) {
      return;
    }

    disposeSitemapCanvas();
    _sitemapPolyData = computeSitemapPolyData(region, bp);
    _sitemapActiveBreakpoint = bp;
    _sitemapLoadedUrl = targetUrl;

    function tryBuild() {
      if (!img.offsetWidth || !img.offsetHeight) {
        requestAnimationFrame(tryBuild); return;
      }
      if (SITEMAP_USE_GLB && typeof THREE !== 'undefined' && typeof THREE.GLTFLoader !== 'undefined') {
        _buildSitemapGltf(wrap, img);
      } else {
        _buildSitemapSvg(wrap, img);
      }
    }

    if (img.src === targetUrl && img.complete && img.naturalWidth > 0) {
      tryBuild();
    } else {
      img.src = targetUrl;
      if (img.complete && img.naturalWidth > 0) tryBuild();
      else img.addEventListener('load', tryBuild, { once: true });
    }

    if (_sitemapRO) _sitemapRO.disconnect();
    _sitemapRO = new ResizeObserver(() => {
      clearTimeout(_sitemapROTimer);
      _sitemapROTimer = setTimeout(() => {
        if (_sitemapRenderer) _syncSitemapToImage(wrap, img);
      }, 60);
    });
    _sitemapRO.observe(wrap);
    _sitemapRO.observe(img);
  }

  let _sitemapPolyData = {};

  function remapPercent(x, y, region) {
    return {
      x: (x - region.left) / (region.right - region.left) * 100,
      y: (y - region.top)  / (region.bottom - region.top)  * 100,
    };
  }
  function remapPointsStr(pointsStr, region) {
    return pointsStr.trim().split(/\s+/).map(p => {
      const [px, py] = p.split(',').map(Number);
      const r = remapPercent(px, py, region);
      return `${r.x},${r.y}`;
    }).join(' ');
  }
  function computeSitemapPolyData(region, bp) {
    const out = {};
    SITEMAP.towerTiles.forEach(t => {
      const useMobile = bp === 'mobile' && t.pointsMobile;
      const useTablet = bp === 'tablet' && t.pointsTablet;

      const srcPoints = useMobile ? t.pointsMobile
                       : useTablet ? t.pointsTablet
                       : t.points;

      const remappedPoints = remapPointsStr(srcPoints, region);
      const pts        = parsePoints(remappedPoints);
      const { cx, cy } = polyCentroid(pts);
      const bbox       = polyBBox(pts);

      // Label now always anchors at the polygon centroid — no manual
      // labelX/labelY to maintain. Vertical lift above the roof is
      // handled purely in CSS via .fp-glb-label's transform + the
      // leader line height, not here.
      out[t.id] = { cx, cy, bbox, labelX: cx, labelY: cy, remappedPoints };
    });
    return out;
  }

  let _sitemapRootList  = [];
  let _sitemapMeshMap   = {};
  let _sitemapCamera    = null;
  let _sitemapCanvas    = null;
  let _sitemapLabelEls  = {};

  const _towerDisplayNumber = {};
  SITEMAP.towerTiles.forEach((t, i) => { _towerDisplayNumber[t.id] = i + 1; });

  // 'desktop' and 'tablet' both use the short edge-hugging tag + leader
  // line; 'mobile' keeps the original above-tile layout.
  function _sitemapUsesEdgeLayout() {
    return true;
  }

  function _addSitemapLabel(wrap, towerId) {
    if (_sitemapLabelEls[towerId]) return;

    // ensure the leader-line SVG exists once
    let leaderSvg = wrap.querySelector('#fp-sitemap-leader-svg');
    if (!leaderSvg) {
      leaderSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      leaderSvg.id = 'fp-sitemap-leader-svg';
      wrap.appendChild(leaderSvg);
    }
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('class', 'fp-sitemap-leader-line');
    line.dataset.towerId = towerId;
    leaderSvg.appendChild(line);

    const useEdgeLayout = _sitemapUsesEdgeLayout();
    const side = _sitemapActiveBreakpoint === 'mobile'
      ? (SITEMAP_LABEL_SIDE_MOBILE[towerId] || 'top')
      : (SITEMAP_LABEL_SIDE[towerId] || 'right');

    const el = document.createElement('div');
    el.className = useEdgeLayout ? `fp-glb-label fp-glb-label--${side}` : 'fp-glb-label fp-glb-label--above';
    el.innerHTML = useEdgeLayout
      ? `<div class="fp-glb-tag">Tower ${_towerDisplayNumber[towerId] || ''}</div>`
      : `<div class="fp-glb-tag">Tower ${_towerDisplayNumber[towerId] || ''}</div><div class="fp-glb-leader"></div>`;
    wrap.appendChild(el);
    _sitemapLabelEls[towerId] = el;
    _positionSitemapLabels();
  }

  function _positionSitemapLabels() {
    if (!_sitemapCanvas) return;
    const left = parseFloat(_sitemapCanvas.style.left)  || 0;
    const top  = parseFloat(_sitemapCanvas.style.top)   || 0;
    const W    = parseFloat(_sitemapCanvas.style.width)  || 0;
    const H    = parseFloat(_sitemapCanvas.style.height) || 0;
    const leaderSvg = document.getElementById('fp-sitemap-leader-svg');
    const useEdgeLayout = _sitemapUsesEdgeLayout();
    const edgeMarginFrac = _sitemapActiveBreakpoint === 'tablet'
      ? (SITEMAP_LABEL_MARGIN_TABLET != null ? SITEMAP_LABEL_MARGIN_TABLET : SITEMAP_LABEL_MARGIN)
      : _sitemapActiveBreakpoint === 'mobile'
      ? (SITEMAP_LABEL_MARGIN_MOBILE != null ? SITEMAP_LABEL_MARGIN_MOBILE : SITEMAP_LABEL_MARGIN)
      : SITEMAP_LABEL_MARGIN;


    // Mobile tags are wider than the small clamp padding used on desktop/tablet,
    // and left-side tags extend LEFTWARD from their anchor point (translate(-100%)),
    // so they need a much bigger clamp pad on mobile or they clip off the card edge.
    const LABEL_EDGE_PAD = _sitemapActiveBreakpoint === 'mobile' ? 92 : 12;

    Object.entries(_sitemapLabelEls).forEach(([towerId, el]) => {
      const poly = _sitemapPolyData[towerId];
      if (!poly) return;

      // Clamp the tower's remapped centroid into 0-100 before using it for
      // label placement. The desktop/tablet crop can push a tower (most
      // often the topmost one) partly outside the 0-100 remapped range; the
      // 3D tile still renders because _syncSitemapToImage separately clamps
      // mesh position back inside the frustum, but the label had no such
      // clamp and could end up placed far off-canvas — effectively invisible.
      const clampPct = v => Math.max(0, Math.min(100, v));
      const ccx = clampPct(poly.cx);
      const ccy = clampPct(poly.cy);

      const cxPx = left + (ccx / 100) * W;
      const cyPx = top  + (ccy / 100) * H;

      let labelX, labelY;

      if (useEdgeLayout) {
        const side = _sitemapActiveBreakpoint === 'mobile'
          ? (SITEMAP_LABEL_SIDE_MOBILE[towerId] || 'top')
          : (SITEMAP_LABEL_SIDE[towerId] || 'right');
        const isVertical = side === 'top' || side === 'bottom';
        // Anchor off the tower's CENTROID, not its bbox edge — a bbox edge
        // can get clipped to the crop's boundary (0 or 100) for whichever
        // tower happens to sit near that edge, which silently defeats the
        // margin value for that one tower/side while the others still
        // respond normally. Centroid + fixed offset makes line length
        // = edgeMarginFrac * canvas width on every tower, no exceptions.
        if (isVertical) {
          const offsetPy = H * edgeMarginFrac;
          labelX = cxPx; // level with the tower's centroid
          labelY = side === 'top' ? cyPx - offsetPy : cyPx + offsetPy;
        } else {
          const offsetPx = W * edgeMarginFrac;
          labelX = side === 'left' ? cxPx - offsetPx : cxPx + offsetPx;
          labelY = cyPx; // level with the tower's centroid
        }
        // final safety clamp: keep the tag within the visible canvas
        labelX = Math.max(left + LABEL_EDGE_PAD, Math.min(left + W - LABEL_EDGE_PAD, labelX));
        labelY = Math.max(top  + LABEL_EDGE_PAD, Math.min(top  + H - LABEL_EDGE_PAD, labelY));
      } else {
        // mobile only: keep the original above-tile behaviour
        labelX = left + (clampPct(poly.labelX) / 100) * W;
        labelY = top  + (clampPct(poly.labelY) / 100) * H;
      }

      el.style.left = labelX + 'px';
      el.style.top  = labelY + 'px';

      const line = leaderSvg && leaderSvg.querySelector(`line[data-tower-id="${towerId}"]`);
      if (line) {
        if (useEdgeLayout) {
          line.setAttribute('x1', labelX);
          line.setAttribute('y1', labelY);
          line.setAttribute('x2', cxPx);
          line.setAttribute('y2', cyPx);
          line.style.display = '';
        } else {
          // mobile uses the CSS .fp-glb-leader stub instead of the SVG line
          line.style.display = 'none';
        }
      }
    });
  }

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
    _positionSitemapLabels();

    _sitemapCamera.left   = -aspect * 0.5;
    _sitemapCamera.right  =  aspect * 0.5;
    _sitemapCamera.top    =  0.5;
    _sitemapCamera.bottom = -0.5;
    _sitemapCamera.updateProjectionMatrix();

    const uniformSz = SITEMAP_GLB_TARGET_SIZE;

    _sitemapRootList.forEach(({ root, towerId }) => {
      const poly = _sitemapPolyData[towerId];
      if (!poly) return;

      const sc = centroidToScene(poly.cx, poly.cy, aspect);
      const sz = uniformSz;

      root.scale.set(1, 1, 1);
      root.position.set(0, 0, 0);
      root.updateMatrixWorld(true);

      const box1  = new THREE.Box3().setFromObject(root);
      const size1 = new THREE.Vector3(); box1.getSize(size1);

      // NAV-PATCH: mobile-only and tablet-only scale overrides —
      // SITEMAP_GLB_SCALE_MOBILE/SITEMAP_GLB_SCALE_TABLET take precedence
      // when the active breakpoint matches and that tower has a non-null
      // override set; otherwise falls back to the shared desktop
      // SITEMAP_GLB_SCALE value. Fixed numbers — don't change with window
      // width within a breakpoint, so they can't drift/grow on resize.
      const mobileOverride = _sitemapActiveBreakpoint === 'mobile' ? SITEMAP_GLB_SCALE_MOBILE[towerId] : null;
      const tabletOverride = _sitemapActiveBreakpoint === 'tablet' ? SITEMAP_GLB_SCALE_TABLET[towerId] : null;
      const glbScale = mobileOverride != null
        ? mobileOverride
        : tabletOverride != null
        ? tabletOverride
        : (SITEMAP_GLB_SCALE[towerId] != null ? SITEMAP_GLB_SCALE[towerId] : 1);
      const scaleX = (size1.x > 0.0001 ? sz.sw / size1.x : 1) * glbScale;
      const scaleY = (size1.y > 0.0001 ? sz.sh / size1.y : 1) * glbScale;
      root.scale.set(scaleX, scaleY, Math.min(scaleX, scaleY));

      root.updateMatrixWorld(true);
      const box2 = new THREE.Box3().setFromObject(root);
      const ctr2 = new THREE.Vector3(); box2.getCenter(ctr2);
      root.position.set(sc.sx - ctr2.x, sc.sy - ctr2.y, 0);

      root.updateMatrixWorld(true);
      const box3 = new THREE.Box3().setFromObject(root);
      const frustumLeft = -aspect * 0.5, frustumRight = aspect * 0.5;
      const frustumTop  = 0.5,           frustumBottom = -0.5;
      let dx = 0, dy = 0;
      if (box3.min.x < frustumLeft)   dx = frustumLeft  - box3.min.x;
      if (box3.max.x > frustumRight)  dx = frustumRight - box3.max.x;
      if (box3.min.y < frustumBottom) dy = frustumBottom - box3.min.y;
      if (box3.max.y > frustumTop)    dy = frustumTop    - box3.max.y;
      if (dx || dy) root.position.set(root.position.x + dx, root.position.y + dy, 0);

      root.traverse(child => {
        if (!child.isMesh) return;
        const existing = _sitemapMeshMap[child.uuid] || {};
        _sitemapMeshMap[child.uuid] = { ...existing, mesh: child, towerId };
      });
    });
  }

  function _buildSitemapGltf(wrap, img) {
    const canvas = document.createElement('canvas');
    canvas.id = 'fp-sitemap-canvas';
    Object.assign(canvas.style, {
      position: 'absolute', pointerEvents: 'all', zIndex: '5',
      filter: 'drop-shadow(0 0 0.6px rgba(0,0,0,0.5))',
      transition: 'filter 0.15s ease',
    });
    wrap.appendChild(canvas);
    _sitemapCanvas = canvas;

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 0);
    _sitemapRenderer = renderer;

    const camera = new THREE.OrthographicCamera(-1, 1, 0.5, -0.5, 0.1, 1000);
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
    _sitemapCamera = camera;

    const scene     = new THREE.Scene();
    const raycaster = new THREE.Raycaster();
    const mouse     = new THREE.Vector2();
    _sitemapMeshMap  = {};
    _sitemapRootList = [];

    const COLOR_IDLE  = 0x8a5a30;
    const COLOR_HOVER = 0xffffff;

    const IDLE_FILL_OPACITY = 0.10;
    const IDLE_EDGE_OPACITY = 1.0;

    function makeFill() {
      return new THREE.MeshBasicMaterial({
        color: 0xffffff, transparent: true, opacity: IDLE_FILL_OPACITY,
        side: THREE.DoubleSide, depthWrite: false,
      });
    }
    function makeEdge(opacity) {
      return new THREE.LineBasicMaterial({
        color: COLOR_IDLE, transparent: true, opacity,
        blending: THREE.NormalBlending, depthWrite: false,
      });
    }

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

        const box0  = new THREE.Box3().setFromObject(root);
        const size0 = new THREE.Vector3(); box0.getSize(size0);
        if (size0.y < 0.01) { root.rotation.x = Math.PI / 2; root.updateMatrixWorld(true); }

        root.traverse(child => {
          if (!child.isMesh) return;
          child.material = makeFill();
          const edgesGeo = new THREE.EdgesGeometry(child.geometry);

          const e1 = new THREE.LineSegments(edgesGeo, makeEdge(1.0));
          e1.renderOrder = 1;
          child.add(e1);

          const e2 = new THREE.LineSegments(edgesGeo, makeEdge(0.75));
          e2.renderOrder = 1;
          child.add(e2);

          const e3 = new THREE.LineSegments(edgesGeo, makeEdge(0.50));
          e3.renderOrder = 1;
          child.add(e3);

          _sitemapMeshMap[child.uuid] = { mesh: child, e1, e2, e3, towerId };
        });

        _sitemapRootList.push({ root, towerId });
        scene.add(root);
        loaded++;
        _syncSitemapToImage(wrap, img);
        _addSitemapLabel(wrap, towerId);
        console.log('[SITEMAP GLTF] ✔ ' + file.split('/').pop() + ' → ' + towerId);
        if (loaded + failed === total) {
          console.log('[SITEMAP GLTF] DONE — Loaded:', loaded, '| Failed:', failed);
          blinkRevealSitemap();
          attachShineOnce(wrap, 'sitemap-glb', { matchRect: canvas });
        }

      }, undefined, (err) => {
        failed++;
        console.error('[SITEMAP GLTF] LOAD ERROR:', file, err);
        if (loaded + failed === total && loaded === 0) {
          // every tower's GLB failed — fall back to the flat SVG sitemap entirely
          disposeSitemapCanvas();
          _buildSitemapSvg(wrap, img);
        } else {
          // only THIS tower's GLB failed — give it a flat SVG polygon + label
          // of its own instead of silently vanishing from the sitemap.
          _addSitemapPolyFallback(wrap, towerId);
          _addSitemapLabel(wrap, towerId);
          if (loaded + failed === total) {
            console.log('[SITEMAP GLTF] DONE — Loaded:', loaded, '| Failed:', failed);
            blinkRevealSitemap();
          }
        }
      });
    });

    _sitemapGltfRO = new ResizeObserver(() => _syncSitemapToImage(wrap, img));
    _sitemapGltfRO.observe(img);

    function pick(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      mouse.x =  ((clientX - rect.left) / rect.width)  * 2 - 1;
      mouse.y = -((clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const meshes = Object.values(_sitemapMeshMap).map(v => v.mesh);
      const hits   = raycaster.intersectObjects(meshes, false);
      return hits.length ? _sitemapMeshMap[hits[0].object.uuid] : null;
    }

    canvas.addEventListener('mousemove',  e => {
      canvas.style.cursor = pick(e.clientX, e.clientY) ? 'pointer' : '';
    });
    canvas.addEventListener('click', e => {
      if (e.detail === 0) return;
      const hit = pick(e.clientX, e.clientY);
      if (!hit) return;
      drillToCluster(hit.towerId);
    });

    let touchMoved = false, touchHit = null;
    canvas.addEventListener('touchstart', e => {
      if (e.touches.length > 1) { touchHit = null; return; }
      touchMoved = false;
      touchHit   = pick(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    canvas.addEventListener('touchmove', () => { touchMoved = true; touchHit = null; }, { passive: true });
    canvas.addEventListener('touchend', e => {
      if (!touchMoved && touchHit) { e.preventDefault(); drillToCluster(touchHit.towerId); }
      touchHit = null;
    });

    (function loop() {
      _sitemapAnimId = requestAnimationFrame(loop);
      renderer.render(scene, camera);
    })();
  }

  const COPPER_HEX  = 0x8a5a30;
  const FLASH_HEX    = 0xf3ead6;
  let _sitemapBlinkTimer = null;
  const SITEMAP_BLINK_MS = 900;
  const GLOW_FILTER  = 'drop-shadow(0 0 0.8px rgba(255,255,255,0.45))';
  const IDLE_FILTER  = 'drop-shadow(0 0 0.6px rgba(0,0,0,0.5))';

  function blinkRevealSitemap() {
    if (_sitemapBlinkTimer) { clearInterval(_sitemapBlinkTimer); _sitemapBlinkTimer = null; }
    let on = true;
    _sitemapBlinkTimer = setInterval(() => {
      on = !on;
      const meshes = Object.values(_sitemapMeshMap);
      meshes.forEach(({ mesh, e1, e2, e3 }) => {
        mesh.material.opacity = 0.10;
        const c = on ? FLASH_HEX : COPPER_HEX;
        if (e1) { e1.material.color.set(c); e1.material.opacity = on ? 0.75 : 1.0; }
        if (e2) { e2.material.color.set(c); e2.material.opacity = on ? 0.55 : 0.85; }
        if (e3) { e3.material.color.set(c); e3.material.opacity = on ? 0.40 : 0.60; }
      });
      if (_sitemapCanvas) _sitemapCanvas.style.filter = on ? GLOW_FILTER : IDLE_FILTER;
      Object.values(_sitemapLabelEls).forEach(el => el.classList.toggle('fp-glb-label--flash', on));
      document.querySelectorAll('#fp-sitemap-leader-svg line').forEach(l =>
        l.classList.toggle('fp-sitemap-leader-line--flash', on)
      );
    }, SITEMAP_BLINK_MS);
  }

  function stopSitemapBlink() {
    if (_sitemapBlinkTimer) { clearInterval(_sitemapBlinkTimer); _sitemapBlinkTimer = null; }
    Object.values(_sitemapMeshMap).forEach(({ mesh, e1, e2, e3 }) => {
      if (!mesh) return;
      mesh.material.opacity = 0.10;
      if (e1) { e1.material.color.set(COPPER_HEX); e1.material.opacity = 1.0; }
      if (e2) { e2.material.color.set(COPPER_HEX); e2.material.opacity = 0.85; }
      if (e3) { e3.material.color.set(COPPER_HEX); e3.material.opacity = 0.60; }
    });
    if (_sitemapCanvas) _sitemapCanvas.style.filter = IDLE_FILTER;
    Object.values(_sitemapLabelEls).forEach(el => el.classList.remove('fp-glb-label--flash'));
    document.querySelectorAll('#fp-sitemap-leader-svg line').forEach(l =>
      l.classList.remove('fp-sitemap-leader-line--flash')
    );
  }

  // Flat SVG polygon for a single tower whose GLB failed to load — keeps
  // that tower visible/clickable on the sitemap even when its 3D tile
  // couldn't be built, instead of it just disappearing.
  function _addSitemapPolyFallback(wrap, towerId) {
    let svg = wrap.querySelector('#fp-sitemap-poly-fallback');
    if (!svg) {
      svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.id = 'fp-sitemap-poly-fallback';
      svg.setAttribute('viewBox', '0 0 100 100');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;overflow:visible;pointer-events:none;z-index:4;';
      wrap.appendChild(svg);
    }
    const poly = _sitemapPolyData[towerId];
    const tile = SITEMAP.towerTiles.find(t => t.id === towerId);
    if (!poly || !tile) return;

    const el = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    el.setAttribute('class', 'fp-tower-poly');
    el.setAttribute('points', poly.remappedPoints);
    el.style.pointerEvents = 'all';
    el.addEventListener('click', e => { if (e.detail === 0) return; drillToCluster(towerId); });
    el.addEventListener('touchend', e => { e.preventDefault(); drillToCluster(towerId); });
    svg.appendChild(el);
  }

  function _buildSitemapSvg(wrap, img) {
    const old = wrap.querySelector('.fp-sitemap-svg');
    if (old) old.remove();

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'fp-sitemap-svg');
    svg.setAttribute('viewBox', '0 0 100 100');
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;overflow:visible;pointer-events:none;';

    if (SITEMAP_DEBUG_GRID) {
      const gridG = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      gridG.setAttribute('class', 'fp-debug-grid');
      for (let v = 0; v <= 100; v += 10) {
        const vLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        vLine.setAttribute('x1', v); vLine.setAttribute('y1', 0);
        vLine.setAttribute('x2', v); vLine.setAttribute('y2', 100);
        vLine.setAttribute('stroke', 'rgba(255,0,0,.35)'); vLine.setAttribute('stroke-width', '0.15');
        gridG.appendChild(vLine);

        const hLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        hLine.setAttribute('x1', 0); hLine.setAttribute('y1', v);
        hLine.setAttribute('x2', 100); hLine.setAttribute('y2', v);
        hLine.setAttribute('stroke', 'rgba(255,0,0,.35)'); hLine.setAttribute('stroke-width', '0.15');
        gridG.appendChild(hLine);

        const xLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        xLabel.setAttribute('x', v); xLabel.setAttribute('y', 3);
        xLabel.setAttribute('font-size', '2.2'); xLabel.setAttribute('fill', 'red');
        xLabel.textContent = v;
        gridG.appendChild(xLabel);

        const yLabel = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        yLabel.setAttribute('x', 1); yLabel.setAttribute('y', v + 1.5);
        yLabel.setAttribute('font-size', '2.2'); yLabel.setAttribute('fill', 'red');
        yLabel.textContent = v;
        gridG.appendChild(yLabel);
      }
      svg.appendChild(gridG);
    }

    SITEMAP.towerTiles.forEach((tile, i) => {
      const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      g.style.pointerEvents = 'all';

      const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      poly.setAttribute('class', 'fp-tower-poly');
      const remapped = (_sitemapPolyData[tile.id] && _sitemapPolyData[tile.id].remappedPoints) || tile.points;
      poly.setAttribute('points', remapped);

      const pts = parsePoints(remapped);
      const { cx, cy } = polyCentroid(pts);
      const { minY }   = polyBBox(pts);

      const tagLabel   = `Tower ${i + 1}`;
      const tagW       = 6 + tagLabel.length * 1.7;
      const tagH       = 4.6;
      const tagX       = cx;
      const tagY       = Math.max(minY - 7, tagH / 2 + 1);
      const leaderTopY = tagY + tagH / 2;

      const tagGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
      tagGroup.setAttribute('class', 'fp-tower-tag');

      const leader = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      leader.setAttribute('class', 'fp-tower-tag-leader');
      leader.setAttribute('x1', tagX); leader.setAttribute('y1', leaderTopY);
      leader.setAttribute('x2', cx);   leader.setAttribute('y2', cy);

      const tagBg = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
      tagBg.setAttribute('class', 'fp-tower-tag-bg');
      tagBg.setAttribute('x', tagX - tagW / 2);
      tagBg.setAttribute('y', tagY - tagH / 2);
      tagBg.setAttribute('width', tagW);
      tagBg.setAttribute('height', tagH);
      tagBg.setAttribute('rx', tagH / 2);

      const tagText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      tagText.setAttribute('class', 'fp-tower-tag-text');
      tagText.setAttribute('x', tagX); tagText.setAttribute('y', tagY + 0.15);
      tagText.textContent = tagLabel;

      tagGroup.appendChild(tagBg);
      tagGroup.appendChild(tagText);

      poly.addEventListener('mouseenter', () => { poly.setAttribute('fill','rgba(212,175,55,.35)'); poly.setAttribute('stroke','rgba(212,175,55,1)'); tagGroup.classList.add('tapped'); });
      poly.addEventListener('mouseleave', () => { poly.setAttribute('fill','rgba(212,175,55,0.08)'); poly.setAttribute('stroke','rgba(212,175,55,0.50)'); tagGroup.classList.remove('tapped'); });
      let tMoved = false;
      g.addEventListener('touchstart', () => { tMoved = false; poly.setAttribute('fill','rgba(212,175,55,.25)'); tagGroup.classList.add('tapped'); }, { passive: true });
      g.addEventListener('touchmove',  () => { tMoved = true;  poly.setAttribute('fill','rgba(212,175,55,0.08)'); tagGroup.classList.remove('tapped'); }, { passive: true });
      g.addEventListener('touchend', e => { poly.setAttribute('fill','rgba(212,175,55,0.08)'); tagGroup.classList.remove('tapped'); if (!tMoved) { e.preventDefault(); drillToCluster(tile.id); } });
      g.addEventListener('click', e => { if (e.detail === 0) return; drillToCluster(tile.id); });

      g.appendChild(poly); g.appendChild(leader); g.appendChild(tagGroup);
      svg.appendChild(g);
    });
    wrap.appendChild(svg);
  }

  // ─── SWAP PARITY ─────────────────────────────────────────────
  const PARITY_FADE_MS = 130;
  let _flipToken = 0;

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

    const myToken  = ++_flipToken;
    const reqTower = activeTower, reqParity = floorParity;

    img.style.transition = `opacity ${PARITY_FADE_MS}ms ease`;
    img.style.opacity    = '0.25';

    setTimeout(() => {
      if (myToken !== _flipToken) return;
      let done = false;
      let hardTimer = null;
      function finish() {
        if (done) return; done = true;
        clearTimeout(hardTimer);
        if (myToken !== _flipToken) return;
        img.style.opacity = '1';
        setTimeout(() => {
          if (myToken !== _flipToken) return;
          buildGltfZones(reqTower, reqParity);
        }, PARITY_FADE_MS);
      }
      img.addEventListener('load', finish, { once: true });
      img.addEventListener('error', finish, { once: true });
      const newSrc = getClusterImage(reqTower, reqParity);
      img.src = newSrc;
      if (img.currentSrc && img.currentSrc.endsWith(newSrc.split('/').pop()) && img.complete && img.naturalWidth > 0) {
        finish();
      }
      hardTimer = setTimeout(finish, 4000);
    }, PARITY_FADE_MS);
  }

  // ─── DRILL TO CLUSTER ────────────────────────────────────────
  function drillToCluster(towerId) {
    if (_transitioning) return;
    _flipToken++;
    activeUnit = null; viewMode = 'top'; floorParity = 'odd';
    const unitInfo = document.getElementById('fp-unit-info');
    if (unitInfo) unitInfo.classList.remove('visible');
    const planImg = document.getElementById('fp-plan-img');
    if (planImg) { planImg.removeAttribute('src'); planImg.style.transform = ''; }
    const sitemapWrap = document.getElementById('fp-sitemap-wrap');
    if (sitemapWrap) sitemapWrap.style.transform = '';
    const clusterWrapReset = document.getElementById('fp-cluster-wrap');
    if (clusterWrapReset) clusterWrapReset.style.transform = '';
    document.querySelectorAll('.fp-zone.selected').forEach(z => z.classList.remove('selected'));
    activeTower = towerId;
    document.querySelectorAll('.fp-parity-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.parity === floorParity);
    });
    const img = document.getElementById('fp-cluster-img');
    const svg = document.getElementById('fp-zone-svg');
    if (!img || !svg) return;
    img.style.transition = '';
    img.style.transform  = '';
    img.style.opacity    = '';
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
      const newSrc = getClusterImage(towerId, floorParity);
      img.src = newSrc;
      if (img.currentSrc && img.currentSrc.endsWith(newSrc.split('/').pop()) && img.complete && img.naturalWidth > 0) {
        finish();
      }
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
  let _gltfBuildGen = 0;

  function disposeGltfCanvas() {
    if (_gltfAnimId)   { cancelAnimationFrame(_gltfAnimId); _gltfAnimId = null; }
    if (_gltfRO)       { _gltfRO.disconnect(); _gltfRO = null; }
    if (_gltfRenderer) { _gltfRenderer.dispose(); _gltfRenderer = null; }
    if (_zoneBlinkTimer) { clearInterval(_zoneBlinkTimer); _zoneBlinkTimer = null; }
    const old = document.getElementById('fp-gltf-canvas');
    if (old) old.remove();
    const dbg = document.getElementById('fp-debug-svg');
    if (dbg) dbg.remove();
    const clusterHint = document.getElementById('fp-cluster-hint');
    if (clusterHint) clusterHint.classList.remove('visible');
    
  }

  function bhkLabelFromFile(file) {
    if (!file) return '';
    return file.split('/').pop().replace(/\.glb$/i, '');
  }

  let _clusterLabelEls = {};

  function _positionClusterLabels(canvas, unitPolyData) {
    if (!canvas) return;
    const left = parseFloat(canvas.style.left)  || 0;
    const top  = parseFloat(canvas.style.top)   || 0;
    const W    = parseFloat(canvas.style.width)  || 0;
    const H    = parseFloat(canvas.style.height) || 0;
    Object.entries(_clusterLabelEls).forEach(([unitId, el]) => {
      const poly = unitPolyData[unitId];
      if (!poly) return;
      el.style.left = (left + (poly.cx / 100) * W) + 'px';
      el.style.top  = (top  + (poly.cy / 100) * H) + 'px';
    });
  }

  function buildGltfZones(towerId, parity) {
    disposeGltfCanvas();
    const myGen = ++_gltfBuildGen;

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

    const unitById = {};
    getUnits(towerId, parity).forEach(u => { unitById[u.unitId] = u; });

    const DEBUG_MARKERS = false;

    const unitPolyData = {};
    unitMeshList.forEach(({ unitId }) => {
      const ud = unitById[unitId] || null;
      if (!ud || !ud.points) return;
      const pts        = parsePoints(ud.points);
      const { cx, cy } = polyCentroid(pts);
      const bbox       = polyBBox(pts);
      unitPolyData[unitId] = { cx, cy, bbox };
    });

    const canvas = document.createElement('canvas');
    canvas.id = 'fp-gltf-canvas';
    Object.assign(canvas.style, {
      position: 'absolute',
      pointerEvents: 'all',
      zIndex: '5',
      filter: 'drop-shadow(0 0 0.6px rgba(0,0,0,0.5))',
      transition: 'filter 0.15s ease',
    });
    wrap.appendChild(canvas);

    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(1);
    renderer.setClearColor(0x000000, 0);
    _gltfRenderer = renderer;

    const camera = new THREE.OrthographicCamera(-1, 1, 0.5, -0.5, 0.1, 1000);
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);

    const scene     = new THREE.Scene();
    const raycaster = new THREE.Raycaster();
    const mouse     = new THREE.Vector2();

    const meshMap  = {};
    const rootList = [];

    const COLOR_IDLE  = 0x8a5a30;
    const COLOR_HOVER = 0xffffff;

    const IDLE_FILL_OPACITY = 0.08;
    const IDLE_EDGE_OPACITY = 1.0;

    function makeFillMaterial() {
      return new THREE.MeshBasicMaterial({
        color:       0xffffff,
        transparent: true,
        opacity:     IDLE_FILL_OPACITY,
        side:        THREE.DoubleSide,
        depthWrite:  false,
      });
    }

    function makeEdgeMaterial(opacity) {
      return new THREE.LineBasicMaterial({
        color:       COLOR_IDLE,
        transparent: true,
        opacity,
        blending:    THREE.NormalBlending,
        depthWrite:  false,
        linewidth:   1,
      });
    }

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
      _positionClusterLabels(canvas, unitPolyData);

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
          const existing = meshMap[child.uuid] || {};
          meshMap[child.uuid] = { ...existing, mesh: child, unitData };
        });
      });

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

    _gltfRO = new ResizeObserver(() => syncToImage());
    _gltfRO.observe(img);

    console.log('[GLTF] Loading', unitMeshList.length, 'unit GLBs for', towerId);
    const loader = new THREE.GLTFLoader();
    let loaded = 0, failed = 0;
    const total = unitMeshList.length;

    unitMeshList.forEach(({ file, unitId }, idx) => {
      const unitData = unitById[unitId] || null;

      loader.load(file, (gltf) => {
        if (myGen !== _gltfBuildGen) return;
        const root = gltf.scene;

        root.rotation.set(0, 0, 0);
        root.scale.set(1, 1, 1);
        root.position.set(0, 0, 0);
        root.updateMatrixWorld(true);

        const box0  = new THREE.Box3().setFromObject(root);
        const size0 = new THREE.Vector3(); box0.getSize(size0);
        if (size0.y < 0.01) {
          root.rotation.x = Math.PI / 2;
          root.updateMatrixWorld(true);
        }

        root.traverse(child => {
          if (!child.isMesh) return;

          child.material = makeFillMaterial();

          const edgesGeo = new THREE.EdgesGeometry(child.geometry);
          const edgeLines = new THREE.LineSegments(edgesGeo, makeEdgeMaterial(IDLE_EDGE_OPACITY));
          edgeLines.renderOrder = 1;
          child.add(edgeLines);

          const edgeLines2 = new THREE.LineSegments(edgesGeo, makeEdgeMaterial(0));
          edgeLines2.renderOrder = 1;
          child.add(edgeLines2);

          const edgeLines3 = new THREE.LineSegments(edgesGeo, makeEdgeMaterial(0));
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
          blinkRevealZones(meshMap, IDLE_FILL_OPACITY, IDLE_EDGE_OPACITY, canvas);
          attachShineOnce(wrap, 'unit-zone-glb', { matchRect: canvas });
          const clusterHint = document.getElementById('fp-cluster-hint');
          if (clusterHint) clusterHint.classList.add('visible');
        }

      }, (xhr) => {
        if (xhr.lengthComputable) {
          const pct = Math.round((xhr.loaded / xhr.total) * 100);
          console.log('[GLTF] ' + file.split('/').pop() + ' ' + pct + '%');
        }
      }, (err) => {
        if (myGen !== _gltfBuildGen) return;
        failed++;
        console.error('[GLTF] LOAD ERROR:', file, err);
        if (loaded + failed === total && loaded === 0) {
          disposeGltfCanvas();
          buildZones(towerId, parity);
        }
      });
    });

    function pick(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      mouse.x =  ((clientX - rect.left) / rect.width)  * 2 - 1;
      mouse.y = -((clientY - rect.top)  / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);
      const hits = raycaster.intersectObjects(Object.values(meshMap).map(v => v.mesh), false);
      return hits.length ? meshMap[hits[0].object.uuid] : null;
    }

    canvas.addEventListener('mousemove', e => {
      canvas.style.cursor = pick(e.clientX, e.clientY) ? 'pointer' : '';
    });
    canvas.addEventListener('click', e => {
      if (e.detail === 0) return;
      const hit = pick(e.clientX, e.clientY);
      if (!hit || !hit.unitData) return;
      drillToUnit(hit.unitData);
    });

    let touchMoved = false, touchHit = null;
    canvas.addEventListener('touchstart', e => {
      if (e.touches.length > 1) { touchHit = null; return; }
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

    (function loop() {
      _gltfAnimId = requestAnimationFrame(loop);
      renderer.render(scene, camera);
    })();
  }

  let _zoneBlinkTimer = null;
  const ZONE_BLINK_MS = 500;

  function blinkRevealZones(meshMap, idleFill, idleEdge, canvas) {
    if (_zoneBlinkTimer) { clearInterval(_zoneBlinkTimer); _zoneBlinkTimer = null; }
    let on = true;
    _zoneBlinkTimer = setInterval(() => {
      on = !on;
      const c = on ? 0xffffff : COPPER_HEX;
      Object.values(meshMap).forEach(({ mesh, edgeLines, edgeLines2, edgeLines3 }) => {
        mesh.material.opacity = idleFill;
        if (edgeLines)  { edgeLines.material.color.set(c);  edgeLines.material.opacity  = idleEdge; }
        if (edgeLines2) { edgeLines2.material.color.set(c); edgeLines2.material.opacity = on ? 0.9  : 0; }
        if (edgeLines3) { edgeLines3.material.color.set(c); edgeLines3.material.opacity = on ? 0.75 : 0; }
      });
      if (canvas) canvas.style.filter = on ? GLOW_FILTER : IDLE_FILTER;
      Object.values(_clusterLabelEls).forEach(el => el.classList.toggle('fp-unit-label--flash', on));
    }, ZONE_BLINK_MS);
  }

  function stopZoneBlink(meshMap, idleFill, idleEdge, canvas) {
    if (_zoneBlinkTimer) { clearInterval(_zoneBlinkTimer); _zoneBlinkTimer = null; }
    if (meshMap) {
      Object.values(meshMap).forEach(({ mesh, edgeLines, edgeLines2, edgeLines3 }) => {
        if (!mesh) return;
        mesh.material.opacity = idleFill;
        if (edgeLines)  { edgeLines.material.color.set(COPPER_HEX);  edgeLines.material.opacity  = idleEdge; }
        if (edgeLines2) { edgeLines2.material.color.set(COPPER_HEX); edgeLines2.material.opacity = 0; }
        if (edgeLines3) { edgeLines3.material.color.set(COPPER_HEX); edgeLines3.material.opacity = 0; }
      });
    }
    if (canvas) canvas.style.filter = IDLE_FILTER;
    Object.values(_clusterLabelEls).forEach(el => el.classList.remove('fp-unit-label--flash'));
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

    const clusterHint = document.getElementById('fp-cluster-hint');
    if (clusterHint) clusterHint.classList.add('visible');
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
  function reportUnitDwell() {
    if (!unitEnteredAt || !activeUnit) return;
    const dwellMs = Date.now() - unitEnteredAt;
    if (typeof gtag === 'function' && dwellMs > 200) {
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
    reportUnitDwell();
    activeUnit = unitData;
    viewMode   = 'top';

    if (typeof gtag === 'function') {
      gtag('event', 'unit_view', {
        unit_id: unitData.unitId,
        unit_label: unitData.label,
        unit_type: unitData.type
      });
    }
    unitEnteredAt = Date.now();
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

  // ─── GENERIC ZOOM/PAN (pinch + drag + wheel) ──────────────────
  function bindZoomPan(area, target, opts) {
    if (!area || !target) return () => {};
    const { maxScale = 4, minScale = 1, hintEl = null, onScaleChange = null, initialScale = null, initialFocus = null } = opts || {};
    let scale = 1, originX = 0, originY = 0, lastDist = null;
    let panStartX = 0, panStartY = 0, panOriginX = 0, panOriginY = 0, lastTap = 0;

    function applyTransform() {
      target.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;
      target.style.transformOrigin = 'center center';
      if (hintEl) {
        if (scale > 1.05) { hintEl.textContent = 'Double-tap to reset'; hintEl.classList.add('visible'); }
        else hintEl.classList.remove('visible');
      }
      if (onScaleChange) onScaleChange(scale);
    }
    function resetZoom() {
      scale = 1; originX = 0; originY = 0;
      target.style.transition = 'transform 0.25s ease';
      applyTransform();
      setTimeout(() => { target.style.transition = ''; }, 260);
      if (hintEl) hintEl.classList.remove('visible');
    }
    function dist(t) { return Math.sqrt((t[0].clientX-t[1].clientX)**2+(t[0].clientY-t[1].clientY)**2); }
    function mid(t)  { return { x:(t[0].clientX+t[1].clientX)/2, y:(t[0].clientY+t[1].clientY)/2 }; }

    function onTouchStart(e) {
      if (e.touches.length === 2) {
        e.preventDefault(); lastDist = dist(e.touches);
      } else if (e.touches.length === 1) {
        const now = Date.now();
        if (now - lastTap < 300) { e.preventDefault(); resetZoom(); }
        lastTap = now;
        panStartX = e.touches[0].clientX; panStartY = e.touches[0].clientY;
        panOriginX = originX; panOriginY = originY;
      }
    }
    function onTouchMove(e) {
      if (e.touches.length === 2) {
        e.preventDefault();
        const d = dist(e.touches), m = mid(e.touches), rect = area.getBoundingClientRect();
        if (lastDist !== null) {
          const newScale = Math.min(maxScale, Math.max(minScale, scale * (d/lastDist)));
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
    }
    function onTouchEnd(e) {
      if (e.touches.length < 2) lastDist = null;
      if (scale <= minScale + 0.05) resetZoom();
    }
    area.addEventListener('touchstart', onTouchStart, { passive: false });
    area.addEventListener('touchmove',  onTouchMove,  { passive: false });
    area.addEventListener('touchend',   onTouchEnd,   { passive: true });

    function onWheel(e) {
      e.preventDefault();
      const rect = area.getBoundingClientRect();
      const newScale = Math.min(maxScale, Math.max(minScale, scale * (e.deltaY < 0 ? 1.12 : 0.89)));
      const pivotX = e.clientX - rect.left - rect.width/2;
      const pivotY = e.clientY - rect.top  - rect.height/2;
      originX = pivotX + (originX - pivotX) * (newScale / scale);
      originY = pivotY + (originY - pivotY) * (newScale / scale);
      scale = newScale;
      applyTransform();
      if (scale <= minScale + 0.01) resetZoom();
    }
    let mDragging = false, mStartX = 0, mStartY = 0, mOriginX = 0, mOriginY = 0;
    function onMouseDown(e) {
      if (scale <= 1) return;
      mDragging = true; mStartX = e.clientX; mStartY = e.clientY; mOriginX = originX; mOriginY = originY;
    }
    function onMouseMove(e) {
      if (!mDragging) return;
      originX = mOriginX + (e.clientX - mStartX);
      originY = mOriginY + (e.clientY - mStartY);
      applyTransform();
    }
    function onMouseUp() { mDragging = false; }
    area.addEventListener('wheel', onWheel, { passive: false });
    area.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);

    if (initialScale && initialFocus) {
      const rect0 = area.getBoundingClientRect();
      const pivotX = (initialFocus.xFrac - 0.5) * rect0.width;
      const pivotY = (initialFocus.yFrac - 0.5) * rect0.height;
      const newScale = Math.min(maxScale, Math.max(minScale, initialScale));
      originX = pivotX * (1 - newScale);
      originY = pivotY * (1 - newScale);
      scale = newScale;
      applyTransform();
    }

    return function unbind() {
      area.removeEventListener('touchstart', onTouchStart);
      area.removeEventListener('touchmove',  onTouchMove);
      area.removeEventListener('touchend',   onTouchEnd);
      area.removeEventListener('wheel', onWheel);
      area.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      resetZoom();
    };
  }

  function bindPinchZoom() {
    const area = document.getElementById('fp-plan-area');
    const img  = document.getElementById('fp-plan-img');
    const zoomHint = document.getElementById('fp-zoom-hint');
    bindZoomPan(area, img, { hintEl: zoomHint });
  }

  // ─── CAMERA VIEWPORT (sitemap) ─────────────────────────────────
  const SITEMAP_VIEWPORT_REGIONS = {
    mobile:  { left: 29,   top: 25.5, right: 77,   bottom: 80  },
  };
  const SITEMAP_VIEWPORT_BREAKPOINTS = { mobileMax: 640, tabletMax: 1024 };

  function getSitemapBreakpoint() {
    const w = window.innerWidth;
    if (w <= SITEMAP_VIEWPORT_BREAKPOINTS.mobileMax) return 'mobile';
    if (w <= SITEMAP_VIEWPORT_BREAKPOINTS.tabletMax) return 'tablet';
    return 'desktop';
  }

  // Units are Three.js scene units (frozen average of all 4 towers' boxes
  // at the time this was set) — raise both to make every tower bigger,
  // lower both to make them smaller; sw=width, sh=height.
  const SITEMAP_GLB_TARGET_SIZE = { sw: 0.185, sh: 0.3995 };

  // NAV-PATCH: desktop/shared per-tower GLB scale multiplier — used as-is
  // on PC/tablet, and on mobile for any tower whose
  // SITEMAP_GLB_SCALE_MOBILE entry is left at null (see below).
  const SITEMAP_GLB_SCALE = {
    'tower-A':2.25,
    'tower-B': 2.3,
    'tower-C': 2.6,
    'tower-D': 2.2,
  };

  // NAV-PATCH: mobile-only per-tower GLB scale override. Only takes effect
  // when the active breakpoint is 'mobile' (see _syncSitemapToImage).
  // null = falls back to SITEMAP_GLB_SCALE's PC value for that tower —
  // set a number here to size that tower's tile independently on mobile
  // without touching its desktop/tablet size.
  const SITEMAP_GLB_SCALE_MOBILE = {
    'tower-A': 1.1,
    'tower-B': 1.2,
    'tower-C': 1.4,
    'tower-D': 1.15,
  };

  // NAV-PATCH: tablet-only per-tower GLB scale override. Only takes effect
  // when the active breakpoint is 'tablet' (see _syncSitemapToImage).
  // null = falls back to SITEMAP_GLB_SCALE's PC value for that tower —
  // set a number here to size that tower's tile independently on tablet
  // without touching its desktop/mobile size.
  const SITEMAP_GLB_SCALE_TABLET = {
    'tower-A': 1.65,
    'tower-B': 1.8,
    'tower-C': 2,
    'tower-D': 1.7,
  };

  // NAV-PATCH: pan/shift system removed — see the note in buildSitemapTiles.

  // NAV-PATCH: tablet/mobile extra zoom — one number per breakpoint.
  // 1 = the original fixed crop untouched.
  const SITEMAP_EXTRA_ZOOM = { tablet: 2, mobile: 2.1 };

  // NAV-PATCH: PC-only extra zoom, on top of the max-zoom fit below.
  const SITEMAP_PC_EXTRA_ZOOM = 2;

  function shrinkRegionAroundCenter(region, factor) {
    if (!factor || factor <= 1) return region;
    const cx = (region.left + region.right) / 2;
    const cy = (region.top + region.bottom) / 2;
    const w = (region.right - region.left) / factor;
    const h = (region.bottom - region.top) / factor;
    let left = cx - w / 2, right = cx + w / 2;
    let top  = cy - h / 2, bottom = cy + h / 2;
    if (left < 0)    { right -= left; left = 0; }
    if (right > 100) { left -= (right - 100); right = 100; }
    if (top < 0)     { bottom -= top; top = 0; }
    if (bottom > 100) { top -= (bottom - 100); bottom = 100; }
    left = Math.max(0, left); right = Math.min(100, right);
    top  = Math.max(0, top);  bottom = Math.min(100, bottom);
    return { left, top, right, bottom };
  }

  function fitSitemapForPCMaxZoom(containerAspect) {
    const req  = SITEMAP_VIEWPORT_REGIONS.mobile;
    const reqW = req.right - req.left;
    const reqH = req.bottom - req.top;
    const cx   = (req.left + req.right) / 2;
    const cy   = (req.top  + req.bottom) / 2;

    let w, h;
    if (containerAspect >= reqW / reqH) {
      h = reqH;
      w = Math.min(100, h * containerAspect);
      if (w >= 100) { w = 100; h = w / containerAspect; }
    } else {
      w = reqW;
      h = Math.min(100, w / containerAspect);
      if (h >= 100) { h = 100; w = h * containerAspect; }
    }

    let left = cx - w / 2, right = cx + w / 2;
    let top  = cy - h / 2, bottom = cy + h / 2;
    if (left < 0)   { right -= left; left = 0; }
    if (right > 100) { left -= (right - 100); right = 100; }
    if (top < 0)    { bottom -= top; top = 0; }
    if (bottom > 100) { top -= (bottom - 100); bottom = 100; }
    left = Math.max(0, left); right = Math.min(100, right);
    top  = Math.max(0, top);  bottom = Math.min(100, bottom);

    return { left, top, right, bottom };
  }

  const SITEMAP_CLOUD_BASE = 'https://res.cloudinary.com/dp5ifzgge/image/upload';
  const SITEMAP_CLOUD_PATH = 'v1784891078/mapgot_lnjjpp.jpg';
  const SITEMAP_DELIVER_MIN = 800;
  const SITEMAP_DELIVER_MAX = 2400;

  function computeSitemapDeliverWidth() {
    const area = document.getElementById('fp-panel-sitemap');
    const cssWidth = (area && area.clientWidth) || window.innerWidth || 800;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    return Math.max(SITEMAP_DELIVER_MIN, Math.min(Math.round(cssWidth * dpr), SITEMAP_DELIVER_MAX));
  }

  function buildSitemapImageUrl(region, deliverWidth) {
    const isFull = region.left === 0 && region.top === 0 && region.right === 100 && region.bottom === 100;
    let cropSeg = '';
    if (!isFull) {
      const x = (region.left / 100).toFixed(4);
      const y = (region.top / 100).toFixed(4);
      const w = ((region.right - region.left) / 100).toFixed(4);
      const h = ((region.bottom - region.top) / 100).toFixed(4);
      cropSeg = `c_crop,x_${x},y_${y},w_${w},h_${h},fl_relative/`;
    }
    return `${SITEMAP_CLOUD_BASE}/${cropSeg}w_${deliverWidth},q_100/${SITEMAP_CLOUD_PATH}`;
  }

  let _sitemapActiveBreakpoint = null;
  let _sitemapLoadedUrl = null;
  let _sitemapResizeTimer = null;

  function bindSitemapResizeWatcher() {
    window.addEventListener('resize', () => {
      clearTimeout(_sitemapResizeTimer);
      _sitemapResizeTimer = setTimeout(() => {
        if (!overlayOpen || level !== 0) return;
        buildSitemapTiles();
      }, 300);
    });
    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        if (overlayOpen && level === 0) buildSitemapTiles();
      }, 100);
    });
  }
  let _sitemapResizeWatcherBound = false;

  let _unbindClusterZoom = null;

  function bindClusterZoomPan() {
    if (_unbindClusterZoom) { _unbindClusterZoom(); _unbindClusterZoom = null; }
    const area = document.getElementById('fp-panel-cluster');
    const wrap = document.getElementById('fp-cluster-wrap');
    _unbindClusterZoom = bindZoomPan(area, wrap, { maxScale: 4 });
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
  let _poppingState = false;
  let _fpHistoryDepth = 0;

  function pushFpState(replace) {
    if (replace) {
      history.replaceState({ fp: true, level }, '');
      _fpHistoryDepth = 1;
    } else {
      history.pushState({ fp: true, level }, '');
      _fpHistoryDepth++;
    }
  }

  function requestBack() {
    if (_fpHistoryDepth > 0) {
      history.back();
    } else {
      if (level > 0) goBack(); else close();
    }
  }

  function bindHistoryNav() {
    window.addEventListener('popstate', () => {
      if (!overlayOpen || _fpHistoryDepth === 0) return;
      _fpHistoryDepth--;
      _poppingState = true;
      if (level > 0) goBack();
      else close();
      _poppingState = false;
    });

    window.addEventListener('keydown', (e) => {
      if (!overlayOpen) return;
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
      attachShineOnce(parityToggle, 'parity-toggle', { pill: true });
    } else if (level === 2) {
      back.classList.add('visible');
      parityToggle.classList.remove('visible');
      const hasIso = !!(activeUnit && activeUnit.iso);
      viewToggle.classList.toggle('visible', hasIso);
      if (hasIso) attachShineOnce(viewToggle, 'view-toggle', { pill: true });
    }
  }

  // ─── OPEN / CLOSE ────────────────────────────────────────────
  const _shinedKeys = new Set();

  function attachShineOnce(container, key, opts) {
    return;
  }

  function _unusedAttachShineOnce(container, key, opts) {
    if (!container || _shinedKeys.has(key)) return;
    _shinedKeys.add(key);

    const { pill, matchRect } = opts || {};

    const shine = document.createElement('div');
    shine.className = pill ? 'fp-shine fp-shine--pill' : 'fp-shine';

    if (matchRect) {
      shine.style.position = 'absolute';
      shine.style.top    = matchRect.style.top;
      shine.style.left   = matchRect.style.left;
      shine.style.width  = matchRect.style.width;
      shine.style.height = matchRect.style.height;
    }

    shine.innerHTML = `<div class="fp-shine-band"></div>`;
    container.appendChild(shine);

    const band = shine.querySelector('.fp-shine-band');
    band.addEventListener('animationend', () => shine.remove(), { once: true });
    setTimeout(() => shine.remove(), 2200);
  }

  function open(floorNum, replaceHistory) {
    if (overlayOpen) return;
    overlayOpen = true;
    const fpOverlay = document.getElementById('fp-overlay');
    if (!fpOverlay) return;

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
    if (!_poppingState) pushFpState(replaceHistory);
  }

  let _closeResetTimer = null;

  function close(skipHistory) {
    if (!overlayOpen) return;
    if (level === 2) { reportUnitDwell(); unitEnteredAt = 0; }
    overlayOpen = false;

    if (!_poppingState && _fpHistoryDepth > 0) {
      const n = _fpHistoryDepth;
      _fpHistoryDepth = 0;
      if (!skipHistory) history.go(-n);
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
    if (!_sitemapResizeWatcherBound) { _sitemapResizeWatcherBound = true; bindSitemapResizeWatcher(); }
    bindClusterZoomPan();
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