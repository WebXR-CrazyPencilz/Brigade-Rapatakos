// floorplan.js — 3-Level Floor Plan Viewer
// Level 0 → Sitemap (default) — 4 tower tiles overlaid
// Level 1 → Tower Cluster image — polygon unit zones overlaid
// Level 2 → Unit plan — Top View / Isometric toggle
//
// IMAGE NAMES (replace placeholder URLs with real ImageKit paths):
//   Sitemap  : sitemap_cluster.jpg
//   Clusters : cluster_tower_A_odd.jpg  / cluster_tower_A_even.jpg
//              cluster_tower_B_odd.jpg  / cluster_tower_B_even.jpg
//              cluster_tower_C_odd.jpg  / cluster_tower_C_even.jpg
//              cluster_tower_D_odd.jpg  / cluster_tower_D_even.jpg
//   Units    : unit_<id>_top.jpg  /  unit_<id>_iso.jpg
//
// HOW ODD / EVEN WORKS:
//   Pass a floor number to FloorplanModule.open(floorNumber).
//   If floorNumber is odd  → loads the tower's odd-floor cluster image.
//   If floorNumber is even → loads the tower's even-floor cluster image.
//   Default (no floor number passed) → shows Level 0 sitemap.

window.FloorplanModule = (function () {

  // ─── IMAGE BASE ────────────────────────────────────────────────
  const IK = 'https://ik.imagekit.io/pwzaetheh';

  // ─── LEVEL 0 — SITEMAP ────────────────────────────────────────
  const SITEMAP = {
    image: `${IK}/Cluster/sitemap_cluster.jpg`,   // ← replace with real path
    // 4 tower tiles: { id, label, x, y, w, h } as % of image natural size
    // Coordinates are PLACEHOLDERS — supply real values once image is confirmed
    towerTiles: [
      { id: 'tower-A', label: 'Tower A', x: 18, y: 30, w: 14, h: 22 },
      { id: 'tower-B', label: 'Tower B', x: 38, y: 28, w: 14, h: 22 },
      { id: 'tower-C', label: 'Tower C', x: 58, y: 30, w: 14, h: 22 },
      { id: 'tower-D', label: 'Tower D', x: 74, y: 32, w: 14, h: 22 },
    ],
  };

  // ─── LEVEL 1 — TOWERS / CLUSTERS ──────────────────────────────
  // Each tower has an odd-floor cluster image and an even-floor cluster image.
  // unitZones: SVG polygon points as percentage strings ("x,y x,y …")
  //   — expressed as % of the cluster image's rendered size so they scale
  //     with the image at any viewport. PLACEHOLDERS — tune after images arrive.
  const TOWERS = {
    'tower-A': {
      label: 'Tower A',
      odd:  { image: `${IK}/Cluster/Brigade_raptakose_Cluster_Floorplan/typical_odd_tower_01.jpg`  },   // ← real path
      even: { image: `${IK}/Cluster/Brigade_raptakose_Cluster_Floorplan/typical_even_tower_01.jpg` },   // ← real path
      // Units that appear on ODD floors
      oddUnits: [
        { unitId: 'A01', label: 'Unit A-01', type: '3 BHK', area: '1,450 sq ft',
          points: '12,20 28,20 28,45 12,45' },  // placeholder polygon
        { unitId: 'A03', label: 'Unit A-03', type: '3 BHK', area: '1,480 sq ft',
          points: '32,20 48,20 48,45 32,45' },
        { unitId: 'A05', label: 'Unit A-05', type: '4 BHK', area: '1,820 sq ft',
          points: '52,20 72,20 72,45 52,45' },
        { unitId: 'A07', label: 'Unit A-07', type: '2 BHK', area: '1,150 sq ft',
          points: '12,52 28,52 28,76 12,76' },
      ],
      // Units that appear on EVEN floors
      evenUnits: [
        { unitId: 'A02', label: 'Unit A-02', type: '2 BHK', area: '1,120 sq ft',
          points: '12,20 28,20 28,45 12,45' },
        { unitId: 'A04', label: 'Unit A-04', type: '2 BHK', area: '1,090 sq ft',
          points: '32,20 48,20 48,45 32,45' },
        { unitId: 'A06', label: 'Unit A-06', type: '3 BHK', area: '1,390 sq ft',
          points: '52,20 72,20 72,45 52,45' },
        { unitId: 'A08', label: 'Unit A-08', type: '4 BHK', area: '1,760 sq ft',
          points: '12,52 28,52 28,76 12,76' },
      ],
    },

    'tower-B': {
      label: 'Tower B',
      odd:  { image: `${IK}/Cluster/Brigade_raptakose_Cluster_Floorplan/typical_odd_tower_02.jpg`  },
      even: { image: `${IK}/Cluster/Brigade_raptakose_Cluster_Floorplan/typical_even_tower_02.jpg` },
      oddUnits: [
        { unitId: 'B01', label: 'Unit B-01', type: '3 BHK', area: '1,450 sq ft',
          points: '12,20 28,20 28,45 12,45' },
        { unitId: 'B03', label: 'Unit B-03', type: '3 BHK', area: '1,480 sq ft',
          points: '32,20 48,20 48,45 32,45' },
        { unitId: 'B05', label: 'Unit B-05', type: '4 BHK', area: '1,820 sq ft',
          points: '52,20 72,20 72,45 52,45' },
        { unitId: 'B07', label: 'Unit B-07', type: '2 BHK', area: '1,150 sq ft',
          points: '12,52 28,52 28,76 12,76' },
      ],
      evenUnits: [
        { unitId: 'B02', label: 'Unit B-02', type: '2 BHK', area: '1,120 sq ft',
          points: '12,20 28,20 28,45 12,45' },
        { unitId: 'B04', label: 'Unit B-04', type: '2 BHK', area: '1,090 sq ft',
          points: '32,20 48,20 48,45 32,45' },
        { unitId: 'B06', label: 'Unit B-06', type: '3 BHK', area: '1,390 sq ft',
          points: '52,20 72,20 72,45 52,45' },
        { unitId: 'B08', label: 'Unit B-08', type: '4 BHK', area: '1,760 sq ft',
          points: '12,52 28,52 28,76 12,76' },
      ],
    },

    'tower-C': {
      label: 'Tower C',
      odd:  { image: `${IK}/Cluster/Brigade_raptakose_Cluster_Floorplan/typical_odd_tower_03.jpg`  },
      even: { image: `${IK}/Cluster/Brigade_raptakose_Cluster_Floorplan/typical_even_tower_03.jpg` },
      oddUnits: [
        { unitId: 'C01', label: 'Unit C-01', type: '3 BHK', area: '1,450 sq ft',
          points: '12,20 28,20 28,45 12,45' },
        { unitId: 'C03', label: 'Unit C-03', type: '3 BHK', area: '1,480 sq ft',
          points: '32,20 48,20 48,45 32,45' },
        { unitId: 'C05', label: 'Unit C-05', type: '4 BHK', area: '1,820 sq ft',
          points: '52,20 72,20 72,45 52,45' },
        { unitId: 'C07', label: 'Unit C-07', type: '2 BHK', area: '1,150 sq ft',
          points: '12,52 28,52 28,76 12,76' },
      ],
      evenUnits: [
        { unitId: 'C02', label: 'Unit C-02', type: '2 BHK', area: '1,120 sq ft',
          points: '12,20 28,20 28,45 12,45' },
        { unitId: 'C04', label: 'Unit C-04', type: '2 BHK', area: '1,090 sq ft',
          points: '32,20 48,20 48,45 32,45' },
        { unitId: 'C06', label: 'Unit C-06', type: '3 BHK', area: '1,390 sq ft',
          points: '52,20 72,20 72,45 52,45' },
        { unitId: 'C08', label: 'Unit C-08', type: '4 BHK', area: '1,760 sq ft',
          points: '12,52 28,52 28,76 12,76' },
      ],
    },

    'tower-D': {
      label: 'Tower D',
      odd:  { image: `${IK}/Cluster/Brigade_raptakose_Cluster_Floorplan/typical_odd_tower_04.jpg`  },
      even: { image: `${IK}/Cluster/Brigade_raptakose_Cluster_Floorplan/typical_even_tower_04.jpg` },
      oddUnits: [
        { unitId: 'D01', label: 'Unit D-01', type: '3 BHK', area: '1,450 sq ft',
          points: '12,20 28,20 28,45 12,45' },
        { unitId: 'D03', label: 'Unit D-03', type: '3 BHK', area: '1,480 sq ft',
          points: '32,20 48,20 48,45 32,45' },
        { unitId: 'D05', label: 'Unit D-05', type: '4 BHK', area: '1,820 sq ft',
          points: '52,20 72,20 72,45 52,45' },
        { unitId: 'D07', label: 'Unit D-07', type: '2 BHK', area: '1,150 sq ft',
          points: '12,52 28,52 28,76 12,76' },
      ],
      evenUnits: [
        { unitId: 'D02', label: 'Unit D-02', type: '2 BHK', area: '1,120 sq ft',
          points: '12,20 28,20 28,45 12,45' },
        { unitId: 'D04', label: 'Unit D-04', type: '2 BHK', area: '1,090 sq ft',
          points: '32,20 48,20 48,45 32,45' },
        { unitId: 'D06', label: 'Unit D-06', type: '3 BHK', area: '1,390 sq ft',
          points: '52,20 72,20 72,45 52,45' },
        { unitId: 'D08', label: 'Unit D-08', type: '4 BHK', area: '1,760 sq ft',
          points: '12,52 28,52 28,76 12,76' },
      ],
    },
  };

  // ─── LEVEL 2 — UNITS ───────────────────────────────────────────
  // Keyed by unitId (e.g. 'A01').  top/iso are the two view images.
  function unitImagePath(unitId, view) {
    // Convention: unit_A01_top.jpg / unit_A01_iso.jpg
    // Place all unit images in /Units/ folder on ImageKit
    return `${IK}/Units/unit_${unitId}_${view}.jpg`;
  }

  // ─── STATE ─────────────────────────────────────────────────────
  let level        = 0;        // 0 | 1 | 2
  let activeTower  = null;     // tower id string
  let activeFloor  = null;     // floor number (odd/even resolves cluster)
  let activeUnit   = null;     // unitId string
  let viewMode     = 'top';    // 'top' | 'iso'
  let overlayOpen  = false;

  // ─── HELPERS ───────────────────────────────────────────────────
  function isOdd(n)  { return n % 2 !== 0; }
  function getUnits(towerId, floor) {
    const t = TOWERS[towerId];
    if (!t) return [];
    if (floor === null) return t.evenUnits; // default to even when no floor given
    return isOdd(floor) ? t.oddUnits : t.evenUnits;
  }
  function getClusterImage(towerId, floor) {
    const t = TOWERS[towerId];
    if (!t) return '';
    if (floor === null) return t.even.image;
    return isOdd(floor) ? t.odd.image : t.even.image;
  }

  // ─── INJECT HTML & STYLES ──────────────────────────────────────
  function injectHTML() {
    if (document.getElementById('fp-overlay')) return;

    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap');

      /* ══ OVERLAY SHELL ══════════════════════════════════════════ */
      #fp-overlay {
        position: fixed;
        inset: 0;
        bottom: 62px;
        z-index: 200;
        background: #0a0805;
        display: flex;
        flex-direction: column;
        opacity: 0;
        pointer-events: none;
        transform: translateY(6px);
        transition: opacity 0.38s ease, transform 0.38s cubic-bezier(0.22, 1, 0.36, 1);
        font-family: 'Syne', sans-serif;
        overflow: hidden;
      }
      #fp-overlay.open {
        opacity: 1;
        pointer-events: all;
        transform: translateY(0);
      }

      /* ── TOPBAR ─────────────────────────────────────────────── */
      #fp-topbar {
        flex-shrink: 0;
        height: 56px;
        display: flex;
        align-items: center;
        padding: 0 20px;
        border-bottom: 1px solid rgba(200,190,154,.18);
        background: rgba(10,8,5,.92);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        gap: 14px;
        position: relative;
        z-index: 2;
      }
      #fp-topbar::after {
        content: '';
        position: absolute;
        bottom: -1px; left: 50%;
        transform: translateX(-50%);
        width: 80px; height: 1px;
        background: linear-gradient(to right, transparent, rgba(200,190,154,.55), transparent);
      }

      /* Back button */
      #fp-back {
        display: flex; align-items: center; gap: 7px;
        cursor: pointer;
        opacity: 0; pointer-events: none;
        transition: opacity 0.22s ease;
        flex-shrink: 0;
      }
      #fp-back.visible { opacity: 1; pointer-events: all; }
      #fp-back-arrow {
        width: 28px; height: 28px;
        border-radius: 6px;
        border: 1px solid rgba(200,190,154,.35);
        background: rgba(200,190,154,.08);
        display: flex; align-items: center; justify-content: center;
        transition: background 0.2s ease, border-color 0.2s ease;
      }
      #fp-back:hover #fp-back-arrow {
        background: rgba(200,190,154,.18);
        border-color: rgba(200,190,154,.65);
      }
      #fp-back-arrow svg {
        width: 13px; height: 13px;
        stroke: rgba(200,190,154,.80); fill: none;
        stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round;
      }
      #fp-back-label {
        font-size: 10px; font-weight: 600;
        letter-spacing: .12em; text-transform: uppercase;
        color: rgba(200,190,154,.65);
        transition: color 0.2s ease;
      }
      #fp-back:hover #fp-back-label { color: rgba(200,190,154,.95); }

      /* Pipe divider */
      .fp-pipe {
        width: 1px; height: 18px;
        background: rgba(200,190,154,.20);
        flex-shrink: 0;
        opacity: 0; transition: opacity 0.22s ease;
      }
      .fp-pipe.visible { opacity: 1; }

      /* Breadcrumb */
      #fp-breadcrumb {
        flex: 1;
        display: flex; align-items: center; gap: 8px;
        min-width: 0; overflow: hidden;
      }
      .fp-crumb {
        font-family: 'Cormorant Garamond', serif;
        font-size: 16px; font-weight: 400;
        color: rgba(200,190,154,.55);
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        cursor: pointer;
        transition: color 0.2s ease;
      }
      .fp-crumb.active {
        color: rgba(245,242,235,.90);
        cursor: default;
      }
      .fp-crumb:not(.active):hover { color: rgba(200,190,154,.85); }
      .fp-crumb-sep {
        font-family: 'Cormorant Garamond', serif;
        font-size: 14px;
        color: rgba(200,190,154,.28);
        flex-shrink: 0;
        opacity: 0; transition: opacity 0.22s ease;
      }
      .fp-crumb-sep.visible { opacity: 1; }

      /* Floor badge */
      #fp-floor-badge {
        flex-shrink: 0;
        padding: 4px 10px;
        border: 1px solid rgba(200,190,154,.22);
        border-radius: 4px;
        background: rgba(200,190,154,.07);
        font-family: 'Syne', sans-serif;
        font-size: 9px; font-weight: 700;
        letter-spacing: .14em; text-transform: uppercase;
        color: rgba(200,190,154,.55);
        opacity: 0; transition: opacity 0.22s ease;
      }
      #fp-floor-badge.visible { opacity: 1; }

      /* View toggle */
      #fp-view-toggle {
        flex-shrink: 0;
        display: flex;
        border: 1px solid rgba(200,190,154,.30);
        border-radius: 7px; overflow: hidden;
        opacity: 0; pointer-events: none;
        transition: opacity 0.28s ease;
      }
      #fp-view-toggle.visible { opacity: 1; pointer-events: all; }
      .fp-toggle-btn {
        padding: 6px 14px;
        font-family: 'Syne', sans-serif;
        font-size: 9.5px; font-weight: 700;
        letter-spacing: .13em; text-transform: uppercase;
        color: rgba(200,190,154,.55);
        cursor: pointer; background: transparent;
        border: none; outline: none;
        border-right: 1px solid rgba(200,190,154,.20);
        transition: background 0.2s ease, color 0.2s ease;
        white-space: nowrap;
      }
      .fp-toggle-btn:last-child { border-right: none; }
      .fp-toggle-btn.active {
        background: rgba(200,190,154,.14);
        color: rgba(245,242,235,.90);
      }
      .fp-toggle-btn:not(.active):hover {
        background: rgba(200,190,154,.07);
        color: rgba(200,190,154,.80);
      }

      /* Close */
      #fp-close {
        flex-shrink: 0;
        width: 30px; height: 30px;
        border-radius: 7px;
        border: 1px solid rgba(200,190,154,.25);
        background: rgba(200,190,154,.06);
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
        transition: background 0.2s ease, border-color 0.2s ease;
        margin-left: 6px;
      }
      #fp-close:hover {
        background: rgba(200,190,154,.16);
        border-color: rgba(200,190,154,.55);
      }
      #fp-close svg {
        width: 12px; height: 12px;
        stroke: rgba(200,190,154,.70); fill: none;
        stroke-width: 2; stroke-linecap: round;
      }

      /* ══ CONTENT PANE ══════════════════════════════════════════ */
      #fp-content {
        flex: 1;
        position: relative;
        overflow: hidden;
      }

      /* shared panel base */
      .fp-panel {
        position: absolute;
        inset: 0;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.30s ease, transform 0.30s cubic-bezier(0.22,1,0.36,1);
      }
      .fp-panel.enter  { opacity: 1; pointer-events: all; transform: translateX(0)  !important; }
      .fp-panel.exit-l { opacity: 0; transform: translateX(-32px); }
      .fp-panel.exit-r { opacity: 0; transform: translateX( 32px); }

      /* ── LEVEL 0 — SITEMAP ──────────────────────────────────── */
      #fp-panel-sitemap {
        display: flex;
        align-items: center;
        justify-content: center;
        background: #0a0805;
        transform: translateX(0);
      }
      #fp-sitemap-wrap {
        position: relative;
        display: inline-block;
        max-width: 100%;
        max-height: 100%;
      }
      #fp-sitemap-img {
        display: block;
        max-width: 100%;
        max-height: calc(100vh - 56px - 62px);
        object-fit: contain;
        border: 1px solid rgba(200,190,154,.12);
      }
      /* Tower tiles overlaid on sitemap */
      .fp-tower-tile {
        position: absolute;
        border: 1px solid rgba(200,190,154,.40);
        background: rgba(200,190,154,.06);
        backdrop-filter: blur(2px);
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.22s ease, border-color 0.22s ease, transform 0.22s ease;
        gap: 4px;
        padding: 8px;
        box-sizing: border-box;
      }
      .fp-tower-tile:hover {
        background: rgba(200,190,154,.18);
        border-color: rgba(200,190,154,.75);
        transform: scale(1.04);
      }
      .fp-tower-tile-label {
        font-family: 'Cormorant Garamond', serif;
        font-size: 13px; font-weight: 500;
        color: rgba(245,242,235,.85);
        white-space: nowrap;
        text-align: center;
      }
      .fp-tower-tile-sub {
        font-family: 'Syne', sans-serif;
        font-size: 7.5px; font-weight: 700;
        letter-spacing: .14em; text-transform: uppercase;
        color: rgba(200,190,154,.55);
        white-space: nowrap;
      }
      /* Hint label at bottom of sitemap */
      #fp-sitemap-hint {
        position: absolute;
        bottom: 18px; left: 50%;
        transform: translateX(-50%);
        font-family: 'Cormorant Garamond', serif;
        font-size: 12px; font-style: italic;
        color: rgba(200,190,154,.38);
        pointer-events: none;
        white-space: nowrap;
      }

      /* ── LEVEL 1 — CLUSTER ──────────────────────────────────── */
      #fp-panel-cluster {
        display: flex;
        align-items: center;
        justify-content: center;
        background: #0a0805;
        transform: translateX(32px);
      }
      #fp-cluster-wrap {
        position: relative;
        display: inline-block;
        max-width: 100%;
        max-height: 100%;
      }
      #fp-cluster-img {
        display: block;
        max-width: 100%;
        max-height: calc(100vh - 56px - 62px);
        object-fit: contain;
        border: 1px solid rgba(200,190,154,.12);
        transition: opacity 0.28s ease;
      }
      #fp-cluster-img.fading { opacity: 0; }

      /* SVG zone overlay — sits on top of the cluster image */
      #fp-zone-svg {
        position: absolute;
        top: 0; left: 0;
        width: 100%; height: 100%;
        pointer-events: none;
        overflow: visible;
      }
      .fp-zone {
        fill: rgba(200,190,154,.12);
        stroke: rgba(200,190,154,.55);
        stroke-width: 1.5;
        cursor: pointer;
        pointer-events: all;
        transition: fill 0.20s ease, stroke 0.20s ease;
      }
      .fp-zone:hover, .fp-zone.hovered {
        fill: rgba(200,190,154,.30);
        stroke: rgba(200,190,154,.95);
      }
      .fp-zone.selected {
        fill: rgba(200,190,154,.22);
        stroke: #e8dfc0;
        stroke-width: 2;
      }

      /* Zone tooltip */
      #fp-zone-tip {
        position: absolute;
        padding: 6px 12px;
        background: rgba(10,8,5,.88);
        border: 1px solid rgba(200,190,154,.40);
        border-radius: 4px;
        backdrop-filter: blur(8px);
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.18s ease;
        z-index: 10;
        white-space: nowrap;
      }
      #fp-zone-tip.visible { opacity: 1; }
      #fp-zone-tip-name {
        font-family: 'Cormorant Garamond', serif;
        font-size: 14px; font-weight: 500;
        color: rgba(245,242,235,.90);
        display: block;
      }
      #fp-zone-tip-type {
        font-family: 'Syne', sans-serif;
        font-size: 8.5px; font-weight: 700;
        letter-spacing: .12em; text-transform: uppercase;
        color: rgba(200,190,154,.60);
        display: block;
        margin-top: 2px;
      }

      /* ── LEVEL 2 — UNIT ─────────────────────────────────────── */
      #fp-panel-unit {
        display: flex;
        flex-direction: column;
        transform: translateX(32px);
      }
      #fp-plan-area {
        flex: 1;
        display: flex; align-items: center; justify-content: center;
        position: relative;
        overflow: hidden;
        padding: 24px;
        box-sizing: border-box;
      }
      #fp-plan-img {
        max-width: 100%; max-height: 100%;
        object-fit: contain;
        border: 1px solid rgba(200,190,154,.15);
        border-radius: 3px;
        box-shadow: 0 12px 60px rgba(0,0,0,.7);
        opacity: 1; transition: opacity 0.28s ease;
        background: rgba(200,190,154,.03);
      }
      #fp-plan-img.fading { opacity: 0; }
      /* Unit info badge */
      #fp-unit-info {
        position: absolute;
        bottom: 28px; left: 32px;
        display: flex; flex-direction: column; gap: 4px;
        opacity: 0; transform: translateY(6px);
        transition: opacity 0.30s ease 0.12s, transform 0.30s ease 0.12s;
        pointer-events: none;
      }
      #fp-unit-info.visible { opacity: 1; transform: translateY(0); }
      #fp-unit-info-name {
        font-family: 'Cormorant Garamond', serif;
        font-size: 22px; font-weight: 300; font-style: italic;
        color: rgba(245,242,235,.75); line-height: 1;
      }
      #fp-unit-info-type {
        font-family: 'Syne', sans-serif;
        font-size: 9px; font-weight: 600;
        letter-spacing: .16em; text-transform: uppercase;
        color: rgba(200,190,154,.55);
      }
      #fp-unit-info-area {
        font-family: 'Syne', sans-serif;
        font-size: 9px; font-weight: 400;
        letter-spacing: .10em;
        color: rgba(200,190,154,.38);
      }

      /* ── Spinner ──────────────────────────────────────────────── */
      #fp-spinner {
        position: absolute;
        inset: 0;
        display: flex; align-items: center; justify-content: center;
        background: rgba(10,8,5,.50);
        opacity: 0; pointer-events: none;
        transition: opacity 0.22s ease;
        z-index: 5;
      }
      #fp-spinner.visible { opacity: 1; }
      #fp-spinner-ring {
        width: 34px; height: 34px;
        border: 2px solid rgba(200,190,154,.20);
        border-top-color: rgba(200,190,154,.85);
        border-radius: 50%;
        animation: fpSpin 0.72s linear infinite;
      }
      @keyframes fpSpin { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);

    document.body.insertAdjacentHTML('beforeend', `
      <div id="fp-overlay">

        <!-- TOPBAR -->
        <div id="fp-topbar">

          <div id="fp-back">
            <div id="fp-back-arrow">
              <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
            </div>
            <span id="fp-back-label">Back</span>
          </div>

          <div class="fp-pipe" id="fp-pipe1"></div>

          <div id="fp-breadcrumb">
            <span class="fp-crumb active" id="fp-crumb-0" data-level="0">Site Plan</span>
            <span class="fp-crumb-sep" id="fp-sep-1">›</span>
            <span class="fp-crumb"      id="fp-crumb-1" data-level="1"></span>
            <span class="fp-crumb-sep" id="fp-sep-2">›</span>
            <span class="fp-crumb"      id="fp-crumb-2" data-level="2"></span>
          </div>

          <div id="fp-floor-badge"></div>

          <div id="fp-view-toggle">
            <button class="fp-toggle-btn active" data-view="top">Top View</button>
            <button class="fp-toggle-btn"        data-view="iso">Isometric</button>
          </div>

          <div id="fp-close">
            <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </div>

        </div>

        <!-- CONTENT -->
        <div id="fp-content">
          <div id="fp-spinner"><div id="fp-spinner-ring"></div></div>

          <!-- LEVEL 0 — SITEMAP -->
          <div id="fp-panel-sitemap" class="fp-panel">
            <div id="fp-sitemap-wrap">
              <img id="fp-sitemap-img" src="${SITEMAP.image}" alt="Site Plan" />
              <div id="fp-sitemap-hint">Select a tower to explore floor plans</div>
              <!-- tower tiles injected by JS -->
            </div>
          </div>

          <!-- LEVEL 1 — CLUSTER -->
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

          <!-- LEVEL 2 — UNIT -->
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

  // ─── PANEL TRANSITIONS ─────────────────────────────────────────
  // direction: 'forward' (drill in) | 'back' (drill out)
  function showPanel(id, direction) {
    const panels = ['fp-panel-sitemap', 'fp-panel-cluster', 'fp-panel-unit'];
    panels.forEach(pid => {
      const el = document.getElementById(pid);
      if (!el) return;
      el.classList.remove('enter', 'exit-l', 'exit-r');
      if (pid === id) {
        el.classList.add('enter');
      } else {
        el.classList.add(direction === 'forward' ? 'exit-l' : 'exit-r');
      }
    });
  }

  // ─── BUILD SITEMAP TOWER TILES ─────────────────────────────────
  function buildSitemapTiles() {
    const wrap = document.getElementById('fp-sitemap-wrap');
    // Remove existing tiles
    wrap.querySelectorAll('.fp-tower-tile').forEach(t => t.remove());

    const img = document.getElementById('fp-sitemap-img');

    function placeTiles() {
      const iw = img.offsetWidth;
      const ih = img.offsetHeight;

      SITEMAP.towerTiles.forEach(tile => {
        const el = document.createElement('div');
        el.className = 'fp-tower-tile';
        el.dataset.towerId = tile.id;
        el.style.left   = (tile.x / 100 * iw) + 'px';
        el.style.top    = (tile.y / 100 * ih) + 'px';
        el.style.width  = (tile.w / 100 * iw) + 'px';
        el.style.height = (tile.h / 100 * ih) + 'px';
        el.innerHTML = `
          <span class="fp-tower-tile-label">${tile.label}</span>
          <span class="fp-tower-tile-sub">Explore</span>
        `;
        el.addEventListener('click', () => drillToCluster(tile.id));
        wrap.appendChild(el);
      });
    }

    if (img.complete && img.naturalWidth > 0) {
      placeTiles();
    } else {
      img.addEventListener('load', placeTiles, { once: true });
    }

    // Re-place on resize
    const ro = new ResizeObserver(placeTiles);
    ro.observe(img);
  }

  // ─── LEVEL 0 → 1 : DRILL TO CLUSTER ──────────────────────────
  function drillToCluster(towerId, floorNum) {
    activeTower = towerId;
    activeFloor = (floorNum !== undefined) ? floorNum : null;

    const tower = TOWERS[towerId];
    if (!tower) return;

    // Load cluster image
    const clusterImg = document.getElementById('fp-cluster-img');
    clusterImg.classList.add('fading');
    const newSrc = getClusterImage(towerId, activeFloor);
    setTimeout(() => {
      clusterImg.src = newSrc;
      clusterImg.onload = () => {
        clusterImg.classList.remove('fading');
        buildZones(towerId, activeFloor);
      };
      clusterImg.onerror = () => {
        clusterImg.classList.remove('fading');
        buildZones(towerId, activeFloor);
      };
    }, 220);

    level = 1;
    showPanel('fp-panel-cluster', 'forward');
    updateTopbar();
  }

  // ─── BUILD ZONE POLYGONS ON CLUSTER SVG ───────────────────────
  function buildZones(towerId, floorNum) {
    const svg = document.getElementById('fp-zone-svg');
    svg.innerHTML = '';

    const units = getUnits(towerId, floorNum);
    units.forEach(u => {
      const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      poly.setAttribute('class', 'fp-zone');
      poly.setAttribute('points', u.points);
      poly.dataset.unitId = u.unitId;

      // Tooltip
      poly.addEventListener('mouseenter', (e) => showZoneTip(u, e));
      poly.addEventListener('mousemove',  (e) => moveZoneTip(e));
      poly.addEventListener('mouseleave', hideZoneTip);

      poly.addEventListener('click', () => drillToUnit(u));
      svg.appendChild(poly);
    });
  }

  // ─── ZONE TOOLTIP ─────────────────────────────────────────────
  function showZoneTip(u, e) {
    document.getElementById('fp-zone-tip-name').textContent = u.label;
    document.getElementById('fp-zone-tip-type').textContent = `${u.type}  ·  ${u.area}`;
    const tip = document.getElementById('fp-zone-tip');
    tip.classList.add('visible');
    moveZoneTip(e);
  }
  function moveZoneTip(e) {
    const wrap = document.getElementById('fp-cluster-wrap');
    const rect = wrap.getBoundingClientRect();
    const tip  = document.getElementById('fp-zone-tip');
    const x = e.clientX - rect.left + 14;
    const y = e.clientY - rect.top  - 14;
    tip.style.left = x + 'px';
    tip.style.top  = y + 'px';
  }
  function hideZoneTip() {
    document.getElementById('fp-zone-tip').classList.remove('visible');
  }

  // ─── LEVEL 1 → 2 : DRILL TO UNIT ─────────────────────────────
  function drillToUnit(unitData) {
    activeUnit = unitData;
    viewMode   = 'top';

    document.querySelectorAll('.fp-toggle-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.view === 'top');
    });

    document.getElementById('fp-unit-info-name').textContent = unitData.label;
    document.getElementById('fp-unit-info-type').textContent = unitData.type;
    document.getElementById('fp-unit-info-area').textContent = unitData.area;
    document.getElementById('fp-unit-info').classList.add('visible');

    level = 2;
    showPanel('fp-panel-unit', 'forward');
    updateTopbar();
    loadUnitImage();
  }

  // ─── LOAD UNIT PLAN IMAGE ─────────────────────────────────────
  function loadUnitImage() {
    if (!activeUnit) return;
    const img     = document.getElementById('fp-plan-img');
    const spinner = document.getElementById('fp-spinner');
    const src     = unitImagePath(activeUnit.unitId, viewMode);

    img.classList.add('fading');
    spinner.classList.add('visible');

    setTimeout(() => {
      img.src = src;
      img.onload = () => {
        img.classList.remove('fading');
        spinner.classList.remove('visible');
      };
      img.onerror = () => {
        img.classList.remove('fading');
        spinner.classList.remove('visible');
      };
    }, 280);
  }

  // ─── BACK NAV ─────────────────────────────────────────────────
  function goBack() {
    if (level === 2) {
      level = 1;
      activeUnit = null;
      document.getElementById('fp-unit-info').classList.remove('visible');
      showPanel('fp-panel-cluster', 'back');
      updateTopbar();
    } else if (level === 1) {
      level = 0;
      activeTower = null;
      activeFloor = null;
      showPanel('fp-panel-sitemap', 'back');
      updateTopbar();
    }
  }

  // ─── UPDATE TOPBAR FOR CURRENT LEVEL ──────────────────────────
  function updateTopbar() {
    const back        = document.getElementById('fp-back');
    const pipe1       = document.getElementById('fp-pipe1');
    const crumb0      = document.getElementById('fp-crumb-0');
    const sep1        = document.getElementById('fp-sep-1');
    const crumb1      = document.getElementById('fp-crumb-1');
    const sep2        = document.getElementById('fp-sep-2');
    const crumb2      = document.getElementById('fp-crumb-2');
    const floorBadge  = document.getElementById('fp-floor-badge');
    const viewToggle  = document.getElementById('fp-view-toggle');

    // Reset all
    [crumb0, crumb1, crumb2].forEach(c => c.classList.remove('active'));
    [sep1, sep2].forEach(s => s.classList.remove('visible'));
    crumb1.textContent = '';
    crumb2.textContent = '';

    if (level === 0) {
      back.classList.remove('visible');
      pipe1.classList.remove('visible');
      crumb0.classList.add('active');
      floorBadge.classList.remove('visible');
      viewToggle.classList.remove('visible');
      document.getElementById('fp-back-label').textContent = 'Back';

    } else if (level === 1) {
      back.classList.add('visible');
      pipe1.classList.add('visible');
      document.getElementById('fp-back-label').textContent = 'Site Plan';

      crumb0.classList.remove('active');
      sep1.classList.add('visible');
      crumb1.textContent = TOWERS[activeTower]?.label || '';
      crumb1.classList.add('active');

      // Floor badge
      if (activeFloor !== null) {
        const parity = isOdd(activeFloor) ? 'Odd' : 'Even';
        floorBadge.textContent = `Floor ${activeFloor}  ·  ${parity}`;
        floorBadge.classList.add('visible');
      } else {
        floorBadge.classList.remove('visible');
      }

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

      viewToggle.classList.add('visible');
    }
  }

  // ─── OPEN / CLOSE ─────────────────────────────────────────────
  function open(floorNum) {
    if (overlayOpen) return;
    overlayOpen = true;

    // Reset to level 0 (sitemap) always
    level = 0;
    activeTower = null;
    activeFloor = (floorNum !== undefined) ? floorNum : null;
    activeUnit  = null;
    viewMode    = 'top';

    // If a floor number was supplied, we can skip sitemap and go straight
    // to tower selection — but since tile positions aren't known yet we stay at 0.
    // To auto-open a specific tower: FloorplanModule.openTower('tower-A', 3);

    buildSitemapTiles();
    showPanel('fp-panel-sitemap', 'forward');
    updateTopbar();
    document.getElementById('fp-overlay').classList.add('open');
  }

  function close() {
    if (!overlayOpen) return;
    overlayOpen = false;
    document.getElementById('fp-overlay').classList.remove('open');
    setTimeout(() => {
      level = 0;
      activeTower = null;
      activeFloor = null;
      activeUnit  = null;
      viewMode    = 'top';
    }, 420);
  }

  // ─── BIND EVENTS ──────────────────────────────────────────────
  function bindEvents() {
    document.getElementById('fp-close').addEventListener('click', close);
    document.getElementById('fp-back').addEventListener('click', goBack);

    // Breadcrumb clicks
    document.getElementById('fp-crumb-0').addEventListener('click', () => {
      if (level > 0) { level = 0; showPanel('fp-panel-sitemap', 'back'); updateTopbar(); }
    });
    document.getElementById('fp-crumb-1').addEventListener('click', () => {
      if (level === 2) goBack();
    });

    // View toggle
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

  // ─── PUBLIC API ────────────────────────────────────────────────
  return {
    init() {
      injectHTML();
      bindEvents();
    },

    // Default open — shows sitemap (Level 0)
    open,
    close,
    toggle() { overlayOpen ? close() : open(); },

    // Jump straight to a tower's cluster (skips sitemap)
    // floorNum optional — determines odd/even cluster image
    openTower(towerId, floorNum) {
      if (!overlayOpen) {
        open();
        setTimeout(() => drillToCluster(towerId, floorNum), 50);
      } else {
        drillToCluster(towerId, floorNum);
      }
    },

    // Jump straight to a unit (skips sitemap + cluster)
    openUnit(towerId, unitData, floorNum) {
      if (!overlayOpen) {
        open();
        setTimeout(() => {
          activeTower = towerId;
          activeFloor = floorNum ?? null;
          drillToUnit(unitData);
        }, 50);
      } else {
        activeTower = towerId;
        activeFloor = floorNum ?? null;
        drillToUnit(unitData);
      }
    },

    // Expose config for external updates
    TOWERS,
    SITEMAP,
  };

})();