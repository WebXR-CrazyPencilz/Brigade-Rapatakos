// floorplan.js — Floor Plan viewer with cluster → unit drill-down
window.FloorplanModule = (function () {

  // ─── CONFIG ──────────────────────────────────────────────────────
  // Cluster plans (the "bird's-eye" view images shown first)
  const CLUSTERS = [
    {
      id: 'tower-02',
      label: 'Tower 02 — Even',
      thumb: 'https://ik.imagekit.io/pwzaetheh/Cluster/enlarged_tower_even_02.jpg',
      image: 'https://ik.imagekit.io/pwzaetheh/Cluster/enlarged_tower_even_02.jpg',
      units: [2, 4, 6, 8],
    },
    {
      id: 'tower-03',
      label: 'Tower 03 — Even',
      thumb: 'https://ik.imagekit.io/pwzaetheh/Cluster/enlarged_tower_even_03.jpg',
      image: 'https://ik.imagekit.io/pwzaetheh/Cluster/enlarged_tower_even_03.jpg',
      units: [1, 3, 5, 7],
    },
  ];

  // Unit plans — each unit has a top-view and an isometric view
  const UNITS = {
    1: { label: 'Unit 01', type: '3 BHK', area: '1,450 sq ft', top: 'floorplans/units/unit01_top.jpg',  iso: 'floorplans/units/unit01_iso.jpg'  },
    2: { label: 'Unit 02', type: '2 BHK', area: '1,120 sq ft', top: 'floorplans/units/unit02_top.jpg',  iso: 'floorplans/units/unit02_iso.jpg'  },
    3: { label: 'Unit 03', type: '3 BHK', area: '1,480 sq ft', top: 'floorplans/units/unit03_top.jpg',  iso: 'floorplans/units/unit03_iso.jpg'  },
    4: { label: 'Unit 04', type: '2 BHK', area: '1,090 sq ft', top: 'floorplans/units/unit04_top.jpg',  iso: 'floorplans/units/unit04_iso.jpg'  },
    5: { label: 'Unit 05', type: '4 BHK', area: '1,820 sq ft', top: 'floorplans/units/unit05_top.jpg',  iso: 'floorplans/units/unit05_iso.jpg'  },
    6: { label: 'Unit 06', type: '3 BHK', area: '1,390 sq ft', top: 'floorplans/units/unit06_top.jpg',  iso: 'floorplans/units/unit06_iso.jpg'  },
    7: { label: 'Unit 07', type: '2 BHK', area: '1,150 sq ft', top: 'floorplans/units/unit07_top.jpg',  iso: 'floorplans/units/unit07_iso.jpg'  },
    8: { label: 'Unit 08', type: '4 BHK', area: '1,760 sq ft', top: 'floorplans/units/unit08_top.jpg',  iso: 'floorplans/units/unit08_iso.jpg'  },
  };

  // ─── STATE ───────────────────────────────────────────────────────
  let activeCluster  = null;   // cluster id string
  let activeUnit     = null;   // unit number
  let viewMode       = 'top';  // 'top' | 'iso'
  let overlayOpen    = false;

  // ─── INJECT HTML & STYLES ────────────────────────────────────────
  function injectHTML() {
    if (document.getElementById('fp-overlay')) return;

    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;1,300;1,400&display=swap');

      /* ══ OVERLAY SHELL ══════════════════════════════════════════ */
      #fp-overlay {
        position: fixed;
        inset: 0;
        bottom: 62px;       /* sit above the home.js bottom panel */
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

      /* ── Top chrome bar ────────────────────────────────────────── */
      #fp-topbar {
        flex-shrink: 0;
        height: 56px;
        display: flex;
        align-items: center;
        padding: 0 20px;
        border-bottom: 1px solid rgba(200, 190, 154, 0.18);
        background: rgba(10, 8, 5, 0.92);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        gap: 14px;
        position: relative;
        z-index: 2;
      }

      /* Back button */
      #fp-back {
        display: flex;
        align-items: center;
        gap: 7px;
        cursor: pointer;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.22s ease;
        flex-shrink: 0;
      }

      #fp-back.visible {
        opacity: 1;
        pointer-events: all;
      }

      #fp-back-arrow {
        width: 28px;
        height: 28px;
        border-radius: 6px;
        border: 1px solid rgba(200, 190, 154, 0.35);
        background: rgba(200, 190, 154, 0.08);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.2s ease, border-color 0.2s ease;
      }

      #fp-back:hover #fp-back-arrow {
        background: rgba(200, 190, 154, 0.18);
        border-color: rgba(200, 190, 154, 0.65);
      }

      #fp-back-arrow svg {
        width: 13px;
        height: 13px;
        stroke: rgba(200, 190, 154, 0.80);
        fill: none;
        stroke-width: 1.8;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      #fp-back-label {
        font-size: 10px;
        font-weight: 600;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: rgba(200, 190, 154, 0.65);
        transition: color 0.2s ease;
      }

      #fp-back:hover #fp-back-label { color: rgba(200, 190, 154, 0.95); }

      /* Divider pipe */
      .fp-pipe {
        width: 1px;
        height: 18px;
        background: rgba(200, 190, 154, 0.20);
        flex-shrink: 0;
        opacity: 0;
        transition: opacity 0.22s ease;
      }

      .fp-pipe.visible { opacity: 1; }

      /* Breadcrumb / title */
      #fp-breadcrumb {
        flex: 1;
        display: flex;
        align-items: center;
        gap: 8px;
        min-width: 0;
        overflow: hidden;
      }

      #fp-crumb-cluster {
        font-family: 'Cormorant Garamond', serif;
        font-size: 16px;
        font-weight: 400;
        color: rgba(200, 190, 154, 0.55);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        cursor: pointer;
        transition: color 0.2s ease;
      }

      #fp-crumb-cluster.top-level {
        color: rgba(200, 190, 154, 0.90);
        cursor: default;
      }

      #fp-crumb-cluster:not(.top-level):hover { color: rgba(200, 190, 154, 0.85); }

      #fp-crumb-sep {
        font-family: 'Cormorant Garamond', serif;
        font-size: 14px;
        color: rgba(200, 190, 154, 0.28);
        opacity: 0;
        transition: opacity 0.22s ease;
        flex-shrink: 0;
      }

      #fp-crumb-sep.visible { opacity: 1; }

      #fp-crumb-unit {
        font-family: 'Cormorant Garamond', serif;
        font-size: 16px;
        font-weight: 500;
        color: rgba(245, 242, 235, 0.90);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        opacity: 0;
        transition: opacity 0.22s ease;
      }

      #fp-crumb-unit.visible { opacity: 1; }

      /* View toggle (Top / Isometric) */
      #fp-view-toggle {
        flex-shrink: 0;
        display: flex;
        align-items: center;
        gap: 0;
        border: 1px solid rgba(200, 190, 154, 0.30);
        border-radius: 7px;
        overflow: hidden;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.28s ease;
      }

      #fp-view-toggle.visible {
        opacity: 1;
        pointer-events: all;
      }

      .fp-toggle-btn {
        padding: 6px 14px;
        font-family: 'Syne', sans-serif;
        font-size: 9.5px;
        font-weight: 700;
        letter-spacing: 0.13em;
        text-transform: uppercase;
        color: rgba(200, 190, 154, 0.55);
        cursor: pointer;
        background: transparent;
        border: none;
        outline: none;
        border-right: 1px solid rgba(200, 190, 154, 0.20);
        transition: background 0.2s ease, color 0.2s ease;
        white-space: nowrap;
      }

      .fp-toggle-btn:last-child { border-right: none; }

      .fp-toggle-btn.active {
        background: rgba(200, 190, 154, 0.14);
        color: rgba(245, 242, 235, 0.90);
      }

      .fp-toggle-btn:not(.active):hover {
        background: rgba(200, 190, 154, 0.07);
        color: rgba(200, 190, 154, 0.80);
      }

      /* Close button */
      #fp-close {
        flex-shrink: 0;
        width: 30px;
        height: 30px;
        border-radius: 7px;
        border: 1px solid rgba(200, 190, 154, 0.25);
        background: rgba(200, 190, 154, 0.06);
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        transition: background 0.2s ease, border-color 0.2s ease;
        margin-left: 6px;
      }

      #fp-close:hover {
        background: rgba(200, 190, 154, 0.16);
        border-color: rgba(200, 190, 154, 0.55);
      }

      #fp-close svg {
        width: 12px;
        height: 12px;
        stroke: rgba(200, 190, 154, 0.70);
        fill: none;
        stroke-width: 2;
        stroke-linecap: round;
      }

      /* ══ CONTENT AREA ═══════════════════════════════════════════ */
      #fp-content {
        flex: 1;
        position: relative;
        overflow: hidden;
      }

      /* ── CLUSTER VIEW ── */
      #fp-cluster-view {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        opacity: 1;
        transform: translateX(0);
        transition: opacity 0.30s ease, transform 0.30s cubic-bezier(0.22, 1, 0.36, 1);
      }

      #fp-cluster-view.slide-out {
        opacity: 0;
        transform: translateX(-32px);
        pointer-events: none;
      }

      /* Cluster header instruction */
      #fp-cluster-hint {
        text-align: center;
        padding: 22px 20px 14px;
        font-family: 'Cormorant Garamond', serif;
        font-size: 13px;
        font-style: italic;
        color: rgba(200, 190, 154, 0.40);
        letter-spacing: 0.04em;
        flex-shrink: 0;
      }

      /* Grid of cluster cards */
      #fp-cluster-grid {
        flex: 1;
        display: flex;
        flex-direction: row;
        align-items: stretch;
        gap: 0;
        overflow: hidden;
      }

      .fp-cluster-card {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        padding: 28px 24px 32px;
        border-right: 1px solid rgba(200, 190, 154, 0.10);
        position: relative;
        overflow: hidden;
        transition: background 0.28s ease;
        gap: 0;
      }

      .fp-cluster-card:last-child { border-right: none; }

      .fp-cluster-card::before {
        content: '';
        position: absolute;
        inset: 0;
        background: radial-gradient(ellipse at center bottom, rgba(200, 190, 154, 0.06) 0%, transparent 70%);
        opacity: 0;
        transition: opacity 0.32s ease;
      }

      .fp-cluster-card:hover::before { opacity: 1; }

      .fp-cluster-card:hover { background: rgba(200, 190, 154, 0.04); }

      /* Image container with gold frame */
      .fp-cluster-img-wrap {
        position: relative;
        width: 100%;
        max-width: 340px;
        aspect-ratio: 4 / 3;
        border: 1px solid rgba(200, 190, 154, 0.22);
        border-radius: 4px;
        overflow: hidden;
        background: rgba(200, 190, 154, 0.04);
        box-shadow:
          0 0 0 1px rgba(200, 190, 154, 0.06),
          0 8px 40px rgba(0, 0, 0, 0.55),
          inset 0 0 0 1px rgba(255, 255, 255, 0.02);
        transition: border-color 0.28s ease, box-shadow 0.28s ease;
        flex-shrink: 0;
      }

      .fp-cluster-card:hover .fp-cluster-img-wrap {
        border-color: rgba(200, 190, 154, 0.45);
        box-shadow:
          0 0 0 1px rgba(200, 190, 154, 0.12),
          0 12px 50px rgba(0, 0, 0, 0.65),
          0 0 28px rgba(200, 190, 154, 0.08);
      }

      .fp-cluster-img {
        width: 100%;
        height: 100%;
        object-fit: contain;
        object-position: center;
        display: block;
        padding: 12px;
        box-sizing: border-box;
        filter: brightness(0.92) contrast(1.05);
        transition: filter 0.28s ease, transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
      }

      .fp-cluster-card:hover .fp-cluster-img {
        filter: brightness(1.0) contrast(1.05);
        transform: scale(1.03);
      }

      /* Explore hint overlay on image */
      .fp-cluster-explore {
        position: absolute;
        bottom: 10px;
        right: 10px;
        padding: 4px 9px;
        background: rgba(10, 8, 5, 0.75);
        border: 1px solid rgba(200, 190, 154, 0.30);
        border-radius: 3px;
        font-family: 'Syne', sans-serif;
        font-size: 8.5px;
        font-weight: 700;
        letter-spacing: 0.15em;
        text-transform: uppercase;
        color: rgba(200, 190, 154, 0.75);
        opacity: 0;
        transform: translateY(4px);
        transition: opacity 0.22s ease, transform 0.22s ease;
        backdrop-filter: blur(6px);
      }

      .fp-cluster-card:hover .fp-cluster-explore {
        opacity: 1;
        transform: translateY(0);
      }

      /* Cluster title & meta */
      .fp-cluster-label {
        margin-top: 20px;
        font-family: 'Cormorant Garamond', serif;
        font-size: 18px;
        font-weight: 400;
        color: rgba(245, 242, 235, 0.80);
        letter-spacing: 0.04em;
        text-align: center;
        transition: color 0.22s ease;
      }

      .fp-cluster-card:hover .fp-cluster-label { color: rgba(245, 242, 235, 0.96); }

      .fp-cluster-units-tag {
        margin-top: 7px;
        font-family: 'Syne', sans-serif;
        font-size: 9px;
        font-weight: 600;
        letter-spacing: 0.18em;
        text-transform: uppercase;
        color: rgba(200, 190, 154, 0.45);
        text-align: center;
        transition: color 0.22s ease;
      }

      .fp-cluster-card:hover .fp-cluster-units-tag { color: rgba(200, 190, 154, 0.70); }

      /* ── UNIT DETAIL VIEW ── */
      #fp-unit-view {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        opacity: 0;
        transform: translateX(32px);
        pointer-events: none;
        transition: opacity 0.30s ease, transform 0.30s cubic-bezier(0.22, 1, 0.36, 1);
      }

      #fp-unit-view.active {
        opacity: 1;
        transform: translateX(0);
        pointer-events: all;
      }

      /* Unit picker strip */
      #fp-unit-strip {
        flex-shrink: 0;
        display: flex;
        flex-direction: row;
        align-items: stretch;
        border-bottom: 1px solid rgba(200, 190, 154, 0.12);
        background: rgba(10, 8, 5, 0.6);
        overflow-x: auto;
        scrollbar-width: none;
      }

      #fp-unit-strip::-webkit-scrollbar { display: none; }

      .fp-unit-tab {
        flex-shrink: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 11px 18px;
        cursor: pointer;
        border-right: 1px solid rgba(200, 190, 154, 0.10);
        position: relative;
        transition: background 0.20s ease;
        gap: 3px;
        min-width: 80px;
      }

      .fp-unit-tab:last-child { border-right: none; }

      .fp-unit-tab::after {
        content: '';
        position: absolute;
        bottom: 0; left: 0; right: 0;
        height: 2px;
        background: transparent;
        transition: background 0.22s ease;
      }

      .fp-unit-tab:hover { background: rgba(200, 190, 154, 0.06); }

      .fp-unit-tab.active {
        background: rgba(200, 190, 154, 0.10);
      }

      .fp-unit-tab.active::after {
        background: linear-gradient(to right, #e8dfc0, #c8be9a, #e8dfc0);
      }

      .fp-unit-tab-num {
        font-family: 'Syne', sans-serif;
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        color: rgba(200, 190, 154, 0.50);
        transition: color 0.20s ease;
      }

      .fp-unit-tab.active .fp-unit-tab-num,
      .fp-unit-tab:hover .fp-unit-tab-num { color: rgba(200, 190, 154, 0.90); }

      .fp-unit-tab-type {
        font-family: 'Cormorant Garamond', serif;
        font-size: 11px;
        font-weight: 400;
        color: rgba(200, 190, 154, 0.32);
        transition: color 0.20s ease;
        white-space: nowrap;
      }

      .fp-unit-tab.active .fp-unit-tab-type,
      .fp-unit-tab:hover .fp-unit-tab-type { color: rgba(200, 190, 154, 0.65); }

      /* Plan canvas area */
      #fp-plan-area {
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
        position: relative;
        overflow: hidden;
        padding: 24px;
        box-sizing: border-box;
      }

      /* Plan image with fade swap */
      #fp-plan-img {
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
        border: 1px solid rgba(200, 190, 154, 0.15);
        border-radius: 3px;
        box-shadow: 0 12px 60px rgba(0, 0, 0, 0.7);
        opacity: 1;
        transition: opacity 0.28s ease;
        background: rgba(200, 190, 154, 0.03);
      }

      #fp-plan-img.fading { opacity: 0; }

      /* Unit info badge — bottom left of plan area */
      #fp-unit-info {
        position: absolute;
        bottom: 28px;
        left: 32px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        opacity: 0;
        transform: translateY(6px);
        transition: opacity 0.30s ease 0.12s, transform 0.30s ease 0.12s;
        pointer-events: none;
      }

      #fp-unit-info.visible {
        opacity: 1;
        transform: translateY(0);
      }

      #fp-unit-info-name {
        font-family: 'Cormorant Garamond', serif;
        font-size: 22px;
        font-weight: 300;
        font-style: italic;
        color: rgba(245, 242, 235, 0.75);
        line-height: 1;
      }

      #fp-unit-info-type {
        font-family: 'Syne', sans-serif;
        font-size: 9px;
        font-weight: 600;
        letter-spacing: 0.16em;
        text-transform: uppercase;
        color: rgba(200, 190, 154, 0.55);
      }

      #fp-unit-info-area {
        font-family: 'Syne', sans-serif;
        font-size: 9px;
        font-weight: 400;
        letter-spacing: 0.10em;
        color: rgba(200, 190, 154, 0.38);
      }

      /* ── Spinner ── */
      #fp-spinner {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(10, 8, 5, 0.50);
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.22s ease;
        z-index: 5;
      }

      #fp-spinner.visible { opacity: 1; }

      #fp-spinner-ring {
        width: 34px;
        height: 34px;
        border: 2px solid rgba(200, 190, 154, 0.20);
        border-top-color: rgba(200, 190, 154, 0.85);
        border-radius: 50%;
        animation: fpSpin 0.72s linear infinite;
      }

      @keyframes fpSpin { to { transform: rotate(360deg); } }

      /* ── Gold line ornament (bottom of topbar) ── */
      #fp-topbar::after {
        content: '';
        position: absolute;
        bottom: -1px;
        left: 50%;
        transform: translateX(-50%);
        width: 80px;
        height: 1px;
        background: linear-gradient(to right, transparent, rgba(200, 190, 154, 0.55), transparent);
      }
    `;
    document.head.appendChild(style);

    document.body.insertAdjacentHTML('beforeend', `
      <div id="fp-overlay">

        <!-- Top chrome -->
        <div id="fp-topbar">
          <div id="fp-back">
            <div id="fp-back-arrow">
              <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
            </div>
            <span id="fp-back-label">Cluster Plan</span>
          </div>

          <div class="fp-pipe" id="fp-pipe"></div>

          <div id="fp-breadcrumb">
            <span id="fp-crumb-cluster" class="top-level">Floor Plans</span>
            <span id="fp-crumb-sep">›</span>
            <span id="fp-crumb-unit"></span>
          </div>

          <div id="fp-view-toggle">
            <button class="fp-toggle-btn active" data-view="top">Top View</button>
            <button class="fp-toggle-btn" data-view="iso">Isometric</button>
          </div>

          <div id="fp-close">
            <svg viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </div>
        </div>

        <!-- Content -->
        <div id="fp-content">
          <div id="fp-spinner"><div id="fp-spinner-ring"></div></div>

          <!-- CLUSTER VIEW -->
          <div id="fp-cluster-view">
            <p id="fp-cluster-hint">Select a cluster to explore individual unit plans</p>
            <div id="fp-cluster-grid"></div>
          </div>

          <!-- UNIT DETAIL VIEW -->
          <div id="fp-unit-view">
            <div id="fp-unit-strip"></div>
            <div id="fp-plan-area">
              <img id="fp-plan-img" src="" alt="Floor Plan" />
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

  // ─── BUILD CLUSTER GRID ──────────────────────────────────────────
  function buildClusterGrid() {
    const grid = document.getElementById('fp-cluster-grid');
    if (!grid) return;
    grid.innerHTML = '';

    CLUSTERS.forEach(cluster => {
      const card = document.createElement('div');
      card.className = 'fp-cluster-card';
      card.dataset.clusterId = cluster.id;
      card.innerHTML = `
        <div class="fp-cluster-img-wrap">
          <img class="fp-cluster-img" src="${cluster.image}" alt="${cluster.label}" />
          <div class="fp-cluster-explore">Explore Units</div>
        </div>
        <div class="fp-cluster-label">${cluster.label}</div>
        <div class="fp-cluster-units-tag">${cluster.units.length} Units · Tap to explore</div>
      `;
      card.addEventListener('click', () => openCluster(cluster));
      grid.appendChild(card);
    });
  }

  // ─── OPEN CLUSTER → UNIT VIEW ────────────────────────────────────
  function openCluster(cluster) {
    activeCluster = cluster;

    // Populate unit strip
    const strip = document.getElementById('fp-unit-strip');
    strip.innerHTML = '';
    cluster.units.forEach(unitNum => {
      const u = UNITS[unitNum];
      if (!u) return;
      const tab = document.createElement('div');
      tab.className = 'fp-unit-tab';
      tab.dataset.unit = unitNum;
      tab.innerHTML = `
        <span class="fp-unit-tab-num">${u.label}</span>
        <span class="fp-unit-tab-type">${u.type}</span>
      `;
      tab.addEventListener('click', () => selectUnit(unitNum));
      strip.appendChild(tab);
    });

    // Slide cluster out, unit view in
    document.getElementById('fp-cluster-view').classList.add('slide-out');
    document.getElementById('fp-unit-view').classList.add('active');

    // Update topbar breadcrumb
    document.getElementById('fp-crumb-cluster').classList.remove('top-level');
    document.getElementById('fp-crumb-cluster').textContent = cluster.label;
    document.getElementById('fp-back').classList.add('visible');
    document.getElementById('fp-pipe').classList.add('visible');

    // Show view toggle
    document.getElementById('fp-view-toggle').classList.add('visible');

    // Auto-select first unit
    const firstUnit = cluster.units[0];
    if (firstUnit) selectUnit(firstUnit);
  }

  // ─── SELECT UNIT ─────────────────────────────────────────────────
  function selectUnit(unitNum) {
    activeUnit = unitNum;
    const u = UNITS[unitNum];
    if (!u) return;

    // Tab highlight
    document.querySelectorAll('.fp-unit-tab').forEach(t => {
      t.classList.toggle('active', parseInt(t.dataset.unit) === unitNum);
    });

    // Update breadcrumb
    const crumbUnit = document.getElementById('fp-crumb-unit');
    crumbUnit.textContent = u.label;
    crumbUnit.classList.add('visible');
    document.getElementById('fp-crumb-sep').classList.add('visible');

    // Update info badge
    document.getElementById('fp-unit-info-name').textContent = u.label;
    document.getElementById('fp-unit-info-type').textContent = u.type;
    document.getElementById('fp-unit-info-area').textContent = u.area;
    document.getElementById('fp-unit-info').classList.add('visible');

    // Load plan image
    loadPlanImage();
  }

  // ─── LOAD PLAN IMAGE ─────────────────────────────────────────────
  function loadPlanImage() {
    if (!activeUnit) return;
    const u = UNITS[activeUnit];
    if (!u) return;

    const img     = document.getElementById('fp-plan-img');
    const spinner = document.getElementById('fp-spinner');
    const src     = viewMode === 'iso' ? u.iso : u.top;

    if (img.src.endsWith(src) && !img.classList.contains('fading')) return;

    img.classList.add('fading');
    if (spinner) spinner.classList.add('visible');

    setTimeout(() => {
      img.src = src;
      img.onload = () => {
        img.classList.remove('fading');
        if (spinner) spinner.classList.remove('visible');
        img.onload = null;
      };
      img.onerror = () => {
        // Graceful fallback: show placeholder style
        img.classList.remove('fading');
        if (spinner) spinner.classList.remove('visible');
        img.onerror = null;
      };
    }, 280);
  }

  // ─── BACK TO CLUSTER ─────────────────────────────────────────────
  function backToCluster() {
    activeUnit = null;
    activeCluster = null;

    // Slide unit view out, cluster back in
    document.getElementById('fp-cluster-view').classList.remove('slide-out');
    document.getElementById('fp-unit-view').classList.remove('active');

    // Topbar reset
    document.getElementById('fp-back').classList.remove('visible');
    document.getElementById('fp-pipe').classList.remove('visible');
    document.getElementById('fp-crumb-cluster').textContent = 'Floor Plans';
    document.getElementById('fp-crumb-cluster').classList.add('top-level');
    document.getElementById('fp-crumb-sep').classList.remove('visible');
    document.getElementById('fp-crumb-unit').classList.remove('visible');
    document.getElementById('fp-view-toggle').classList.remove('visible');
    document.getElementById('fp-unit-info').classList.remove('visible');

    // Reset toggle
    viewMode = 'top';
    document.querySelectorAll('.fp-toggle-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.view === 'top');
    });
  }

  // ─── OPEN / CLOSE OVERLAY ────────────────────────────────────────
  function open() {
    if (overlayOpen) return;
    overlayOpen = true;
    buildClusterGrid();
    document.getElementById('fp-overlay').classList.add('open');
  }

  function close() {
    if (!overlayOpen) return;
    overlayOpen = false;
    document.getElementById('fp-overlay').classList.remove('open');

    // Reset state after transition
    setTimeout(() => {
      backToCluster();
    }, 420);
  }

  // ─── BIND EVENTS ─────────────────────────────────────────────────
  function bindEvents() {
    // Close button
    document.getElementById('fp-close').addEventListener('click', close);

    // Back button
    document.getElementById('fp-back').addEventListener('click', backToCluster);

    // Cluster label in breadcrumb (when in unit view)
    document.getElementById('fp-crumb-cluster').addEventListener('click', () => {
      if (!document.getElementById('fp-crumb-cluster').classList.contains('top-level')) {
        backToCluster();
      }
    });

    // View mode toggle
    document.querySelectorAll('.fp-toggle-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const v = btn.dataset.view;
        if (v === viewMode) return;
        viewMode = v;
        document.querySelectorAll('.fp-toggle-btn').forEach(b => {
          b.classList.toggle('active', b.dataset.view === viewMode);
        });
        loadPlanImage();
      });
    });
  }

  // ─── PUBLIC API ──────────────────────────────────────────────────
  return {
    init() {
      injectHTML();
      bindEvents();
    },

    open,
    close,

    // Called by home.js panel slot click
    toggle() {
      overlayOpen ? close() : open();
    }
  };

})();