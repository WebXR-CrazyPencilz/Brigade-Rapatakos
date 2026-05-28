// floorplan.js — 3-Level Floor Plan Viewer
// Level 0 → Sitemap (default) — 4 tower tiles overlaid
// Level 1 → Tower Cluster image — ODD/EVEN toggle + polygon unit zones
// Level 2 → Unit plan — Top View / Isometric toggle
//
// ─── SPREADSHEET COLOR KEY ────────────────────────────────────────────────────
// BLUE  = unit appears in BOTH odd and even columns → listed in oddUnits AND evenUnits
// GREEN = unit appears in only ONE column (odd or even) → listed in that side only
// WHITE = removed (not applicable for that parity)
//
// Tower A
//   ODD  (3 units — blue only): 4BHK-C, 3BHK(L)-D, 3BHK(S)-A
//   EVEN (5 units — blue only): 3BHK(L)-C(Podium), 3BHK(L)-B, 3BHK(L)-D, 3BHK(S)-A, 4BHK-E
//
// Tower B
//   ODD  (3 units — blue only): 4BHK-C, 3BHK(L)-D, 3BHK(S)-A
//   EVEN (5 units — blue only): 3BHK(L)-C(Podium), 3BHK(L)-B, 3BHK(L)-D, 3BHK(S)-A, 4BHK-D
//
// Tower C
//   ODD  (2 units): 3BHK(L)-G (blue), 3BHK(L)-G Podium (green=odd-only)
//   EVEN (6 units): 3BHK-G (green=even-only), 3BHK(S)-B (blue), 3BHK(S)-B Podium (blue),
//                   4BHK-F (blue), 3BHK(L)-G (blue), 3BHK(L)-E (blue)
//
// Tower D
//   ODD  (2 units — blue): 3BHK(L)-A, 3BHK(S)-A
//   EVEN (6 units — blue): 4BHK-A, 3BHK(L)-B, 3BHK(L)-A, 4BHK-B, 3BHK(S)-A, 4BHK-E
// ─────────────────────────────────────────────────────────────────────────────

window.FloorplanModule = (function () {

  const IK_BASE = 'https://ik.imagekit.io/pwzaetheh';

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

  const TOWERS = {

    // ══════════════════════════════════════════════════════════
    // TOWER A
    // ODD  (3 blue): 4BHK-C, 3BHK(L)-D, 3BHK(S)-A
    // EVEN (5 blue): 3BHK(L)-C Podium, 3BHK(L)-B, 3BHK(L)-D, 3BHK(S)-A, 4BHK-E
    // ══════════════════════════════════════════════════════════
    'tower-A': {
      label: 'Tower A',
      odd:  { image: IK('Cluster/Brigade_raptakose_Cluster_Floorplan/typical_odd_tower_01.jpg')  },
      even: { image: IK('Cluster/Brigade_raptakose_Cluster_Floorplan/typical_even_tower_01.jpg') },

      oddUnits: [
        {
          unitId: 'A-odd-01',
          label:  '4BHK Type C',
          type:   '4 BHK',
          area:   '',
          top:    IK('topview/unit03_4bhk_(c)_tower_01.jpg'),
          iso:    IK('isometric/unit03_4bhk_(c)_tower_01.jpg'),
          points: '10,15 45,15 45,48 10,48',
        },
        {
          unitId: 'A-odd-02',
          label:  '3BHK (L) Type D',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit06_3bhk_l(d)_tower_02.jpg'),
          iso:    IK('isometric/unit06_3bhk_l(d)_tower_02.jpg'),
          points: '50,15 85,15 85,48 50,48',
        },
        {
          unitId: 'A-odd-03',
          label:  '3BHK (S) Type A',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit05_3bhk_s(a)_tower_02.jpg'),
          iso:    IK('isometric/unit05_3bhk_s(a)_tower_02.jpg'),
          points: '10,52 85,52 85,85 10,85',
        },
      ],

      evenUnits: [
        {
          unitId: 'A-even-01',
          label:  '3BHK (L) Type C — Podium',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit01_3bhk_l(C)_podium_tower_02.jpg'),
          iso:    IK('isometric/unit01_3bhk_l(C)_podium_tower_02.jpg'),
          points: '10,10 35,10 35,38 10,38',
        },
        {
          unitId: 'A-even-02',
          label:  '3BHK (L) Type B',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit02_3bhk_l(b)_tower_02.jpg'),
          iso:    IK('isometric/unit02_3bhk_l(b)_tower_02.jpg'),
          points: '40,10 65,10 65,38 40,38',
        },
        {
          unitId: 'A-even-03',
          label:  '3BHK (L) Type D',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit06_3bhk_l(d)_tower_02.jpg'),
          iso:    IK('isometric/unit06_3bhk_l(d)_tower_02.jpg'),
          points: '70,10 90,10 90,38 70,38',
        },
        {
          unitId: 'A-even-04',
          label:  '3BHK (S) Type A',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit05_3bhk_s(a)_tower_02.jpg'),
          iso:    IK('isometric/unit05_3bhk_s(a)_tower_02.jpg'),
          points: '10,43 45,43 45,75 10,75',
        },
        {
          unitId: 'A-even-05',
          label:  '4BHK Type E',
          type:   '4 BHK',
          area:   '',
          top:    IK('topview/unit04_4bhk_(e)_tower_04.jpg'),
          iso:    IK('isometric/unit04_4bhk_(e)_tower_04.jpg'),
          points: '50,43 90,43 90,75 50,75',
        },
      ],
    },

    // ══════════════════════════════════════════════════════════
    // TOWER B
    // ODD  (3 blue): 4BHK-C, 3BHK(L)-D, 3BHK(S)-A
    // EVEN (5 blue): 3BHK(L)-C Podium, 3BHK(L)-B, 3BHK(L)-D, 3BHK(S)-A, 4BHK-D
    // ══════════════════════════════════════════════════════════
    'tower-B': {
      label: 'Tower B',
      odd:  { image: IK('Cluster/Brigade_raptakose_Cluster_Floorplan/typical_odd_tower_02.jpg')  },
      even: { image: IK('Cluster/Brigade_raptakose_Cluster_Floorplan/typical_even_tower_02.jpg') },

      oddUnits: [
        {
          unitId: 'B-odd-01',
          label:  '4BHK Type C',
          type:   '4 BHK',
          area:   '',
          top:    IK('topview/unit03_4bhk_(c)_tower_01.jpg'),
          iso:    IK('isometric/unit03_4bhk_(c)_tower_01.jpg'),
          points: '10,15 45,15 45,48 10,48',
        },
        {
          unitId: 'B-odd-02',
          label:  '3BHK (L) Type D',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit06_3bhk_l(d)_tower_02.jpg'),
          iso:    IK('isometric/unit06_3bhk_l(d)_tower_02.jpg'),
          points: '50,15 85,15 85,48 50,48',
        },
        {
          unitId: 'B-odd-03',
          label:  '3BHK (S) Type A',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit05_3bhk_s(a)_tower_02.jpg'),
          iso:    IK('isometric/unit05_3bhk_s(a)_tower_02.jpg'),
          points: '10,52 85,52 85,85 10,85',
        },
      ],

      evenUnits: [
        {
          unitId: 'B-even-01',
          label:  '3BHK (L) Type C — Podium',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit01_3bhk_l(C)_podium_tower_02.jpg'),
          iso:    IK('isometric/unit01_3bhk_l(C)_podium_tower_02.jpg'),
          points: '10,10 35,10 35,38 10,38',
        },
        {
          unitId: 'B-even-02',
          label:  '3BHK (L) Type B',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit02_3bhk_l(b)_tower_02.jpg'),
          iso:    IK('isometric/unit02_3bhk_l(b)_tower_02.jpg'),
          points: '40,10 65,10 65,38 40,38',
        },
        {
          unitId: 'B-even-03',
          label:  '3BHK (L) Type D',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit06_3bhk_l(d)_tower_02.jpg'),
          iso:    IK('isometric/unit06_3bhk_l(d)_tower_02.jpg'),
          points: '70,10 90,10 90,38 70,38',
        },
        {
          unitId: 'B-even-04',
          label:  '3BHK (S) Type A',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit05_3bhk_s(a)_tower_02.jpg'),
          iso:    IK('isometric/unit05_3bhk_s(a)_tower_02.jpg'),
          points: '10,43 45,43 45,75 10,75',
        },
        {
          unitId: 'B-even-05',
          label:  '4BHK Type D',
          type:   '4 BHK',
          area:   '',
          top:    IK('topview/unit04_4bhk_(d)_tower_02.jpg'),
          iso:    IK('isometric/unit04_4bhk_(d)_tower_02.jpg'),
          points: '50,43 90,43 90,75 50,75',
        },
      ],
    },

    // ══════════════════════════════════════════════════════════
    // TOWER C
    // ODD  (2 units): 3BHK(L)-G [blue], 3BHK(L)-G Podium [green=odd-only]
    // EVEN (6 units): 4BHK-G [green=even-only], 3BHK(S)-B [blue],
    //                 3BHK(S)-B Podium [blue], 4BHK-F [blue],
    //                 3BHK(L)-G [blue], 3BHK(L)-E [blue]
    // ══════════════════════════════════════════════════════════
    'tower-C': {
      label: 'Tower C',
      odd:  { image: IK('Cluster/Brigade_raptakose_Cluster_Floorplan/typical_odd_tower_03.jpg')  },
      even: { image: IK('Cluster/Brigade_raptakose_Cluster_Floorplan/typical_even_tower_03.jpg') },

      oddUnits: [
        // BLUE — appears in both odd and even
        {
          unitId: 'C-odd-01',
          label:  '3BHK (L) Type G',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit06_3bhk_l(g)_tower_03.jpg'),
          iso:    IK('isometric/unit06_3bhk_l(g)_tower_03.jpg'),
          points: '10,15 55,15 55,52 10,52',
        },
        // GREEN — odd only
        {
          unitId: 'C-odd-02',
          label:  '3BHK (L) Type G — Podium',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit06_3bhk_l(g)_podium_tower_03.jpg'),
          iso:    IK('isometric/unit06_3bhk_l(g)_podium_tower_03.jpg'),
          points: '60,15 90,15 90,52 60,52',
        },
      ],

      evenUnits: [
        // GREEN — even only
        {
          unitId: 'C-even-01',
          label:  '4BHK Type G',
          type:   '4 BHK',
          area:   '',
          top:    IK('topview/unit01_4bhk_(g)_tower_03.jpg'),
          iso:    IK('isometric/unit01_4bhk_(g)_tower_03.jpg'),
          points: '5,8 30,8 30,35 5,35',
        },
        // BLUE — appears in both odd and even
        {
          unitId: 'C-even-02',
          label:  '3BHK (S) Type B',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit02_3bhk_s(b)_tower_03.jpg'),
          iso:    IK('isometric/unit02_3bhk_s(b)_tower_03.jpg'),
          points: '35,8 60,8 60,35 35,35',
        },
        {
          unitId: 'C-even-03',
          label:  '3BHK (S) Type B — Podium',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit02_3bhk_s(b)_podium_tower_03.jpg'),
          iso:    IK('isometric/unit02_3bhk_s(b)_podium_tower_03.jpg'),
          points: '65,8 90,8 90,35 65,35',
        },
        {
          unitId: 'C-even-04',
          label:  '4BHK Type F',
          type:   '4 BHK',
          area:   '',
          top:    IK('topview/unit07_4bhk_(f)_tower_03.jpg'),
          iso:    IK('isometric/unit07_4bhk_(f)_tower_03.jpg'),
          points: '5,40 30,40 30,67 5,67',
        },
        {
          unitId: 'C-even-05',
          label:  '3BHK (L) Type G',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit06_3bhk_l(g)_tower_03.jpg'),
          iso:    IK('isometric/unit06_3bhk_l(g)_tower_03.jpg'),
          points: '35,40 60,40 60,67 35,67',
        },
        {
          unitId: 'C-even-06',
          label:  '3BHK (L) Type E',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit05_3bhk_l(e)_tower_03.jpg'),
          iso:    IK('isometric/unit05_3bhk_l(e)_tower_03.jpg'),
          points: '65,40 90,40 90,67 65,67',
        },
      ],
    },

    // ══════════════════════════════════════════════════════════
    // TOWER D
    // ODD  (2 blue): 3BHK(L)-A, 3BHK(S)-A
    // EVEN (6 blue): 4BHK-A, 3BHK(L)-B, 3BHK(L)-A, 4BHK-B, 3BHK(S)-A, 4BHK-E
    // ══════════════════════════════════════════════════════════
    'tower-D': {
      label: 'Tower D',
      odd:  { image: IK('Cluster/Brigade_raptakose_Cluster_Floorplan/typical_odd_tower_04.jpg')  },
      even: { image: IK('Cluster/Brigade_raptakose_Cluster_Floorplan/typical_even_tower_04.jpg') },

      oddUnits: [
        {
          unitId: 'D-odd-01',
          label:  '3BHK (L) Type A',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit03_3bhk_l(a)_tower_04.jpg'),
          iso:    IK('isometric/unit03_3bhk_l(a)_tower_04.jpg'),
          points: '10,15 55,15 55,52 10,52',
        },
        {
          unitId: 'D-odd-02',
          label:  '3BHK (S) Type A',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit05_3bhk_s(a)_tower_02.jpg'),
          iso:    IK('isometric/unit05_3bhk_s(a)_tower_02.jpg'),
          points: '60,15 90,15 90,52 60,52',
        },
      ],

      evenUnits: [
        {
          unitId: 'D-even-01',
          label:  '4BHK Type A',
          type:   '4 BHK',
          area:   '',
          top:    IK('topview/unit01_4bhk_(a)_tower_04.jpg'),
          iso:    IK('isometric/unit01_4bhk_(a)_tower_04.jpg'),
          points: '10,10 35,10 35,38 10,38',
        },
        {
          unitId: 'D-even-02',
          label:  '3BHK (L) Type B',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit02_3bhk_l(b)_tower_02.jpg'),
          iso:    IK('isometric/unit02_3bhk_l(b)_tower_02.jpg'),
          points: '40,10 65,10 65,38 40,38',
        },
        {
          unitId: 'D-even-03',
          label:  '3BHK (L) Type A',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit03_3bhk_l(a)_tower_04.jpg'),
          iso:    IK('isometric/unit03_3bhk_l(a)_tower_04.jpg'),
          points: '70,10 90,10 90,38 70,38',
        },
        {
          unitId: 'D-even-04',
          label:  '4BHK Type B',
          type:   '4 BHK',
          area:   '',
          top:    IK('topview/unit06_4bhk_(b)_tower_04.jpg'),
          iso:    IK('isometric/unit06_4bhk_(b)_tower_04.jpg'),
          points: '10,43 35,43 35,75 10,75',
        },
        {
          unitId: 'D-even-05',
          label:  '3BHK (S) Type A',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit05_3bhk_s(a)_tower_02.jpg'),
          iso:    IK('isometric/unit05_3bhk_s(a)_tower_02.jpg'),
          points: '40,43 65,43 65,75 40,75',
        },
        {
          unitId: 'D-even-06',
          label:  '4BHK Type E',
          type:   '4 BHK',
          area:   '',
          top:    IK('topview/unit04_4bhk_(e)_tower_04.jpg'),
          iso:    IK('isometric/unit04_4bhk_(e)_tower_04.jpg'),
          points: '70,43 90,43 90,75 70,75',
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

      /* ── TOPBAR ── */
      #fp-topbar {
        flex-shrink: 0;
        display: flex; align-items: center;
        padding: 0 12px;
        min-height: 56px; height: auto;
        border-bottom: 1px solid rgba(200,190,154,.18);
        background: rgba(10,8,5,.92);
        backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        gap: 10px; position: relative; z-index: 2;
        flex-wrap: wrap;
        row-gap: 6px;
        padding-top: 8px; padding-bottom: 8px;
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
      #fp-back-label {
        font-size:10px; font-weight:600; letter-spacing:.12em; text-transform:uppercase;
        color:rgba(200,190,154,.65); transition:color 0.2s;
        /* hide text on very small screens, keep icon */
        display: none;
      }
      @media (min-width: 400px) { #fp-back-label { display: block; } }
      #fp-back:hover #fp-back-label { color:rgba(200,190,154,.95); }

      .fp-pipe { width:1px; height:18px; background:rgba(200,190,154,.20); flex-shrink:0; opacity:0; transition:opacity 0.22s; }
      .fp-pipe.visible { opacity:1; }

      #fp-breadcrumb {
        flex:1; display:flex; align-items:center; gap:6px; min-width:0; overflow:hidden;
      }
      .fp-crumb {
        font-family:'Cormorant Garamond',serif; font-size:15px; font-weight:400;
        color:rgba(200,190,154,.55); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
        cursor:pointer; transition:color 0.2s;
      }
      .fp-crumb.active { color:rgba(245,242,235,.90); cursor:default; }
      .fp-crumb:not(.active):hover { color:rgba(200,190,154,.85); }
      .fp-crumb-sep { font-family:'Cormorant Garamond',serif; font-size:14px; color:rgba(200,190,154,.28); flex-shrink:0; opacity:0; transition:opacity 0.22s; }
      .fp-crumb-sep.visible { opacity:1; }

      /* toggles row — on mobile they move below the main bar row */
      #fp-toggles-row {
        display: flex; align-items: center; gap: 8px; flex-shrink: 0;
      }

      #fp-parity-toggle {
        display:flex;
        border:1px solid rgba(200,190,154,.30); border-radius:7px; overflow:hidden;
        opacity:0; pointer-events:none; transition:opacity 0.28s;
      }
      #fp-parity-toggle.visible { opacity:1; pointer-events:all; }
      .fp-parity-btn {
        padding:5px 11px; font-family:'Syne',sans-serif; font-size:9px; font-weight:700;
        letter-spacing:.11em; text-transform:uppercase; color:rgba(200,190,154,.55);
        cursor:pointer; background:transparent; border:none; outline:none;
        border-right:1px solid rgba(200,190,154,.20); transition:background 0.2s, color 0.2s; white-space:nowrap;
      }
      .fp-parity-btn:last-child { border-right:none; }
      .fp-parity-btn.active { background:rgba(200,190,154,.14); color:rgba(245,242,235,.90); }
      .fp-parity-btn:not(.active):hover { background:rgba(200,190,154,.07); color:rgba(200,190,154,.80); }

      #fp-view-toggle {
        display:flex;
        border:1px solid rgba(200,190,154,.30); border-radius:7px; overflow:hidden;
        opacity:0; pointer-events:none; transition:opacity 0.28s;
      }
      #fp-view-toggle.visible { opacity:1; pointer-events:all; }
      .fp-toggle-btn {
        padding:5px 11px; font-family:'Syne',sans-serif; font-size:9px; font-weight:700;
        letter-spacing:.11em; text-transform:uppercase; color:rgba(200,190,154,.55);
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
        transition:background 0.2s, border-color 0.2s;
      }
      #fp-close:hover { background:rgba(200,190,154,.16); border-color:rgba(200,190,154,.55); }
      #fp-close svg { width:12px; height:12px; stroke:rgba(200,190,154,.70); fill:none; stroke-width:2; stroke-linecap:round; }

      #fp-content { flex:1; position:relative; overflow:hidden; }

      .fp-panel { position:absolute; inset:0; opacity:0; pointer-events:none; transition:opacity 0.30s ease, transform 0.30s cubic-bezier(0.22,1,0.36,1); }
      .fp-panel.enter  { opacity:1; pointer-events:all; transform:translateX(0) !important; }
      .fp-panel.exit-l { opacity:0; transform:translateX(-32px); }
      .fp-panel.exit-r { opacity:0; transform:translateX( 32px); }

      /* ── SITEMAP ── */
      #fp-panel-sitemap { display:flex; align-items:center; justify-content:center; background:#0a0805; transform:translateX(0); }
      #fp-sitemap-wrap { position:relative; display:inline-block; max-width:100%; max-height:100%; }
      #fp-sitemap-img {
        display:block; max-width:100%; max-height:calc(100dvh - 56px - 62px);
        object-fit:contain; border:1px solid rgba(200,190,154,.12);
      }

      .fp-tower-tile {
        position:absolute; border:1px solid rgba(200,190,154,.40); background:rgba(200,190,154,.06);
        backdrop-filter:blur(2px); border-radius:4px; display:flex; flex-direction:column;
        align-items:center; justify-content:center; cursor:pointer;
        transition:background 0.22s, border-color 0.22s, transform 0.22s;
        gap:3px; padding:6px; box-sizing:border-box;
      }
      .fp-tower-tile:hover { background:rgba(200,190,154,.18); border-color:rgba(200,190,154,.75); transform:scale(1.04); }
      /* larger tap target on touch */
      @media (hover: none) { .fp-tower-tile { padding: 8px; } }
      .fp-tower-tile-label { font-family:'Cormorant Garamond',serif; font-size:12px; font-weight:500; color:rgba(245,242,235,.85); white-space:nowrap; text-align:center; }
      .fp-tower-tile-sub { font-family:'Syne',sans-serif; font-size:7px; font-weight:700; letter-spacing:.13em; text-transform:uppercase; color:rgba(200,190,154,.55); white-space:nowrap; }
      #fp-sitemap-hint {
        position:absolute; bottom:12px; left:50%; transform:translateX(-50%);
        font-family:'Cormorant Garamond',serif; font-size:11px; font-style:italic;
        color:rgba(200,190,154,.38); pointer-events:none; white-space:nowrap;
      }

      /* ── CLUSTER ── */
      #fp-panel-cluster { display:flex; align-items:center; justify-content:center; background:#0a0805; transform:translateX(32px); }
      #fp-cluster-wrap { position:relative; display:inline-block; max-width:100%; max-height:100%; }
      #fp-cluster-img {
        display:block; max-width:100%; max-height:calc(100dvh - 56px - 62px);
        object-fit:contain; border:1px solid rgba(200,190,154,.12); transition:opacity 0.28s;
        /* ensure touch events pass through to SVG zones */
        pointer-events: none;
      }
      #fp-cluster-img.fading { opacity:0; }

      #fp-zone-svg { position:absolute; top:0; left:0; width:100%; height:100%; overflow:visible; }
      .fp-zone {
        fill:rgba(200,190,154,.12); stroke:rgba(200,190,154,.55); stroke-width:1.5;
        cursor:pointer; pointer-events:all;
        transition:fill 0.20s, stroke 0.20s;
        /* larger touch area via stroke trick on mobile */
        stroke-linejoin: round;
      }
      .fp-zone:hover { fill:rgba(200,190,154,.30); stroke:rgba(200,190,154,.95); }
      .fp-zone.selected { fill:rgba(200,190,154,.22); stroke:#e8dfc0; stroke-width:2; }
      /* touch-specific highlight */
      .fp-zone:active { fill:rgba(200,190,154,.40); }

      #fp-zone-tip {
        position:absolute; padding:6px 12px;
        background:rgba(10,8,5,.88); border:1px solid rgba(200,190,154,.40);
        border-radius:4px; backdrop-filter:blur(8px);
        pointer-events:none; opacity:0; transition:opacity 0.18s; z-index:10; white-space:nowrap;
        /* keep tip on screen */
        max-width: calc(100vw - 24px);
      }
      #fp-zone-tip.visible { opacity:1; }
      #fp-zone-tip-name { font-family:'Cormorant Garamond',serif; font-size:14px; font-weight:500; color:rgba(245,242,235,.90); display:block; }
      #fp-zone-tip-type { font-family:'Syne',sans-serif; font-size:8.5px; font-weight:700; letter-spacing:.12em; text-transform:uppercase; color:rgba(200,190,154,.60); display:block; margin-top:2px; }

      /* ── UNIT PANEL ── */
      #fp-panel-unit { display:flex; flex-direction:column; transform:translateX(32px); }
      #fp-plan-area {
        flex:1; display:flex; align-items:center; justify-content:center;
        position:relative; overflow:hidden; padding:16px; box-sizing:border-box;
      }
      #fp-plan-img {
        max-width:100%; max-height:100%; object-fit:contain;
        border:1px solid rgba(200,190,154,.15); border-radius:3px;
        box-shadow:0 12px 60px rgba(0,0,0,.7);
        opacity:1; transition:opacity 0.28s; background:rgba(200,190,154,.03);
      }
      #fp-plan-img.fading { opacity:0; }

      #fp-unit-info {
        position:absolute; bottom:20px; left:20px;
        display:flex; flex-direction:column; gap:3px;
        opacity:0; transform:translateY(6px);
        transition:opacity 0.30s ease 0.12s, transform 0.30s ease 0.12s;
        pointer-events:none;
        /* don't overflow on very small screens */
        max-width: calc(100vw - 40px);
      }
      #fp-unit-info.visible { opacity:1; transform:translateY(0); }
      #fp-unit-info-name { font-family:'Cormorant Garamond',serif; font-size:18px; font-weight:300; font-style:italic; color:rgba(245,242,235,.75); line-height:1.1; }
      #fp-unit-info-type { font-family:'Syne',sans-serif; font-size:9px; font-weight:600; letter-spacing:.16em; text-transform:uppercase; color:rgba(200,190,154,.55); }
      #fp-unit-info-area { font-family:'Syne',sans-serif; font-size:9px; font-weight:400; letter-spacing:.10em; color:rgba(200,190,154,.38); }

      /* ── SPINNER ── */
      #fp-spinner {
        position:absolute; inset:0; display:flex; align-items:center; justify-content:center;
        background:rgba(10,8,5,.50); opacity:0; pointer-events:none;
        transition:opacity 0.22s; z-index:5;
      }
      #fp-spinner.visible { opacity:1; }
      #fp-spinner-ring {
        width:34px; height:34px; border:2px solid rgba(200,190,154,.20);
        border-top-color:rgba(200,190,154,.85); border-radius:50%;
        animation:fpSpin 0.72s linear infinite;
      }
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

          <div id="fp-toggles-row">
            <div id="fp-parity-toggle">
              <button class="fp-parity-btn active" data-parity="odd">Odd</button>
              <button class="fp-parity-btn"        data-parity="even">Even</button>
            </div>

            <div id="fp-view-toggle">
              <button class="fp-toggle-btn active" data-view="top">Plan</button>
              <button class="fp-toggle-btn"        data-view="iso">Iso</button>
            </div>
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
  // Keep a single ResizeObserver so we never stack duplicates across open() calls.
  let _sitemapRO = null;

  function buildSitemapTiles() {
    const wrap = document.getElementById('fp-sitemap-wrap');
    const img  = document.getElementById('fp-sitemap-img');

    // Disconnect any previous observer before creating a new one.
    if (_sitemapRO) { _sitemapRO.disconnect(); _sitemapRO = null; }

    function placeTiles() {
      // Remove and re-draw tiles so we never accumulate duplicates.
      wrap.querySelectorAll('.fp-tower-tile').forEach(t => t.remove());
      const iw = img.offsetWidth, ih = img.offsetHeight;
      if (!iw || !ih) return; // image not yet laid out — observer will retry
      SITEMAP.towerTiles.forEach(tile => {
        const el = document.createElement('div');
        el.className = 'fp-tower-tile';
        el.style.left   = (tile.x / 100 * iw) + 'px';
        el.style.top    = (tile.y / 100 * ih) + 'px';
        el.style.width  = (tile.w / 100 * iw) + 'px';
        el.style.height = (tile.h / 100 * ih) + 'px';
        el.innerHTML = `<span class="fp-tower-tile-label">${tile.label}</span><span class="fp-tower-tile-sub">Explore</span>`;
        // Capture tile.id in a const so the closure is stable.
        const tileId = tile.id;
        el.addEventListener('click', () => drillToCluster(tileId));
        wrap.appendChild(el);
      });
    }

    if (img.complete && img.naturalWidth > 0) placeTiles();
    else img.addEventListener('load', placeTiles, { once: true });

    // Single observer — disconnect stored above on next call.
    _sitemapRO = new ResizeObserver(placeTiles);
    _sitemapRO.observe(img);
  }

  // ─── SWAP PARITY ─────────────────────────────────────────────
  function swapParity(newParity) {
    if (!activeTower || newParity === floorParity) return;
    floorParity = newParity;
    document.querySelectorAll('.fp-parity-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.parity === floorParity);
    });
    const img    = document.getElementById('fp-cluster-img');
    const newSrc = getClusterImage(activeTower, floorParity);

    // Clear zones immediately so old ones can't be tapped during the fade.
    document.getElementById('fp-zone-svg').innerHTML = '';
    img.classList.add('fading');

    setTimeout(() => {
      let zonesBuilt = false;
      function finishLoad() {
        if (zonesBuilt) return;
        zonesBuilt = true;
        img.classList.remove('fading');
        buildZones(activeTower, floorParity);
      }
      img.onload  = finishLoad;
      img.onerror = () => { img.classList.remove('fading'); };
      img.src = newSrc;
      if (img.complete && img.naturalWidth > 0) finishLoad();
    }, 220);
  }

  // ─── DRILL TO CLUSTER ────────────────────────────────────────
  function drillToCluster(towerId) {
    // Always reset unit state whenever we enter the cluster level.
    activeUnit = null;
    document.getElementById('fp-unit-info').classList.remove('visible');
    const planImg = document.getElementById('fp-plan-img');
    planImg.removeAttribute('src');
    document.querySelectorAll('.fp-zone.selected').forEach(z => z.classList.remove('selected'));

    activeTower = towerId;
    document.querySelectorAll('.fp-parity-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.parity === floorParity);
    });

    const img    = document.getElementById('fp-cluster-img');
    const newSrc = getClusterImage(towerId, floorParity);

    img.classList.add('fading');

    // Always clear old zones immediately so stale polygons can't be tapped.
    document.getElementById('fp-zone-svg').innerHTML = '';

    setTimeout(() => {
      // Guard: only run buildZones once even if both onload and the
      // already-cached branch fire (some browsers fire onload for cached imgs).
      let zonesBuilt = false;
      function finishLoad() {
        if (zonesBuilt) return;
        zonesBuilt = true;
        img.classList.remove('fading');
        buildZones(towerId, floorParity);
      }

      img.onload  = finishLoad;
      img.onerror = () => { img.classList.remove('fading'); };
      img.src = newSrc;

      // If image was already cached the browser won't fire onload — handle it.
      if (img.complete && img.naturalWidth > 0) finishLoad();
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

      // mouse events (desktop)
      poly.addEventListener('mouseenter', (e) => showZoneTip(u, e));
      poly.addEventListener('mousemove',  (e) => moveZoneTip(e));
      poly.addEventListener('mouseleave', hideZoneTip);
      poly.addEventListener('click', () => drillToUnit(u));

      // touch events (mobile) — show tip briefly then navigate on tap
      let touchMoved = false;
      poly.addEventListener('touchstart', (e) => {
        touchMoved = false;
        showZoneTipTouch(u, e);
      }, { passive: true });
      poly.addEventListener('touchmove', () => { touchMoved = true; hideZoneTip(); }, { passive: true });
      poly.addEventListener('touchend', (e) => {
        if (!touchMoved) {
          e.preventDefault();
          hideZoneTip();
          drillToUnit(u);
        }
      });

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

  function showZoneTipTouch(u, e) {
    document.getElementById('fp-zone-tip-name').textContent = u.label;
    document.getElementById('fp-zone-tip-type').textContent = `${u.type}${u.area ? '  ·  ' + u.area : ''}`;
    const tip  = document.getElementById('fp-zone-tip');
    tip.classList.add('visible');
    // position near touch point
    const rect = document.getElementById('fp-cluster-wrap').getBoundingClientRect();
    const t = e.touches[0];
    let left = t.clientX - rect.left + 14;
    let top  = t.clientY - rect.top  - 40;
    // clamp so tip stays inside wrap
    const tw = tip.offsetWidth || 120;
    if (left + tw > rect.width - 8) left = rect.width - tw - 8;
    if (left < 4) left = 4;
    if (top < 4) top = 4;
    tip.style.left = left + 'px';
    tip.style.top  = top  + 'px';
  }

  function moveZoneTip(e) {
    const rect = document.getElementById('fp-cluster-wrap').getBoundingClientRect();
    const tip  = document.getElementById('fp-zone-tip');
    let left = e.clientX - rect.left + 14;
    let top  = e.clientY - rect.top  - 14;
    const tw = tip.offsetWidth || 120;
    if (left + tw > rect.width - 8) left = rect.width - tw - 8;
    tip.style.left = left + 'px';
    tip.style.top  = top  + 'px';
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
    // clear previous selected zone
    document.querySelectorAll('.fp-zone')
    .forEach(z => z.classList.remove('selected'));

    // highlight current selected zone
    const activeZone = document.querySelector(
    `.fp-zone[data-unit-id="${unitData.unitId}"]`
    );

    if (activeZone) {
    activeZone.classList.add('selected');
    }
    
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
      level = 1;
      // ── BUG FIX: clear activeUnit when leaving unit panel ──
      activeUnit = null;
      document.getElementById('fp-unit-info').classList.remove('visible');
      showPanel('fp-panel-cluster', 'back');
      updateTopbar();
    } else if (level === 1) {
      level = 0;
      // ── BUG FIX: clear both tower and unit when going to sitemap ──
      activeTower = null;
      activeUnit  = null;
      document.getElementById('fp-unit-info').classList.remove('visible');

      const planImg = document.getElementById('fp-plan-img');
      planImg.removeAttribute('src');

      document.querySelectorAll('.fp-zone.selected')
      .forEach(z => z.classList.remove('selected'));
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
      if (level > 0) {
        // ── BUG FIX: clear tower + unit when jumping directly to sitemap via breadcrumb ──
        level = 0; activeTower = null; activeUnit = null;
        showPanel('fp-panel-sitemap','back'); updateTopbar();
      }
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
    IK,
  };

})();