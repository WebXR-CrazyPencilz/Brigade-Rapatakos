// home.js — Horizontal image carousel with bottom panel navigation
window.HomeModule = (function () {

  let unitRowVisible = false;
  let current = 0;
  let autoTimer = null;
  let startX = 0;
  let dragged = false;

  // ─── UNIT URL MAP ────────────────────────────────────────────────
  const unitURLs = {
    1: 'unit1/index.html',
    2: 'unit2/index.html',
    3: 'unit3/index.html',
    4: 'unit4/index.html',
  };

  // ─── CAROUSEL IMAGES ─────────────────────────────────────────────
  // Replace src with your ImageKit URLs when ready
  const IMAGES = [
    { src: '', label: 'View 1' },
    { src: '', label: 'View 2' },
    { src: '', label: 'View 3' },
    { src: '', label: 'View 4' },
    { src: '', label: 'View 5' },
  ];

  // ─── INJECT HTML & STYLES ────────────────────────────────────────
  function injectHTML() {
    if (document.getElementById('bottom-panel')) return;

    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700&family=Cormorant+Garamond:wght@300;400;500&display=swap');

      /* ── Rotate Prompt ── */
      #rotate-prompt {
        display: none;
        position: fixed;
        inset: 0;
        z-index: 9999;
        background: #0a0805;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
        pointer-events: all;
      }
      #rotate-prompt.show { display: flex; }
      #rotate-prompt svg {
        width: 52px; height: 52px;
        stroke: rgba(200,190,154,.80); fill: none;
        stroke-width: 1.5;
        animation: rotateHint 1.8s ease-in-out infinite;
      }
      @keyframes rotateHint {
        0%,100% { transform: rotate(0deg); }
        50%      { transform: rotate(90deg); }
      }
      #rotate-prompt p {
        font-family: 'Syne', sans-serif;
        font-size: 11px; font-weight: 600;
        letter-spacing: .16em; text-transform: uppercase;
        color: rgba(200,190,154,.55);
        margin: 0;
      }
      @media (orientation: landscape) {
        #rotate-prompt { display: none !important; }
      }

      /* ── Carousel ── */
      #carousel {
        position: fixed;
        inset: 0;
        bottom: 62px;
        background: #0a0805;
        overflow: hidden;
      }
      #carousel-track {
        display: flex;
        height: 100%;
        transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
        cursor: grab;
        user-select: none;
      }
      #carousel-track.grabbing { cursor: grabbing; }
      .c-slide {
        flex-shrink: 0;
        width: 100vw;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .c-slide img {
        width: 100%; height: 100%;
        object-fit: cover;
        display: block;
        pointer-events: none;
      }
      .c-placeholder {
        font-family: 'Cormorant Garamond', serif;
        font-size: 100px; font-weight: 300;
        color: rgba(200,190,154,.06);
      }
      #c-dots {
        position: absolute;
        bottom: 16px; left: 50%;
        transform: translateX(-50%);
        display: flex; gap: 8px;
        pointer-events: none;
      }
      .c-dot {
        width: 5px; height: 5px;
        border-radius: 50%;
        background: rgba(200,190,154,.25);
        transition: background .3s, transform .3s;
      }
      .c-dot.active {
        background: rgba(200,190,154,.85);
        transform: scale(1.4);
      }

      /* ── Lightbox ── */
      #lightbox {
        position: fixed; inset: 0; z-index: 500;
        background: rgba(5,4,2,.95);
        display: flex; align-items: center; justify-content: center;
        opacity: 0; pointer-events: none;
        transition: opacity .3s;
      }
      #lightbox.open { opacity: 1; pointer-events: all; }
      #lb-img {
        max-width: calc(100vw - 40px);
        max-height: calc(100dvh - 80px);
        object-fit: contain;
      }
      #lb-empty {
        display: none;
        font-family: 'Cormorant Garamond', serif;
        font-style: italic;
        color: rgba(200,190,154,.35);
        font-size: 16px;
      }
      #lb-close {
        position: absolute; top: 16px; right: 16px;
        width: 36px; height: 36px; border-radius: 8px;
        border: 1px solid rgba(200,190,154,.25);
        background: rgba(200,190,154,.06);
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; color: rgba(200,190,154,.7); font-size: 18px;
        -webkit-tap-highlight-color: transparent;
      }

      /* ── Unit Row ── */
      #unit-row {
        position: fixed;
        bottom: 62px;
        left: 0; right: 0; width: 100%;
        z-index: 101;
        display: flex;
        flex-direction: row;
        align-items: stretch;
        gap: 0; padding: 0;
        background: rgba(245, 242, 235, 0.97);
        border-top: 1px solid rgba(200, 190, 154, 0.50);
        border-bottom: 1px solid rgba(200, 190, 154, 0.50);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        box-shadow: 0 -2px 20px rgba(200, 190, 154, 0.15);
        opacity: 0;
        pointer-events: none;
        transform: translateY(10px);
        transition: opacity 0.28s ease, transform 0.28s cubic-bezier(0.22, 1, 0.36, 1);
        box-sizing: border-box;
      }
      #unit-row.visible {
        opacity: 1;
        pointer-events: all;
        transform: translateY(0px);
      }

      .unit-btn {
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 10px;
        padding: 10px 12px;
        cursor: pointer;
        border-right: 1px solid rgba(200, 190, 154, 0.25);
        background: transparent;
        flex: 1; min-width: 0;
        transition: background 0.22s ease;
        position: relative;
      }
      .unit-btn:last-child { border-right: none; }
      .unit-btn::after {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 2px;
        background: transparent;
        transition: background 0.25s ease;
      }
      .unit-btn:hover { background: rgba(200, 190, 154, 0.10); }
      .unit-btn:hover::after { background: linear-gradient(to right, #e8dfc0, #c8be9a, #e8dfc0); }
      .unit-btn.active { background: rgba(200, 190, 154, 0.18); }
      .unit-btn.active::after { background: linear-gradient(to right, #e8dfc0, #c8be9a, #e8dfc0); }

      .unit-btn-icon {
        width: 26px; height: 26px;
        border-radius: 5px;
        background: rgba(200, 190, 154, 0.15);
        border: 1px solid rgba(200, 190, 154, 0.45);
        display: flex; align-items: center; justify-content: center;
        font-family: 'Syne', sans-serif;
        font-size: 9px; font-weight: 700;
        color: rgba(100, 88, 60, 0.85);
        flex-shrink: 0;
        transition: background 0.22s ease, border-color 0.22s ease;
      }
      .unit-btn:hover .unit-btn-icon,
      .unit-btn.active .unit-btn-icon {
        background: rgba(200, 190, 154, 0.28);
        border-color: rgba(200, 190, 154, 0.80);
      }

      .unit-btn-label {
        font-family: 'Syne', sans-serif;
        font-size: 10px; font-weight: 600;
        letter-spacing: 0.12em; text-transform: uppercase;
        color: rgba(100, 88, 60, 0.75);
        line-height: 1; white-space: nowrap;
        transition: color 0.22s ease;
      }
      .unit-btn:hover .unit-btn-label,
      .unit-btn.active .unit-btn-label { color: #5a4e2e; }

      /* ── Bottom Panel ── */
      #bottom-panel {
        position: fixed;
        bottom: 0; left: 0; right: 0; width: 100%;
        height: 62px;
        z-index: 100;
        display: flex;
        flex-direction: row;
        align-items: stretch;
        background: rgba(245, 242, 235, 0.97);
        border-top: 2px solid rgba(200, 190, 154, 0.75);
        backdrop-filter: blur(14px);
        -webkit-backdrop-filter: blur(14px);
        box-shadow: 0 -4px 28px rgba(200, 190, 154, 0.18);
        box-sizing: border-box;
        transform: translateY(100%);
        animation: panelRiseIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.3s forwards;
      }
      @keyframes panelRiseIn {
        from { transform: translateY(100%); }
        to   { transform: translateY(0); }
      }

      .panel-slot {
        position: relative;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: center;
        gap: 10px;
        flex: 1;
        cursor: pointer;
        border-right: 1px solid rgba(200, 190, 154, 0.25);
        transition: background 0.25s ease;
        overflow: hidden;
      }
      .panel-slot:last-child { border-right: none; }
      .panel-slot::after {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 2px;
        background: transparent;
        transition: background 0.25s ease;
      }
      .panel-slot:hover { background: rgba(200, 190, 154, 0.12); }
      .panel-slot:hover::after { background: linear-gradient(to right, #e8dfc0, #c8be9a, #e8dfc0); }
      .panel-slot.active { background: rgba(200, 190, 154, 0.16); }
      .panel-slot.active::after { background: linear-gradient(to right, #e8dfc0, #c8be9a, #e8dfc0); }

      .panel-slot-icon {
        width: 30px; height: 30px;
        display: flex; align-items: center; justify-content: center;
        flex-shrink: 0;
        border-radius: 7px;
        background: rgba(200, 190, 154, 0.15);
        border: 1px solid rgba(200, 190, 154, 0.45);
        transition: background 0.25s ease, border-color 0.25s ease;
      }
      .panel-slot:hover .panel-slot-icon,
      .panel-slot.active .panel-slot-icon {
        background: rgba(200, 190, 154, 0.28);
        border-color: rgba(200, 190, 154, 0.80);
      }
      .panel-slot-icon svg {
        width: 15px; height: 15px;
        stroke: rgba(160, 148, 110, 0.80);
        fill: none; stroke-width: 1.5;
        stroke-linecap: round; stroke-linejoin: round;
        transition: stroke 0.25s ease;
      }
      .panel-slot:hover .panel-slot-icon svg,
      .panel-slot.active .panel-slot-icon svg { stroke: #8a7a50; }

      .panel-slot-label {
        font-family: 'Syne', sans-serif;
        font-size: 11px; font-weight: 600;
        letter-spacing: 0.12em; text-transform: uppercase;
        color: rgba(100, 88, 60, 0.75);
        line-height: 1; white-space: nowrap;
        transition: color 0.25s ease;
      }
      .panel-slot:hover .panel-slot-label,
      .panel-slot.active .panel-slot-label { color: #5a4e2e; }

      /* ── Unit Viewer Overlay ── */
      #unit-viewer-overlay {
        position: fixed;
        top: 0; left: 0; right: 0;
        bottom: 62px;
        z-index: 99;
        transform: translateY(100%);
        transition: transform 0.5s cubic-bezier(0.22, 1, 0.36, 1);
      }
      #unit-viewer-overlay.open { transform: translateY(0); }

      /* ── iframe ── */
      #unit-iframe {
        width: 100%; height: 100%;
        border: none; display: block;
        opacity: 1;
        transition: opacity 0.35s ease;
      }
      #unit-iframe.fading { opacity: 0; }

      /* ── Unit loader ── */
      #unit-loader {
        position: absolute; inset: 0;
        display: flex; align-items: center; justify-content: center;
        background: rgba(10, 8, 5, 0.55);
        opacity: 0; pointer-events: none;
        transition: opacity 0.25s ease;
        z-index: 2;
      }
      #unit-loader.visible { opacity: 1; }
      #unit-loader-ring {
        width: 36px; height: 36px;
        border: 2.5px solid rgba(200, 190, 154, 0.25);
        border-top-color: rgba(200, 190, 154, 0.9);
        border-radius: 50%;
        animation: spinRing 0.75s linear infinite;
      }
      @keyframes spinRing { to { transform: rotate(360deg); } }
    `;
    document.head.appendChild(style);

    const icons = {
      floorplan: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`,
      view360:   `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 5C7 5 2.73 8.11 1 12.5 2.73 16.89 7 20 12 20s9.27-3.11 11-7.5C21.27 8.11 17 5 12 5z"/></svg>`,
      gallery:   `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="5" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="3" y="11" width="18" height="10" rx="1"/></svg>`,
      map:       `<svg viewBox="0 0 24 24"><path d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>`,
    };

    const slidesHTML = IMAGES.map((img, i) => `
      <div class="c-slide" data-index="${i}">
        ${img.src ? `<img src="${img.src}" alt="${img.label}"/>` : `<div class="c-placeholder">0${i + 1}</div>`}
      </div>`).join('');

    const dotsHTML = IMAGES.map((_, i) =>
      `<div class="c-dot${i === 0 ? ' active' : ''}"></div>`).join('');

    // Rotate prompt
    document.body.insertAdjacentHTML('beforeend', `
      <div id="rotate-prompt">
        <svg viewBox="0 0 24 24">
          <rect x="5" y="2" width="14" height="20" rx="2"/>
          <path d="M9 21h6"/>
        </svg>
        <p>Please rotate your device</p>
      </div>
    `);

    // Carousel
    document.body.insertAdjacentHTML('beforeend', `
      <div id="carousel">
        <div id="carousel-track">${slidesHTML}</div>
        <div id="c-dots">${dotsHTML}</div>
      </div>
    `);

    // Lightbox
    document.body.insertAdjacentHTML('beforeend', `
      <div id="lightbox">
        <img id="lb-img" src="" alt=""/>
        <div id="lb-empty">Image coming soon</div>
        <div id="lb-close">✕</div>
      </div>
    `);

    // Unit row
    document.body.insertAdjacentHTML('beforeend', `
      <div id="unit-row">
        <div class="unit-btn" data-unit="1">
          <div class="unit-btn-icon">U1</div>
          <span class="unit-btn-label">Unit 1</span>
        </div>
        <div class="unit-btn" data-unit="2">
          <div class="unit-btn-icon">U2</div>
          <span class="unit-btn-label">Unit 2</span>
        </div>
        <div class="unit-btn" data-unit="3">
          <div class="unit-btn-icon">U3</div>
          <span class="unit-btn-label">Unit 3</span>
        </div>
        <div class="unit-btn" data-unit="4">
          <div class="unit-btn-icon">U4</div>
          <span class="unit-btn-label">Unit 4</span>
        </div>
      </div>
    `);

    // Bottom panel
    document.body.insertAdjacentHTML('beforeend', `
      <div id="bottom-panel">
        <div class="panel-slot" data-slot="floorplan">
          <div class="panel-slot-icon">${icons.floorplan}</div>
          <span class="panel-slot-label">Floor Plan</span>
        </div>
        <div class="panel-slot" data-slot="360view">
          <div class="panel-slot-icon">${icons.view360}</div>
          <span class="panel-slot-label">360 View</span>
        </div>
        <div class="panel-slot" data-slot="gallery">
          <div class="panel-slot-icon">${icons.gallery}</div>
          <span class="panel-slot-label">Gallery</span>
        </div>
        <div class="panel-slot" data-slot="map">
          <div class="panel-slot-icon">${icons.map}</div>
          <span class="panel-slot-label">Location Map</span>
        </div>
      </div>
    `);

    // Unit viewer overlay
    document.body.insertAdjacentHTML('beforeend', `
      <div id="unit-viewer-overlay">
        <div id="unit-loader"><div id="unit-loader-ring"></div></div>
        <iframe id="unit-iframe" src="" allow="fullscreen"></iframe>
      </div>
    `);
  }

  // ─── CAROUSEL ────────────────────────────────────────────────────
  function goTo(index) {
    current = ((index % IMAGES.length) + IMAGES.length) % IMAGES.length;
    document.getElementById('carousel-track').style.transform = `translateX(-${current * 100}vw)`;
    document.querySelectorAll('.c-dot').forEach((d, i) => d.classList.toggle('active', i === current));
  }

  function startAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => goTo(current + 1), 3500);
  }

  function initCarousel() {
    const track    = document.getElementById('carousel-track');
    const carousel = document.getElementById('carousel');

    // Tap → lightbox (only if not a drag)
    track.addEventListener('click', () => { if (!dragged) openLightbox(current); });

    // Touch swipe
    track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; dragged = false; }, { passive: true });
    track.addEventListener('touchmove',  e => { if (Math.abs(e.touches[0].clientX - startX) > 8) dragged = true; }, { passive: true });
    track.addEventListener('touchend',   e => {
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 50) { goTo(current + (dx < 0 ? 1 : -1)); startAuto(); }
    });

    // Mouse drag
    track.addEventListener('mousedown', e => { startX = e.clientX; dragged = false; track.classList.add('grabbing'); });
    window.addEventListener('mousemove', e => { if (e.buttons && Math.abs(e.clientX - startX) > 8) dragged = true; });
    window.addEventListener('mouseup', e => {
      if (!track.classList.contains('grabbing')) return;
      track.classList.remove('grabbing');
      const dx = e.clientX - startX;
      if (Math.abs(dx) > 50) { goTo(current + (dx < 0 ? 1 : -1)); startAuto(); }
    });

    // Pause auto on hover
    carousel.addEventListener('mouseenter', () => clearInterval(autoTimer));
    carousel.addEventListener('mouseleave', startAuto);

    startAuto();
  }

  // ─── LIGHTBOX ────────────────────────────────────────────────────
  function openLightbox(index) {
    const src = IMAGES[index].src;
    document.getElementById('lb-img').src             = src || '';
    document.getElementById('lb-img').style.display   = src ? '' : 'none';
    document.getElementById('lb-empty').style.display = src ? 'none' : 'block';
    document.getElementById('lightbox').classList.add('open');
  }

  function closeLightbox() {
    document.getElementById('lightbox').classList.remove('open');
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
          iframe.onload = null;
        };
      }, 350);
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

    unitRowVisible = false;
    const row = document.getElementById('unit-row');
    if (row) row.classList.remove('visible');
    document.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));

    let floorplanWasOpen = false;
    const fpOverlay = document.getElementById('fp-overlay');
    if (fpOverlay) {
      floorplanWasOpen = fpOverlay.classList.contains('open');
      fpOverlay.style.pointerEvents = 'none';
    }
    if (window.FloorplanModule && typeof FloorplanModule.close === 'function') {
      FloorplanModule.close();
    }
    setTimeout(() => {
      if (fpOverlay) fpOverlay.style.pointerEvents = '';
    }, 420);

    if (window.GalleryModule && typeof GalleryModule.close === 'function') {
      GalleryModule.close();
    }

    if (window.MapModule && typeof MapModule.close === 'function') {
      MapModule.close();
    }

    return floorplanWasOpen;
  }

  // ─── PANEL EVENTS ────────────────────────────────────────────────
  function bindPanelEvents() {

    document.querySelectorAll('.panel-slot').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();

        const slot     = el.dataset.slot;
        const isActive = el.classList.contains('active');

        const previouslyActiveUnit = document.querySelector('.unit-btn.active');
        const targetUnit = previouslyActiveUnit ? parseInt(previouslyActiveUnit.dataset.unit) : 1;

        document.querySelectorAll('.panel-slot').forEach(s => s.classList.remove('active'));
        const fpWasOpen = closeAllModules();

        if (isActive) return;

        el.classList.add('active');

        if (slot === '360view') {
          const open360 = () => {
            unitRowVisible = true;
            const unitRow = document.getElementById('unit-row');
            if (unitRow) unitRow.classList.add('visible');
          };
          setTimeout(open360, 420);
          return;
        }

        if (slot === 'floorplan') {
          if (window.FloorplanModule) FloorplanModule.open();
          return;
        }

        if (slot === 'gallery') {
          if (window.GalleryModule) GalleryModule.open();
          return;
        }

        if (slot === 'map') {
          if (window.MapModule) MapModule.open();
          return;
        }
      });
    });

    // Unit buttons
    document.querySelectorAll('.unit-btn').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const unit = parseInt(el.dataset.unit);
        document.querySelectorAll('.unit-btn').forEach(b => b.classList.remove('active'));
        el.classList.add('active');
        openUnitViewer(unit);
      });
    });

    document.addEventListener('click', (e) => {
      const bar       = document.getElementById('bottom-panel');
      const row       = document.getElementById('unit-row');
      const overlay   = document.getElementById('unit-viewer-overlay');
      const fpOverlay = document.getElementById('fp-overlay');
      const lb        = document.getElementById('lightbox');

      if (lb && lb.classList.contains('open')) {
        if (!lb.contains(e.target) || e.target === lb) { closeLightbox(); return; }
      }

      const clickedOutside =
        bar && row &&
        !bar.contains(e.target) &&
        !row.contains(e.target) &&
        !(overlay  && overlay.contains(e.target)) &&
        !(fpOverlay && fpOverlay.contains(e.target));

      if (clickedOutside) {
        document.querySelectorAll('.panel-slot').forEach(s => s.classList.remove('active'));
        closeAllModules();
      }
    });

    document.getElementById('lb-close').addEventListener('click', closeLightbox);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeLightbox(); });
  }

  // ─── ORIENTATION / MOBILE CHECK ──────────────────────────────────
  function bindOrientationCheck() {
    function check() {
      const prompt = document.getElementById('rotate-prompt');
      if (!prompt) return;
      const isMobile   = window.innerWidth <= 900 || 'ontouchstart' in window;
      const isPortrait = window.innerHeight > window.innerWidth;
      prompt.classList.toggle('show', isMobile && isPortrait);
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
      bindPanelEvents();
      bindOrientationCheck();
      if (window.App && typeof window.App.finishLoad === 'function') {
        window.App.finishLoad();
      }
    }
  };

})();