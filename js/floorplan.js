// floorplan.js — 3-Level Floor Plan Viewer
// Level 0 → Sitemap (default) — 4 tower tiles overlaid
// Level 1 → Tower Cluster image — ODD/EVEN toggle + polygon unit zones
// Level 2 → Unit plan — Top View / Isometric toggle
//
// ─── SPREADSHEET REFERENCE ───────────────────────────────────────────────────
// Image 1: Full file name mapping (26 rows) with tower assignments
// Image 2: ODD/EVEN floor unit listing per tower
//   BLUE  = unit appears in BOTH odd and even floor plans → listed in both oddUnits & evenUnits
//   GREEN = unit appears in only ONE of odd or even → listed in that column only
//
// Tower A — all units are BLUE → oddUnits === evenUnits
//   3BHK(L) Type C (Podium)   → unit01_3bhk_l(C)_podium_tower_02  [NOTE: tower_02 file, assigned Tower A]
//   3BHK(L) Type B             → unit02_3bhk_l(b)_tower_02
//   4BHK Type C                → unit03_4bhk_(c)_tower_01
//   3BHK(L) Type D             → unit06_3bhk_l(d)_tower_02
//   3BHK(S) Type A             → unit05_3bhk_s(a)_tower_02
//   4BHK Type E                → unit04_4bhk_(e)_tower_04
//
// Tower B — all units are BLUE → oddUnits === evenUnits
//   3BHK(L) Type C (Podium)   → unit01_3bhk_l(C)_podium_tower_02
//   3BHK(L) Type B             → unit02_3bhk_l(b)_tower_02
//   4BHK Type C                → unit03_4bhk_(c)_tower_01
//   3BHK(L) Type D             → unit06_3bhk_l(d)_tower_02
//   3BHK(S) Type A             → unit05_3bhk_s(a)_tower_02
//   4BHK Type D                → unit04_4bhk_(d)_tower_02
//
// Tower C — mixed BLUE + GREEN (different units for odd/even)
//   ODD:  4BHK-G(green=odd only), 3BHK(S)-B, 3BHK(S)-B(Podium), 4BHK-F(Podium), 3BHK(L)-G, 3BHK(L)-G(Podium), 3BHK(L)-F, 3BHK(L)-F(Podium), 3BHK(L)-E, 4BHK-F(Odd)
//   EVEN: 3BHK-G(green=even only), 3BHK(S)-B, 3BHK(S)-B(Podium), 4BHK-F(Podium), 3BHK(L)-G, 3BHK(L)-G(Podium), 3BHK(L)-F, 3BHK(L)-F(Podium), 3BHK(L)-E, 4BHK-F(Even)
//
// Tower D — all units are BLUE → oddUnits === evenUnits
//   4BHK Type A                → unit01_4bhk_(a)_tower_04
//   3BHK(L) Type B             → unit02_3bhk_l(b)_tower_02  [shared file]
//   3BHK(L) Type A             → unit03_3bhk_l(a)_tower_04
//   4BHK Type B                → unit06_4bhk_(b)_tower_04
//   3BHK(S) Type A             → unit05_3bhk_s(a)_tower_02  [shared file]
//   4BHK Type E                → unit04_4bhk_(e)_tower_04
// ─────────────────────────────────────────────────────────────────────────────

window.FloorplanModule = (function () {

  const IK_BASE = 'https://ik.imagekit.io/pwzaetheh';

  /**
   * Build a full ImageKit URL from a relative path.
   * @param {string} path — e.g. 'isometric/unit06_3bhk_l(g)_podium_tower_03.jpg'
   * @returns {string}
   */
  function IK(path) {
    return `${IK_BASE}/${path}`;
  }

  // ─── LEVEL 0 — SITEMAP ────────────────────────────────────────
  const SITEMAP = {
    image: IK('Cluster/sitemap_cluster.jpg'),
    towerTiles: [
      { id: 'tower-A', label: 'Tower A', x: 18, y: 30, w: 14, h: 22 },
      { id: 'tower-B', label: 'Tower B', x: 38, y: 28, w: 14, h: 22 },
      { id: 'tower-C', label: 'Tower C', x: 58, y: 30, w: 14, h: 22 },
      { id: 'tower-D', label: 'Tower D', x: 74, y: 32, w: 14, h: 22 },
    ],
  };

  // ─────────────────────────────────────────────────────────────
  // TOWERS CONFIG
  //
  // File naming convention from spreadsheet Image 1:
  //   topview/  → IK('topview/<filename>.jpg')
  //   isometric → IK('isometric/<filename>.jpg')
  //
  // All filenames follow the pattern in the "Updated File Names" column.
  // The isometric folder already had one confirmed file in the original code:
  //   isometric/unit06_3bhk_l(g)_podium_tower_03.jpg  (C-odd-06 / C-even-06)
  //   isometric/unit06_3bhk_l(g)_tower_03.jpg         (C-odd-07 / C-even-07)
  //
  // For top-view files, the folder is 'topview/' and filenames follow the same
  // naming pattern as the "Updated File Names" column but may use different
  // extensions or subfolder structures — fill in as assets become available.
  // ─────────────────────────────────────────────────────────────

  const TOWERS = {

    // ══════════════════════════════════════════════════════════
    // TOWER A
    // From Image 2: ALL units are BLUE → identical oddUnits & evenUnits
    //
    // Units (6 total):
    //   1. 3BHK(L) Type C — Podium   [row 7  in Image 1]  unit01_3bhk_l(C)_podium_tower_02
    //   2. 3BHK(L) Type B             [row 6  in Image 1]  unit02_3bhk_l(b)_tower_02
    //   3. 4BHK Type C                [row 18 in Image 1]  unit03_4bhk_(c)_tower_01
    //   4. 3BHK(L) Type D             [row 8  in Image 1]  unit06_3bhk_l(d)_tower_02
    //   5. 3BHK(S) Type A             [row 2  in Image 1]  unit05_3bhk_s(a)_tower_02
    //   6. 4BHK Type E                [row 22 in Image 1]  unit04_4bhk_(e)_tower_04
    // ══════════════════════════════════════════════════════════
    'tower-A': {
      label: 'Tower A',
      odd:  { image: IK('Cluster/Brigade_raptakose_Cluster_Floorplan/typical_odd_tower_01.jpg')  },
      even: { image: IK('Cluster/Brigade_raptakose_Cluster_Floorplan/typical_even_tower_01.jpg') },

      oddUnits: [
        {
          unitId: 'A-odd-01',
          label:  '3BHK (L) Type C — Podium',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit01_3bhk_l(C)_podium_tower_02.jpg'),
          iso:    IK('isometric/unit01_3bhk_l(C)_podium_tower_02.jpg'),
          points: '10,15 35,15 35,45 10,45',
        },
        {
          unitId: 'A-odd-02',
          label:  '3BHK (L) Type B',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit02_3bhk_l(b)_tower_02.jpg'),
          iso:    IK('isometric/unit02_3bhk_l(b)_tower_02.jpg'),
          points: '40,15 65,15 65,45 40,45',
        },
        {
          unitId: 'A-odd-03',
          label:  '4BHK Type C',
          type:   '4 BHK',
          area:   '',
          top:    IK('topview/unit03_4bhk_(c)_tower_01.jpg'),
          iso:    IK('isometric/unit03_4bhk_(c)_tower_01.jpg'),
          points: '10,52 35,52 35,80 10,80',
        },
        {
          unitId: 'A-odd-04',
          label:  '3BHK (L) Type D',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit06_3bhk_l(d)_tower_02.jpg'),
          iso:    IK('isometric/unit06_3bhk_l(d)_tower_02.jpg'),
          points: '40,52 65,52 65,80 40,80',
        },
        {
          unitId: 'A-odd-05',
          label:  '3BHK (S) Type A',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit05_3bhk_s(a)_tower_02.jpg'),
          iso:    IK('isometric/unit05_3bhk_s(a)_tower_02.jpg'),
          points: '70,15 90,15 90,45 70,45',
        },
        {
          unitId: 'A-odd-06',
          label:  '4BHK Type E',
          type:   '4 BHK',
          area:   '',
          top:    IK('topview/unit04_4bhk_(e)_tower_04.jpg'),
          iso:    IK('isometric/unit04_4bhk_(e)_tower_04.jpg'),
          points: '70,52 90,52 90,80 70,80',
        },
      ],

      // BLUE = all same as oddUnits
      evenUnits: [
        {
          unitId: 'A-even-01',
          label:  '3BHK (L) Type C — Podium',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit01_3bhk_l(C)_podium_tower_02.jpg'),
          iso:    IK('isometric/unit01_3bhk_l(C)_podium_tower_02.jpg'),
          points: '10,15 35,15 35,45 10,45',
        },
        {
          unitId: 'A-even-02',
          label:  '3BHK (L) Type B',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit02_3bhk_l(b)_tower_02.jpg'),
          iso:    IK('isometric/unit02_3bhk_l(b)_tower_02.jpg'),
          points: '40,15 65,15 65,45 40,45',
        },
        {
          unitId: 'A-even-03',
          label:  '4BHK Type C',
          type:   '4 BHK',
          area:   '',
          top:    IK('topview/unit03_4bhk_(c)_tower_01.jpg'),
          iso:    IK('isometric/unit03_4bhk_(c)_tower_01.jpg'),
          points: '10,52 35,52 35,80 10,80',
        },
        {
          unitId: 'A-even-04',
          label:  '3BHK (L) Type D',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit06_3bhk_l(d)_tower_02.jpg'),
          iso:    IK('isometric/unit06_3bhk_l(d)_tower_02.jpg'),
          points: '40,52 65,52 65,80 40,80',
        },
        {
          unitId: 'A-even-05',
          label:  '3BHK (S) Type A',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit05_3bhk_s(a)_tower_02.jpg'),
          iso:    IK('isometric/unit05_3bhk_s(a)_tower_02.jpg'),
          points: '70,15 90,15 90,45 70,45',
        },
        {
          unitId: 'A-even-06',
          label:  '4BHK Type E',
          type:   '4 BHK',
          area:   '',
          top:    IK('topview/unit04_4bhk_(e)_tower_04.jpg'),
          iso:    IK('isometric/unit04_4bhk_(e)_tower_04.jpg'),
          points: '70,52 90,52 90,80 70,80',
        },
      ],
    },

    // ══════════════════════════════════════════════════════════
    // TOWER B
    // From Image 2: ALL units are BLUE → identical oddUnits & evenUnits
    //
    // Units (6 total):
    //   1. 3BHK(L) Type C — Podium   [row 7  in Image 1]  unit01_3bhk_l(C)_podium_tower_02
    //   2. 3BHK(L) Type B             [row 6  in Image 1]  unit02_3bhk_l(b)_tower_02
    //   3. 4BHK Type C                [row 18 in Image 1]  unit03_4bhk_(c)_tower_01
    //   4. 3BHK(L) Type D             [row 8  in Image 1]  unit06_3bhk_l(d)_tower_02
    //   5. 3BHK(S) Type A             [row 2  in Image 1]  unit05_3bhk_s(a)_tower_02
    //   6. 4BHK Type D                [row 20 in Image 1]  unit04_4bhk_(d)_tower_02
    // ══════════════════════════════════════════════════════════
    'tower-B': {
      label: 'Tower B',
      odd:  { image: IK('Cluster/Brigade_raptakose_Cluster_Floorplan/typical_odd_tower_02.jpg')  },
      even: { image: IK('Cluster/Brigade_raptakose_Cluster_Floorplan/typical_even_tower_02.jpg') },

      oddUnits: [
        {
          unitId: 'B-odd-01',
          label:  '3BHK (L) Type C — Podium',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit01_3bhk_l(C)_podium_tower_02.jpg'),
          iso:    IK('isometric/unit01_3bhk_l(C)_podium_tower_02.jpg'),
          points: '10,10 30,10 30,35 10,35',
        },
        {
          unitId: 'B-odd-02',
          label:  '3BHK (L) Type B',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit02_3bhk_l(b)_tower_02.jpg'),
          iso:    IK('isometric/unit02_3bhk_l(b)_tower_02.jpg'),
          points: '35,10 55,10 55,35 35,35',
        },
        {
          unitId: 'B-odd-03',
          label:  '4BHK Type C',
          type:   '4 BHK',
          area:   '',
          top:    IK('topview/unit03_4bhk_(c)_tower_01.jpg'),
          iso:    IK('isometric/unit03_4bhk_(c)_tower_01.jpg'),
          points: '60,10 80,10 80,35 60,35',
        },
        {
          unitId: 'B-odd-04',
          label:  '3BHK (L) Type D',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit06_3bhk_l(d)_tower_02.jpg'),
          iso:    IK('isometric/unit06_3bhk_l(d)_tower_02.jpg'),
          points: '10,42 30,42 30,68 10,68',
        },
        {
          unitId: 'B-odd-05',
          label:  '3BHK (S) Type A',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit05_3bhk_s(a)_tower_02.jpg'),
          iso:    IK('isometric/unit05_3bhk_s(a)_tower_02.jpg'),
          points: '35,42 55,42 55,68 35,68',
        },
        {
          unitId: 'B-odd-06',
          label:  '4BHK Type D',
          type:   '4 BHK',
          area:   '',
          top:    IK('topview/unit04_4bhk_(d)_tower_02.jpg'),
          iso:    IK('isometric/unit04_4bhk_(d)_tower_02.jpg'),
          points: '60,42 80,42 80,68 60,68',
        },
      ],

      // BLUE = all same as oddUnits
      evenUnits: [
        {
          unitId: 'B-even-01',
          label:  '3BHK (L) Type C — Podium',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit01_3bhk_l(C)_podium_tower_02.jpg'),
          iso:    IK('isometric/unit01_3bhk_l(C)_podium_tower_02.jpg'),
          points: '10,10 30,10 30,35 10,35',
        },
        {
          unitId: 'B-even-02',
          label:  '3BHK (L) Type B',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit02_3bhk_l(b)_tower_02.jpg'),
          iso:    IK('isometric/unit02_3bhk_l(b)_tower_02.jpg'),
          points: '35,10 55,10 55,35 35,35',
        },
        {
          unitId: 'B-even-03',
          label:  '4BHK Type C',
          type:   '4 BHK',
          area:   '',
          top:    IK('topview/unit03_4bhk_(c)_tower_01.jpg'),
          iso:    IK('isometric/unit03_4bhk_(c)_tower_01.jpg'),
          points: '60,10 80,10 80,35 60,35',
        },
        {
          unitId: 'B-even-04',
          label:  '3BHK (L) Type D',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit06_3bhk_l(d)_tower_02.jpg'),
          iso:    IK('isometric/unit06_3bhk_l(d)_tower_02.jpg'),
          points: '10,42 30,42 30,68 10,68',
        },
        {
          unitId: 'B-even-05',
          label:  '3BHK (S) Type A',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit05_3bhk_s(a)_tower_02.jpg'),
          iso:    IK('isometric/unit05_3bhk_s(a)_tower_02.jpg'),
          points: '35,42 55,42 55,68 35,68',
        },
        {
          unitId: 'B-even-06',
          label:  '4BHK Type D',
          type:   '4 BHK',
          area:   '',
          top:    IK('topview/unit04_4bhk_(d)_tower_02.jpg'),
          iso:    IK('isometric/unit04_4bhk_(d)_tower_02.jpg'),
          points: '60,42 80,42 80,68 60,68',
        },
      ],
    },

    // ══════════════════════════════════════════════════════════
    // TOWER C
    // From Image 2: MIXED — some units BLUE (both), some GREEN (one only)
    //
    // SHARED units (BLUE = in both ODD and EVEN, 9 units):
    //   3BHK(S) Type B             [row 4  in Image 1]  unit02_3bhk_s(b)_tower_03
    //   3BHK(S) Type B — Podium    [row 3  in Image 1]  unit02_3bhk_s(b)_podium_tower_03
    //   4BHK Type F — Podium       [row 23 in Image 1]  unit07_4bhk_(f)_podium_tower_03
    //   3BHK(L) Type G             [row 13 in Image 1]  unit06_3bhk_l(g)_tower_03
    //   3BHK(L) Type G — Podium    [row 12 in Image 1]  unit06_3bhk_l(g)_podium_tower_03
    //   3BHK(L) Type F             [row 11 in Image 1]  unit04_3bhk_l(f)_tower_03
    //   3BHK(L) Type F — Podium    [row 10 in Image 1]  unit04_3bhk_l(f)_podium_tower_03
    //   3BHK(L) Type E             [row 9  in Image 1]  unit05_3bhk_l(e)_tower_03
    //
    // ODD-ONLY unit (GREEN in ODD column):
    //   4BHK Type F — Odd Floors   [row 25 in Image 1]  unit07_4bhk_(f)_odd_tower_03
    //
    // EVEN-ONLY unit (GREEN in EVEN column):
    //   4BHK Type F — Even Floors  [row 24 in Image 1]  unit07_4bhk_(f)_even_tower_03
    //   4BHK Type G                [row 26 in Image 1]  unit01_4bhk_(g)_tower_03
    //     NOTE: 4BHK-G is green in EVEN column of Tower C in Image 2
    // ══════════════════════════════════════════════════════════
    'tower-C': {
      label: 'Tower C',
      odd:  { image: IK('Cluster/Brigade_raptakose_Cluster_Floorplan/typical_odd_tower_03.jpg')  },
      even: { image: IK('Cluster/Brigade_raptakose_Cluster_Floorplan/typical_even_tower_03.jpg') },

      oddUnits: [
        // ── BLUE (shared with even) ──
        {
          unitId: 'C-odd-01',
          label:  '3BHK (S) Type B',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit02_3bhk_s(b)_tower_03.jpg'),
          iso:    IK('isometric/unit02_3bhk_s(b)_tower_03.jpg'),
          points: '5,8 25,8 25,30 5,30',
        },
        {
          unitId: 'C-odd-02',
          label:  '3BHK (S) Type B — Podium',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit02_3bhk_s(b)_podium_tower_03.jpg'),
          iso:    IK('isometric/unit02_3bhk_s(b)_podium_tower_03.jpg'),
          points: '28,8 48,8 48,30 28,30',
        },
        {
          unitId: 'C-odd-03',
          label:  '4BHK Type F — Podium',
          type:   '4 BHK',
          area:   '',
          top:    IK('topview/unit07_4bhk_(f)_podium_tower_03.jpg'),
          iso:    IK('isometric/unit07_4bhk_(f)_podium_tower_03.jpg'),
          points: '51,8 71,8 71,30 51,30',
        },
        {
          unitId: 'C-odd-04',
          label:  '3BHK (L) Type G',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit06_3bhk_l(g)_tower_03.jpg'),
          iso:    IK('isometric/unit06_3bhk_l(g)_tower_03.jpg'),
          points: '74,8 94,8 94,30 74,30',
        },
        {
          unitId: 'C-odd-05',
          label:  '3BHK (L) Type G — Podium',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit06_3bhk_l(g)_podium_tower_03.jpg'),
          iso:    IK('isometric/unit06_3bhk_l(g)_podium_tower_03.jpg'),
          points: '5,34 25,34 25,56 5,56',
        },
        {
          unitId: 'C-odd-06',
          label:  '3BHK (L) Type F',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit04_3bhk_l(f)_tower_03.jpg'),
          iso:    IK('isometric/unit04_3bhk_l(f)_tower_03.jpg'),
          points: '28,34 48,34 48,56 28,56',
        },
        {
          unitId: 'C-odd-07',
          label:  '3BHK (L) Type F — Podium',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit04_3bhk_l(f)_podium_tower_03.jpg'),
          iso:    IK('isometric/unit04_3bhk_l(f)_podium_tower_03.jpg'),
          points: '51,34 71,34 71,56 51,56',
        },
        {
          unitId: 'C-odd-08',
          label:  '3BHK (L) Type E',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit05_3bhk_l(e)_tower_03.jpg'),
          iso:    IK('isometric/unit05_3bhk_l(e)_tower_03.jpg'),
          points: '74,34 94,34 94,56 74,56',
        },
        // ── GREEN — ODD only ──
        {
          unitId: 'C-odd-09',
          label:  '4BHK Type F — Odd Floors',
          type:   '4 BHK',
          area:   '',
          top:    IK('topview/unit07_4bhk_(f)_odd_tower_03.jpg'),
          iso:    IK('isometric/unit07_4bhk_(f)_odd_tower_03.jpg'),
          points: '5,60 25,60 25,82 5,82',
        },
      ],

      evenUnits: [
        // ── BLUE (shared with odd) ──
        {
          unitId: 'C-even-01',
          label:  '3BHK (S) Type B',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit02_3bhk_s(b)_tower_03.jpg'),
          iso:    IK('isometric/unit02_3bhk_s(b)_tower_03.jpg'),
          points: '5,8 25,8 25,30 5,30',
        },
        {
          unitId: 'C-even-02',
          label:  '3BHK (S) Type B — Podium',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit02_3bhk_s(b)_podium_tower_03.jpg'),
          iso:    IK('isometric/unit02_3bhk_s(b)_podium_tower_03.jpg'),
          points: '28,8 48,8 48,30 28,30',
        },
        {
          unitId: 'C-even-03',
          label:  '4BHK Type F — Podium',
          type:   '4 BHK',
          area:   '',
          top:    IK('topview/unit07_4bhk_(f)_podium_tower_03.jpg'),
          iso:    IK('isometric/unit07_4bhk_(f)_podium_tower_03.jpg'),
          points: '51,8 71,8 71,30 51,30',
        },
        {
          unitId: 'C-even-04',
          label:  '3BHK (L) Type G',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit06_3bhk_l(g)_tower_03.jpg'),
          iso:    IK('isometric/unit06_3bhk_l(g)_tower_03.jpg'),
          points: '74,8 94,8 94,30 74,30',
        },
        {
          unitId: 'C-even-05',
          label:  '3BHK (L) Type G — Podium',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit06_3bhk_l(g)_podium_tower_03.jpg'),
          iso:    IK('isometric/unit06_3bhk_l(g)_podium_tower_03.jpg'),
          points: '5,34 25,34 25,56 5,56',
        },
        {
          unitId: 'C-even-06',
          label:  '3BHK (L) Type F',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit04_3bhk_l(f)_tower_03.jpg'),
          iso:    IK('isometric/unit04_3bhk_l(f)_tower_03.jpg'),
          points: '28,34 48,34 48,56 28,56',
        },
        {
          unitId: 'C-even-07',
          label:  '3BHK (L) Type F — Podium',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit04_3bhk_l(f)_podium_tower_03.jpg'),
          iso:    IK('isometric/unit04_3bhk_l(f)_podium_tower_03.jpg'),
          points: '51,34 71,34 71,56 51,56',
        },
        {
          unitId: 'C-even-08',
          label:  '3BHK (L) Type E',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit05_3bhk_l(e)_tower_03.jpg'),
          iso:    IK('isometric/unit05_3bhk_l(e)_tower_03.jpg'),
          points: '74,34 94,34 94,56 74,56',
        },
        // ── GREEN — EVEN only ──
        {
          unitId: 'C-even-09',
          label:  '4BHK Type F — Even Floors',
          type:   '4 BHK',
          area:   '',
          top:    IK('topview/unit07_4bhk_(f)_even_tower_03.jpg'),
          iso:    IK('isometric/unit07_4bhk_(f)_even_tower_03.jpg'),
          points: '5,60 25,60 25,82 5,82',
        },
        {
          unitId: 'C-even-10',
          label:  '4BHK Type G',
          type:   '4 BHK',
          area:   '',
          top:    IK('topview/unit01_4bhk_(g)_tower_03.jpg'),
          iso:    IK('isometric/unit01_4bhk_(g)_tower_03.jpg'),
          points: '28,60 48,60 48,82 28,82',
        },
      ],
    },

    // ══════════════════════════════════════════════════════════
    // TOWER D
    // From Image 2: ALL units are BLUE → identical oddUnits & evenUnits
    //
    // Units (6 total):
    //   1. 4BHK Type A             [row 14 in Image 1]  unit01_4bhk_(a)_tower_04
    //   2. 3BHK(L) Type B          [row 6  in Image 1]  unit02_3bhk_l(b)_tower_02  (shared file)
    //   3. 3BHK(L) Type A          [row 5  in Image 1]  unit03_3bhk_l(a)_tower_04
    //   4. 4BHK Type B             [row 16 in Image 1]  unit06_4bhk_(b)_tower_04
    //   5. 3BHK(S) Type A          [row 2  in Image 1]  unit05_3bhk_s(a)_tower_02  (shared file)
    //   6. 4BHK Type E             [row 22 in Image 1]  unit04_4bhk_(e)_tower_04
    // ══════════════════════════════════════════════════════════
    'tower-D': {
      label: 'Tower D',
      odd:  { image: IK('Cluster/Brigade_raptakose_Cluster_Floorplan/typical_odd_tower_04.jpg')  },
      even: { image: IK('Cluster/Brigade_raptakose_Cluster_Floorplan/typical_even_tower_04.jpg') },

      oddUnits: [
        {
          unitId: 'D-odd-01',
          label:  '4BHK Type A',
          type:   '4 BHK',
          area:   '',
          top:    IK('topview/unit01_4bhk_(a)_tower_04.jpg'),
          iso:    IK('isometric/unit01_4bhk_(a)_tower_04.jpg'),
          points: '10,12 35,12 35,42 10,42',
        },
        {
          unitId: 'D-odd-02',
          label:  '3BHK (L) Type B',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit02_3bhk_l(b)_tower_02.jpg'),
          iso:    IK('isometric/unit02_3bhk_l(b)_tower_02.jpg'),
          points: '40,12 65,12 65,42 40,42',
        },
        {
          unitId: 'D-odd-03',
          label:  '3BHK (L) Type A',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit03_3bhk_l(a)_tower_04.jpg'),
          iso:    IK('isometric/unit03_3bhk_l(a)_tower_04.jpg'),
          points: '70,12 90,12 90,42 70,42',
        },
        {
          unitId: 'D-odd-04',
          label:  '4BHK Type B',
          type:   '4 BHK',
          area:   '',
          top:    IK('topview/unit06_4bhk_(b)_tower_04.jpg'),
          iso:    IK('isometric/unit06_4bhk_(b)_tower_04.jpg'),
          points: '10,48 35,48 35,78 10,78',
        },
        {
          unitId: 'D-odd-05',
          label:  '3BHK (S) Type A',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit05_3bhk_s(a)_tower_02.jpg'),
          iso:    IK('isometric/unit05_3bhk_s(a)_tower_02.jpg'),
          points: '40,48 65,48 65,78 40,78',
        },
        {
          unitId: 'D-odd-06',
          label:  '4BHK Type E',
          type:   '4 BHK',
          area:   '',
          top:    IK('topview/unit04_4bhk_(e)_tower_04.jpg'),
          iso:    IK('isometric/unit04_4bhk_(e)_tower_04.jpg'),
          points: '70,48 90,48 90,78 70,78',
        },
      ],

      // BLUE = all same as oddUnits
      evenUnits: [
        {
          unitId: 'D-even-01',
          label:  '4BHK Type A',
          type:   '4 BHK',
          area:   '',
          top:    IK('topview/unit01_4bhk_(a)_tower_04.jpg'),
          iso:    IK('isometric/unit01_4bhk_(a)_tower_04.jpg'),
          points: '10,12 35,12 35,42 10,42',
        },
        {
          unitId: 'D-even-02',
          label:  '3BHK (L) Type B',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit02_3bhk_l(b)_tower_02.jpg'),
          iso:    IK('isometric/unit02_3bhk_l(b)_tower_02.jpg'),
          points: '40,12 65,12 65,42 40,42',
        },
        {
          unitId: 'D-even-03',
          label:  '3BHK (L) Type A',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit03_3bhk_l(a)_tower_04.jpg'),
          iso:    IK('isometric/unit03_3bhk_l(a)_tower_04.jpg'),
          points: '70,12 90,12 90,42 70,42',
        },
        {
          unitId: 'D-even-04',
          label:  '4BHK Type B',
          type:   '4 BHK',
          area:   '',
          top:    IK('topview/unit06_4bhk_(b)_tower_04.jpg'),
          iso:    IK('isometric/unit06_4bhk_(b)_tower_04.jpg'),
          points: '10,48 35,48 35,78 10,78',
        },
        {
          unitId: 'D-even-05',
          label:  '3BHK (S) Type A',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit05_3bhk_s(a)_tower_02.jpg'),
          iso:    IK('isometric/unit05_3bhk_s(a)_tower_02.jpg'),
          points: '40,48 65,48 65,78 40,78',
        },
        {
          unitId: 'D-even-06',
          label:  '4BHK Type E',
          type:   '4 BHK',
          area:   '',
          top:    IK('topview/unit04_4bhk_(e)_tower_04.jpg'),
          iso:    IK('isometric/unit04_4bhk_(e)_tower_04.jpg'),
          points: '70,48 90,48 90,78 70,78',
        },
      ],
    },
  };

  // ─── LEVEL 2 — UNIT IMAGE  ───────────────────────────────────
  function unitImagePath(unitData, view) {
    return view === 'iso' ? unitData.iso : unitData.top;
  }

  // ─── STATE ───────────────────────────────────────────────────
  let level        = 0;
  let activeTower  = null;
  let activeFloor  = null;
  let activeUnit   = null;
  let floorParity  = 'odd';
  let viewMode     = 'top';
  let overlayOpen  = false;

  // ─── HELPERS ─────────────────────────────────────────────────
  function isOdd(n) { return n % 2 !== 0; }

  function getUnits(towerId, parity) {
    const t = TOWERS[towerId];
    if (!t) return [];
    return parity === 'odd' ? t.oddUnits : t.evenUnits;
  }

  function getClusterImage(towerId, parity) {
    const t = TOWERS[towerId];
    if (!t) return '';
    return parity === 'odd' ? t.odd.image : t.even.image;
  }

  // ─── INJECT HTML & STYLES ────────────────────────────────────
  function injectHTML() {
    if (document.getElementById('fp-overlay')) return;

    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap');

      #fp-overlay {
        position: fixed; inset: 0; bottom: 62px;
        z-index: 200; background: #0a0805;
        display: flex; flex-direction: column;
        opacity: 0; pointer-events: none;
        transform: translateY(6px);
        transition: opacity 0.38s ease, transform 0.38s cubic-bezier(0.22,1,0.36,1);
        font-family: 'Syne', sans-serif; overflow: hidden;
      }
      #fp-overlay.open { opacity: 1; pointer-events: all; transform: translateY(0); }

      #fp-topbar {
        flex-shrink: 0; height: 56px;
        display: flex; align-items: center;
        padding: 0 20px;
        border-bottom: 1px solid rgba(200,190,154,.18);
        background: rgba(10,8,5,.92);
        backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        gap: 14px; position: relative; z-index: 2;
      }
      #fp-topbar::after {
        content: ''; position: absolute; bottom: -1px; left: 50%;
        transform: translateX(-50%); width: 80px; height: 1px;
        background: linear-gradient(to right, transparent, rgba(200,190,154,.55), transparent);
      }

      #fp-back {
        display: flex; align-items: center; gap: 7px;
        cursor: pointer; opacity: 0; pointer-events: none;
        transition: opacity 0.22s ease; flex-shrink: 0;
      }
      #fp-back.visible { opacity: 1; pointer-events: all; }
      #fp-back-arrow {
        width: 28px; height: 28px; border-radius: 6px;
        border: 1px solid rgba(200,190,154,.35);
        background: rgba(200,190,154,.08);
        display: flex; align-items: center; justify-content: center;
        transition: background 0.2s, border-color 0.2s;
      }
      #fp-back:hover #fp-back-arrow { background: rgba(200,190,154,.18); border-color: rgba(200,190,154,.65); }
      #fp-back-arrow svg { width:13px; height:13px; stroke:rgba(200,190,154,.80); fill:none; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round; }
      #fp-back-label { font-size:10px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:rgba(200,190,154,.65); transition:color 0.2s; }
      #fp-back:hover #fp-back-label { color:rgba(200,190,154,.95); }

      .fp-pipe { width:1px; height:18px; background:rgba(200,190,154,.20); flex-shrink:0; opacity:0; transition:opacity 0.22s; }
      .fp-pipe.visible { opacity:1; }

      #fp-breadcrumb { flex:1; display:flex; align-items:center; gap:8px; min-width:0; overflow:hidden; }
      .fp-crumb { font-family:'Cormorant Garamond',serif; font-size:16px; font-weight:400; color:rgba(200,190,154,.55); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; cursor:pointer; transition:color 0.2s; }
      .fp-crumb.active { color:rgba(245,242,235,.90); cursor:default; }
      .fp-crumb:not(.active):hover { color:rgba(200,190,154,.85); }
      .fp-crumb-sep { font-family:'Cormorant Garamond',serif; font-size:14px; color:rgba(200,190,154,.28); flex-shrink:0; opacity:0; transition:opacity 0.22s; }
      .fp-crumb-sep.visible { opacity:1; }

      #fp-parity-toggle {
        flex-shrink:0; display:flex;
        border:1px solid rgba(200,190,154,.30); border-radius:7px; overflow:hidden;
        opacity:0; pointer-events:none; transition:opacity 0.28s;
      }
      #fp-parity-toggle.visible { opacity:1; pointer-events:all; }
      .fp-parity-btn {
        padding:6px 16px; font-family:'Syne',sans-serif; font-size:9.5px; font-weight:700;
        letter-spacing:.13em; text-transform:uppercase; color:rgba(200,190,154,.55);
        cursor:pointer; background:transparent; border:none; outline:none;
        border-right:1px solid rgba(200,190,154,.20); transition:background 0.2s, color 0.2s; white-space:nowrap;
      }
      .fp-parity-btn:last-child { border-right:none; }
      .fp-parity-btn.active { background:rgba(200,190,154,.14); color:rgba(245,242,235,.90); }
      .fp-parity-btn:not(.active):hover { background:rgba(200,190,154,.07); color:rgba(200,190,154,.80); }

      #fp-view-toggle {
        flex-shrink:0; display:flex;
        border:1px solid rgba(200,190,154,.30); border-radius:7px; overflow:hidden;
        opacity:0; pointer-events:none; transition:opacity 0.28s;
      }
      #fp-view-toggle.visible { opacity:1; pointer-events:all; }
      .fp-toggle-btn {
        padding:6px 14px; font-family:'Syne',sans-serif; font-size:9.5px; font-weight:700;
        letter-spacing:.13em; text-transform:uppercase; color:rgba(200,190,154,.55);
        cursor:pointer; background:transparent; border:none; outline:none;
        border-right:1px solid rgba(200,190,154,.20); transition:background 0.2s, color 0.2s; white-space:nowrap;
      }
      .fp-toggle-btn:last-child { border-right:none; }
      .fp-toggle-btn.active { background:rgba(200,190,154,.14); color:rgba(245,242,235,.90); }
      .fp-toggle-btn:not(.active):hover { background:rgba(200,190,154,.07); color:rgba(200,190,154,.80); }

      #fp-close {
        flex-shrink:0; width:30px; height:30px; border-radius:7px;
        border:1px solid rgba(200,190,154,.25); background:rgba(200,190,154,.06);
        display:flex; align-items:center; justify-content:center; cursor:pointer;
        transition:background 0.2s, border-color 0.2s; margin-left:6px;
      }
      #fp-close:hover { background:rgba(200,190,154,.16); border-color:rgba(200,190,154,.55); }
      #fp-close svg { width:12px; height:12px; stroke:rgba(200,190,154,.70); fill:none; stroke-width:2; stroke-linecap:round; }

      #fp-content { flex:1; position:relative; overflow:hidden; }

      .fp-panel { position:absolute; inset:0; opacity:0; pointer-events:none; transition:opacity 0.30s ease, transform 0.30s cubic-bezier(0.22,1,0.36,1); }
      .fp-panel.enter  { opacity:1; pointer-events:all; transform:translateX(0) !important; }
      .fp-panel.exit-l { opacity:0; transform:translateX(-32px); }
      .fp-panel.exit-r { opacity:0; transform:translateX( 32px); }

      #fp-panel-sitemap { display:flex; align-items:center; justify-content:center; background:#0a0805; transform:translateX(0); }
      #fp-sitemap-wrap { position:relative; display:inline-block; max-width:100%; max-height:100%; }
      #fp-sitemap-img { display:block; max-width:100%; max-height:calc(100vh - 56px - 62px); object-fit:contain; border:1px solid rgba(200,190,154,.12); }

      .fp-tower-tile {
        position:absolute; border:1px solid rgba(200,190,154,.40); background:rgba(200,190,154,.06);
        backdrop-filter:blur(2px); border-radius:4px; display:flex; flex-direction:column;
        align-items:center; justify-content:center; cursor:pointer;
        transition:background 0.22s, border-color 0.22s, transform 0.22s;
        gap:4px; padding:8px; box-sizing:border-box;
      }
      .fp-tower-tile:hover { background:rgba(200,190,154,.18); border-color:rgba(200,190,154,.75); transform:scale(1.04); }
      .fp-tower-tile-label { font-family:'Cormorant Garamond',serif; font-size:13px; font-weight:500; color:rgba(245,242,235,.85); white-space:nowrap; text-align:center; }
      .fp-tower-tile-sub { font-family:'Syne',sans-serif; font-size:7.5px; font-weight:700; letter-spacing:.14em; text-transform:uppercase; color:rgba(200,190,154,.55); white-space:nowrap; }
      #fp-sitemap-hint { position:absolute; bottom:18px; left:50%; transform:translateX(-50%); font-family:'Cormorant Garamond',serif; font-size:12px; font-style:italic; color:rgba(200,190,154,.38); pointer-events:none; white-space:nowrap; }

      #fp-panel-cluster { display:flex; align-items:center; justify-content:center; background:#0a0805; transform:translateX(32px); }
      #fp-cluster-wrap { position:relative; display:inline-block; max-width:100%; max-height:100%; }
      #fp-cluster-img { display:block; max-width:100%; max-height:calc(100vh - 56px - 62px); object-fit:contain; border:1px solid rgba(200,190,154,.12); transition:opacity 0.28s; }
      #fp-cluster-img.fading { opacity:0; }

      #fp-zone-svg { position:absolute; top:0; left:0; width:100%; height:100%; pointer-events:none; overflow:visible; }
      .fp-zone { fill:rgba(200,190,154,.12); stroke:rgba(200,190,154,.55); stroke-width:1.5; cursor:pointer; pointer-events:all; transition:fill 0.20s, stroke 0.20s; }
      .fp-zone:hover { fill:rgba(200,190,154,.30); stroke:rgba(200,190,154,.95); }
      .fp-zone.selected { fill:rgba(200,190,154,.22); stroke:#e8dfc0; stroke-width:2; }

      #fp-zone-tip { position:absolute; padding:6px 12px; background:rgba(10,8,5,.88); border:1px solid rgba(200,190,154,.40); border-radius:4px; backdrop-filter:blur(8px); pointer-events:none; opacity:0; transition:opacity 0.18s; z-index:10; white-space:nowrap; }
      #fp-zone-tip.visible { opacity:1; }
      #fp-zone-tip-name { font-family:'Cormorant Garamond',serif; font-size:14px; font-weight:500; color:rgba(245,242,235,.90); display:block; }
      #fp-zone-tip-type { font-family:'Syne',sans-serif; font-size:8.5px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:rgba(200,190,154,.60); display:block; margin-top:2px; }

      #fp-panel-unit { display:flex; flex-direction:column; transform:translateX(32px); }
      #fp-plan-area { flex:1; display:flex; align-items:center; justify-content:center; position:relative; overflow:hidden; padding:24px; box-sizing:border-box; }
      #fp-plan-img { max-width:100%; max-height:100%; object-fit:contain; border:1px solid rgba(200,190,154,.15); border-radius:3px; box-shadow:0 12px 60px rgba(0,0,0,.7); opacity:1; transition:opacity 0.28s; background:rgba(200,190,154,.03); }
      #fp-plan-img.fading { opacity:0; }

      #fp-unit-info { position:absolute; bottom:28px; left:32px; display:flex; flex-direction:column; gap:4px; opacity:0; transform:translateY(6px); transition:opacity 0.30s ease 0.12s, transform 0.30s ease 0.12s; pointer-events:none; }
      #fp-unit-info.visible { opacity:1; transform:translateY(0); }
      #fp-unit-info-name { font-family:'Cormorant Garamond',serif; font-size:22px; font-weight:300; font-style:italic; color:rgba(245,242,235,.75); line-height:1; }
      #fp-unit-info-type { font-family:'Syne',sans-serif; font-size:9px; font-weight:600; letter-spacing:.16em; text-transform:uppercase; color:rgba(200,190,154,.55); }
      #fp-unit-info-area { font-family:'Syne',sans-serif; font-size:9px; font-weight:400; letter-spacing:.10em; color:rgba(200,190,154,.38); }

      #fp-spinner { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(10,8,5,.50); opacity:0; pointer-events:none; transition:opacity 0.22s; z-index:5; }
      #fp-spinner.visible { opacity:1; }
      #fp-spinner-ring { width:34px; height:34px; border:2px solid rgba(200,190,154,.20); border-top-color:rgba(200,190,154,.85); border-radius:50%; animation:fpSpin 0.72s linear infinite; }
      @keyframes fpSpin { to { transform:rotate(360deg); } }
    `;
    document.head.appendChild(style);

    document.body.insertAdjacentHTML('beforeend', `
      <div id="fp-overlay">
        <div id="fp-topbar">

          <div id="fp-back">
            <div id="fp-back-arrow">
              <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
            </div>
            <span id="fp-back-label">Back</span>
          </div>

          <div class="fp-pipe" id="fp-pipe1"></div>

          <div id="fp-breadcrumb">
            <span class="fp-crumb active" id="fp-crumb-0">Site Plan</span>
            <span class="fp-crumb-sep"    id="fp-sep-1">›</span>
            <span class="fp-crumb"        id="fp-crumb-1"></span>
            <span class="fp-crumb-sep"    id="fp-sep-2">›</span>
            <span class="fp-crumb"        id="fp-crumb-2"></span>
          </div>

          <div id="fp-parity-toggle">
            <button class="fp-parity-btn active" data-parity="odd">Odd Floors</button>
            <button class="fp-parity-btn"        data-parity="even">Even Floors</button>
          </div>

          <div id="fp-view-toggle">
            <button class="fp-toggle-btn active" data-view="top">Floor Plan</button>
            <button class="fp-toggle-btn"        data-view="iso">Isometric</button>
          </div>

          <div id="fp-close">
            <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </div>

        </div>

        <div id="fp-content">
          <div id="fp-spinner"><div id="fp-spinner-ring"></div></div>

          <div id="fp-panel-sitemap" class="fp-panel">
            <div id="fp-sitemap-wrap">
              <img id="fp-sitemap-img" src="${SITEMAP.image}" alt="Site Plan" />
              <div id="fp-sitemap-hint">Select a tower to explore floor plans</div>
            </div>
          </div>

          <div id="fp-panel-cluster" class="fp-panel">
            <div id="fp-cluster-wrap">
              <img id="fp-cluster-img" src="" alt="Cluster Plan" />
              <svg id="fp-zone-svg" viewBox="0 0 100 100" preserveAspectRatio="none"></svg>
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
            </div>
          </div>

        </div>
      </div>
    `);
  }

  // ─── PANEL TRANSITIONS ───────────────────────────────────────
  function showPanel(id, direction) {
    ['fp-panel-sitemap','fp-panel-cluster','fp-panel-unit'].forEach(pid => {
      const el = document.getElementById(pid);
      if (!el) return;
      el.classList.remove('enter','exit-l','exit-r');
      el.classList.add(pid === id ? 'enter' : direction === 'forward' ? 'exit-l' : 'exit-r');
    });
  }

  // ─── SITEMAP TILES ───────────────────────────────────────────
  function buildSitemapTiles() {
    const wrap = document.getElementById('fp-sitemap-wrap');
    wrap.querySelectorAll('.fp-tower-tile').forEach(t => t.remove());
    const img = document.getElementById('fp-sitemap-img');

    function placeTiles() {
      const iw = img.offsetWidth, ih = img.offsetHeight;
      SITEMAP.towerTiles.forEach(tile => {
        const el = document.createElement('div');
        el.className = 'fp-tower-tile';
        el.style.left   = (tile.x / 100 * iw) + 'px';
        el.style.top    = (tile.y / 100 * ih) + 'px';
        el.style.width  = (tile.w / 100 * iw) + 'px';
        el.style.height = (tile.h / 100 * ih) + 'px';
        el.innerHTML = `<span class="fp-tower-tile-label">${tile.label}</span><span class="fp-tower-tile-sub">Explore</span>`;
        el.addEventListener('click', () => drillToCluster(tile.id));
        wrap.appendChild(el);
      });
    }

    if (img.complete && img.naturalWidth > 0) placeTiles();
    else img.addEventListener('load', placeTiles, { once: true });
    new ResizeObserver(placeTiles).observe(img);
  }

  // ─── SWAP PARITY ─────────────────────────────────────────────
  function swapParity(newParity) {
    if (!activeTower || newParity === floorParity) return;
    floorParity = newParity;
    document.querySelectorAll('.fp-parity-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.parity === floorParity);
    });
    const img = document.getElementById('fp-cluster-img');
    img.classList.add('fading');
    setTimeout(() => {
      img.src = getClusterImage(activeTower, floorParity);
      img.onload  = () => { img.classList.remove('fading'); buildZones(activeTower, floorParity); };
      img.onerror = () => { img.classList.remove('fading'); buildZones(activeTower, floorParity); };
    }, 220);
  }

  // ─── DRILL TO CLUSTER ────────────────────────────────────────
  function drillToCluster(towerId) {
    activeTower = towerId;
    document.querySelectorAll('.fp-parity-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.parity === floorParity);
    });
    const img = document.getElementById('fp-cluster-img');
    img.classList.add('fading');
    setTimeout(() => {
      img.src = getClusterImage(towerId, floorParity);
      img.onload  = () => { img.classList.remove('fading'); buildZones(towerId, floorParity); };
      img.onerror = () => { img.classList.remove('fading'); buildZones(towerId, floorParity); };
    }, 220);
    level = 1;
    showPanel('fp-panel-cluster', 'forward');
    updateTopbar();
  }

  // ─── BUILD ZONES ─────────────────────────────────────────────
  function buildZones(towerId, parity) {
    const svg = document.getElementById('fp-zone-svg');
    svg.innerHTML = '';
    getUnits(towerId, parity).forEach(u => {
      const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      poly.setAttribute('class', 'fp-zone');
      poly.setAttribute('points', u.points);
      poly.dataset.unitId = u.unitId;
      poly.addEventListener('mouseenter', (e) => showZoneTip(u, e));
      poly.addEventListener('mousemove',  (e) => moveZoneTip(e));
      poly.addEventListener('mouseleave', hideZoneTip);
      poly.addEventListener('click', () => drillToUnit(u));
      svg.appendChild(poly);
    });
  }

  // ─── ZONE TOOLTIP ────────────────────────────────────────────
  function showZoneTip(u, e) {
    document.getElementById('fp-zone-tip-name').textContent = u.label;
    document.getElementById('fp-zone-tip-type').textContent = `${u.type}${u.area ? '  ·  ' + u.area : ''}`;
    document.getElementById('fp-zone-tip').classList.add('visible');
    moveZoneTip(e);
  }
  function moveZoneTip(e) {
    const rect = document.getElementById('fp-cluster-wrap').getBoundingClientRect();
    const tip  = document.getElementById('fp-zone-tip');
    tip.style.left = (e.clientX - rect.left + 14) + 'px';
    tip.style.top  = (e.clientY - rect.top  - 14) + 'px';
  }
  function hideZoneTip() {
    document.getElementById('fp-zone-tip').classList.remove('visible');
  }

  // ─── DRILL TO UNIT ───────────────────────────────────────────
  function drillToUnit(unitData) {
    activeUnit = unitData;
    viewMode   = 'top';
    document.querySelectorAll('.fp-toggle-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.view === 'top');
    });
    document.getElementById('fp-unit-info-name').textContent = unitData.label;
    document.getElementById('fp-unit-info-type').textContent = unitData.type;
    document.getElementById('fp-unit-info-area').textContent = unitData.area || '';
    document.getElementById('fp-unit-info').classList.add('visible');
    level = 2;
    showPanel('fp-panel-unit', 'forward');
    updateTopbar();
    loadUnitImage();
  }

  // ─── LOAD UNIT IMAGE ─────────────────────────────────────────
  function loadUnitImage() {
    if (!activeUnit) return;
    const img     = document.getElementById('fp-plan-img');
    const spinner = document.getElementById('fp-spinner');
    const src     = unitImagePath(activeUnit, viewMode);

    if (!src) {
      img.removeAttribute('src');
      spinner.classList.remove('visible');
      return;
    }

    img.classList.add('fading');
    spinner.classList.add('visible');
    setTimeout(() => {
      img.src = src;
      img.onload  = () => { img.classList.remove('fading'); spinner.classList.remove('visible'); };
      img.onerror = () => { img.classList.remove('fading'); spinner.classList.remove('visible'); };
    }, 280);
  }

  // ─── BACK NAV ────────────────────────────────────────────────
  function goBack() {
    if (level === 2) {
      level = 1; activeUnit = null;
      document.getElementById('fp-unit-info').classList.remove('visible');
      showPanel('fp-panel-cluster', 'back');
      updateTopbar();
    } else if (level === 1) {
      level = 0; activeTower = null;
      showPanel('fp-panel-sitemap', 'back');
      updateTopbar();
    }
  }

  // ─── UPDATE TOPBAR ───────────────────────────────────────────
  function updateTopbar() {
    const back         = document.getElementById('fp-back');
    const pipe1        = document.getElementById('fp-pipe1');
    const crumb0       = document.getElementById('fp-crumb-0');
    const sep1         = document.getElementById('fp-sep-1');
    const crumb1       = document.getElementById('fp-crumb-1');
    const sep2         = document.getElementById('fp-sep-2');
    const crumb2       = document.getElementById('fp-crumb-2');
    const parityToggle = document.getElementById('fp-parity-toggle');
    const viewToggle   = document.getElementById('fp-view-toggle');

    [crumb0,crumb1,crumb2].forEach(c => c.classList.remove('active'));
    [sep1,sep2].forEach(s => s.classList.remove('visible'));
    crumb1.textContent = '';
    crumb2.textContent = '';

    if (level === 0) {
      back.classList.remove('visible');
      pipe1.classList.remove('visible');
      crumb0.classList.add('active');
      parityToggle.classList.remove('visible');
      viewToggle.classList.remove('visible');

    } else if (level === 1) {
      back.classList.add('visible');
      pipe1.classList.add('visible');
      document.getElementById('fp-back-label').textContent = 'Site Plan';
      crumb0.classList.remove('active');
      sep1.classList.add('visible');
      crumb1.textContent = TOWERS[activeTower]?.label || '';
      crumb1.classList.add('active');
      parityToggle.classList.add('visible');
      viewToggle.classList.remove('visible');

    } else if (level === 2) {
      back.classList.add('visible');
      pipe1.classList.add('visible');
      document.getElementById('fp-back-label').textContent = TOWERS[activeTower]?.label || 'Cluster';
      sep1.classList.add('visible');
      crumb1.textContent = TOWERS[activeTower]?.label || '';
      sep2.classList.add('visible');
      crumb2.textContent = activeUnit?.label || '';
      crumb2.classList.add('active');
      parityToggle.classList.remove('visible');
      viewToggle.classList.add('visible');
    }
  }

  // ─── OPEN / CLOSE ────────────────────────────────────────────
  function open(floorNum) {
    if (overlayOpen) return;
    overlayOpen = true;
    level = 0; activeTower = null; activeUnit = null; viewMode = 'top';
    floorParity = (floorNum !== undefined) ? (isOdd(floorNum) ? 'odd' : 'even') : 'odd';
    document.querySelectorAll('.fp-parity-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.parity === floorParity);
    });
    buildSitemapTiles();
    showPanel('fp-panel-sitemap', 'forward');
    updateTopbar();
    document.getElementById('fp-overlay').classList.add('open');
  }

  function close() {
    if (!overlayOpen) return;
    overlayOpen = false;
    document.getElementById('fp-overlay').classList.remove('open');
    setTimeout(() => { level = 0; activeTower = null; activeUnit = null; viewMode = 'top'; }, 420);
  }

  // ─── BIND EVENTS ─────────────────────────────────────────────
  function bindEvents() {
    document.getElementById('fp-close').addEventListener('click', close);
    document.getElementById('fp-back').addEventListener('click', goBack);

    document.getElementById('fp-crumb-0').addEventListener('click', () => {
      if (level > 0) { level = 0; showPanel('fp-panel-sitemap','back'); updateTopbar(); }
    });
    document.getElementById('fp-crumb-1').addEventListener('click', () => {
      if (level === 2) goBack();
    });

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
        activeTower = towerId; drillToUnit(unitData);
      }
    },
    TOWERS,
    SITEMAP,
    IK, // expose so external code can also build IK URLs
  };

})();