// home.js — Brigade Stellaris · UI v2
window.HomeModule = (function () {

  let unitRowVisible = false;
  let current       = 0;
  let autoTimer     = null;
  let isAnimating   = false;
  let startX        = 0;
  let startY        = 0;

  // Dwell-time tracking state
  let carouselSlideEnteredAt = 0;
  let lightboxEnteredAt      = 0;
  let lightboxIndex          = null;
  let unitViewerEnteredAt    = 0;
  let activeUnitNumber       = null;
  let unitLoadTimeout        = null; // safety net so the unit-viewer spinner never spins forever

  // ─── BROWSER/HARDWARE BACK SUPPORT ────────────────────────────────
  // Map overlay, unit viewer and lightbox each push a history entry
  // when opened, so the phone's back button (and PC Backspace) closes
  // them instead of leaving the page. Each overlay tracks its own
  // depth; popstate closes whichever of ours is open.
  const _hist = { map: 0, unit: 0, lb: 0 };
  let _popping = false;

  function pushHist(key) {
    history.pushState({ home: key }, '');
    _hist[key]++;
  }
  function unwindHist(key, skipGo) {
    // Overlay closed via UI while it still owns a history entry —
    // silently consume it so back never needs an extra press later.
    // skipGo=true just zeroes the counter without calling history.go():
    // used when we know another module's open() is about to push a
    // fresh state right after (tab switch) — calling history.go() here
    // would be async and race with that immediate pushState, which is
    // what caused switching tabs to intermittently bounce to the home
    // view and need a second click.
    if (!_popping && _hist[key] > 0) {
      const n = _hist[key];
      _hist[key] = 0;
      if (!skipGo) history.go(-n);
    }
  }
  function requestHistBack(key, closeFn) {
    if (_hist[key] > 0) history.back(); // → popstate → closeFn
    else closeFn();
  }

  // ─── UNIT URL MAP ────────────────────────────────────────────────
  const unitURLs = {
    1: 'unit1/index.html',
    2: 'unit2/index.html',
    3: 'unit3/index.html',
  };

  // ─── CAROUSEL IMAGES ─────────────────────────────────────────────
  const IMAGES = [
    { src: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1781157224/01_abyzw2.jpg', label: 'View 1' },
  ];

  // ─── LOCATION MAP IMAGE ──────────────────────────────────────────
  const MAP_IMAGE_SRC = 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1781162438/locationmap_cvfs0z.jpg';

  // ─── SVG ICONS ───────────────────────────────────────────────────
  const ICON_FLOORPLAN = `<svg class="panel-slot-icon" width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0.75" y="0.75" width="4.5" height="4.5" rx="0.5" stroke="currentColor" stroke-width="1.2"/>
    <rect x="7.75" y="0.75" width="4.5" height="4.5" rx="0.5" stroke="currentColor" stroke-width="1.2"/>
    <rect x="0.75" y="7.75" width="4.5" height="4.5" rx="0.5" stroke="currentColor" stroke-width="1.2"/>
    <rect x="7.75" y="7.75" width="4.5" height="4.5" rx="0.5" stroke="currentColor" stroke-width="1.2"/>
  </svg>`;

  const ICON_360 = `<svg class="panel-slot-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="7" r="5.75" stroke="currentColor" stroke-width="1.2"/>
    <line x1="1.25" y1="7" x2="12.75" y2="7" stroke="currentColor" stroke-width="1.2"/>
    <path d="M7 1.25C7 1.25 9.25 3.75 9.25 7C9.25 10.25 7 12.75 7 12.75" stroke="currentColor" stroke-width="1.2"/>
    <path d="M7 1.25C7 1.25 4.75 3.75 4.75 7C4.75 10.25 7 12.75 7 12.75" stroke="currentColor" stroke-width="1.2"/>
  </svg>`;

  const ICON_GALLERY = `<svg class="panel-slot-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0.75" y="0.75" width="12.5" height="9.5" rx="1.25" stroke="currentColor" stroke-width="1.2"/>
    <circle cx="4.5" cy="4.5" r="1.25" stroke="currentColor" stroke-width="1.1"/>
    <path d="M0.75 8.5L3.5 6L6 8L9 5.5L13.25 9.5" stroke="currentColor" stroke-width="1.1" stroke-linejoin="round"/>
    <line x1="3" y1="12.5" x2="11" y2="12.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
  </svg>`;

  const ICON_LOCATION = `<svg class="panel-slot-icon" width="13" height="14" viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.5 1C4.015 1 2 3.015 2 5.5C2 8.985 6.5 13.5 6.5 13.5C6.5 13.5 11 8.985 11 5.5C11 3.015 8.985 1 6.5 1Z" stroke="currentColor" stroke-width="1.2"/>
    <circle cx="6.5" cy="5.5" r="1.5" stroke="currentColor" stroke-width="1.1"/>
  </svg>`;

  // ─── INJECT HTML & STYLES ────────────────────────────────────────
  function injectHTML() {
    if (document.getElementById('bottom-panel')) return;

    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=Cormorant+Garamond:wght@300;400;500&display=swap');

      /* ── Rotate Prompt ── */
      #rotate-prompt {
        display: none; position: fixed; inset: 0; z-index: 9999;
        background: #0a0805; flex-direction: column;
        align-items: center; justify-content: center; gap: 16px; pointer-events: all;
      }
      #rotate-prompt.show { display: flex; }
      #rotate-prompt svg { width:52px; height:52px; stroke:rgba(200,190,154,.80); fill:none; stroke-width:1.5; animation:rotateHint 1.8s ease-in-out infinite; }
      @keyframes rotateHint { 0%,100%{transform:rotate(0deg);}50%{transform:rotate(90deg);} }
      #rotate-prompt p { font-family:'Syne',sans-serif; font-size:11px; font-weight:600; letter-spacing:.16em; text-transform:uppercase; color:rgba(200,190,154,.55); margin:0; }
      @media (orientation:landscape) { #rotate-prompt { display:none !important; } }

      /* ── Carousel ── */
      #carousel {
        position: fixed; inset: 0; bottom: calc(62px + env(safe-area-inset-bottom, 0px));
        background: #e8e4dd;
        display: flex; align-items: center; justify-content: center;
        overflow: hidden; cursor: pointer;
        padding: 24px; box-sizing: border-box;
      }
      #carousel-card {
        position: relative; width: 100%; height: 100%;
        border-radius: 12px; overflow: hidden;
        box-shadow: 0 8px 40px rgba(0,0,0,.18);
        background: #0a0805;
      }
      #carousel-img {
        position: absolute; inset: 0;
        width: 100%; height: 100%;
        object-fit: cover; display: block;
        pointer-events: none; user-select: none; -webkit-user-drag: none;
        opacity: 1; transition: opacity 0.45s ease;
      }
      #carousel-img.fading { opacity: 0; }
      #hc-vignette {
        position: absolute; inset: 0; z-index: 2; pointer-events: none;
        background: radial-gradient(ellipse 90% 80% at 50% 50%, transparent 45%, rgba(4,3,2,.55) 100%);
      }
      #hc-dots {
        position: absolute; bottom: 10px; left: 50%;
        transform: translateX(-50%);
        display: flex; gap: 6px; align-items: center;
        pointer-events: none; z-index: 3;
      }
      .hc-dot {
        height: 4px; width: 4px; border-radius: 2px;
        background: rgba(200,190,154,.22);
        transition: width .3s, background .3s; flex-shrink: 0;
      }
      .hc-dot.active { width: 18px; background: rgba(245,240,232,.80); }

      /* ── Lightbox ── */
      #lightbox {
        position: fixed; inset: 0; z-index: 500;
        background: rgba(5,4,2,.96);
        display: flex; align-items: center; justify-content: center;
        opacity: 0; pointer-events: none; transition: opacity .3s;
        overflow: hidden; touch-action: none;
      }
      #lightbox.open { opacity: 1; pointer-events: all; }
      #lb-img {
        max-width: calc(100vw - 40px); max-height: calc(100dvh - 80px);
        object-fit: contain; transform-origin: center center;
        will-change: transform; user-select: none; -webkit-user-drag: none;
        pointer-events: none;
      }
      #lb-empty {
        display: none; font-family: 'Cormorant Garamond', serif;
        font-style: italic; color: rgba(200,185,165,.35); font-size: 16px;
      }
      #lb-close {
        position: absolute; top: 16px; right: 16px;
        width: 36px; height: 36px; border-radius: 8px;
        border: 1px solid rgba(122,62,30,.30); background: rgba(122,62,30,.08);
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; color: rgba(200,185,165,.80); font-size: 18px;
        z-index: 2; -webkit-tap-highlight-color: transparent;
      }

      /* ── Location Map Overlay ── */
      #map-overlay {
        position: fixed; inset: 0; bottom: calc(62px + env(safe-area-inset-bottom, 0px)); z-index: 300;
        background: #e8e4dd;
        display: flex; flex-direction: column; padding: 24px; box-sizing: border-box;
        opacity: 0; pointer-events: none;
        transform: translateY(8px);
        transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.22,1,0.36,1);
      }
      #map-overlay.open { opacity: 1; pointer-events: all; transform: translateY(0); }
      #map-overlay-card {
        flex: 1; border-radius: 12px; overflow: hidden;
        box-shadow: 0 8px 40px rgba(0,0,0,.18);
        background: #0d1a24;
        display: flex; flex-direction: column; position: relative;
      }
      #map-topbar {
        flex-shrink: 0;
        display: flex; align-items: center; gap: 12px;
        padding: 10px 14px;
        background: rgba(10,25,36,.95);
        border-bottom: 1px solid rgba(122,62,30,.20);
        backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        position: relative; z-index: 2;
      }
      #map-back {
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; flex-shrink: 0; -webkit-tap-highlight-color: transparent;
      }
      #map-back-btn {
        width: 32px; height: 32px; border-radius: 8px;
        border: 1px solid rgba(122,62,30,.35); background: rgba(122,62,30,.08);
        display: flex; align-items: center; justify-content: center;
        transition: background 0.2s, border-color 0.2s;
      }
      #map-back:hover #map-back-btn, #map-back:active #map-back-btn {
        background: rgba(122,62,30,.20); border-color: rgba(122,62,30,.65);
      }
      #map-back-btn svg {
        width: 13px; height: 13px; stroke: rgba(200,185,165,.80);
        fill: none; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round;
      }
      #map-title {
        font-family: 'Cormorant Garamond', serif;
        font-size: 15px; font-weight: 400; color: rgba(245,242,235,.85);
        letter-spacing: 0.04em;
      }
      #map-body {
        flex: 1; display: flex; align-items: center; justify-content: center;
        overflow: hidden; position: relative; background: #0d1a24;
        touch-action: none;
      }
      #map-img {
        width: 100%; height: 100%; object-fit: cover; display: block;
        user-select: none; -webkit-user-drag: none;
        transform-origin: center center; will-change: transform;
      }
      #map-zoom-hint {
        position: absolute; bottom: 16px; left: 50%; transform: translateX(-50%);
        font-family: 'Syne', sans-serif; font-size: 8.5px; font-weight: 600;
        letter-spacing: .12em; text-transform: uppercase;
        color: rgba(255,255,255,.55); pointer-events: none;
        opacity: 0; transition: opacity 0.4s; white-space: nowrap;
        background: rgba(0,0,0,.35); padding: 5px 12px; border-radius: 999px;
      }
      #map-zoom-hint.visible { opacity: 1; }
      #map-spinner { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity 0.22s; }
      #map-spinner.visible { opacity: 1; }
      #map-spinner-ring { width: 32px; height: 32px; border: 2px solid rgba(122,62,30,.20); border-top-color: rgba(122,62,30,.85); border-radius: 50%; animation: spinMap 0.72s linear infinite; }
      @keyframes spinMap { to { transform: rotate(360deg); } }

      /* ── Unit Row — thumbnail strip ──
         Each thumbnail is a tiny, non-interactive live iframe of that
         unit's own 360 tour page (unitURLs[n]) scaled way down — so the
         "thumbnail" is always the real scene, no separate image asset
         needed. Desktop: horizontal strip above the bottom nav, same as
         before. Mobile: a vertical rail docked to the right edge, since
         a full-width horizontal strip eats too much vertical space on
         a phone screen and a side rail stays out of the way of the
         360 viewer itself. */
      #unit-row {
        position: fixed; bottom: calc(62px + env(safe-area-inset-bottom, 0px)); left: 0; right: 0;
        width: 100%;
        z-index: 98;
        display: flex; flex-direction: row;
        align-items: stretch; justify-content: center;
        gap: 10px; padding: 10px 14px;
        opacity: 0; pointer-events: none;
        transform: translateY(6px);
        transition: opacity .28s ease, transform .28s cubic-bezier(0.22,1,0.36,1);
        box-sizing: border-box;
        background: rgba(245,242,235,0.97);
        backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
        border-top: 1px solid rgba(180,160,120,.22);
        box-shadow: 0 -2px 16px rgba(0,0,0,.07);
      }
      #unit-row.visible { opacity: 1; pointer-events: all; transform: translateY(0); }

      .unit-btn {
        position: relative;
        display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
        cursor: pointer;
        border-radius: 10px; overflow: hidden;
        border: 2px solid transparent;
        transition: border-color .22s, transform .22s;
        -webkit-tap-highlight-color: transparent;
        flex: 1; max-width: 220px; min-width: 90px;
        aspect-ratio: 16 / 10;
        background: #0d0d0d;
      }
      .unit-btn:hover { transform: translateY(-2px); }
      .unit-btn.active { border-color: #7a3e1e; }

      .unit-btn-thumb-frame {
        position: absolute; inset: 0;
        pointer-events: none; /* clicks always go to the .unit-btn wrapper */
        overflow: hidden;
      }
      /* The iframe is rendered at a large fixed size then scaled down
         via CSS transform, so the panorama viewer inside it lays out
         normally (it doesn't know it's being shown small) and just
         gets visually shrunk to thumbnail size. */
      .unit-btn-thumb-frame iframe {
        position: absolute; top: 0; left: 0;
        width: 1000px; height: 625px;
        border: none;
        transform-origin: top left;
        /* scale set inline per-thumbnail via JS once its box is measured */
      }
      .unit-btn-thumb-scrim {
        position: absolute; inset: 0;
        background: linear-gradient(to top, rgba(0,0,0,.75) 0%, rgba(0,0,0,.05) 55%, transparent 100%);
        pointer-events: none;
      }
      .unit-btn-label {
        position: relative; z-index: 2;
        font-family: 'Syne', sans-serif; font-size: 10.5px; font-weight: 700;
        letter-spacing: .12em; text-transform: uppercase;
        color: rgba(255,255,255,.85); line-height: 1; white-space: nowrap;
        padding: 8px 0 9px;
        transition: color .22s;
      }
      .unit-btn.active .unit-btn-label { color: #f0c896; }

      /* ── Mobile: vertical rail on the right edge instead of a
         full-width bottom strip ── */
      @media (max-width: 640px) {
        #unit-row {
          left: auto; right: 0; bottom: calc(74px + env(safe-area-inset-bottom, 0px));
          top: auto;
          width: auto;
          flex-direction: column;
          gap: 8px;
          padding: 8px calc(8px + env(safe-area-inset-right, 0px)) 8px 8px;
          background: transparent; backdrop-filter: none; -webkit-backdrop-filter: none;
          border-top: none; box-shadow: none;
          max-height: 60vh; overflow-y: auto;
        }
        .unit-btn {
          max-width: 84px; min-width: 72px; aspect-ratio: 4 / 3;
          border-radius: 8px;
          box-shadow: 0 3px 10px rgba(0,0,0,.25);
        }
        .unit-btn-label { font-size: 8.5px; padding: 5px 0 6px; }
      }


      /* ── Bottom Panel ── */
      #bottom-panel {
        position: fixed; bottom: 0; left: 0; right: 0; width: 100%; height: 62px; z-index: 100;
        display: flex; flex-direction: row; align-items: center;
        background: rgba(245,242,235,0.97);
        border-top: 1px solid rgba(180,160,120,.25);
        backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
        box-shadow: 0 -2px 20px rgba(0,0,0,.07);
        box-sizing: border-box; padding: 0; gap: 0;
        transform: translateY(100%);
        animation: panelRiseIn .6s cubic-bezier(0.22,1,0.36,1) .3s forwards;
      }
      @keyframes panelRiseIn { from{transform:translateY(100%);}to{transform:translateY(0);} }

      /* Nav group — center */
      #panel-nav-group {
        display: flex; flex-direction: row; align-items: stretch;
        width: 100%; justify-content: center; height: 100%;
      }

      .panel-slot {
        position: relative;
        display: flex; align-items: center; justify-content: center; gap: 7px;
        padding: 0 18px; cursor: pointer;
        background: transparent;
        border-bottom: 2.5px solid transparent;
        border-top: 2.5px solid transparent;
        transition: background .22s, border-color .22s;
        -webkit-tap-highlight-color: transparent;
        white-space: nowrap;
      }
      .panel-slot:hover { background: rgba(122,62,30,.06); }
      .panel-slot.active {
        background: #7a3e1e;
        border-radius: 6px;
        margin: 10px 4px;
        border-bottom-color: transparent;
      }

      /* Icon color transitions */
      .panel-slot-icon {
        flex-shrink: 0;
        color: rgba(80,55,30,.60);
        transition: color .22s;
      }
      .panel-slot.active .panel-slot-icon { color: #f5f0e8; }
      .panel-slot:hover:not(.active) .panel-slot-icon { color: rgba(80,55,30,.90); }

      .panel-slot-label {
        font-family: 'Syne', sans-serif; font-size: 10.5px; font-weight: 700;
        letter-spacing: .11em; text-transform: uppercase;
        color: rgba(80,55,30,.60); line-height: 1;
        transition: color .22s;
      }
      .panel-slot.active .panel-slot-label { color: #f5f0e8; }
      .panel-slot:hover:not(.active) .panel-slot-label { color: rgba(80,55,30,.90); }

      /* Divider between nav slots */
      .panel-slot + .panel-slot::before {
        content: '';
        position: absolute; left: 0; top: 28%; height: 44%;
        width: 1px; background: rgba(120,80,40,.12);
      }
      .panel-slot.active + .panel-slot::before,
      .panel-slot + .panel-slot.active::before { display: none; }


      /* ── Unit Viewer Overlay ── */
      #unit-viewer-overlay {
        position: fixed; top: 0; left: 0; right: 0; bottom: calc(62px + env(safe-area-inset-bottom, 0px)); z-index: 99;
        transform: translateY(100%); transition: transform .5s cubic-bezier(0.22,1,0.36,1);
        background: transparent; padding: 0; box-sizing: border-box;
        display: flex; flex-direction: column;
      }
      #unit-viewer-overlay.open { transform: translateY(0); }
      #unit-viewer-card {
        flex: 1; height: 100%; border-radius: 0; overflow: hidden;
        box-shadow: none;
        position: relative; background: transparent;
      }
      #unit-iframe { width:100%; height:100%; border:none; display:block; opacity:1; transition:opacity .35s; }
      #unit-iframe.fading { opacity:0; }
      #unit-loader { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(10,8,5,.55); opacity:0; pointer-events:none; transition:opacity .25s; z-index:2; }
      #unit-loader.visible { opacity:1; }
      #unit-loader-ring { width:36px; height:36px; border:2.5px solid rgba(200,190,154,.25); border-top-color:rgba(200,190,154,.9); border-radius:50%; animation:spinRing .75s linear infinite; }
      @keyframes spinRing { to{transform:rotate(360deg);} }

      /* Floating back button over the unit 360 viewer (mobile + desktop) */
      #unit-back {
        position: absolute;
        top: calc(14px + env(safe-area-inset-top, 0px));
        left: calc(14px + env(safe-area-inset-left, 0px));
        z-index: 15;
        width: 36px; height: 36px; min-width: 36px; min-height: 36px; border-radius: 10px;
        border: 1px solid rgba(200,185,165,.25); background: rgba(20,16,12,.55);
        backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; -webkit-tap-highlight-color: transparent;
      }
      #unit-back svg { width: 15px; height: 15px; stroke: rgba(230,220,205,.9); fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
      #unit-back svg { width: 15px; height: 15px; stroke: rgba(230,220,205,.90); fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

      /* ── Portrait / small-screen refinements ── */
      @media (max-width: 520px) {
        /* Bottom nav: compress so all four tabs fit a narrow screen */
        .panel-slot { padding: 0 10px; gap: 5px; }
        .panel-slot-label { font-size: 9px; letter-spacing: .08em; }
        .panel-slot.active { margin: 8px 2px; }
        /* Unit thumbnail rail sizing lives in its own @media(max-width:640px) block above */
        /* Carousel + map: slimmer frame so the image owns the screen */
        #carousel { padding: 12px; }
        #map-overlay { padding: 12px; }
        #map-title { font-size: 13px; }
        /* Lightbox close within thumb reach */
        #lb-close { top: 12px; right: 12px; }
      }
      @media (max-width: 360px) {
        .panel-slot { padding: 0 7px; gap: 4px; }
        .panel-slot-label { font-size: 8px; }
      }
      /* Respect notch/home-indicator on phones */
      #bottom-panel { padding-bottom: env(safe-area-inset-bottom, 0px); height: calc(62px + env(safe-area-inset-bottom, 0px)); }
    `;
    document.head.appendChild(style);

    const dotsHTML = IMAGES.map((_, i) =>
      `<div class="hc-dot${i === 0 ? ' active' : ''}"></div>`).join('');

    document.body.insertAdjacentHTML('beforeend', `
      <div id="rotate-prompt">
        <svg viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 21h6"/></svg>
        <p>Please rotate your device</p>
      </div>

      <div id="carousel">
        <div id="carousel-card">
          <img id="carousel-img" src="" alt="" />
          <div id="hc-vignette"></div>
          <div id="hc-dots">${dotsHTML}</div>
        </div>
      </div>

      <div id="lightbox">
        <img id="lb-img" src="" alt=""/>
        <div id="lb-empty">Image coming soon</div>
        <div id="lb-close">&#x2715;</div>
      </div>

      <div id="map-overlay">
        <div id="map-overlay-card">
          <div id="map-topbar">
            <div id="map-back">
              <div id="map-back-btn">
                <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
              </div>
            </div>
            <div id="map-title">Location Map</div>
          </div>
          <div id="map-body">
            <div id="map-spinner"><div id="map-spinner-ring"></div></div>
            <img id="map-img" src="" alt="Location Map" />
            <div id="map-zoom-hint">Pinch to zoom</div>
          </div>
        </div>
      </div>

      <div id="unit-row">
        <div class="unit-btn" data-unit="1">
          <div class="unit-btn-thumb-frame"></div>
          <div class="unit-btn-thumb-scrim"></div>
          <span class="unit-btn-label">Unit 1</span>
        </div>
        <div class="unit-btn" data-unit="2">
          <div class="unit-btn-thumb-frame"></div>
          <div class="unit-btn-thumb-scrim"></div>
          <span class="unit-btn-label">Unit 2</span>
        </div>
        <div class="unit-btn" data-unit="3">
          <div class="unit-btn-thumb-frame"></div>
          <div class="unit-btn-thumb-scrim"></div>
          <span class="unit-btn-label">Unit 3</span>
        </div>
      </div>

      <div id="bottom-panel">
        <div id="panel-nav-group">
          <div class="panel-slot" data-slot="floorplan">
            ${ICON_FLOORPLAN}
            <span class="panel-slot-label">Floor Plan</span>
          </div>
          <div class="panel-slot" data-slot="360view">
            ${ICON_360}
            <span class="panel-slot-label">360 View</span>
          </div>
          <div class="panel-slot" data-slot="gallery">
            ${ICON_GALLERY}
            <span class="panel-slot-label">Gallery</span>
          </div>
          <div class="panel-slot" data-slot="map">
            ${ICON_LOCATION}
            <span class="panel-slot-label">Location</span>
          </div>
        </div>

      </div>

      <div id="unit-viewer-overlay">
        <div id="unit-viewer-card">
          <div id="unit-back">
            <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
          </div>
          <div id="unit-loader"><div id="unit-loader-ring"></div></div>
          <iframe id="unit-iframe" src="" allow="fullscreen"></iframe>
        </div>
      </div>
    `);

    // Set initial carousel image
    const carouselImg = document.getElementById('carousel-img');
    if (carouselImg && IMAGES.length > 0) {
      carouselImg.src = IMAGES[0].src;
      carouselImg.alt = IMAGES[0].label || '';
    }
  }

  // ─── CAROUSEL — CROSSFADE ────────────────────────────────────────
  function reportCarouselDwell(idx) {
    if (!carouselSlideEnteredAt) return;
    const dwellMs = Date.now() - carouselSlideEnteredAt;
    if (typeof gtag === 'function' && dwellMs > 200) {
      gtag('event', 'carousel_engagement', {
        slide_index: idx,
        slide_label: (IMAGES[idx] && IMAGES[idx].label) || null,
        dwell_ms: dwellMs
      });
    }
  }

  function goTo(targetIdx) {
    if (isAnimating || IMAGES.length <= 1) return;
    isAnimating = true;

    const img  = document.getElementById('carousel-img');
    const next = IMAGES[targetIdx];

    img.classList.add('fading');
    setTimeout(() => {
      img.src = next.src;
      img.alt = next.label || '';
      img.classList.remove('fading');
      reportCarouselDwell(current); // 'current' is still the outgoing slide here
      current = targetIdx;
      carouselSlideEnteredAt = Date.now();
      updateDots();
      isAnimating = false;
    }, 450);
  }

  function updateDots() {
    document.querySelectorAll('.hc-dot').forEach((d, i) =>
      d.classList.toggle('active', i === current));
  }

  function startAuto() {
    clearInterval(autoTimer);
    if (IMAGES.length <= 1) return;
    autoTimer = setInterval(() => {
      if (!isAnimating) goTo((current + 1) % IMAGES.length);
    }, 3800);
  }

  // FIX #9: stop carousel timer cleanly
  function stopAuto() {
    clearInterval(autoTimer);
    autoTimer = null;
  }

  function initCarousel() {
    const carousel = document.getElementById('carousel');
    carouselSlideEnteredAt = Date.now(); // start the clock on the first slide

    // Touch
    let tapMoved = false;
    carousel.addEventListener('touchstart', e => {
      startX   = e.touches[0].clientX;
      startY   = e.touches[0].clientY;
      tapMoved = false;
    }, { passive: true });
    carousel.addEventListener('touchmove', e => {
      if (Math.abs(e.touches[0].clientX - startX) > 8) tapMoved = true;
    }, { passive: true });
    carousel.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        goTo(dx < 0 ? (current + 1) % IMAGES.length : (current - 1 + IMAGES.length) % IMAGES.length);
        startAuto();
      } else if (!tapMoved) {
        openLightbox(current);
      }
    }, { passive: true });

    // Mouse drag
    let mStart = 0, mDrag = false, mMoved = false;
    carousel.addEventListener('mousedown', e => { mStart = e.clientX; mDrag = true; mMoved = false; });
    window.addEventListener('mousemove',  e => { if (mDrag && Math.abs(e.clientX - mStart) > 8) mMoved = true; });
    window.addEventListener('mouseup',    e => {
      if (!mDrag) return;
      mDrag = false;
      const dx = e.clientX - mStart;
      if (Math.abs(dx) > 50) {
        goTo(dx < 0 ? (current + 1) % IMAGES.length : (current - 1 + IMAGES.length) % IMAGES.length);
        startAuto();
      } else if (!mMoved) {
        openLightbox(current);
      }
    });

    carousel.addEventListener('mouseenter', () => clearInterval(autoTimer));
    carousel.addEventListener('mouseleave', startAuto);
    startAuto();
  }

  // ─── LIGHTBOX ────────────────────────────────────────────────────
  let lbScale = 1, lbPanX = 0, lbPanY = 0, lbPinchDist = 0;
  let lbPanStart = { x: 0, y: 0 };
  const LB_MAX = 4;

  function lbSetTransform(animate) {
    const img = document.getElementById('lb-img');
    img.style.transition = animate ? 'transform .25s ease' : 'none';
    img.style.transform  = `scale(${lbScale}) translate(${lbPanX / lbScale}px, ${lbPanY / lbScale}px)`;
  }
  function lbReset(animate) { lbScale = 1; lbPanX = 0; lbPanY = 0; lbSetTransform(animate !== false); }

  function openLightbox(index) {
    const src = IMAGES[index].src;
    const img = document.getElementById('lb-img');
    img.src = src || '';
    img.style.display = src ? '' : 'none';
    document.getElementById('lb-empty').style.display  = src ? 'none' : 'block';
    document.getElementById('lightbox').classList.add('open');
    lbReset(false);
    lightboxIndex     = index;
    lightboxEnteredAt = Date.now();
    if (!_popping) pushHist('lb');
  }
  function closeLightbox() {
    const lbEl = document.getElementById('lightbox');
    if (!lbEl || !lbEl.classList.contains('open')) return;
    unwindHist('lb');
    if (lightboxEnteredAt) {
      const dwellMs = Date.now() - lightboxEnteredAt;
      if (typeof gtag === 'function' && dwellMs > 200) {
        gtag('event', 'lightbox_engagement', {
          slide_index: lightboxIndex,
          slide_label: (IMAGES[lightboxIndex] && IMAGES[lightboxIndex].label) || null,
          dwell_ms: dwellMs
        });
      }
    }
    lightboxEnteredAt = 0;
    lightboxIndex = null;
    document.getElementById('lightbox').classList.remove('open');
    lbReset(false);
  }

  function bindLightboxZoom() {
    const lb = document.getElementById('lightbox');
    let touches = [];

    lb.addEventListener('touchstart', (e) => {
      touches = Array.from(e.touches);
      if (touches.length === 2) {
        lbPinchDist = Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
      } else if (touches.length === 1) {
        lbPanStart = { x: touches[0].clientX - lbPanX, y: touches[0].clientY - lbPanY };
      }
    }, { passive: true });

    lb.addEventListener('touchmove', (e) => {
      e.preventDefault();
      touches = Array.from(e.touches);
      if (touches.length === 2) {
        const dist = Math.hypot(touches[0].clientX - touches[1].clientX, touches[0].clientY - touches[1].clientY);
        lbScale = Math.min(LB_MAX, Math.max(1, lbScale * (dist / lbPinchDist)));
        lbPinchDist = dist;
        if (lbScale === 1) { lbPanX = 0; lbPanY = 0; }
        lbSetTransform(false);
      } else if (touches.length === 1 && lbScale > 1) {
        lbPanX = touches[0].clientX - lbPanStart.x;
        lbPanY = touches[0].clientY - lbPanStart.y;
        lbSetTransform(false);
      }
    }, { passive: false });

    lb.addEventListener('touchend', (e) => {
      touches = Array.from(e.touches);
      if (touches.length === 1) lbPanStart = { x: touches[0].clientX - lbPanX, y: touches[0].clientY - lbPanY };
    }, { passive: true });

    let lastTap = 0;
    lb.addEventListener('touchend', () => { const now = Date.now(); if (now - lastTap < 300) lbReset(true); lastTap = now; });
    lb.addEventListener('dblclick', () => lbReset(true));
    function requestLbBack() { requestHistBack('lb', closeLightbox); }
    document.getElementById('lb-close').addEventListener('click', requestLbBack);
    lb.addEventListener('click', (e) => { if (e.target === lb) requestLbBack(); });
    document.addEventListener('keydown', e => {
      if (!document.getElementById('lightbox').classList.contains('open')) return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 'Escape' || e.key === 'Backspace') { e.preventDefault(); requestLbBack(); }
    });
  }

  // ─── LOCATION MAP ────────────────────────────────────────────────
  let _mapLoaded = false;

  function openMap() {
    const overlay = document.getElementById('map-overlay');
    if (!overlay) return;
    overlay.classList.add('open');
    if (!_popping) pushHist('map');
    if (!_mapLoaded) {
      _mapLoaded = true;
      const img     = document.getElementById('map-img');
      const spinner = document.getElementById('map-spinner');
      img.style.opacity = '0';
      spinner.classList.add('visible');
      img.addEventListener('load', () => {
        spinner.classList.remove('visible');
        img.style.transition = 'opacity 0.3s ease';
        img.style.opacity = '1';
      }, { once: true });
      img.addEventListener('error', () => {
        spinner.classList.remove('visible');
        img.style.opacity = '1';
      }, { once: true });
      img.src = MAP_IMAGE_SRC;
    }
  }

  function closeMap(skipHistory) {
    const overlay = document.getElementById('map-overlay');
    if (!overlay || !overlay.classList.contains('open')) return;
    overlay.classList.remove('open');
    const mapImg = document.getElementById('map-img');
    if (mapImg) mapImg.style.transform = '';
    const zoomHint = document.getElementById('map-zoom-hint');
    if (zoomHint) zoomHint.classList.remove('visible');
    unwindHist('map', skipHistory);
  }

  // ─── GENERIC ZOOM/PAN (pinch + drag + wheel) ──────────────────
  // Same pattern used in floorplan.js — transforms `target` inside
  // `area` via translate+scale. Reused here for the location map.
  function bindZoomPan(area, target, opts) {
    if (!area || !target) return () => {};
    const { maxScale = 4, minScale = 1, hintEl = null } = opts || {};
    let scale = 1, originX = 0, originY = 0, lastDist = null;
    let panStartX = 0, panStartY = 0, panOriginX = 0, panOriginY = 0, lastTap = 0;

    function applyTransform() {
      target.style.transform = `translate(${originX}px, ${originY}px) scale(${scale})`;
      if (hintEl) {
        if (scale > 1.05) { hintEl.textContent = 'Double-tap to reset'; hintEl.classList.add('visible'); }
        else hintEl.classList.remove('visible');
      }
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

  let _mapZoomBound = false;
  function bindMapZoom() {
    if (_mapZoomBound) return;
    _mapZoomBound = true;
    const area = document.getElementById('map-body');
    const img  = document.getElementById('map-img');
    const hint = document.getElementById('map-zoom-hint');
    bindZoomPan(area, img, { hintEl: hint });
  }

  function bindMapEvents() {
    bindMapZoom();
    const mapBack = document.getElementById('map-back');
    function handleMapBack() {
      requestHistBack('map', closeMap);
      document.querySelectorAll('.panel-slot').forEach(s => s.classList.remove('active'));
    }
    mapBack.addEventListener('click', handleMapBack);
    mapBack.addEventListener('touchend', (e) => { e.preventDefault(); handleMapBack(); });
    document.addEventListener('keydown', (e) => {
      if (!document.getElementById('map-overlay').classList.contains('open')) return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 'Escape' || e.key === 'Backspace') { e.preventDefault(); handleMapBack(); }
    });
  }

  // ─── UNIT THEME CSS (injected into iframe) ────────────────────────
  const UNIT_THEME_CSS = `
    :root {
      --accent:        #7a3e1e;
      --accent-light:  #9a5030;
      --accent-bg:     rgba(122,62,30,.12);
      --gold:          #7a3e1e;
      --gold-dim:      rgba(122,62,30,.55);
      --gold-faint:    rgba(122,62,30,.18);
      --text-primary:  rgba(245,240,232,.92);
      --text-dim:      rgba(200,185,165,.65);
      --bg-panel:      rgba(15,12,8,.96);
      --border:        rgba(122,62,30,.28);
    }
    .room-list, #room-list, .sidebar, #sidebar,
    [class*="room-panel"], [class*="room-list"],
    [class*="side-panel"], [class*="sidebar"] {
      background: rgba(15,12,8,.96) !important;
      border-right: 1px solid rgba(122,62,30,.25) !important;
    }
    .room-list-header, .sidebar-header, [class*="panel-header"],
    .unit-type, [class*="unit-type"] {
      color: rgba(200,185,165,.55) !important;
      letter-spacing: .14em !important;
    }
    .room-list-title, .sidebar-title, [class*="panel-title"] {
      color: rgba(245,240,232,.90) !important;
    }
    .room-item, [class*="room-item"], li[class*="room"],
    .scene-item, [class*="scene-item"] {
      border-bottom: 1px solid rgba(122,62,30,.14) !important;
      background: transparent !important;
    }
    .room-item:hover, [class*="room-item"]:hover,
    .scene-item:hover, [class*="scene-item"]:hover {
      background: rgba(122,62,30,.10) !important;
    }
    .room-item.active, .room-item.selected,
    [class*="room-item"].active, [class*="room-item"].selected,
    .scene-item.active, .scene-item.selected,
    [class*="scene-item"].active, [class*="scene-item"].selected {
      background: transparent !important;
      border: 1px solid rgba(122,62,30,.55) !important;
      border-left: 3px solid #7a3e1e !important;
    }
    .room-num, [class*="room-num"], .scene-num,
    .index, [class*="-index"], [class*="item-num"] {
      color: rgba(122,62,30,.65) !important;
    }
    .room-name, [class*="room-name"], .scene-name,
    [class*="scene-name"], [class*="item-label"] {
      color: rgba(245,240,232,.85) !important;
      font-weight: 600 !important;
      letter-spacing: .08em !important;
    }
    .toggle-btn, [class*="toggle"], .collapse-btn,
    #sidebar-toggle, [id*="toggle"] {
      background: #ffffff !important;
      border: 1px solid rgba(122,62,30,.25) !important;
      border-left: none !important;
      color: #7a3e1e !important;
    }
    .hotspot-label, [class*="hotspot"] .label,
    .pnlm-hotspot-base span {
      background: #7a3e1e !important;
      color: #f5f0e8 !important;
      border-color: rgba(122,62,30,.45) !important;
    }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: rgba(15,12,8,.5); }
    ::-webkit-scrollbar-thumb { background: rgba(122,62,30,.40); border-radius: 2px; }
    ::-webkit-scrollbar-thumb:hover { background: rgba(122,62,30,.70); }
  `;

  function injectUnitTheme(iframe) {
    try {
      const doc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!doc) return;
      const existing = doc.getElementById('stellaris-theme-override');
      if (existing) existing.remove();
      const style = doc.createElement('style');
      style.id = 'stellaris-theme-override';
      style.textContent = UNIT_THEME_CSS;
      (doc.head || doc.documentElement).appendChild(style);
    } catch (e) {
      // cross-origin iframe — skip silently
    }
  }

  // ─── UNIT VIEWER ─────────────────────────────────────────────────
  // ─── UNIT THUMBNAILS — live scaled-down iframes of each unit's own
  // 360 page, instead of a separate static image. Created lazily the
  // first time the 360 View tab is opened (not on page load) so three
  // extra heavy panorama pages aren't fetched before the user asks
  // for them. The iframe is rendered at a fixed large intrinsic size
  // then visually shrunk with a CSS scale so its internal layout
  // behaves exactly as it would full-size — just smaller on screen.
  const THUMB_IFRAME_W = 1000, THUMB_IFRAME_H = 625;
  let _thumbsLoaded = false;

  function syncUnitThumbScale() {
    document.querySelectorAll('.unit-btn-thumb-frame').forEach(frame => {
      const iframe = frame.querySelector('iframe');
      if (!iframe) return;
      const box = frame.getBoundingClientRect();
      if (box.width < 2 || box.height < 2) return;
      const scale = Math.max(box.width / THUMB_IFRAME_W, box.height / THUMB_IFRAME_H);
      iframe.style.transform = `scale(${scale})`;
    });
  }

  function loadUnitThumbnails() {
    if (_thumbsLoaded) { syncUnitThumbScale(); return; }
    _thumbsLoaded = true;
    document.querySelectorAll('.unit-btn').forEach(btn => {
      const unitNum = btn.dataset.unit;
      const url = unitURLs[unitNum];
      const frame = btn.querySelector('.unit-btn-thumb-frame');
      if (!url || !frame) return;
      const iframe = document.createElement('iframe');
      iframe.src = url;
      iframe.width = THUMB_IFRAME_W;
      iframe.height = THUMB_IFRAME_H;
      iframe.setAttribute('loading', 'lazy');
      iframe.setAttribute('tabindex', '-1');
      iframe.setAttribute('aria-hidden', 'true');
      frame.appendChild(iframe);
    });
    // Scale after layout settles
    requestAnimationFrame(syncUnitThumbScale);
    window.addEventListener('resize', syncUnitThumbScale);
  }

  function openUnitViewer(unit) {
    const overlay = document.getElementById('unit-viewer-overlay');
    const iframe  = document.getElementById('unit-iframe');
    const loader  = document.getElementById('unit-loader');
    if (!overlay || !iframe) return;
    const url = unitURLs[unit];
    if (!url) return;

    // Use data attribute to track what's loaded — iframe.src becomes
    // an absolute URL so endsWith() is unreliable for same-unit checks
    const currentTarget = iframe.dataset.targetUrl || '';
    const isSameUnit    = currentTarget === url;

    if (overlay.classList.contains('open') && isSameUnit) return;

    if (!isSameUnit) {
      // Report dwell for whichever unit was previously open, if switching directly between units
      if (activeUnitNumber !== null && activeUnitNumber !== unit) reportUnitViewerDwell();
      activeUnitNumber    = unit;
      unitViewerEnteredAt = Date.now();

      // Record what we're loading so rapid re-clicks don't double-load
      iframe.dataset.targetUrl = url;

      // Fade iframe immediately — no setTimeout delay
      iframe.classList.add('fading');
      if (loader) loader.classList.add('visible');

      // Clear any previous safety timeout from an earlier unit switch
      clearTimeout(unitLoadTimeout);

      // Safety net: if onload never fires (stalled request, connection
      // contention, etc.), don't leave the spinner stuck forever —
      // force it to clear after 12s and log why for debugging.
      unitLoadTimeout = setTimeout(() => {
        if (iframe.onload) {
          console.warn('Unit viewer: iframe did not finish loading within 12s for', url);
          iframe.classList.remove('fading');
          if (loader) loader.classList.remove('visible');
          iframe.onload = null;
        }
      }, 12000);

      // Set onload BEFORE src so cached pages don't miss the event
      iframe.onload = () => {
        clearTimeout(unitLoadTimeout);
        iframe.classList.remove('fading');
        if (loader) loader.classList.remove('visible');
        injectUnitTheme(iframe);
        iframe.onload = null;
      };

      // Assign src immediately — starts loading right away
      iframe.src = url;
    } else {
      injectUnitTheme(iframe);
    }

    // Open overlay immediately so slide-up plays while iframe loads
    const wasOpen = overlay.classList.contains('open');
    overlay.classList.add('open');
    if (!wasOpen && !_popping) pushHist('unit');
  }

  // Reports how long the currently open unit's 360 viewer was on screen, then resets.
  function reportUnitViewerDwell() {
    if (!unitViewerEnteredAt || activeUnitNumber === null) return;
    const dwellMs = Date.now() - unitViewerEnteredAt;
    if (typeof gtag === 'function' && dwellMs > 200) {
      gtag('event', 'unit_360_engagement', {
        unit_number: activeUnitNumber,
        dwell_ms: dwellMs
      });
    }
  }

  function closeUnitViewer(skipHistory) {
    const overlay = document.getElementById('unit-viewer-overlay');
    if (!overlay || !overlay.classList.contains('open')) return;
    reportUnitViewerDwell();
    unitViewerEnteredAt = 0;
    activeUnitNumber = null;
    overlay.classList.remove('open');
    document.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
    unwindHist('unit', skipHistory);
  }

  // ─── BACK NAVIGATION (hardware back / Backspace) ─────────────────
  function bindBackNav() {
    // Unit viewer floating back button
    const unitBack = document.getElementById('unit-back');
    function requestUnitBack() { requestHistBack('unit', closeUnitViewer); }
    if (unitBack) {
      unitBack.addEventListener('click', requestUnitBack);
      unitBack.addEventListener('touchend', (e) => { e.preventDefault(); requestUnitBack(); });
    }

    // Backspace / Escape closes the unit viewer on PC
    document.addEventListener('keydown', (e) => {
      const overlay = document.getElementById('unit-viewer-overlay');
      if (!overlay || !overlay.classList.contains('open')) return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 'Escape' || e.key === 'Backspace') { e.preventDefault(); requestUnitBack(); }
    });

    // Hardware/browser back button — closes whichever of our overlays
    // is open, most-recent first (lightbox > unit viewer > map).
    window.addEventListener('popstate', () => {
      _popping = true;
      const lb      = document.getElementById('lightbox');
      const unitOvl = document.getElementById('unit-viewer-overlay');
      const mapOvl  = document.getElementById('map-overlay');

      if (lb && lb.classList.contains('open') && _hist.lb > 0) {
        _hist.lb--; closeLightbox();
      } else if (unitOvl && unitOvl.classList.contains('open') && _hist.unit > 0) {
        _hist.unit--; closeUnitViewer();
      } else if (mapOvl && mapOvl.classList.contains('open') && _hist.map > 0) {
        _hist.map--; closeMap();
        document.querySelectorAll('.panel-slot').forEach(s => s.classList.remove('active'));
      }
      _popping = false;
    });
  }

  // ─── CLOSE ALL MODULES ───────────────────────────────────────────
  // skipHistory=true is used when we're about to immediately open a
  // different module (tab switch) — it avoids each module's own
  // history.go() unwind racing against the next module's pushState,
  // which was causing a tab switch to intermittently bounce back to
  // the home view and require a second click to actually open.
  function closeAllModules(skipHistory) {
    // FIX #9: stop carousel auto-timer when navigating away
    stopAuto();

    closeUnitViewer(skipHistory);
    closeMap(skipHistory);
    unitRowVisible = false;
    const row = document.getElementById('unit-row');
    if (row) row.classList.remove('visible');
    document.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
    const fpOverlay = document.getElementById('fp-overlay');
    if (fpOverlay) fpOverlay.style.pointerEvents = 'none';
    if (window.FloorplanModule && typeof FloorplanModule.close === 'function') FloorplanModule.close(skipHistory);
    setTimeout(() => { if (fpOverlay) fpOverlay.style.pointerEvents = ''; }, 420);
    if (window.GalleryModule && typeof GalleryModule.close === 'function') GalleryModule.close(skipHistory);

    // Restart carousel auto-play after closing modules
    // (only matters if carousel becomes visible again)
    startAuto();
  }

  // ─── PANEL EVENTS ────────────────────────────────────────────────
  function bindPanelEvents() {
    document.querySelectorAll('.panel-slot').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const slot     = el.dataset.slot;
        const isActive = el.classList.contains('active');
        document.querySelectorAll('.panel-slot').forEach(s => s.classList.remove('active'));
        // Switching to a different tab (isActive===false) means a new
        // module opens right after this — skip each module's own
        // history.go() unwind so it can't race the new pushState.
        // Toggling the CURRENT tab off (isActive===true) is a real
        // close with nothing opening next, so unwind history properly.
        closeAllModules(!isActive);
        if (isActive) return;
        el.classList.add('active');

        // Track section entry in GA4 — this is the real click path for
        // Floor Plan / 360 View / Gallery / Location, unlike App.navigate()
        // which these buttons never call.
        if (typeof gtag === 'function') {
          gtag('event', 'view_change', { view_name: slot });
        }

        if (slot === '360view') {
          unitRowVisible = true;
          document.getElementById('unit-row')?.classList.add('visible');
          loadUnitThumbnails();
          // Warm the most-clicked unit while the user picks
          const iframe = document.getElementById('unit-iframe');
          if (iframe && !iframe.dataset.targetUrl) {
            iframe.dataset.targetUrl = unitURLs[1];
            iframe.src = unitURLs[1];
          }
          return;
        }
        if (slot === 'floorplan') { if (window.FloorplanModule) FloorplanModule.open(); return; }
        if (slot === 'gallery')   { if (window.GalleryModule)   GalleryModule.open();   return; }
        if (slot === 'map')       { openMap(); return; }
      });
    });

    document.querySelectorAll('.unit-btn').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
        el.classList.add('active');
        const unitNum = parseInt(el.dataset.unit);

        // Track which specific unit's 360 view was opened
        if (typeof gtag === 'function') {
          gtag('event', 'unit_360_view', { unit_number: unitNum });
        }

        openUnitViewer(unitNum);
      });
    });

    document.addEventListener('click', (e) => {
      const bar        = document.getElementById('bottom-panel');
      const row        = document.getElementById('unit-row');
      const overlay    = document.getElementById('unit-viewer-overlay');
      const fpOvl      = document.getElementById('fp-overlay');
      const lb         = document.getElementById('lightbox');
      const mapOvl     = document.getElementById('map-overlay');
      const sidePanel  = document.getElementById('side-panel');
      const sideToggle = document.getElementById('toggle');

      if (lb     && lb.classList.contains('open'))                                     return;
      if (mapOvl && mapOvl.classList.contains('open') && mapOvl.contains(e.target))   return;
      if (overlay && overlay.classList.contains('open') && overlay.contains(e.target)) return;

      const clickedOutside =
        bar && row &&
        !bar.contains(e.target) &&
        !row.contains(e.target) &&
        !(overlay    && overlay.contains(e.target))    &&
        !(fpOvl      && fpOvl.contains(e.target))      &&
        !(sidePanel  && sidePanel.contains(e.target))  &&
        !(sideToggle && sideToggle.contains(e.target));

      if (clickedOutside) {
        document.querySelectorAll('.panel-slot').forEach(s => s.classList.remove('active'));
        closeAllModules();
      }
    });
  }

  // ─── ORIENTATION CHECK ───────────────────────────────────────────
  function bindOrientationCheck() {
    function check() {
      const prompt = document.getElementById('rotate-prompt');
      if (!prompt) return;
      // Portrait is now fully supported — no longer forcing landscape rotation.
      prompt.classList.remove('show');
    }
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    check();
  }

  // ─── PUBLIC API ──────────────────────────────────────────────────
  return {
    init() {
      injectHTML();
      initCarousel();
      bindLightboxZoom();
      bindMapEvents();
      bindPanelEvents();
      bindBackNav();
      bindOrientationCheck();
      if (window.App && typeof window.App.finishLoad === 'function') App.finishLoad();

      // Default view: open straight into the Floor Plan instead of the
      // carousel, since most customers land here first.
      stopAuto();
      const fpSlot = document.querySelector('.panel-slot[data-slot="floorplan"]');
      if (fpSlot && window.FloorplanModule && typeof FloorplanModule.open === 'function') {
        fpSlot.classList.add('active');
        if (typeof gtag === 'function') gtag('event', 'view_change', { view_name: 'floorplan' });
        FloorplanModule.open();
      }
    }
  };

})();