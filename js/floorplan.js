// floorplan.js — 3-Level Floor Plan Viewer
// Level 0 → Sitemap (default) — 4 tower tiles overlaid
// Level 1 → Tower Cluster image — ODD/EVEN toggle + polygon unit zones
// Level 2 → Unit plan — Top View / Isometric toggle
//
// ─── SPREADSHEET COLOR KEY ────────────────────────────────────────────────────
// BLUE  = unit appears in BOTH odd and even columns → listed in oddUnits AND evenUnits
// GREEN = unit appears in only ONE column (odd or even) → listed in that side only
// WHITE = removed (not applicable for that parity)
// ─────────────────────────────────────────────────────────────────────────────
//
// ─── IMAGE URL HELPER ────────────────────────────────────────────────────────
// IK(path) builds a full ImageKit URL from a relative path.
// Usage:  IK('isometric/unit06_3bhk_l(g)_podium_tower_03.jpg')
//         IK('topview/unit05_3bhk_s(a)_tower_02.jpg')
// To fill an empty slot replace '' with IK('folder/filename.jpg')
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
        {
          unitId: 'C-odd-01',
          label:  '3BHK (L) Type G',
          type:   '3 BHK',
          area:   '',
          top:    IK('topview/unit06_3bhk_l(g)_tower_03.jpg'),
          iso:    IK('isometric/unit06_3bhk_l(g)_tower_03.jpg'),
          points: '10,15 55,15 55,52 10,52',
        },
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
        {
          unitId: 'C-even-01',
          label:  '4BHK Type G',
          type:   '4 BHK',
          area:   '',
          top:    IK('topview/unit01_4bhk_(g)_tower_03.jpg'),
          iso:    IK('isometric/unit01_4bhk_(g)_tower_03.jpg'),
          points: '5,8 30,8 30,35 5,35',
        },
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
  let activeUnit   = null;
  let floorParity  = 'odd';
  let viewMode     = 'top';
  let overlayOpen  = false;

  // Blocks ResizeObserver from rebuilding tiles during panel animations
  let _transitioning = false;

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

      /* ── OVERLAY ── */
      #fp-overlay {
        position: fixed;
        top: 0; left: 0; right: 0;
        bottom: calc(62px + env(safe-area-inset-bottom, 0px));
        z-index: 200; background: #0a0805;
        display: flex; flex-direction: column;
        opacity: 0; pointer-events: none;
        transform: translateY(6px);
        transition: opacity 0.38s ease, transform 0.38s cubic-bezier(0.22,1,0.36,1);
        font-family: 'Syne', sans-serif; overflow: hidden;
      }
      #fp-overlay.open { opacity: 1; pointer-events: all; transform: translateY(0); }

      /* ── TOPBAR ──
         Uses a CSS custom property --fp-topbar-h that JS updates whenever
         the topbar height changes (e.g. wraps to two rows on small screens).
         Images use this variable so they never go behind the topbar.       */
      :root { --fp-topbar-h: 56px; }

      #fp-topbar {
        flex-shrink: 0;
        display: flex; align-items: center;
        padding: 8px 12px;
        border-bottom: 1px solid rgba(200,190,154,.18);
        background: rgba(10,8,5,.92);
        backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        gap: 10px; position: relative; z-index: 2;
        flex-wrap: wrap; row-gap: 6px;
      }
      #fp-topbar::after {
        content: ''; position: absolute; bottom: -1px; left: 50%;
        transform: translateX(-50%); width: 80px; height: 1px;
        background: linear-gradient(to right, transparent, rgba(200,190,154,.55), transparent);
      }

      /* ── BACK BUTTON — icon only, no label, no pipe, no breadcrumb ── */
      #fp-back {
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; opacity: 0; pointer-events: none;
        transition: opacity 0.22s ease; flex-shrink: 0;
      }
      #fp-back.visible { opacity: 1; pointer-events: all; }
      #fp-back-arrow {
        width: 32px; height: 32px; border-radius: 8px;
        border: 1px solid rgba(200,190,154,.35);
        background: rgba(200,190,154,.08);
        display: flex; align-items: center; justify-content: center;
        transition: background 0.2s, border-color 0.2s;
        /* larger tap target on touch */
        -webkit-tap-highlight-color: transparent;
      }
      #fp-back:active #fp-back-arrow,
      #fp-back:hover  #fp-back-arrow {
        background: rgba(200,190,154,.18); border-color: rgba(200,190,154,.65);
      }
      #fp-back-arrow svg {
        width:13px; height:13px; stroke:rgba(200,190,154,.80);
        fill:none; stroke-width:1.8; stroke-linecap:round; stroke-linejoin:round;
      }

      /* ── TITLE — shows current level name in the topbar ── */
      #fp-title {
        flex: 1; min-width: 0;
        font-family: 'Cormorant Garamond', serif;
        font-size: 15px; font-weight: 400;
        color: rgba(245,242,235,.85);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }

      /* ── TOGGLES ── */
      #fp-toggles-row { 
      position: absolute; left: 50%; transform: translateX(-50%);
      display: flex; align-items: center; gap: 8px;
      }

      /* ── TOGGLES — pill style ── */
      #fp-parity-toggle,
      #fp-view-toggle {
        display: flex;
        background: rgba(30,28,24,0.92);
        border: 1px solid rgba(200,190,154,.22);
        border-radius: 999px;
        padding: 3px;
        gap: 2px;
        opacity: 0; pointer-events: none; transition: opacity 0.28s;
      }
      #fp-parity-toggle.visible,
      #fp-view-toggle.visible { opacity: 1; pointer-events: all; }

      .fp-parity-btn,
      .fp-toggle-btn {
        padding: 6px 16px;
        font-family: 'Syne', sans-serif;
        font-size: 9px; font-weight: 700;
        letter-spacing: .13em; text-transform: uppercase;
        color: rgba(200,190,154,.50);
        cursor: pointer; background: transparent;
        border: none; outline: none;
        border-radius: 999px;
        transition: background 0.22s, color 0.22s;
        white-space: nowrap; min-height: 32px;
        display: flex; align-items: center;
        -webkit-tap-highlight-color: transparent;
      }
      .fp-parity-btn.active,
      .fp-toggle-btn.active {
        background: linear-gradient(135deg, #c8b96a 0%, #a8943a 100%);
        color: #1a1608;
        box-shadow: 0 2px 8px rgba(180,160,60,.35);
      }
      .fp-parity-btn:not(.active):active,
      .fp-parity-btn:not(.active):hover,
      .fp-toggle-btn:not(.active):active,
      .fp-toggle-btn:not(.active):hover {
        color: rgba(200,190,154,.80);
        background: rgba(200,190,154,.08);
      }

      /* ── CLOSE ── */
      #fp-close {
        flex-shrink: 0; width: 32px; height: 32px; border-radius: 8px;
        border: 1px solid rgba(200,190,154,.25); background: rgba(200,190,154,.06);
        display: flex; align-items: center; justify-content: center; cursor: pointer;
        transition: background 0.2s, border-color 0.2s;
        -webkit-tap-highlight-color: transparent;
      }
      #fp-close:active, #fp-close:hover {
        background: rgba(200,190,154,.16); border-color: rgba(200,190,154,.55);
      }
      #fp-close svg { width:12px; height:12px; stroke:rgba(200,190,154,.70); fill:none; stroke-width:2; stroke-linecap:round; }

      /* ── CONTENT + PANELS ── */
      #fp-content { flex: 1; position: relative; overflow: hidden; }

      .fp-panel {
        position: absolute; inset: 0;
        opacity: 0; pointer-events: none;
        transition: opacity 0.30s ease, transform 0.30s cubic-bezier(0.22,1,0.36,1);
      }
      .fp-panel.enter  { opacity: 1; pointer-events: all; transform: translateX(0) !important; }
      .fp-panel.exit-l { opacity: 0; transform: translateX(-32px); }
      .fp-panel.exit-r { opacity: 0; transform: translateX( 32px); }

      /* ── SITEMAP ── */
      #fp-panel-sitemap {
        display: flex; align-items: center; justify-content: center;
        background: #0a0805; transform: translateX(0);
      }
      #fp-sitemap-wrap { position: relative; display: inline-block; max-width: 100%; max-height: 100%; }
      #fp-sitemap-img {
        display: block; max-width: 100%;
        max-height: calc(100dvh - var(--fp-topbar-h) - 62px - env(safe-area-inset-bottom, 0px));
        object-fit: contain; border: 1px solid rgba(200,190,154,.12);
      }

      .fp-tower-tile {
        position: absolute;
        border: 1px solid rgba(200,190,154,.40); background: rgba(200,190,154,.06);
        backdrop-filter: blur(2px); border-radius: 4px;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        cursor: pointer; gap: 3px; padding: 6px; box-sizing: border-box;
        transition: background 0.22s, border-color 0.22s, transform 0.18s;
        -webkit-tap-highlight-color: transparent;
        /* minimum 44px touch target */
        min-width: 44px; min-height: 44px;
      }
      .fp-tower-tile.tapped,
      .fp-tower-tile:hover  { background: rgba(200,190,154,.18); border-color: rgba(200,190,154,.75); transform: scale(1.04); }
      .fp-tower-tile-label  { font-family: 'Cormorant Garamond', serif; font-size: 12px; font-weight: 500; color: rgba(245,242,235,.85); white-space: nowrap; text-align: center; }
      .fp-tower-tile-sub    { font-family: 'Syne', sans-serif; font-size: 7px; font-weight: 700; letter-spacing: .13em; text-transform: uppercase; color: rgba(200,190,154,.55); white-space: nowrap; }
      #fp-sitemap-hint {
        position: absolute; bottom: 12px; left: 50%; transform: translateX(-50%);
        font-family: 'Cormorant Garamond', serif; font-size: 11px; font-style: italic;
        color: rgba(200,190,154,.38); pointer-events: none; white-space: nowrap;
      }

      /* ── CLUSTER ── */
      #fp-panel-cluster {
        display: flex; align-items: center; justify-content: center;
        background: #0a0805; transform: translateX(32px);
      }
      #fp-cluster-wrap { position: relative; display: inline-block; max-width: 100%; max-height: 100%; }
      #fp-cluster-img {
        display: block; max-width: 100%;
        max-height: calc(100dvh - var(--fp-topbar-h) - 62px - env(safe-area-inset-bottom, 0px));
        object-fit: contain; border: 1px solid rgba(200,190,154,.12);
        transition: opacity 0.28s; pointer-events: none;
      }
      #fp-cluster-img.fading { opacity: 0; }

      #fp-zone-svg { position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: visible; }
      .fp-zone {
        fill: rgba(200,190,154,.12); stroke: rgba(200,190,154,.55); stroke-width: 1.5;
        cursor: pointer; pointer-events: all;
        transition: fill 0.20s, stroke 0.20s; stroke-linejoin: round;
      }
      .fp-zone:hover,
      .fp-zone.tapped  { fill: rgba(200,190,154,.30); stroke: rgba(200,190,154,.95); }
      .fp-zone.selected { fill: rgba(200,190,154,.22); stroke: #e8dfc0; stroke-width: 2; }

      #fp-zone-tip {
        position: absolute; padding: 6px 12px;
        background: rgba(10,8,5,.88); border: 1px solid rgba(200,190,154,.40);
        border-radius: 4px; backdrop-filter: blur(8px);
        pointer-events: none; opacity: 0; transition: opacity 0.18s;
        z-index: 10; white-space: nowrap;
        max-width: calc(100vw - 24px);
      }
      #fp-zone-tip.visible { opacity: 1; }
      #fp-zone-tip-name { font-family: 'Cormorant Garamond', serif; font-size: 14px; font-weight: 500; color: rgba(245,242,235,.90); display: block; }
      #fp-zone-tip-type { font-family: 'Syne', sans-serif; font-size: 8.5px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; color: rgba(200,190,154,.60); display: block; margin-top: 2px; }

      /* ── UNIT PANEL ── */
      #fp-panel-unit { display: flex; flex-direction: column; transform: translateX(32px); background: #0a0805; }
      #fp-plan-area {
        flex: 1; display: flex; align-items: center; justify-content: center;
        position: relative; overflow: hidden; padding: 16px; box-sizing: border-box;
        /* allow pinch-zoom via JS — disable browser default pan/zoom interference */
        touch-action: none;
      }
      #fp-plan-img {
        max-width: 100%; max-height: 100%; object-fit: contain;
        border: 1px solid rgba(200,190,154,.15); border-radius: 3px;
        box-shadow: 0 12px 60px rgba(0,0,0,.7);
        opacity: 1; transition: opacity 0.28s; background: rgba(200,190,154,.03);
        /* transform origin center for pinch-zoom */
        transform-origin: center center;
        user-select: none; -webkit-user-select: none;
      }
      #fp-plan-img.fading { opacity: 0; }
      /* Reset zoom hint */
      #fp-zoom-hint {
        position: absolute; bottom: 60px; left: 50%; transform: translateX(-50%);
        font-family: 'Syne', sans-serif; font-size: 8.5px; font-weight: 600;
        letter-spacing: .12em; text-transform: uppercase;
        color: rgba(200,190,154,.35); pointer-events: none;
        opacity: 0; transition: opacity 0.4s;
        white-space: nowrap;
      }
      #fp-zoom-hint.visible { opacity: 1; }

      #fp-unit-info {
        position: absolute; bottom: 20px; left: 20px;
        display: flex; flex-direction: column; gap: 3px;
        opacity: 0; transform: translateY(6px);
        transition: opacity 0.30s ease 0.12s, transform 0.30s ease 0.12s;
        pointer-events: none; max-width: calc(100vw - 40px);
      }
      #fp-unit-info.visible { opacity: 1; transform: translateY(0); }
      #fp-unit-info-name { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 300; font-style: italic; color: rgba(245,242,235,.75); line-height: 1.1; }
      #fp-unit-info-type { font-family: 'Syne', sans-serif; font-size: 9px; font-weight: 600; letter-spacing: .16em; text-transform: uppercase; color: rgba(200,190,154,.55); }
      #fp-unit-info-area { font-family: 'Syne', sans-serif; font-size: 9px; font-weight: 400; letter-spacing: .10em; color: rgba(200,190,154,.38); }

      /* ── SPINNER ── */
      #fp-spinner {
        position: absolute; inset: 0;
        display: flex; align-items: center; justify-content: center;
        background: rgba(10,8,5,.50); opacity: 0; pointer-events: none;
        transition: opacity 0.22s; z-index: 5;
      }
      #fp-spinner.visible { opacity: 1; }
      #fp-spinner-ring {
        width: 34px; height: 34px;
        border: 2px solid rgba(200,190,154,.20);
        border-top-color: rgba(200,190,154,.85);
        border-radius: 50%; animation: fpSpin 0.72s linear infinite;
      }
      @keyframes fpSpin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);

    document.body.insertAdjacentHTML('beforeend', `
      <div id="fp-overlay">
        <div id="fp-topbar">

          <div id="fp-back">
            <div id="fp-back-arrow">
              <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
            </div>
          </div>

          <div id="fp-title">Site Plan</div>

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
              <div id="fp-zoom-hint">Pinch to zoom</div>
            </div>
          </div>

        </div>
      </div>
    `);
  }

  // ─── TOPBAR HEIGHT TRACKER ────────────────────────────────────
  // Updates --fp-topbar-h whenever the topbar resizes (wraps to 2 rows).
  // Images use this var so they never slide behind a taller topbar.
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

  // ─── UPDATE TITLE ────────────────────────────────────────────
  function updateTitle() {
    const el = document.getElementById('fp-title');
    if (!el) return;
    if (level === 0) { el.textContent = 'Site Plan'; }
    else if (level === 1) { el.textContent = TOWERS[activeTower]?.label || 'Tower'; }
    else if (level === 2) { el.textContent = activeUnit?.label || ''; }
  }

  // ─── RESET TO SITEMAP ────────────────────────────────────────
  function resetToSitemap() {
    level       = 0;
    activeTower = null;
    activeUnit  = null;

    const svg = document.getElementById('fp-zone-svg');
    if (svg) svg.innerHTML = '';
    const clusterImg = document.getElementById('fp-cluster-img');
    if (clusterImg) { clusterImg.classList.remove('fading'); clusterImg.removeAttribute('src'); }
    const planImg = document.getElementById('fp-plan-img');
    if (planImg) {
      planImg.classList.remove('fading');
      planImg.removeAttribute('src');
      planImg.style.transform = '';   // reset pinch-zoom
    }
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
  }

  // ─── SITEMAP TILES ───────────────────────────────────────────
  let _sitemapRO = null;

  function buildSitemapTiles() {
    const wrap = document.getElementById('fp-sitemap-wrap');
    const img  = document.getElementById('fp-sitemap-img');
    let lastW  = 0;
    let lastH  = 0;

    if (_sitemapRO) { _sitemapRO.disconnect(); _sitemapRO = null; }

    function placeTiles() {
      if (_transitioning) return;
      const iw = img.offsetWidth;
      const ih = img.offsetHeight;
      if (!iw || !ih) return;
      if (iw === lastW && ih === lastH) return;
      lastW = iw; lastH = ih;

      wrap.querySelectorAll('.fp-tower-tile').forEach(t => t.remove());

      SITEMAP.towerTiles.forEach(tile => {
        const el = document.createElement('div');
        el.className = 'fp-tower-tile';
        el.style.left   = (tile.x / 100 * iw) + 'px';
        el.style.top    = (tile.y / 100 * ih) + 'px';
        el.style.width  = (tile.w / 100 * iw) + 'px';
        el.style.height = (tile.h / 100 * ih) + 'px';
        el.innerHTML = `<span class="fp-tower-tile-label">${tile.label}</span><span class="fp-tower-tile-sub">Explore</span>`;

        const tileId = tile.id;

        // Touch — instant response, no 300ms delay
        let tileTouchMoved = false;
        el.addEventListener('touchstart', (e) => {
          tileTouchMoved = false;
          el.classList.add('tapped');
        }, { passive: true });
        el.addEventListener('touchmove', () => {
          tileTouchMoved = true;
          el.classList.remove('tapped');
        }, { passive: true });
        el.addEventListener('touchend', (e) => {
          el.classList.remove('tapped');
          if (!tileTouchMoved) {
            e.preventDefault();
            drillToCluster(tileId);
          }
        });

        // Mouse (desktop)
        el.addEventListener('click', () => drillToCluster(tileId));

        wrap.appendChild(el);
      });
    }

    if (img.complete && img.naturalWidth > 0) placeTiles();
    else img.addEventListener('load', placeTiles, { once: true });

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
    document.getElementById('fp-zone-svg').innerHTML = '';
    img.classList.add('fading');

    setTimeout(() => {
      let done = false;
      function finish() {
        if (done) return; done = true;
        img.classList.remove('fading');
        buildZones(activeTower, floorParity);
      }
      img.onload  = finish;
      img.onerror = () => { img.classList.remove('fading'); };
      img.src = newSrc;
      if (img.complete && img.naturalWidth > 0) finish();
    }, 220);
  }

  // ─── DRILL TO CLUSTER ────────────────────────────────────────
  function drillToCluster(towerId) {
    activeUnit = null;
    const unitInfo = document.getElementById('fp-unit-info');
    if (unitInfo) unitInfo.classList.remove('visible');
    const planImg = document.getElementById('fp-plan-img');
    if (planImg) { planImg.removeAttribute('src'); planImg.style.transform = ''; }
    document.querySelectorAll('.fp-zone.selected').forEach(z => z.classList.remove('selected'));

    activeTower = towerId;
    document.querySelectorAll('.fp-parity-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.parity === floorParity);
    });

    const img    = document.getElementById('fp-cluster-img');
    const newSrc = getClusterImage(towerId, floorParity);
    document.getElementById('fp-zone-svg').innerHTML = '';
    img.classList.add('fading');

    setTimeout(() => {
      let done = false;
      function finish() {
        if (done) return; done = true;
        img.classList.remove('fading');
        buildZones(towerId, floorParity);
      }
      img.onload  = finish;
      img.onerror = () => { img.classList.remove('fading'); };
      img.src = newSrc;
      if (img.complete && img.naturalWidth > 0) finish();
    }, 220);

    level = 1;
    showPanel('fp-panel-cluster', 'forward');
    updateTopbar();
    updateTitle();
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

      // Desktop
      poly.addEventListener('mouseenter', (e) => showZoneTip(u, e));
      poly.addEventListener('mousemove',  (e) => moveZoneTip(e));
      poly.addEventListener('mouseleave', hideZoneTip);
      poly.addEventListener('click', () => drillToUnit(u));

      // Touch — tap to navigate, show tip briefly then auto-hide
      let touchMoved   = false;
      let tipHideTimer = null;
      poly.addEventListener('touchstart', (e) => {
        touchMoved = false;
        clearTimeout(tipHideTimer);
        showZoneTipTouch(u, e);
        // auto-hide tip after 1.2s if user doesn't lift finger
        tipHideTimer = setTimeout(hideZoneTip, 1200);
      }, { passive: true });
      poly.addEventListener('touchmove', () => {
        touchMoved = true;
        clearTimeout(tipHideTimer);
        hideZoneTip();
      }, { passive: true });
      poly.addEventListener('touchend', (e) => {
        clearTimeout(tipHideTimer);
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
    const rect = document.getElementById('fp-cluster-wrap').getBoundingClientRect();
    const t    = e.touches[0];
    let left   = t.clientX - rect.left + 14;
    let top    = t.clientY - rect.top  - 40;
    const tw   = tip.offsetWidth || 120;
    if (left + tw > rect.width - 8) left = rect.width - tw - 8;
    if (left < 4) left = 4;
    if (top  < 4) top  = 4;
    tip.style.left = left + 'px';
    tip.style.top  = top  + 'px';
  }

  function moveZoneTip(e) {
    const rect = document.getElementById('fp-cluster-wrap').getBoundingClientRect();
    const tip  = document.getElementById('fp-zone-tip');
    let left   = e.clientX - rect.left + 14;
    let top    = e.clientY - rect.top  - 14;
    const tw   = tip.offsetWidth || 120;
    if (left + tw > rect.width - 8) left = rect.width - tw - 8;
    tip.style.left = left + 'px';
    tip.style.top  = top  + 'px';
  }

  function hideZoneTip() {
    const tip = document.getElementById('fp-zone-tip');
    if (tip) tip.classList.remove('visible');
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

    // Highlight zone BEFORE panel transition
    document.querySelectorAll('.fp-zone').forEach(z => z.classList.remove('selected'));
    const activeZone = document.querySelector(`.fp-zone[data-unit-id="${unitData.unitId}"]`);
    if (activeZone) activeZone.classList.add('selected');

    // Reset pinch-zoom from any previous unit
    const planImg = document.getElementById('fp-plan-img');
    if (planImg) planImg.style.transform = '';

    level = 2;
    showPanel('fp-panel-unit', 'forward');
    updateTopbar();
    updateTitle();
    loadUnitImage();
  }

  // ─── LOAD UNIT IMAGE ─────────────────────────────────────────
  function loadUnitImage() {
    if (!activeUnit) return;
    const img     = document.getElementById('fp-plan-img');
    const spinner = document.getElementById('fp-spinner');
    const src     = unitImagePath(activeUnit, viewMode);

    // IK('folder/') with no filename = not set yet
    if (!src || src.endsWith('/')) {
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

  // ─── PINCH-ZOOM on floor plan image ─────────────────────────
  // Handles two-finger pinch to zoom and single-finger pan when zoomed.
  // Double-tap resets zoom.
  function bindPinchZoom() {
    const area = document.getElementById('fp-plan-area');
    const img  = document.getElementById('fp-plan-img');
    if (!area || !img) return;

    let scale      = 1;
    let originX    = 0;
    let originY    = 0;
    let lastDist   = null;
    let panStartX  = 0;
    let panStartY  = 0;
    let panOriginX = 0;
    let panOriginY = 0;
    let lastTap    = 0;
    const MAX_SCALE = 4;
    const MIN_SCALE = 1;
    const zoomHint  = document.getElementById('fp-zoom-hint');

    function applyTransform() {
      img.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;
      if (zoomHint) {
        // Show "Pinch to zoom" only when at 1x; show "Double-tap to reset" when zoomed
        if (scale > 1.05) {
          zoomHint.textContent = 'Double-tap to reset';
          zoomHint.classList.add('visible');
        } else {
          zoomHint.classList.remove('visible');
        }
      }
    }

    function resetZoom() {
      scale = 1; originX = 0; originY = 0;
      img.style.transition = 'transform 0.25s ease';
      applyTransform();
      setTimeout(() => { img.style.transition = ''; }, 260);
      if (zoomHint) zoomHint.classList.remove('visible');
    }

    function dist(touches) {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    }

    function midpoint(touches) {
      return {
        x: (touches[0].clientX + touches[1].clientX) / 2,
        y: (touches[0].clientY + touches[1].clientY) / 2,
      };
    }

    area.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        lastDist = dist(e.touches);
      } else if (e.touches.length === 1) {
        // Double-tap to reset
        const now = Date.now();
        if (now - lastTap < 300) {
          e.preventDefault();
          resetZoom();
        }
        lastTap    = now;
        panStartX  = e.touches[0].clientX;
        panStartY  = e.touches[0].clientY;
        panOriginX = originX;
        panOriginY = originY;
      }
    }, { passive: false });

    area.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const d    = dist(e.touches);
        const mid  = midpoint(e.touches);
        const rect = area.getBoundingClientRect();

        if (lastDist !== null) {
          const delta    = d / lastDist;
          const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * delta));

          // Zoom toward the pinch midpoint
          const pivotX = mid.x - rect.left - rect.width  / 2;
          const pivotY = mid.y - rect.top  - rect.height / 2;
          originX = pivotX + (originX - pivotX) * (newScale / scale);
          originY = pivotY + (originY - pivotY) * (newScale / scale);
          scale   = newScale;
          applyTransform();
        }
        lastDist = d;

      } else if (e.touches.length === 1 && scale > 1) {
        // Pan when zoomed
        e.preventDefault();
        originX = panOriginX + (e.touches[0].clientX - panStartX);
        originY = panOriginY + (e.touches[0].clientY - panStartY);
        applyTransform();
      }
    }, { passive: false });

    area.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) lastDist = null;
      // Snap back to bounds if over-panned
      if (scale <= MIN_SCALE + 0.05) resetZoom();
    }, { passive: true });
  }

  // ─── SWIPE-BACK gesture ──────────────────────────────────────
  // Swipe right from left edge (< 40px) triggers goBack().
  function bindSwipeBack() {
    const content = document.getElementById('fp-content');
    if (!content) return;
    let startX = 0;
    let startY = 0;
    let active = false;

    content.addEventListener('touchstart', (e) => {
      if (e.touches[0].clientX < 40) {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        active = true;
      }
    }, { passive: true });

    content.addEventListener('touchmove', (e) => {
      if (!active) return;
      const dx = e.touches[0].clientX - startX;
      const dy = Math.abs(e.touches[0].clientY - startY);
      // Cancel if mostly vertical
      if (dy > 30) { active = false; }
    }, { passive: true });

    content.addEventListener('touchend', (e) => {
      if (!active) return;
      active = false;
      const dx = e.changedTouches[0].clientX - startX;
      if (dx > 60 && level > 0) goBack();
    }, { passive: true });
  }

  // ─── BACK NAV ────────────────────────────────────────────────
  function goBack() {
    if (level === 2) {
      activeUnit = null;
      document.getElementById('fp-unit-info').classList.remove('visible');
      document.getElementById('fp-spinner').classList.remove('visible');
      // Reset pinch-zoom when leaving unit panel
      const planImg = document.getElementById('fp-plan-img');
      if (planImg) planImg.style.transform = '';
      showPanel('fp-panel-cluster', 'back');
      level = 1;
      updateTopbar();
      updateTitle();
    } else if (level === 1) {
      resetToSitemap();
    }
  }

  // ─── UPDATE TOPBAR ───────────────────────────────────────────
  function updateTopbar() {
    const back         = document.getElementById('fp-back');
    const parityToggle = document.getElementById('fp-parity-toggle');
    const viewToggle   = document.getElementById('fp-view-toggle');

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
    updateTitle();
    document.getElementById('fp-overlay').classList.add('open');
  }

  function close() {
    if (!overlayOpen) return;
    overlayOpen = false;
    document.getElementById('fp-overlay').classList.remove('open');
    setTimeout(() => { resetToSitemap(); }, 420);
  }

  // ─── BIND EVENTS ─────────────────────────────────────────────
  function bindEvents() {
    document.getElementById('fp-close').addEventListener('click', close);
    document.getElementById('fp-back').addEventListener('click', goBack);

    // Touch on back button — instant response
    document.getElementById('fp-back').addEventListener('touchend', (e) => {
      e.preventDefault();
      goBack();
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

    bindPinchZoom();
    bindSwipeBack();
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
        activeTower = towerId; drillToUnit(unitData);
      }
    },
    TOWERS,
    SITEMAP,
    IK,
  };

})();