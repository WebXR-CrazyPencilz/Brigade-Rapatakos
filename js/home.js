// home.js — Cube transition carousel as the main home view
window.HomeModule = (function () {

  let unitRowVisible = false;
  let current = 0;
  let autoTimer = null;
  let isAnimating = false;
  let startX = 0;
  let startY = 0;

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

      /* ── Cube Carousel ── */
      #carousel {
        position: fixed; inset: 0; bottom: 62px;
        background: #0a0805;
        display: flex; align-items: center; justify-content: center;
        perspective: 1200px;
        overflow: hidden;
      }

      /* CSS variable for half-cube-width (translateZ depth) */
      :root { --hc-tz: min(45vw, 440px); }
      @media (max-width: 520px) { :root { --hc-tz: 46vw; } }

      #hc-cube {
        position: relative;
        transform-style: preserve-3d;
        width: min(90vw, 880px);
        height: calc(100% - 32px);
      }

      .hc-face {
        position: absolute; inset: 0;
        overflow: hidden;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
        background: #0d0b07;
      }
      .hc-face img {
        width: 100%; height: 100%;
        object-fit: contain;
        display: block; pointer-events: none;
        user-select: none; -webkit-user-drag: none;
      }

      #hc-face-current { transform: rotateY(  0deg) translateZ(var(--hc-tz)); }
      #hc-face-next    { transform: rotateY( 90deg) translateZ(var(--hc-tz)); }
      #hc-face-prev    { transform: rotateY(-90deg) translateZ(var(--hc-tz)); }

      #hc-cube.to-next { transform: rotateY(-90deg); }
      #hc-cube.to-prev { transform: rotateY( 90deg); }

      /* Vignette — pointer-events none */
      #hc-vignette {
        position: absolute; inset: 0; z-index: 2; pointer-events: none;
        background: radial-gradient(ellipse 90% 80% at 50% 50%, transparent 45%, rgba(4,3,2,.55) 100%);
      }

      /* Counter label */
      #hc-counter {
        position: absolute; bottom: 22px; left: 50%;
        transform: translateX(-50%);
        font-family: 'Syne', sans-serif; font-size: 9px; font-weight: 700;
        letter-spacing: .20em; text-transform: uppercase;
        color: rgba(200,190,154,.30);
        pointer-events: none; z-index: 3;
      }

      /* Dots */
      #hc-dots {
        position: absolute; bottom: 10px; left: 50%;
        transform: translateX(-50%);
        display: flex; gap: 6px; align-items: center;
        pointer-events: none; z-index: 3;
      }
      .hc-dot {
        height: 4px; width: 4px; border-radius: 2px;
        background: rgba(200,190,154,.22);
        transition: width .3s, background .3s;
        flex-shrink: 0;
      }
      .hc-dot.active { width: 18px; background: rgba(200,190,154,.80); }

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
        font-style: italic; color: rgba(200,190,154,.35); font-size: 16px;
      }
      #lb-close {
        position: absolute; top: 16px; right: 16px;
        width: 36px; height: 36px; border-radius: 8px;
        border: 1px solid rgba(200,190,154,.25); background: rgba(200,190,154,.06);
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; color: rgba(200,190,154,.7); font-size: 18px;
        z-index: 2; -webkit-tap-highlight-color: transparent;
      }

      /* ── Unit Row ── */
      #unit-row {
        position: fixed; bottom: 62px; left: 0; right: 0; width: 100%; z-index: 101;
        display: flex; flex-direction: row; align-items: stretch;
        background: rgba(245,242,235,0.97);
        border-top: 1px solid rgba(200,190,154,.50); border-bottom: 1px solid rgba(200,190,154,.50);
        backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
        box-shadow: 0 -2px 20px rgba(200,190,154,.15);
        opacity: 0; pointer-events: none; transform: translateY(10px);
        transition: opacity .28s ease, transform .28s cubic-bezier(0.22,1,0.36,1);
        box-sizing: border-box;
      }
      #unit-row.visible { opacity:1; pointer-events:all; transform:translateY(0); }
      .unit-btn { display:flex; flex-direction:row; align-items:center; justify-content:center; gap:10px; padding:10px 12px; cursor:pointer; border-right:1px solid rgba(200,190,154,.25); background:transparent; flex:1; min-width:0; transition:background .22s; position:relative; }
      .unit-btn:last-child { border-right:none; }
      .unit-btn::after { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:transparent; transition:background .25s; }
      .unit-btn:hover { background:rgba(200,190,154,.10); }
      .unit-btn:hover::after { background:linear-gradient(to right,#e8dfc0,#c8be9a,#e8dfc0); }
      .unit-btn.active { background:rgba(200,190,154,.18); }
      .unit-btn.active::after { background:linear-gradient(to right,#e8dfc0,#c8be9a,#e8dfc0); }
      .unit-btn-icon { width:26px; height:26px; border-radius:5px; background:rgba(200,190,154,.15); border:1px solid rgba(200,190,154,.45); display:flex; align-items:center; justify-content:center; font-family:'Syne',sans-serif; font-size:9px; font-weight:700; color:rgba(100,88,60,.85); flex-shrink:0; transition:background .22s, border-color .22s; }
      .unit-btn:hover .unit-btn-icon, .unit-btn.active .unit-btn-icon { background:rgba(200,190,154,.28); border-color:rgba(200,190,154,.80); }
      .unit-btn-label { font-family:'Syne',sans-serif; font-size:10px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:rgba(100,88,60,.75); line-height:1; white-space:nowrap; transition:color .22s; }
      .unit-btn:hover .unit-btn-label, .unit-btn.active .unit-btn-label { color:#5a4e2e; }

      /* ── Bottom Panel ── */
      #bottom-panel {
        position: fixed; bottom: 0; left: 0; right: 0; width: 100%; height: 62px; z-index: 100;
        display: flex; flex-direction: row; align-items: stretch;
        background: rgba(245,242,235,0.97); border-top: 2px solid rgba(200,190,154,.75);
        backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
        box-shadow: 0 -4px 28px rgba(200,190,154,.18); box-sizing: border-box;
        transform: translateY(100%); animation: panelRiseIn .6s cubic-bezier(0.22,1,0.36,1) .3s forwards;
      }
      @keyframes panelRiseIn { from{transform:translateY(100%);}to{transform:translateY(0);} }
      .panel-slot { position:relative; display:flex; flex-direction:row; align-items:center; justify-content:center; gap:10px; flex:1; cursor:pointer; border-right:1px solid rgba(200,190,154,.25); transition:background .25s; overflow:hidden; }
      .panel-slot:last-child { border-right:none; }
      .panel-slot::after { content:''; position:absolute; top:0; left:0; right:0; height:2px; background:transparent; transition:background .25s; }
      .panel-slot:hover { background:rgba(200,190,154,.12); }
      .panel-slot:hover::after { background:linear-gradient(to right,#e8dfc0,#c8be9a,#e8dfc0); }
      .panel-slot.active { background:rgba(200,190,154,.16); }
      .panel-slot.active::after { background:linear-gradient(to right,#e8dfc0,#c8be9a,#e8dfc0); }
      .panel-slot-icon { width:30px; height:30px; display:flex; align-items:center; justify-content:center; flex-shrink:0; border-radius:7px; background:rgba(200,190,154,.15); border:1px solid rgba(200,190,154,.45); transition:background .25s, border-color .25s; }
      .panel-slot:hover .panel-slot-icon, .panel-slot.active .panel-slot-icon { background:rgba(200,190,154,.28); border-color:rgba(200,190,154,.80); }
      .panel-slot-icon svg { width:15px; height:15px; stroke:rgba(160,148,110,.80); fill:none; stroke-width:1.5; stroke-linecap:round; stroke-linejoin:round; transition:stroke .25s; }
      .panel-slot:hover .panel-slot-icon svg, .panel-slot.active .panel-slot-icon svg { stroke:#8a7a50; }
      .panel-slot-label { font-family:'Syne',sans-serif; font-size:11px; font-weight:600; letter-spacing:.12em; text-transform:uppercase; color:rgba(100,88,60,.75); line-height:1; white-space:nowrap; transition:color .25s; }
      .panel-slot:hover .panel-slot-label, .panel-slot.active .panel-slot-label { color:#5a4e2e; }

      /* ── Unit Viewer Overlay ── */
      #unit-viewer-overlay { position:fixed; top:0; left:0; right:0; bottom:62px; z-index:99; transform:translateY(100%); transition:transform .5s cubic-bezier(0.22,1,0.36,1); }
      #unit-viewer-overlay.open { transform:translateY(0); }
      #unit-iframe { width:100%; height:100%; border:none; display:block; opacity:1; transition:opacity .35s; }
      #unit-iframe.fading { opacity:0; }
      #unit-loader { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; background:rgba(10,8,5,.55); opacity:0; pointer-events:none; transition:opacity .25s; z-index:2; }
      #unit-loader.visible { opacity:1; }
      #unit-loader-ring { width:36px; height:36px; border:2.5px solid rgba(200,190,154,.25); border-top-color:rgba(200,190,154,.9); border-radius:50%; animation:spinRing .75s linear infinite; }
      @keyframes spinRing { to{transform:rotate(360deg);} }
    `;
    document.head.appendChild(style);

    const icons = {
      floorplan: `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>`,
      view360:   `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 5C7 5 2.73 8.11 1 12.5 2.73 16.89 7 20 12 20s9.27-3.11 11-7.5C21.27 8.11 17 5 12 5z"/></svg>`,
      gallery:   `<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="5" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="3" y="11" width="18" height="10" rx="1"/></svg>`,
      map:       `<svg viewBox="0 0 24 24"><path d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>`,
    };

    const dotsHTML = IMAGES.map((_, i) =>
      `<div class="hc-dot${i === 0 ? ' active' : ''}"></div>`).join('');

    document.body.insertAdjacentHTML('beforeend', `
      <div id="rotate-prompt">
        <svg viewBox="0 0 24 24"><rect x="5" y="2" width="14" height="20" rx="2"/><path d="M9 21h6"/></svg>
        <p>Please rotate your device</p>
      </div>

      <div id="carousel">
        <div id="hc-cube">
          <div class="hc-face" id="hc-face-current">
            <img src="${IMAGES[0].src}" alt="${IMAGES[0].label}"/>
          </div>
          <div class="hc-face" id="hc-face-next">
            <img src="${IMAGES[1].src}" alt="${IMAGES[1].label}"/>
          </div>
          <div class="hc-face" id="hc-face-prev">
            <img src="${IMAGES[IMAGES.length - 1].src}" alt=""/>
          </div>
        </div>
        <div id="hc-vignette"></div>
        <div id="hc-dots">${dotsHTML}</div>
      </div>

      <div id="lightbox">
        <img id="lb-img" src="" alt=""/>
        <div id="lb-empty">Image coming soon</div>
        <div id="lb-close">✕</div>
      </div>

      <div id="unit-row">
        <div class="unit-btn" data-unit="1"><div class="unit-btn-icon">U1</div><span class="unit-btn-label">Unit 1</span></div>
        <div class="unit-btn" data-unit="2"><div class="unit-btn-icon">U2</div><span class="unit-btn-label">Unit 2</span></div>
        <div class="unit-btn" data-unit="3"><div class="unit-btn-icon">U3</div><span class="unit-btn-label">Unit 3</span></div>
        <div class="unit-btn" data-unit="4"><div class="unit-btn-icon">U4</div><span class="unit-btn-label">Unit 4</span></div>
      </div>

      <div id="bottom-panel">
        <div class="panel-slot" data-slot="floorplan"><div class="panel-slot-icon">${icons.floorplan}</div><span class="panel-slot-label">Floor Plan</span></div>
        <div class="panel-slot" data-slot="360view"><div class="panel-slot-icon">${icons.view360}</div><span class="panel-slot-label">360 View</span></div>
        <div class="panel-slot" data-slot="gallery"><div class="panel-slot-icon">${icons.gallery}</div><span class="panel-slot-label">Gallery</span></div>
        <div class="panel-slot" data-slot="map"><div class="panel-slot-icon">${icons.map}</div><span class="panel-slot-label">Location Map</span></div>
      </div>

      <div id="unit-viewer-overlay">
        <div id="unit-loader"><div id="unit-loader-ring"></div></div>
        <iframe id="unit-iframe" src="" allow="fullscreen"></iframe>
      </div>
    `);
  }

  // ─── CUBE NAVIGATION ─────────────────────────────────────────────
  function cubeTo(targetIdx, direction) {
    if (isAnimating) return;
    isAnimating = true;

    const cube     = document.getElementById('hc-cube');
    const faceNext = document.getElementById('hc-face-next');
    const facePrev = document.getElementById('hc-face-prev');
    const faceCur  = document.getElementById('hc-face-current');

    const img = IMAGES[targetIdx];

    if (direction === 'next') {
      faceNext.querySelector('img').src = img.src;
      faceNext.querySelector('img').alt = img.label;
    } else {
      facePrev.querySelector('img').src = img.src;
      facePrev.querySelector('img').alt = img.label;
    }

    const duration = 560;
    cube.style.transition = `transform ${duration}ms cubic-bezier(0.22,1,0.36,1)`;
    cube.classList.add(direction === 'next' ? 'to-next' : 'to-prev');

    setTimeout(() => {
      cube.style.transition = 'none';
      cube.classList.remove('to-next', 'to-prev');

      faceCur.querySelector('img').src = img.src;
      faceCur.querySelector('img').alt = img.label;

      const afterIdx  = (targetIdx + 1) % IMAGES.length;
      const beforeIdx = (targetIdx - 1 + IMAGES.length) % IMAGES.length;
      faceNext.querySelector('img').src = IMAGES[afterIdx].src;
      facePrev.querySelector('img').src = IMAGES[beforeIdx].src;

      current = targetIdx;
      updateDots();
      isAnimating = false;
    }, duration + 30);
  }

  function goTo(index) {
    const target = ((index % IMAGES.length) + IMAGES.length) % IMAGES.length;
    const dir = target === (current + 1) % IMAGES.length ? 'next' : 'prev';
    cubeTo(target, dir);
  }

  function updateDots() {
    document.querySelectorAll('.hc-dot').forEach((d, i) =>
      d.classList.toggle('active', i === current));
  }

  function startAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(() => {
      if (!isAnimating) cubeTo((current + 1) % IMAGES.length, 'next');
    }, 3800);
  }

  function initCarousel() {
    const carousel = document.getElementById('carousel');
    const cube     = document.getElementById('hc-cube');

    // Tap → lightbox (only if not a drag/swipe)
    let tapMoved = false;
    carousel.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      tapMoved = false;
    }, { passive: true });
    carousel.addEventListener('touchmove', e => {
      if (Math.abs(e.touches[0].clientX - startX) > 8) tapMoved = true;
    }, { passive: true });
    carousel.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        dx < 0
          ? cubeTo((current + 1) % IMAGES.length, 'next')
          : cubeTo((current - 1 + IMAGES.length) % IMAGES.length, 'prev');
        startAuto();
      } else if (!tapMoved) {
        openLightbox(current);
      }
    }, { passive: true });

    // Mouse drag
    let mStart = 0, mDrag = false, mMoved = false;
    carousel.addEventListener('mousedown', e => { mStart = e.clientX; mDrag = true; mMoved = false; });
    window.addEventListener('mousemove', e => { if (mDrag && Math.abs(e.clientX - mStart) > 8) mMoved = true; });
    window.addEventListener('mouseup', e => {
      if (!mDrag) return;
      mDrag = false;
      const dx = e.clientX - mStart;
      if (Math.abs(dx) > 50) {
        dx < 0
          ? cubeTo((current + 1) % IMAGES.length, 'next')
          : cubeTo((current - 1 + IMAGES.length) % IMAGES.length, 'prev');
        startAuto();
      } else if (!mMoved) {
        openLightbox(current);
      }
    });

    // Pause on hover
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
    document.getElementById('lb-empty').style.display = src ? 'none' : 'block';
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
        iframe.onload = () => { iframe.classList.remove('fading'); if (loader) loader.classList.remove('visible'); iframe.onload = null; };
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
    if (window.FloorplanModule && typeof FloorplanModule.close === 'function') FloorplanModule.close();
    setTimeout(() => { if (fpOverlay) fpOverlay.style.pointerEvents = ''; }, 420);
    if (window.GalleryModule && typeof GalleryModule.close === 'function') GalleryModule.close();
    if (window.MapModule     && typeof MapModule.close     === 'function') MapModule.close();
    return floorplanWasOpen;
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
        if (slot === '360view')   { setTimeout(() => { unitRowVisible = true; document.getElementById('unit-row')?.classList.add('visible'); }, 420); return; }
        if (slot === 'floorplan') { if (window.FloorplanModule) FloorplanModule.open(); return; }
        if (slot === 'gallery')   { if (window.GalleryModule)   GalleryModule.open();   return; }
        if (slot === 'map')       { if (window.MapModule)        MapModule.open();        return; }
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

    document.addEventListener('click', (e) => {
      const bar       = document.getElementById('bottom-panel');
      const row       = document.getElementById('unit-row');
      const overlay   = document.getElementById('unit-viewer-overlay');
      const fpOverlay = document.getElementById('fp-overlay');
      const lb        = document.getElementById('lightbox');
      if (lb && lb.classList.contains('open')) return;
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
      bindPanelEvents();
      bindOrientationCheck();
      if (window.App && typeof window.App.finishLoad === 'function') App.finishLoad();
    }
  };

})();