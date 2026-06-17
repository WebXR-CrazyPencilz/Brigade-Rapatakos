// home.js — Brigade Stellaris · UI v2
window.HomeModule = (function () {

  let unitRowVisible = false;
  let current       = 0;
  let autoTimer     = null;
  let isAnimating   = false;
  let startX        = 0;
  let startY        = 0;

  // ─── UNIT URL MAP ────────────────────────────────────────────────
  const unitURLs = {
    1: 'unit1/index.html',
    2: 'unit2/index.html',
    3: 'unit3/index.html',
    4: 'unit4/index.html',
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
        position: fixed; inset: 0; bottom: 62px;
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
        position: fixed; inset: 0; bottom: 62px; z-index: 300;
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
      }
      #map-img { width: 100%; height: 100%; object-fit: cover; display: block; user-select: none; -webkit-user-drag: none; }
      #map-spinner { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0; pointer-events: none; transition: opacity 0.22s; }
      #map-spinner.visible { opacity: 1; }
      #map-spinner-ring { width: 32px; height: 32px; border: 2px solid rgba(122,62,30,.20); border-top-color: rgba(122,62,30,.85); border-radius: 50%; animation: spinMap 0.72s linear infinite; }
      @keyframes spinMap { to { transform: rotate(360deg); } }

      /* ── Unit Row — tab strip ── */
      #unit-row {
        position: fixed; bottom: 62px; left: 0; right: 0;
        width: 100%; z-index: 101;
        display: flex; flex-direction: row;
        align-items: stretch; justify-content: center;
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
        display: flex; align-items: center; justify-content: center;
        padding: 11px 32px; cursor: pointer;
        background: transparent;
        border-bottom: 2.5px solid transparent;
        border-top: 2.5px solid transparent;
        transition: border-color .22s, background .22s;
        -webkit-tap-highlight-color: transparent;
        flex: 1; max-width: 140px;
      }
      /* divider between tabs */
      .unit-btn + .unit-btn::before {
        content: '';
        position: absolute; left: 0; top: 20%; height: 60%;
        width: 1px; background: rgba(120,80,40,.14);
      }
      .unit-btn:hover { background: rgba(122,62,30,.05); }
      .unit-btn.active { border-bottom-color: #7a3e1e; }
      .unit-btn-label {
        font-family: 'Syne', sans-serif; font-size: 10.5px; font-weight: 700;
        letter-spacing: .12em; text-transform: uppercase;
        color: rgba(80,55,30,.45); line-height: 1; white-space: nowrap;
        transition: color .22s;
      }
      .unit-btn.active .unit-btn-label { color: #7a3e1e; }
      .unit-btn:hover:not(.active) .unit-btn-label { color: rgba(80,55,30,.75); }

      /* ── Bottom Panel ── */
      #bottom-panel {
        position: fixed; bottom: 0; left: 0; right: 0; width: 100%; height: 62px; z-index: 100;
        display: flex; flex-direction: row; align-items: center;
        background: rgba(245,242,235,0.97);
        border-top: 1px solid rgba(180,160,120,.25);
        backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
        box-shadow: 0 -2px 20px rgba(0,0,0,.07);
        box-sizing: border-box; padding: 0 16px; gap: 0;
        transform: translateY(100%);
        animation: panelRiseIn .6s cubic-bezier(0.22,1,0.36,1) .3s forwards;
      }
      @keyframes panelRiseIn { from{transform:translateY(100%);}to{transform:translateY(0);} }

      /* Nav group — center */
      #panel-nav-group {
        display: flex; flex-direction: row; align-items: stretch;
        flex: 1; justify-content: center; height: 100%;
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

      /* Chat Here button */
      #panel-chat-btn {
        display: flex; align-items: center; gap: 7px;
        padding: 9px 16px; cursor: pointer;
        border: 1px solid rgba(120,80,40,.28); border-radius: 6px;
        background: transparent; flex-shrink: 0;
        transition: background .22s, border-color .22s;
        -webkit-tap-highlight-color: transparent;
        margin-left: 8px;
      }
      #panel-chat-btn:hover { background: rgba(122,62,30,.08); border-color: rgba(120,80,40,.55); }
      #panel-chat-btn-label {
        font-family: 'Syne', sans-serif; font-size: 10.5px; font-weight: 700;
        letter-spacing: .11em; text-transform: uppercase;
        color: rgba(80,55,30,.65); white-space: nowrap; transition: color .22s;
      }
      #panel-chat-btn:hover #panel-chat-btn-label { color: rgba(80,55,30,.95); }
      #panel-chat-arrow {
        font-size: 13px; color: rgba(80,55,30,.45);
        transition: transform .22s, color .22s; line-height: 1;
      }
      #panel-chat-btn:hover #panel-chat-arrow { transform: translateX(3px); color: rgba(80,55,30,.80); }

      /* ── Unit Viewer Overlay ── */
      #unit-viewer-overlay {
        position: fixed; top: 0; left: 0; right: 0; bottom: 62px; z-index: 99;
        transform: translateY(100%); transition: transform .5s cubic-bezier(0.22,1,0.36,1);
        background: #e8e4dd; padding: 24px; box-sizing: border-box;
        display: flex; flex-direction: column;
      }
      #unit-viewer-overlay.open { transform: translateY(0); }
      #unit-viewer-card {
        flex: 1; height: 100%; border-radius: 12px; overflow: hidden;
        box-shadow: 0 8px 40px rgba(0,0,0,.18);
        position: relative; background: #0a0805;
      }
      #unit-iframe { width:100%; height:100%; border:none; display:block; opacity:1; transition:opacity .35s; }
      #unit-iframe.fading { opacity:0; }
      #unit-loader { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(10,8,5,.55); opacity:0; pointer-events:none; transition:opacity .25s; z-index:2; }
      #unit-loader.visible { opacity:1; }
      #unit-loader-ring { width:36px; height:36px; border:2.5px solid rgba(200,190,154,.25); border-top-color:rgba(200,190,154,.9); border-radius:50%; animation:spinRing .75s linear infinite; }
      @keyframes spinRing { to{transform:rotate(360deg);} }

      /* ── Floor Plan toggle strip (shared with unit row style) ── */
      #fp-view-toggle {
        position: fixed; top: 16px; left: 50%; transform: translateX(-50%);
        z-index: 200;
        display: flex; flex-direction: row; align-items: center;
        background: rgba(245,242,235,0.95);
        backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
        border: 1px solid rgba(120,80,40,.22);
        border-radius: 8px;
        box-shadow: 0 4px 20px rgba(0,0,0,.12);
        padding: 3px;
        gap: 0;
        opacity: 0; pointer-events: none;
        transition: opacity .28s ease;
      }
      #fp-view-toggle.visible { opacity: 1; pointer-events: all; }
      .fp-toggle-btn {
        display: flex; align-items: center; justify-content: center;
        padding: 7px 20px; cursor: pointer;
        border-radius: 5px; background: transparent;
        transition: background .22s;
        -webkit-tap-highlight-color: transparent;
      }
      .fp-toggle-btn.active { background: #7a3e1e; }
      .fp-toggle-label {
        font-family: 'Syne', sans-serif; font-size: 10.5px; font-weight: 700;
        letter-spacing: .11em; text-transform: uppercase;
        color: rgba(80,55,30,.55); line-height: 1; white-space: nowrap;
        transition: color .22s;
      }
      .fp-toggle-btn.active .fp-toggle-label { color: #f5f0e8; }
      .fp-toggle-btn:hover:not(.active) .fp-toggle-label { color: rgba(80,55,30,.85); }
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
          </div>
        </div>
      </div>

      <div id="unit-row">
        <div class="unit-btn" data-unit="1"><span class="unit-btn-label">Unit 1</span></div>
        <div class="unit-btn" data-unit="2"><span class="unit-btn-label">Unit 2</span></div>
        <div class="unit-btn" data-unit="3"><span class="unit-btn-label">Unit 3</span></div>
        <div class="unit-btn" data-unit="4"><span class="unit-btn-label">Unit 4</span></div>
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
        <div id="panel-chat-btn">
          <span id="panel-chat-btn-label">Chat Here</span>
          <span id="panel-chat-arrow">→</span>
        </div>
      </div>

      <div id="unit-viewer-overlay">
        <div id="unit-viewer-card">
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
      current = targetIdx;
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

  function initCarousel() {
    const carousel = document.getElementById('carousel');

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
  }
  function closeLightbox() {
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
    document.getElementById('lb-close').addEventListener('click', closeLightbox);
    lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && document.getElementById('lightbox').classList.contains('open')) closeLightbox();
    });
  }

  // ─── LOCATION MAP ────────────────────────────────────────────────
  let _mapLoaded = false;

  function openMap() {
    const overlay = document.getElementById('map-overlay');
    if (!overlay) return;
    overlay.classList.add('open');
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

  function closeMap() {
    const overlay = document.getElementById('map-overlay');
    if (overlay) overlay.classList.remove('open');
  }

  function bindMapEvents() {
    const mapBack = document.getElementById('map-back');
    function handleMapBack() {
      closeMap();
      document.querySelectorAll('.panel-slot').forEach(s => s.classList.remove('active'));
    }
    mapBack.addEventListener('click', handleMapBack);
    mapBack.addEventListener('touchend', (e) => { e.preventDefault(); handleMapBack(); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.getElementById('map-overlay').classList.contains('open')) {
        handleMapBack();
      }
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
      background: rgba(15,12,8,.90) !important;
      border: 1px solid rgba(122,62,30,.35) !important;
      color: rgba(122,62,30,.80) !important;
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
  function openUnitViewer(unit) {
    const overlay = document.getElementById('unit-viewer-overlay');
    const iframe  = document.getElementById('unit-iframe');
    const loader  = document.getElementById('unit-loader');
    if (!overlay || !iframe) return;
    const url = unitURLs[unit];
    if (!url) return;
    const isSameUnit = iframe.src.endsWith(url);
    if (overlay.classList.contains('open') && isSameUnit) return;
    if (!isSameUnit) {
      iframe.classList.add('fading');
      if (loader) loader.classList.add('visible');
      setTimeout(() => {
        iframe.src = url;
        iframe.onload = () => {
          iframe.classList.remove('fading');
          if (loader) loader.classList.remove('visible');
          injectUnitTheme(iframe);
          iframe.onload = null;
        };
      }, 350);
    } else {
      injectUnitTheme(iframe);
    }
    overlay.classList.add('open');
  }

  function closeUnitViewer() {
    const overlay = document.getElementById('unit-viewer-overlay');
    if (overlay) overlay.classList.remove('open');
  }

  // ─── CLOSE ALL MODULES ───────────────────────────────────────────
  function closeAllModules() {
    closeUnitViewer();
    closeMap();
    unitRowVisible = false;
    const row = document.getElementById('unit-row');
    if (row) row.classList.remove('visible');
    document.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
    const fpOverlay = document.getElementById('fp-overlay');
    if (fpOverlay) fpOverlay.style.pointerEvents = 'none';
    if (window.FloorplanModule && typeof FloorplanModule.close === 'function') FloorplanModule.close();
    setTimeout(() => { if (fpOverlay) fpOverlay.style.pointerEvents = ''; }, 420);
    if (window.GalleryModule && typeof GalleryModule.close === 'function') GalleryModule.close();
  }

  // ─── PANEL EVENTS ────────────────────────────────────────────────
  function bindPanelEvents() {
    document.querySelectorAll('.panel-slot').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const slot     = el.dataset.slot;
        const isActive = el.classList.contains('active');
        document.querySelectorAll('.panel-slot').forEach(s => s.classList.remove('active'));
        closeAllModules();
        if (isActive) return;
        el.classList.add('active');
        if (slot === '360view') {
          setTimeout(() => {
            unitRowVisible = true;
            document.getElementById('unit-row')?.classList.add('visible');
          }, 420);
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
        openUnitViewer(parseInt(el.dataset.unit));
      });
    });

    // Click-outside to collapse
    document.addEventListener('click', (e) => {
      const bar     = document.getElementById('bottom-panel');
      const row     = document.getElementById('unit-row');
      const overlay = document.getElementById('unit-viewer-overlay');
      const fpOvl   = document.getElementById('fp-overlay');
      const lb      = document.getElementById('lightbox');
      const mapOvl  = document.getElementById('map-overlay');
      const chatBtn = document.getElementById('panel-chat-btn');
      if (lb    && lb.classList.contains('open'))                                      return;
      if (mapOvl && mapOvl.classList.contains('open') && mapOvl.contains(e.target))   return;
      const clickedOutside =
        bar && row &&
        !bar.contains(e.target) &&
        !row.contains(e.target) &&
        !(chatBtn  && chatBtn.contains(e.target)) &&
        !(overlay  && overlay.contains(e.target)) &&
        !(fpOvl    && fpOvl.contains(e.target));
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
      const isMobile = window.innerWidth <= 900 || 'ontouchstart' in window;
      prompt.classList.toggle('show', isMobile && window.innerHeight > window.innerWidth);
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
      bindOrientationCheck();
      if (window.App && typeof window.App.finishLoad === 'function') App.finishLoad();
    }
  };

})();