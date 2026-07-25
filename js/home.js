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
  let _landingHideTimeout    = null; // NAV-PATCH: pending timeout for the landing screen's hide animation

  // ─── BROWSER/HARDWARE BACK SUPPORT ────────────────────────────────
  const _hist = { map: 0, unit: 0, lb: 0, threeSixty: 0, gmap: 0 };
  let _popping = false;

  function pushHist(key, replace) {
    if (replace) history.replaceState({ home: key }, '');
    else history.pushState({ home: key }, '');
    _hist[key] = 1;
  }
  function unwindHist(key, skipGo) {
    if (!_popping && _hist[key] > 0) {
      const n = _hist[key];
      _hist[key] = 0;
      if (!skipGo) history.go(-n);
    }
  }
  function requestHistBack(key, closeFn) {
    if (_hist[key] > 0) history.back();
    else closeFn();
  }

  const unitURLs = {
    1: 'unit1/index.html',
    2: 'unit2/index.html',
    3: 'unit3/index.html',
    4: 'unit4/index.html',
  };

  // ─── UNIT FLOOR PLAN THUMBNAILS ──────────────────────────────────
  // Config for the new #unit-plans-gallery section — one entry per
  // card. Replace `image` with the real floor plan render for that
  // unit (an ImageKit/Cloudinary URL, same pattern as IMAGES/
  // MAP_IMAGE_SRC above). title/subtitle/towerLine are the small
  // caption text printed over the top-left of each thumbnail;
  // pillLabel is the text on the button underneath the card.
  const UNIT_PLAN_THUMBS = [
    {
      id: 1,
      image: 'https://ik.imagekit.io/pwzaetheh/360view/4bhkf.jpg',
      title: 'UNIT01',
      subtitle: '4BHK - F',
      towerLine: 'TOWER - 03 (EVEN)',
      pillLabel: 'Unit 1',
    },
    {
      id: 2,
      image: 'https://ik.imagekit.io/pwzaetheh/360view/3bhklc.jpg',
      title: 'UNIT02',
      subtitle: '3BHK(L) - C',
      towerLine: 'TOWER - 02',
      pillLabel: 'Unit 2',
    },
    {
      id: 3,
      image: 'https://ik.imagekit.io/pwzaetheh/360view/3bhksb.jpg',
      title: 'UNIT03',
      subtitle: '3BHK(S) - B',
      towerLine: 'TOWER - 03 (ODD)',
      pillLabel: 'Unit 3',
    },
  ];

  const IMAGES = [
    { src: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1781157224/01_abyzw2.jpg', label: 'View 1' },
  ];

  const MAP_IMAGE_SRC = 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1781162438/locationmap_cvfs0z.jpg';

  const GMAPS_LINK       = 'https://maps.app.goo.gl/kHTxw1SK2QpXku2KA';
  const GMAPS_EMBED_SRC  = 'https://www.google.com/maps?q=12.9920591,80.2189587&z=17&output=embed';

  // ─── SVG ICONS (medium-thickness, non-scaling stroke) ─────────────
  const ICON_FLOORPLAN = `<svg class="panel-slot-icon" width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0.75" y="0.75" width="4.5" height="4.5" rx="0.5" stroke="currentColor" stroke-width="1.7" vector-effect="non-scaling-stroke"/>
    <rect x="7.75" y="0.75" width="4.5" height="4.5" rx="0.5" stroke="currentColor" stroke-width="1.7" vector-effect="non-scaling-stroke"/>
    <rect x="0.75" y="7.75" width="4.5" height="4.5" rx="0.5" stroke="currentColor" stroke-width="1.7" vector-effect="non-scaling-stroke"/>
    <rect x="7.75" y="7.75" width="4.5" height="4.5" rx="0.5" stroke="currentColor" stroke-width="1.7" vector-effect="non-scaling-stroke"/>
  </svg>`;

  const ICON_360 = `<svg class="panel-slot-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="7" cy="7" r="5.75" stroke="currentColor" stroke-width="1.7" vector-effect="non-scaling-stroke"/>
    <line x1="1.25" y1="7" x2="12.75" y2="7" stroke="currentColor" stroke-width="1.7" vector-effect="non-scaling-stroke"/>
    <path d="M7 1.25C7 1.25 9.25 3.75 9.25 7C9.25 10.25 7 12.75 7 12.75" stroke="currentColor" stroke-width="1.7" vector-effect="non-scaling-stroke"/>
    <path d="M7 1.25C7 1.25 4.75 3.75 4.75 7C4.75 10.25 7 12.75 7 12.75" stroke="currentColor" stroke-width="1.7" vector-effect="non-scaling-stroke"/>
  </svg>`;

  const ICON_GALLERY = `<svg class="panel-slot-icon" width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0.75" y="0.75" width="12.5" height="9.5" rx="1.25" stroke="currentColor" stroke-width="1.7" vector-effect="non-scaling-stroke"/>
    <circle cx="4.5" cy="4.5" r="1.25" stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
    <path d="M0.75 8.5L3.5 6L6 8L9 5.5L13.25 9.5" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>
    <line x1="3" y1="12.5" x2="11" y2="12.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" vector-effect="non-scaling-stroke"/>
  </svg>`;

  const ICON_LOCATION = `<svg class="panel-slot-icon" width="13" height="14" viewBox="0 0 13 14" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M6.5 1C4.015 1 2 3.015 2 5.5C2 8.985 6.5 13.5 6.5 13.5C6.5 13.5 11 8.985 11 5.5C11 3.015 8.985 1 6.5 1Z" stroke="currentColor" stroke-width="1.7" vector-effect="non-scaling-stroke"/>
    <circle cx="6.5" cy="5.5" r="1.5" stroke="currentColor" stroke-width="1.5" vector-effect="non-scaling-stroke"/>
  </svg>`;

  // ─── INJECT HTML & STYLES ────────────────────────────────────────
  function injectHTML() {
    if (document.getElementById('bottom-panel')) return;

    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=Cormorant+Garamond:wght@300;400;500&display=swap');

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
      #hc-vignette { display: none; }
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
        width: 56px; height: 34px; border-radius: 8px;
        border: 1px solid #7a3e1e; background: #7a3e1e;
        display: flex; align-items: center; justify-content: center;
        transition: background 0.2s, border-color 0.2s;
      }
      #map-back:hover #map-back-btn, #map-back:active #map-back-btn {
        background: #9a5327; border-color: #b56530;
      }
      #map-back-btn svg {
        width: 16px; height: 16px; stroke: #ffffff;
        fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;
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

      #map-gmaps-btn {
        position: absolute; bottom: 8px; right: 0; z-index: 10;
        width: 148px; height: 92px;
        display: flex; align-items: flex-end;
        border: 1px solid #9a5327;
        border-bottom: none; border-right: none;
        border-radius: 10px 0 8px 0;
        overflow: hidden;
        box-shadow: 0 -2px 10px rgba(0,0,0,.25);
        transition: box-shadow .2s, transform .2s;
        -webkit-tap-highlight-color: transparent;
        cursor: pointer;
        background: #1a1410;
      }
      #map-gmaps-btn-preview {
        position: absolute; inset: 0; z-index: 0;
        width: 100%; height: 100%;
        border: none; pointer-events: none;
      }
      #map-gmaps-btn::before {
        content: '';
        position: absolute; inset: 0; z-index: 1;
        background: linear-gradient(to top, rgba(10,8,6,.85) 0%, rgba(10,8,6,.15) 55%, transparent 100%);
      }
      #map-gmaps-btn-label {
        position: relative; z-index: 2;
        display: flex; align-items: center; gap: 6px;
        font-family: 'Syne', sans-serif; font-size: 10px; font-weight: 700;
        letter-spacing: .06em; text-transform: uppercase;
        color: #ffffff; padding: 8px 10px; width: 100%; box-sizing: border-box;
      }
      #map-gmaps-btn-label svg { width: 12px; height: 12px; flex-shrink: 0; color: #d99a5e; }
      #map-gmaps-btn:hover { box-shadow: 0 -4px 16px rgba(0,0,0,.35); }
      #map-gmaps-btn:active { transform: scale(0.98); }
      @media (max-width: 520px) {
        #map-gmaps-btn { width: 112px; height: 74px; }
        #map-gmaps-btn-label { font-size: 9px; padding: 6px 8px; }
      }
      #map-spinner { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity 0.22s; }
      #map-spinner.visible { opacity: 1; }
      #map-spinner-ring { width: 32px; height: 32px; border: 2px solid rgba(122,62,30,.20); border-top-color: rgba(122,62,30,.85); border-radius: 50%; animation: spinMap 0.72s linear infinite; }
      @keyframes spinMap { to { transform: rotate(360deg); } }

      #gmap-embed-overlay {
        position: fixed; inset: 0; bottom: calc(62px + env(safe-area-inset-bottom, 0px)); z-index: 320;
        background: #e8e4dd;
        display: flex; flex-direction: column; padding: 24px; box-sizing: border-box;
        opacity: 0; pointer-events: none;
        transform: translateY(8px);
        transition: opacity 0.35s ease, transform 0.35s cubic-bezier(0.22,1,0.36,1);
      }
      #gmap-embed-overlay.open { opacity: 1; pointer-events: all; transform: translateY(0); }
      #gmap-embed-card {
        flex: 1; border-radius: 12px; overflow: hidden;
        box-shadow: 0 8px 40px rgba(0,0,0,.18);
        background: #0d1a24;
        display: flex; flex-direction: column; position: relative;
      }
      #gmap-embed-topbar {
        flex-shrink: 0;
        display: flex; align-items: center; gap: 12px;
        padding: 10px 14px;
        background: rgba(10,25,36,.95);
        border-bottom: 1px solid rgba(122,62,30,.20);
        backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px);
        position: relative; z-index: 2;
      }
      #gmap-embed-back {
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; flex-shrink: 0; -webkit-tap-highlight-color: transparent;
      }
      #gmap-embed-back-btn {
        width: 56px; height: 34px; border-radius: 8px;
        border: 1px solid #7a3e1e; background: #7a3e1e;
        display: flex; align-items: center; justify-content: center;
        transition: background 0.2s, border-color 0.2s;
      }
      #gmap-embed-back:hover #gmap-embed-back-btn, #gmap-embed-back:active #gmap-embed-back-btn {
        background: #9a5327; border-color: #b56530;
      }
      #gmap-embed-back-btn svg {
        width: 16px; height: 16px; stroke: #ffffff;
        fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;
      }
      #gmap-embed-title {
        font-family: 'Cormorant Garamond', serif;
        font-size: 15px; font-weight: 400; color: rgba(245,242,235,.85);
        letter-spacing: 0.04em; flex: 1;
      }
      #gmap-embed-open-external {
        display: flex; align-items: center; gap: 6px;
        font-family: 'Syne', sans-serif; font-size: 9.5px; font-weight: 700;
        letter-spacing: .07em; text-transform: uppercase;
        color: rgba(200,185,165,.80); text-decoration: none;
        border: 1px solid rgba(122,62,30,.35); background: rgba(122,62,30,.08);
        padding: 7px 12px; border-radius: 7px;
        transition: background .2s, border-color .2s, color .2s;
        flex-shrink: 0; white-space: nowrap;
      }
      #gmap-embed-open-external:hover {
        background: rgba(122,62,30,.22); border-color: rgba(122,62,30,.65); color: #f5f0e8;
      }
      #gmap-embed-open-external svg { width: 12px; height: 12px; flex-shrink: 0; }
      #gmap-embed-body { flex: 1; position: relative; background: #0d1a24; }
      #gmap-embed-iframe {
        width: 100%; height: 100%; border: none; display: block;
        opacity: 0; transition: opacity 0.3s ease;
      }
      #gmap-embed-iframe.loaded { opacity: 1; }
      #gmap-embed-spinner {
        position: absolute; inset: 0; display: flex; align-items: center; justify-content: center;
        opacity: 1; pointer-events: none; transition: opacity 0.22s;
      }
      #gmap-embed-spinner.hidden { opacity: 0; }
      #gmap-embed-spinner-ring {
        width: 32px; height: 32px; border: 2px solid rgba(122,62,30,.20);
        border-top-color: rgba(122,62,30,.85); border-radius: 50%;
        animation: spinMap 0.72s linear infinite;
      }
      @media (max-width: 640px) {
        #gmap-embed-overlay { padding: 12px; }
        #gmap-embed-title { font-size: 13px; }
        #gmap-embed-open-external span { display: none; }
      }

      #unit-row {
        position: fixed; top: 0; left: 0; right: 0; bottom: calc(62px + env(safe-area-inset-bottom, 0px));
        z-index: 98;
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        grid-template-rows: repeat(2, 1fr);
        gap: 16px;
        align-items: stretch; justify-items: stretch;
        overflow: hidden;
        padding: 22px;
        margin: 16px;
        border-radius: 22px;
        border: 1px solid rgba(255,255,255,.14);
        background: rgba(10,8,6,.28);
        backdrop-filter: blur(6px);
        -webkit-backdrop-filter: blur(6px);
        opacity: 0; pointer-events: none;
        transition: opacity .28s ease;
        box-sizing: border-box;
      }
      #unit-row.visible { opacity: 1; pointer-events: all; }

      /* ─── UNIT FLOOR PLAN THUMBNAILS (new section) ───────────────
         Static gallery — driven by UNIT_PLAN_THUMBS above. Not tied to
         any open/close state by default (renders inline wherever the
         markup sits); use HomeModule.showUnitPlans()/hideUnitPlans()
         if you want to toggle it like the other overlays. */
      #unit-plans-gallery {
        /* FIX: this element had no "position" set, so per CSS stacking
           rules it painted in the "non-positioned block" layer — which
           paints BEFORE positioned elements with z-index:auto. #carousel
           is position:fixed and covers the entire viewport as the
           always-on home background, so even though this gallery comes
           LATER in the HTML, #carousel was painting ON TOP of it and
           hiding it completely — nothing to do with the image URLs
           (verified those load fine). Making this positioned + giving it
           an explicit z-index moves it into the later stacking layer, so
           it now paints above #carousel as intended. */
        position: relative; z-index: 5;
        display: flex; flex-wrap: wrap; justify-content: center; gap: 32px;
        padding: 40px 24px;
        background: #f5f4f2;
      }
      .unit-plan-card {
        width: 340px; display: flex; flex-direction: column; align-items: center; gap: 16px;
      }
      .unit-plan-thumb {
        position: relative; width: 100%;
        background: #ffffff; border-radius: 18px; overflow: hidden;
        box-shadow: 0 3px 10px rgba(0,0,0,.08);
      }
      .unit-plan-thumb img {
        width: 100%; height: auto; display: block;
      }
      .unit-plan-caption {
        position: absolute; top: 14px; left: 16px;
        font-family: 'Syne', sans-serif; font-weight: 700;
        color: #7a3e1e; line-height: 1.5; pointer-events: none;
      }
      .unit-plan-caption span { display: block; font-size: 9px; letter-spacing: .04em; }
      .unit-plan-icon {
        position: absolute; top: 12px; right: 14px;
        width: 22px; height: 22px; color: #7a3e1e; opacity: .85;
      }
      .unit-plan-pill {
        font-family: 'Syne', sans-serif; font-size: 13px; font-weight: 700;
        letter-spacing: .08em; text-transform: uppercase; color: #7a3e1e;
        background: #ffffff; border: 1.5px solid #c9762f; border-radius: 999px;
        padding: 10px 28px; cursor: pointer;
        transition: background .2s ease, color .2s ease;
      }
      .unit-plan-pill:hover {
        background: #c9762f; color: #ffffff;
      }
      @media (min-width: 641px) {
        .unit-plan-card { width: 460px; }
        .unit-plan-thumb { padding: 24px; box-sizing: border-box; }
      }
      @media (max-width: 640px) {
        .unit-plan-card { width: 46%; min-width: 170px; }
      }

      .unit-btn {
        position: relative;
        display: flex; flex-direction: column; align-items: center; justify-content: flex-end;
        cursor: pointer;
        border: 2px solid transparent;
        border-radius: 14px;
        overflow: hidden;
        clip-path: inset(0 round 14px);
        -webkit-clip-path: inset(0 round 14px);
        -webkit-mask-image: -webkit-radial-gradient(white, white);
        box-shadow: none;
        transition: border-color .22s, box-shadow .22s, transform .18s ease;
        -webkit-tap-highlight-color: transparent;
        width: 100%;
        height: 100%;
        margin: 0;
        background: #0d0d0d;
        z-index: 1;
      }
      .unit-btn:hover { transform: translateY(-2px); box-shadow: none; z-index: 2; }
      .unit-btn:active { transform: translateY(0); box-shadow: none; }
      .unit-btn.active { border-color: #7a3e1e; box-shadow: inset 0 0 0 1px rgba(122,62,30,.35); }

      .unit-btn-overlay {
        position: absolute; inset: 0;
        z-index: 3;
        pointer-events: none;
        background: rgba(122,62,30,0);
        transition: background .22s ease;
      }
      .unit-btn:hover .unit-btn-overlay { background: rgba(20,14,8,.12); }
      .unit-btn.active .unit-btn-overlay { background: rgba(122,62,30,.16); }

      .unit-btn-thumb-frame {
        position: absolute; inset: 0;
        pointer-events: none;
        overflow: hidden;
        border-radius: 14px;
        clip-path: inset(0 round 14px);
        -webkit-clip-path: inset(0 round 14px);
        background: #ffffff;
      }
      .unit-btn-thumb-frame iframe,
      .unit-btn-thumb-frame img {
        position: absolute; top: 0; left: 0;
        width: 100%; height: 100%;
        border: none;
        border-radius: 14px;
        background: #ffffff;
        object-fit: cover;
      }
      .unit-btn-thumb-scrim {
        position: absolute; inset: 0;
        background: linear-gradient(to top, rgba(0,0,0,.35) 0%, transparent 45%);
        pointer-events: none;
      }
      .unit-btn-label {
        position: relative; z-index: 4;
        font-family: 'Syne', sans-serif; font-size: 16px; font-weight: 700;
        letter-spacing: .11em; text-transform: uppercase;
        color: #c98a4b; line-height: 1; white-space: nowrap;
        padding: 12px 0 14px;
        transition: color .22s;
      }
      .unit-btn.active .unit-btn-label { color: #f0c896; }

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

      .panel-slot-icon { flex-shrink: 0; color: rgba(80,55,30,.60); transition: color .22s; }
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

      .panel-slot + .panel-slot::before {
        content: '';
        position: absolute; left: 0; top: 28%; height: 44%;
        width: 1px; background: rgba(120,80,40,.12);
      }
      .panel-slot.active + .panel-slot::before,
      .panel-slot + .panel-slot.active::before { display: none; }

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

      #unit-back {
        position: absolute;
        top: calc(14px + env(safe-area-inset-top, 0px));
        left: calc(14px + env(safe-area-inset-left, 0px));
        z-index: 15;
        width: 56px; height: 34px; min-width: 56px; min-height: 34px; border-radius: 8px;
        border: 1px solid #7a3e1e; background: #7a3e1e;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; -webkit-tap-highlight-color: transparent;
        transition: background 0.2s, border-color 0.2s;
      }
      #unit-back:hover, #unit-back:active { background: #9a5327; border-color: #b56530; }
      #unit-back svg { width: 16px; height: 16px; stroke: #ffffff; fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

      @media (min-width: 641px) {
        #unit-row {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: center;
          flex-wrap: wrap;
          gap: 32px;
          padding: 40px;
          border: none;
          background: #f5f4f2;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
        }
        .unit-btn {
          flex: 0 1 260px;
          max-width: 320px;
          width: 100%;
          height: auto;
          margin: 0;
          flex-direction: column;
          align-items: stretch;
          justify-content: flex-start;
          gap: 14px;
          overflow: visible;
          border: none;
          border-radius: 0;
          clip-path: none;
          -webkit-clip-path: none;
          -webkit-mask-image: none;
          box-shadow: none;
          background: transparent;
        }
        .unit-btn:hover { transform: none; }
        .unit-btn:hover .unit-btn-thumb-frame { transform: translateY(-2px); }
        .unit-btn-thumb-frame {
          position: relative;
          inset: auto;
          width: 100%;
          aspect-ratio: 1 / 1;
          border-radius: 18px;
          overflow: hidden;
          background: #ffffff;
          border: 2px solid transparent;
          box-shadow: 0 10px 30px rgba(0,0,0,.14);
          transition: border-color .22s, box-shadow .22s;
        }
        .unit-btn.active { border-color: transparent; box-shadow: none; }
        .unit-btn.active .unit-btn-thumb-frame { border-color: #c9762f; }
        .unit-btn-thumb-frame iframe, .unit-btn-thumb-frame img { border-radius: 16px; }
        .unit-btn-thumb-scrim { display: none; }
        .unit-btn-overlay { background: transparent !important; }
        .unit-btn-label {
          position: static;
          align-self: center;
          padding: 8px 22px;
          border-radius: 8px;
          background: #ffffff;
          border: 1px solid rgba(0,0,0,.08);
          color: #7a5230;
          font-size: 13px;
          box-shadow: 0 4px 14px rgba(0,0,0,.08);
        }
        .unit-btn.active .unit-btn-label { background: #8a4a22; border-color: #8a4a22; color: #ffffff; }
      }

      @media (max-width: 640px) {
        .panel-slot { padding: 0 10px; gap: 5px; }
        .panel-slot-label { font-size: 9px; letter-spacing: .08em; }
        .panel-slot.active { margin: 8px 2px; }
        #carousel { padding: 12px; }
        #map-overlay { padding: 12px; }
        #map-title { font-size: 13px; }
        #lb-close { top: 12px; right: 12px; }
        #unit-row {
          padding: 12px;
          margin: 10px;
          gap: 10px;
          border-radius: 18px;
          grid-template-rows: repeat(2, minmax(0, 42vw));
          align-content: center;
        }
        .unit-btn { height: 100%; max-height: 42vw; }
      }
      @media (max-width: 360px) {
        .panel-slot { padding: 0 7px; gap: 4px; }
        .panel-slot-label { font-size: 8px; }
      }
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
            <div id="map-gmaps-btn">
              <iframe id="map-gmaps-btn-preview" src="${GMAPS_EMBED_SRC}" tabindex="-1" aria-hidden="true" loading="lazy"></iframe>
              <div id="map-gmaps-btn-label">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0Z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                View on Maps
              </div>
            </div>
          </div>
        </div>
      </div>

      <div id="gmap-embed-overlay">
        <div id="gmap-embed-card">
          <div id="gmap-embed-topbar">
            <div id="gmap-embed-back">
              <div id="gmap-embed-back-btn">
                <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
              </div>
            </div>
            <div id="gmap-embed-title">Google Maps</div>
            <a id="gmap-embed-open-external" href="${GMAPS_LINK}" target="_blank" rel="noopener noreferrer">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              <span>Open in App</span>
            </a>
          </div>
          <div id="gmap-embed-body">
            <div id="gmap-embed-spinner"><div id="gmap-embed-spinner-ring"></div></div>
            <iframe id="gmap-embed-iframe" src="" loading="lazy" referrerpolicy="no-referrer-when-downgrade" allowfullscreen></iframe>
          </div>
        </div>
      </div>

      <div id="unit-row">
        ${UNIT_PLAN_THUMBS.map(u => `
          <div class="unit-btn" data-unit="${u.id}">
            <div class="unit-btn-thumb-frame"><img src="${u.image}" alt="${u.title} floor plan" loading="lazy" /></div>
            <div class="unit-btn-thumb-scrim"></div>
            <div class="unit-btn-overlay"></div>
            <span class="unit-btn-label">${u.pillLabel}</span>
          </div>
        `).join('')}
      </div>

      <div id="unit-plans-gallery">
        ${UNIT_PLAN_THUMBS.map(u => `
          <div class="unit-plan-card">
            <div class="unit-plan-thumb">
              <img src="${u.image}" alt="${u.title} floor plan" loading="lazy" />
              <div class="unit-plan-caption">
                <span>${u.title}</span>
                <span>${u.subtitle}</span>
                <span>${u.towerLine}</span>
              </div>
              <svg class="unit-plan-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
                <path d="M9 3H5a2 2 0 0 0-2 2v4"/>
                <path d="M15 3h4a2 2 0 0 1 2 2v4"/>
                <path d="M9 21H5a2 2 0 0 1-2-2v-4"/>
                <path d="M15 21h4a2 2 0 0 0 2-2v-4"/>
              </svg>
            </div>
            <button type="button" class="unit-plan-pill" data-plan-unit="${u.id}">${u.pillLabel}</button>
          </div>
        `).join('')}
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

    const carouselImg = document.getElementById('carousel-img');
    if (carouselImg && IMAGES.length > 0) {
      carouselImg.src = IMAGES[0].src;
      carouselImg.alt = IMAGES[0].label || '';
    }
  }

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
      reportCarouselDwell(current);
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
    }, 3000);
  }

  function stopAuto() {
    clearInterval(autoTimer);
    autoTimer = null;
  }

  function initCarousel() {
    const carousel = document.getElementById('carousel');
    carouselSlideEnteredAt = Date.now();

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

  let _mapLoaded = false;

  function openMap(replaceHistory) {
    const overlay = document.getElementById('map-overlay');
    if (!overlay) return;
    overlay.classList.add('open');
    if (!_popping) pushHist('map', replaceHistory);
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

  let _gmapEmbedLoaded = false;

  function openGmapEmbed() {
    const overlay = document.getElementById('gmap-embed-overlay');
    if (!overlay) return;
    if (typeof gtag === 'function') {
      gtag('event', 'view_on_google_maps', { unit_number: window.UNIT_NUMBER || null });
    }
    overlay.classList.add('open');
    if (!_popping) pushHist('gmap');
    if (!_gmapEmbedLoaded) {
      _gmapEmbedLoaded = true;
      const iframe  = document.getElementById('gmap-embed-iframe');
      const spinner = document.getElementById('gmap-embed-spinner');
      iframe.addEventListener('load', () => {
        spinner.classList.add('hidden');
        iframe.classList.add('loaded');
      }, { once: true });
      iframe.src = GMAPS_EMBED_SRC;
    }
  }

  function closeGmapEmbed(skipHistory) {
    const overlay = document.getElementById('gmap-embed-overlay');
    if (!overlay || !overlay.classList.contains('open')) return;
    overlay.classList.remove('open');
    unwindHist('gmap', skipHistory);
  }

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
      const pivotY = e.clientY - rect.top - rect.height/2;
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

    const gmapsBtn = document.getElementById('map-gmaps-btn');
    if (gmapsBtn) {
      gmapsBtn.addEventListener('click', () => openGmapEmbed());
    }

    const gmapBack = document.getElementById('gmap-embed-back');
    function handleGmapEmbedBack() { requestHistBack('gmap', closeGmapEmbed); }
    if (gmapBack) {
      gmapBack.addEventListener('click', handleGmapEmbedBack);
      gmapBack.addEventListener('touchend', (e) => { e.preventDefault(); handleGmapEmbedBack(); });
    }

    document.addEventListener('keydown', (e) => {
      const gmapOverlay = document.getElementById('gmap-embed-overlay');
      const mapOverlay  = document.getElementById('map-overlay');
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key !== 'Escape' && e.key !== 'Backspace') return;
      if (gmapOverlay && gmapOverlay.classList.contains('open')) { e.preventDefault(); handleGmapEmbedBack(); return; }
      if (mapOverlay && mapOverlay.classList.contains('open')) { e.preventDefault(); handleMapBack(); }
    });
  }

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
    } catch (e) {}
  }

  function openUnitViewer(unit) {
    const overlay = document.getElementById('unit-viewer-overlay');
    const iframe  = document.getElementById('unit-iframe');
    const loader  = document.getElementById('unit-loader');
    if (!overlay || !iframe) return;
    const url = unitURLs[unit];
    if (!url) return;

    const currentTarget = iframe.dataset.targetUrl || '';
    const isSameUnit    = currentTarget === url;

    if (overlay.classList.contains('open') && isSameUnit) return;

    if (!isSameUnit) {
      if (activeUnitNumber !== null && activeUnitNumber !== unit) reportUnitViewerDwell();
      activeUnitNumber    = unit;
      unitViewerEnteredAt = Date.now();

      iframe.dataset.targetUrl = url;

      iframe.classList.add('fading');
      if (loader) loader.classList.add('visible');

      clearTimeout(unitLoadTimeout);

      unitLoadTimeout = setTimeout(() => {
        if (iframe.onload) {
          console.warn('Unit viewer: iframe did not finish loading within 12s for', url);
          iframe.classList.remove('fading');
          if (loader) loader.classList.remove('visible');
          iframe.onload = null;
        }
      }, 12000);

      iframe.onload = () => {
        clearTimeout(unitLoadTimeout);
        iframe.classList.remove('fading');
        if (loader) loader.classList.remove('visible');
        injectUnitTheme(iframe);
        iframe.onload = null;
      };

      iframe.src = url;
    } else {
      injectUnitTheme(iframe);
    }

    const wasOpen = overlay.classList.contains('open');
    overlay.classList.add('open');
    if (!wasOpen && !_popping) pushHist('unit');
  }

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

  function bindBackNav() {
    const unitBack = document.getElementById('unit-back');
    function requestUnitBack() { requestHistBack('unit', closeUnitViewer); }
    if (unitBack) {
      unitBack.addEventListener('click', requestUnitBack);
      unitBack.addEventListener('touchend', (e) => { e.preventDefault(); requestUnitBack(); });
    }

    document.addEventListener('keydown', (e) => {
      const overlay = document.getElementById('unit-viewer-overlay');
      if (!overlay || !overlay.classList.contains('open')) return;
      const t = e.target;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (e.key === 'Escape' || e.key === 'Backspace') { e.preventDefault(); requestUnitBack(); }
    });

    window.addEventListener('popstate', () => {
      _popping = true;
      const lb        = document.getElementById('lightbox');
      const gmapOvl    = document.getElementById('gmap-embed-overlay');
      const unitOvl    = document.getElementById('unit-viewer-overlay');
      const mapOvl     = document.getElementById('map-overlay');

      if (lb && lb.classList.contains('open') && _hist.lb > 0) {
        _hist.lb--; closeLightbox();
      } else if (gmapOvl && gmapOvl.classList.contains('open') && _hist.gmap > 0) {
        _hist.gmap--; closeGmapEmbed();
      } else if (unitOvl && unitOvl.classList.contains('open') && _hist.unit > 0) {
        _hist.unit--; closeUnitViewer();
      } else if (mapOvl && mapOvl.classList.contains('open') && _hist.map > 0) {
        _hist.map--; closeMap();
        document.querySelectorAll('.panel-slot').forEach(s => s.classList.remove('active'));
        // NAV-PATCH: nothing else is open after Location closes — surface Landing (home root).
        showLanding();
      } else if (unitRowVisible && _hist.threeSixty > 0) {
        _hist.threeSixty--;
        unitRowVisible = false;
        document.getElementById('unit-row')?.classList.remove('visible');
        document.getElementById('carousel').style.display = '';
        document.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.panel-slot').forEach(s => s.classList.remove('active'));
        // NAV-PATCH: nothing else is open after 360 Viewer closes — surface Landing (home root).
        showLanding();
      }
      _popping = false;
    });
  }

  function closeAllModules(skipHistory, toLanding) {
    stopAuto();
    document.getElementById('carousel').style.display = '';

    closeGmapEmbed(skipHistory);
    closeUnitViewer(skipHistory);
    closeMap(skipHistory);
    if (unitRowVisible) unwindHist('threeSixty', skipHistory);
    unitRowVisible = false;
    const row = document.getElementById('unit-row');
    if (row) row.classList.remove('visible');
    document.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
    const fpOverlay = document.getElementById('fp-overlay');
    if (fpOverlay) fpOverlay.style.pointerEvents = 'none';
    if (window.FloorplanModule && typeof FloorplanModule.close === 'function') FloorplanModule.close(skipHistory);
    setTimeout(() => { if (fpOverlay) fpOverlay.style.pointerEvents = ''; }, 420);
    if (window.GalleryModule && typeof GalleryModule.close === 'function') GalleryModule.close(skipHistory);

    startAuto();

    // NAV-PATCH: only re-surface Landing when we're actually landing back at
    // the idle/root state (i.e. nothing new is about to open). Callers that
    // are switching straight into another module pass toLanding=false so
    // there's no Landing flash between sibling switches.
    if (toLanding) showLanding();
  }

  function bindPanelEvents() {
    document.querySelectorAll('.panel-slot').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const slot     = el.dataset.slot;
        const isActive = el.classList.contains('active');
        const switching = !isActive && document.querySelector('.panel-slot.active') !== null;
        document.querySelectorAll('.panel-slot').forEach(s => s.classList.remove('active'));
        // NAV-PATCH: only show Landing if this click is *closing* the active
        // slot (isActive); if we're opening a new slot, closeAllModules must
        // not surface Landing first.
        closeAllModules(!isActive, isActive);
        if (isActive) return;
        el.classList.add('active');

        if (typeof gtag === 'function') {
          gtag('event', 'view_change', { view_name: slot });
        }

        if (slot === '360view') {
          unitRowVisible = true;
          document.getElementById('unit-row')?.classList.add('visible');
          if (!_popping) pushHist('threeSixty', switching);
          const iframe = document.getElementById('unit-iframe');
          if (iframe && !iframe.dataset.targetUrl) {
            iframe.dataset.targetUrl = unitURLs[1];
            iframe.src = unitURLs[1];
          }
          return;
        }
        if (slot === 'floorplan') { if (window.FloorplanModule) FloorplanModule.open(undefined, switching); return; }
        if (slot === 'gallery')   { if (window.GalleryModule)   GalleryModule.open(0, switching);   return; }
        if (slot === 'map')       { openMap(switching); return; }
      });
    });

    document.querySelectorAll('.unit-btn').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
        el.classList.add('active');
        const unitNum = parseInt(el.dataset.unit);

        if (typeof gtag === 'function') {
          gtag('event', 'unit_360_view', { unit_number: unitNum });
        }

        openUnitViewer(unitNum);
      });
    });

    // ─── UNIT PLAN THUMBNAIL PILLS ──────────────────────────────────
    // Fires a CustomEvent so this new gallery isn't hard-wired to any
    // one destination — listen for 'unitplan:select' wherever you want
    // to react (open a lightbox, scroll to a section, etc.), e.g.:
    //   document.addEventListener('unitplan:select', e => { ... e.detail.unitId ... });
    document.querySelectorAll('.unit-plan-pill').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const unitId = parseInt(btn.dataset.planUnit);
        document.dispatchEvent(new CustomEvent('unitplan:select', { detail: { unitId } }));
        if (typeof gtag === 'function') {
          gtag('event', 'unit_plan_thumb_click', { unit_number: unitId });
        }
      });
    });

    document.addEventListener('click', (e) => {
      const bar        = document.getElementById('bottom-panel');
      const row        = document.getElementById('unit-row');
      const overlay    = document.getElementById('unit-viewer-overlay');
      const fpOvl      = document.getElementById('fp-overlay');
      const lb         = document.getElementById('lightbox');
      const mapOvl     = document.getElementById('map-overlay');
      const gmapOvl    = document.getElementById('gmap-embed-overlay');
      const sidePanel  = document.getElementById('side-panel');
      const sideToggle = document.getElementById('toggle');

      if (lb      && lb.classList.contains('open'))                                    return;
      if (gmapOvl && gmapOvl.classList.contains('open') && gmapOvl.contains(e.target))  return;
      if (mapOvl  && mapOvl.classList.contains('open')  && mapOvl.contains(e.target))   return;
      if (overlay && overlay.classList.contains('open') && overlay.contains(e.target))  return;

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
        // NAV-PATCH: clicking outside with nothing about to open next → surface Landing.
        closeAllModules(false, true);
      }
    });
  }

  function bindOrientationCheck() {
    function check() {
      const prompt = document.getElementById('rotate-prompt');
      if (!prompt) return;
      prompt.classList.remove('show');
    }
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    check();
  }

  // NAV-PATCH: hideLanding()/showLanding() extracted so Landing can be a
  // re-enterable root state instead of a one-time splash. Same visual
  // transition as before (opacity/transform via the existing `.hide` class),
  // just made reversible.
  function hideLanding() {
    const screen = document.getElementById('landing-screen');
    if (!screen || screen.classList.contains('hide')) return;
    screen.classList.add('hide');
    clearTimeout(_landingHideTimeout);
    _landingHideTimeout = setTimeout(() => { screen.style.display = 'none'; }, 480);
  }

  function showLanding() {
    const screen = document.getElementById('landing-screen');
    if (!screen) return;
    document.querySelectorAll('.landing-card.active').forEach(c => c.classList.remove('active'));
    clearTimeout(_landingHideTimeout);
    screen.style.display = 'flex';
    // force reflow so removing '.hide' actually re-triggers the CSS transition
    void screen.offsetWidth;
    screen.classList.remove('hide');
  }

  function injectLanding() {
    if (document.getElementById('landing-screen')) return;

    const style = document.createElement('style');
    style.textContent = `
      #landing-screen {
        position: fixed; inset: 0; z-index: 500;
        background: #0a0805;
        display: flex; flex-direction: column; align-items: center; justify-content: center;
        overflow: hidden;
        opacity: 1; pointer-events: all;
        transition: opacity .45s ease;
      }
      #landing-screen::before { display: none; }
      #landing-screen.hide { opacity: 0; pointer-events: none; }

      /* NAV-PATCH: background lives on its own layer, oversized by 12% and
         re-centred (inset: -6%), so it can be scaled independently of the
         tagline/cards above it. --landing-bg-zoom is the one knob to turn:
         1 = baseline (same framing as before), <1 = zoom out a touch,
         >1 = zoom in. The 12% oversize gives headroom in both directions
         before any edge/gap would show. */
      #landing-bg {
        position: absolute; inset: -6%; z-index: 0;
        background: url('https://ik.imagekit.io/pwzaetheh/Home/landing.jpeg') center center / cover no-repeat;
        transform: scale(var(--landing-bg-zoom, 0.94));
      }

      #landing-tagline {
        font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 600;
        letter-spacing: .22em; text-transform: uppercase; color: #c9762f;
        margin-top: -30px; margin-bottom: 40px; text-align: center; padding: 0 20px;
        position: relative; z-index: 2;
      }

      #landing-cards {
        display: grid; grid-template-columns: repeat(4, 1fr); justify-content: center; gap: 22px;
        padding: 0 24px; max-width: 1100px; width: 100%; margin: 0 auto;
        position: relative; z-index: 2;
      }

      .landing-card {
        width: 100%; height: 268px;
        background: #fdfbf8;
        border: 1px solid rgba(255,255,255,.45);
        border-radius: 18px;
        display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 18px;
        cursor: pointer;
        box-shadow: 0 3px 8px rgba(0,0,0,.07);
        transition: transform .22s ease, border-color .22s ease, background .22s ease, box-shadow .22s ease;
        -webkit-tap-highlight-color: transparent;
      }
      .landing-card:hover,
      .landing-card:focus,
      .landing-card:focus-visible,
      .landing-card.active {
        background: linear-gradient(135deg, #7A3E1E 0%, #C97846 100%);
        border-color: transparent;
        transform: translateY(-4px);
        box-shadow: 0 6px 14px rgba(0,0,0,.10);
        outline: none;
      }
      .landing-card .panel-slot-icon {
        width: 48px; height: 48px;
        color: #c9762f;
        transition: color .22s ease;
      }
      .landing-card:hover .panel-slot-icon,
      .landing-card:focus .panel-slot-icon,
      .landing-card:focus-visible .panel-slot-icon,
      .landing-card.active .panel-slot-icon {
        color: #f5f0e8;
      }

      .landing-card-label {
        font-family: 'Syne', sans-serif; font-size: 17px; font-weight: 700;
        letter-spacing: .12em; text-transform: uppercase;
        color: #2b3a4a; transition: color .22s ease;
      }
      .landing-card:hover .landing-card-label,
      .landing-card:focus .landing-card-label,
      .landing-card:focus-visible .landing-card-label,
      .landing-card.active .landing-card-label {
        color: #f5f0e8;
      }

      @media (max-width: 640px) {
        #landing-tagline { font-size: 23px; font-weight: 600; letter-spacing: .14em; margin-top: -52px; margin-bottom: 26px; }
        .landing-card-label { font-size: 16px; }
        #landing-cards {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          justify-content: center;
          justify-items: center;
          gap: 18px;
          max-width: 452px;
          width: 100%;
          margin: 0 auto;
        }
        .landing-card {
          width: 100%;
          height: 216px;
          gap: 14px;
          border-radius: 18px;
        }
        .landing-card .panel-slot-icon { width: 47px; height: 47px; }
      }
      @media (max-width: 360px) {
        .landing-card { width: 100%; height: 188px; }
        #landing-cards { max-width: 340px; }
      }
    `;
    document.head.appendChild(style);

    document.body.insertAdjacentHTML('beforeend', `
      <div id="landing-screen">
        <div id="landing-bg"></div>
        <div id="landing-tagline">Explore. Experience. Envision.</div>
        <div id="landing-cards">
          <div class="landing-card" data-slot="floorplan">
            ${ICON_FLOORPLAN}
            <span class="landing-card-label">Floor Plan</span>
          </div>
          <div class="landing-card" data-slot="360view">
            ${ICON_360}
            <span class="landing-card-label">360 View</span>
          </div>
          <div class="landing-card" data-slot="gallery">
            ${ICON_GALLERY}
            <span class="landing-card-label">Gallery</span>
          </div>
          <div class="landing-card" data-slot="map">
            ${ICON_LOCATION}
            <span class="landing-card-label">Location</span>
          </div>
        </div>
      </div>
    `);

    document.getElementById('landing-screen').querySelectorAll('.landing-card').forEach(card => {
      card.addEventListener('click', (e) => {
        e.stopPropagation();
        document.querySelectorAll('.landing-card.active').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        const slot   = card.dataset.slot;
        // NAV-PATCH: reuse the shared hideLanding() instead of the inline
        // duplicate that used to live here, so open/close stays symmetric.
        hideLanding();
        const target = document.querySelector(`.panel-slot[data-slot="${slot}"]`);
        if (target) target.click();
      });
    });
  }

  return {
    init() {
      injectHTML();
      injectLanding();
      initCarousel();
      bindLightboxZoom();
      bindMapEvents();
      bindPanelEvents();
      bindBackNav();
      bindOrientationCheck();
      if (window.App && typeof window.App.finishLoad === 'function') App.finishLoad();

      stopAuto();
    },
    // NAV-PATCH: exposed so FloorplanModule/GalleryModule (files not in this
    // patch) can call HomeModule.showLanding() from their own back-button /
    // popstate handling once they finish closing, so "Floor Plan → Landing"
    // and "Gallery → Landing" work too. See chat notes for why this couldn't
    // be wired end-to-end here.
    showLanding
  };

})();