// gallery.js — Full-screen gallery with floating thumbnails + curved transitions
window.GalleryModule = (function () {

  const IMAGES = [
    { src: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1781157232/05_w03okg.jpg', caption: '01' },
    { src: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1781158353/09_gytlb3.jpg', caption: '02' },
    { src: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1781158354/14_nwgerk.jpg', caption: '03' },
    { src: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1781158353/11_si2bfi.jpg', caption: '04' },
    { src: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1781157224/04_guuouq.jpg', caption: '05' },
    { src: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1781157224/06_nz4s5w.jpg', caption: '06' },
    { src: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1781158353/12_sv6p4o.jpg', caption: '07' },
    { src: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1781158353/08_y7htgv.jpg', caption: '08' },
    { src: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1781158353/10_mj07h8.jpg', caption: '09' },
    { src: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1781158364/13_mv0mfy.jpg', caption: '10' },
    { src: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1781158355/16_kx2kfd.jpg', caption: '11' },
  ];

  let current     = 0;
  let isAnimating = false;
  let startX      = 0;
  let startY      = 0;
  let injected    = false;
  let imageEnteredAt = 0; // timestamp when the current image became visible — used for dwell-time tracking
  let glImgScale  = 1; // current pinch-zoom scale of the stage — read by the swipe handler to block navigation while zoomed in

  // ─── BROWSER/HARDWARE BACK SUPPORT ────────────────────────────────
  // Opening the gallery pushes a history entry so the phone's back
  // button (or PC Backspace) closes the gallery instead of leaving
  // the page. requestBack() is the single exit point used by ✕, the
  // mobile back arrow, hardware back, Backspace and Escape.
  let _historyDepth = 0;
  let _popping      = false;

  function pushGlState() {
    history.pushState({ gl: true }, '');
    _historyDepth++;
  }

  function requestBack() {
    if (_historyDepth > 0) history.back(); // → popstate → close()
    else close();
  }

  // ─── INJECT ──────────────────────────────────────────────────────
  function inject() {
    if (injected) return;
    injected = true;

    const style = document.createElement('style');
    style.textContent = `
      /* ── Overlay — full bleed, no padding, no card ── */
      #gallery-overlay {
        position: fixed; top: 0; left: 0; right: 0;
        bottom: calc(62px + env(safe-area-inset-bottom, 0px));
        z-index: 200; background: #080604;
        opacity: 0; pointer-events: none;
        transition: opacity .38s cubic-bezier(0.22,1,0.36,1);
        overflow: hidden;
      }
      #gallery-overlay.open { opacity: 1; pointer-events: all; }

      /* ── HEADER — floats over the image ── */
      #gl-header {
        position: absolute; top: 0; left: 0; right: 0; z-index: 30;
        display: flex; align-items: center; justify-content: space-between;
        padding: calc(18px + env(safe-area-inset-top, 0px)) calc(20px + env(safe-area-inset-right, 0px)) 40px calc(20px + env(safe-area-inset-left, 0px));
        background: linear-gradient(to bottom, rgba(8,6,4,.85) 0%, transparent 100%);
        pointer-events: none;
      }
      #gl-header > * { pointer-events: all; }
      #gl-title-wrap { min-width: 0; }
      #gl-label {
        font-family: 'Syne', sans-serif; font-size: 9px; font-weight: 700;
        letter-spacing: .22em; text-transform: uppercase;
        color: rgba(200,185,165,.55); margin: 0 0 4px;
      }
      #gl-caption {
        font-family: 'Cormorant Garamond', serif; font-style: italic;
        font-size: 22px; font-weight: 300; color: rgba(245,240,232,.92);
        margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        transition: opacity .25s;
      }
      #gl-caption.fading { opacity: 0; }
      #gl-close {
        flex-shrink: 0; width: 38px; height: 38px; min-width: 38px; min-height: 38px;
        border: 1px solid rgba(200,185,165,.25); background: rgba(20,16,12,.55);
        backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
        border-radius: 10px; display: flex; align-items: center; justify-content: center;
        cursor: pointer; color: rgba(230,220,205,.85); font-size: 16px;
        transition: background .2s, border-color .2s;
        -webkit-tap-highlight-color: transparent; margin-left: 16px;
      }
      #gl-close:hover { background: rgba(122,62,30,.35); border-color: rgba(122,62,30,.65); }

      /* Back arrow — same glass style as close, sits left of the title */
      #gl-back {
        flex-shrink: 0; width: 38px; height: 38px; min-width: 38px; min-height: 38px;
        border: 1px solid rgba(200,185,165,.25); background: rgba(20,16,12,.55);
        backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
        border-radius: 10px; display: flex; align-items: center; justify-content: center;
        cursor: pointer; margin-right: 14px;
        transition: background .2s, border-color .2s;
        -webkit-tap-highlight-color: transparent;
      }
      #gl-back:hover { background: rgba(122,62,30,.35); border-color: rgba(122,62,30,.65); }
      #gl-back svg { width: 16px; height: 16px; stroke: rgba(230,220,205,.90); fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

      /* ── STAGE — full bleed image area, no border, no shadow card ── */
      #gl-stage {
        position: absolute; inset: 0; z-index: 1;
        overflow: hidden;
        perspective: 1400px;
        touch-action: pan-y;
      }

      .gl-card {
        position: absolute; inset: 0;
        width: 100%; height: 100%;
        will-change: transform, opacity, filter;
        cursor: grab;
      }
      .gl-card:active { cursor: grabbing; }
      .gl-card img {
        width: 100%; height: 100%; object-fit: cover;
        display: block; pointer-events: none;
        user-select: none; -webkit-user-drag: none;
      }

      /* Resting stack positions */
      #gl-card-behind {
        transform: scale(1.06) translateY(0);
        opacity: 0;
        z-index: 1;
        filter: blur(6px);
      }
      #gl-card-current {
        transform: scale(1) translateY(0) rotate(0deg);
        opacity: 1;
        z-index: 2;
        filter: blur(0);
      }
      #gl-card-incoming {
        transform: scale(1.08) translateY(0);
        opacity: 0;
        z-index: 3;
        filter: blur(4px);
      }

      /* Vignette for header/footer legibility — sits above images */
      #gl-vignette {
        position: absolute; inset: 0; z-index: 5; pointer-events: none;
        background:
          linear-gradient(to bottom, rgba(8,6,4,.55) 0%, transparent 18%, transparent 78%, rgba(8,6,4,.65) 100%);
      }

      /* ── Arrows ── */
      .gl-arrow {
        position: absolute; top: 50%; transform: translateY(-50%);
        z-index: 20; width: 44px; height: 44px; min-width: 44px; min-height: 44px;
        background: rgba(15,12,9,.45); border: 1px solid rgba(200,185,165,.20);
        backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
        border-radius: 12px; display: flex; align-items: center; justify-content: center;
        cursor: pointer; transition: background .2s, border-color .2s, transform .2s;
        -webkit-tap-highlight-color: transparent;
      }
      .gl-arrow:hover { background: rgba(122,62,30,.35); border-color: rgba(122,62,30,.65); transform: translateY(-50%) scale(1.06); }
      #gl-arrow-prev { left: calc(18px + env(safe-area-inset-left, 0px)); }
      #gl-arrow-next { right: calc(18px + env(safe-area-inset-right, 0px)); }
      .gl-arrow svg { width: 17px; height: 17px; stroke: rgba(230,220,205,.90); fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

      /* ── FOOTER — floating thumbnail strip OVER the image ── */
      #gl-footer {
        position: absolute; left: 0; right: 0; bottom: 0; z-index: 30;
        display: flex; flex-direction: column; align-items: center; gap: 10px;
        padding: 36px calc(20px + env(safe-area-inset-right, 0px)) calc(18px + env(safe-area-inset-bottom, 0px)) calc(20px + env(safe-area-inset-left, 0px));
        background: linear-gradient(to top, rgba(8,6,4,.88) 0%, transparent 100%);
        pointer-events: none;
      }
      #gl-footer > * { pointer-events: all; }

      #gl-counter {
        font-family: 'Syne', sans-serif; font-size: 9px; font-weight: 700;
        letter-spacing: .20em; text-transform: uppercase; color: rgba(230,220,205,.55);
      }

      #gl-thumbs-track {
        display: flex; gap: 8px; overflow-x: auto; scrollbar-width: none;
        padding: 4px; max-width: 100%;
        background: rgba(245,242,235,.92);
        border: 1px solid rgba(180,160,120,.30);
        border-radius: 14px;
        backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
        box-shadow: 0 10px 32px rgba(0,0,0,.18);
      }
      #gl-thumbs-track::-webkit-scrollbar { display: none; }

      .gl-thumb {
        flex-shrink: 0; width: 60px; height: 42px;
        border-radius: 8px; overflow: hidden;
        border: 2px solid transparent;
        cursor: pointer; opacity: .75;
        transition: opacity .28s cubic-bezier(0.22,1,0.36,1),
                    border-color .28s cubic-bezier(0.22,1,0.36,1),
                    transform .35s cubic-bezier(0.34,1.56,0.64,1);
        background: #e8e2d8;
      }
      .gl-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; pointer-events: none; }
      .gl-thumb.active {
        opacity: 1; border-color: #7a3e1e; transform: translateY(-4px) scale(1.10);
        box-shadow: 0 6px 16px rgba(122,62,30,.30);
      }
      .gl-thumb:not(.active):hover { opacity: .88; transform: translateY(-2px); }

      @media (max-width: 520px) {
        #gl-header { padding: calc(12px + env(safe-area-inset-top, 0px)) calc(12px + env(safe-area-inset-right, 0px)) 32px calc(12px + env(safe-area-inset-left, 0px)); }
        #gl-caption { font-size: 17px; }
        #gl-label { font-size: 8px; margin-bottom: 2px; }
        #gl-back, #gl-close { width: 34px; height: 34px; min-width: 34px; min-height: 34px; }
        #gl-back { margin-right: 10px; }
        .gl-arrow { width: 36px; height: 36px; min-width: 36px; min-height: 36px; }
        #gl-arrow-prev { left: calc(8px + env(safe-area-inset-left, 0px)); }
        #gl-arrow-next { right: calc(8px + env(safe-area-inset-right, 0px)); }
        .gl-thumb { width: 44px; height: 31px; }
        #gl-footer {
          padding: 36px calc(12px + env(safe-area-inset-right, 0px)) calc(18px + env(safe-area-inset-bottom, 0px)) calc(12px + env(safe-area-inset-left, 0px));
          background: linear-gradient(to top, rgba(8,6,4,.35) 0%, transparent 100%);
        }
      }

      /* Portrait phones — keep full-bleed image (cover) but move the
         arrows down out of the image centre and tighten chrome so the
         photo owns the vertical screen */
      @media (orientation: portrait) and (max-width: 520px) {
        .gl-card img { object-fit: cover; }
        .gl-arrow { top: auto; bottom: 118px; transform: none; }
        .gl-arrow:hover { transform: scale(1.06); }
        #gl-counter {
        font-family: 'Syne', sans-serif; font-size: 9px; font-weight: 700;
        letter-spacing: .20em; text-transform: uppercase;
        color: rgba(245,240,232,.85);
        text-shadow: 0 1px 6px rgba(0,0,0,.45);
      }
      }
    `;
    document.head.appendChild(style);

    const thumbsHTML = IMAGES.map((img, i) => `
      <div class="gl-thumb${i === 0 ? ' active' : ''}" data-idx="${i}">
        <img src="${img.src}" alt="${img.caption}" loading="lazy"/>
      </div>`).join('');

    document.body.insertAdjacentHTML('beforeend', `
      <div id="gallery-overlay">

        <div id="gl-stage">
          <div class="gl-card" id="gl-card-behind">
            <img src="${IMAGES[1 % IMAGES.length].src}" alt=""/>
          </div>
          <div class="gl-card" id="gl-card-current">
            <img src="${IMAGES[0].src}" alt="${IMAGES[0].caption}"/>
          </div>
          <div class="gl-card" id="gl-card-incoming">
            <img src="" alt=""/>
          </div>
          <div id="gl-vignette"></div>
        </div>

        <div id="gl-header">
          <div id="gl-back">
            <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
          </div>
          <div id="gl-title-wrap">
            <p id="gl-label">Gallery</p>
            <p id="gl-caption">${IMAGES[0].caption}</p>
          </div>
          <div id="gl-close">✕</div>
        </div>

        <div class="gl-arrow" id="gl-arrow-prev">
          <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
        </div>
        <div class="gl-arrow" id="gl-arrow-next">
          <svg viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18"/></svg>
        </div>

        <div id="gl-footer">
          <div id="gl-counter">01 / ${String(IMAGES.length).padStart(2,'0')}</div>
          <div id="gl-thumbs-track">${thumbsHTML}</div>
        </div>

      </div>
    `);

    bindEvents();
  }

  // ─── CURVED CROSS-DISSOLVE TRANSITION ─────────────────────────────
  // Soft scale + blur + opacity curve — no straight fly-out, feels like
  // depth-of-field racking between two photographs.
  // Reports how long the given image was visible, then resets the timer.
  // Call this right before switching away from an image (next/prev/close).
  function reportDwell(imageIndex) {
    if (!imageEnteredAt) return;
    const dwellMs = Date.now() - imageEnteredAt;
    if (typeof gtag === 'function' && dwellMs > 200) { // ignore accidental sub-200ms flicks
      gtag('event', 'image_engagement', {
        image_index: imageIndex,
        caption: IMAGES[imageIndex] ? IMAGES[imageIndex].caption : null,
        dwell_ms: dwellMs
      });
    }
  }

  // ─── PINCH-ZOOM ON THE CURRENT PHOTO ────────────────────────────
  // Zooms the whole #gl-stage container (not the individual card, whose
  // id gets swapped between elements on every navigation) — child card
  // transforms from cardTo()'s flight animation compose correctly on
  // top of this since CSS transforms are relative to the parent.
  let _glZoomOrigin = { x: 0, y: 0 };
  let _glStageEl = null;

  function resetGalleryZoom() {
    glImgScale = 1;
    _glZoomOrigin = { x: 0, y: 0 };
    if (_glStageEl) {
      _glStageEl.style.transition = 'transform 0.25s ease';
      _glStageEl.style.transform = 'translate(0px, 0px) scale(1)';
      setTimeout(() => { if (_glStageEl) _glStageEl.style.transition = ''; }, 260);
    }
  }

  function bindGalleryZoom(stage) {
    _glStageEl = stage;
    let lastDist = null;
    let panStartX = 0, panStartY = 0, panOriginX = 0, panOriginY = 0, lastTap = 0;
    const MAX_SCALE = 4, MIN_SCALE = 1;

    function apply() {
      stage.style.transform = `translate(${_glZoomOrigin.x}px, ${_glZoomOrigin.y}px) scale(${glImgScale})`;
    }
    function dist(t) { return Math.sqrt((t[0].clientX-t[1].clientX)**2+(t[0].clientY-t[1].clientY)**2); }
    function mid(t)  { return { x:(t[0].clientX+t[1].clientX)/2, y:(t[0].clientY+t[1].clientY)/2 }; }

    stage.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        lastDist = dist(e.touches);
      } else if (e.touches.length === 1 && glImgScale > 1) {
        const now = Date.now();
        if (now - lastTap < 300) { resetGalleryZoom(); }
        lastTap = now;
        panStartX = e.touches[0].clientX; panStartY = e.touches[0].clientY;
        panOriginX = _glZoomOrigin.x; panOriginY = _glZoomOrigin.y;
      }
    }, { passive: true });

    stage.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const d = dist(e.touches), m = mid(e.touches), rect = stage.getBoundingClientRect();
        if (lastDist !== null) {
          const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, glImgScale * (d/lastDist)));
          const pivotX = m.x - rect.left - rect.width/2;
          const pivotY = m.y - rect.top  - rect.height/2;
          _glZoomOrigin.x = pivotX + (_glZoomOrigin.x - pivotX) * (newScale / glImgScale);
          _glZoomOrigin.y = pivotY + (_glZoomOrigin.y - pivotY) * (newScale / glImgScale);
          glImgScale = newScale;
          apply();
        }
        lastDist = d;
      } else if (e.touches.length === 1 && glImgScale > 1) {
        e.preventDefault();
        _glZoomOrigin.x = panOriginX + (e.touches[0].clientX - panStartX);
        _glZoomOrigin.y = panOriginY + (e.touches[0].clientY - panStartY);
        apply();
      }
    }, { passive: false });

    stage.addEventListener('touchend', (e) => {
      if (e.touches.length < 2) lastDist = null;
      if (glImgScale <= MIN_SCALE + 0.05) resetGalleryZoom();
    }, { passive: true });

    // Desktop: wheel to zoom
    stage.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = stage.getBoundingClientRect();
      const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, glImgScale * (e.deltaY < 0 ? 1.12 : 0.89)));
      const pivotX = e.clientX - rect.left - rect.width/2;
      const pivotY = e.clientY - rect.top  - rect.height/2;
      _glZoomOrigin.x = pivotX + (_glZoomOrigin.x - pivotX) * (newScale / glImgScale);
      _glZoomOrigin.y = pivotY + (_glZoomOrigin.y - pivotY) * (newScale / glImgScale);
      glImgScale = newScale;
      apply();
      if (glImgScale <= MIN_SCALE + 0.01) resetGalleryZoom();
    }, { passive: false });
  }

  function cardTo(targetIdx, direction) {
    if (isAnimating || targetIdx === current) return;
    isAnimating = true;

    const cardCur      = document.getElementById('gl-card-current');
    const cardBehind    = document.getElementById('gl-card-behind');
    const cardIncoming = document.getElementById('gl-card-incoming');
    const caption       = document.getElementById('gl-caption');

    const img       = IMAGES[targetIdx];
    const nextAfter = (targetIdx + 1) % IMAGES.length;
    const DURATION  = 620;
    const EASE      = 'cubic-bezier(0.65,0,0.35,1)';

    cardIncoming.querySelector('img').src = img.src;
    cardIncoming.querySelector('img').alt = img.caption;

    // Incoming starts slightly zoomed + blurred, drifts in from depth
    cardIncoming.style.transition = 'none';
    cardIncoming.style.transform  = direction === 'next'
      ? 'scale(1.10) translateX(3%)'
      : 'scale(1.10) translateX(-3%)';
    cardIncoming.style.opacity = '0';
    cardIncoming.style.filter  = 'blur(10px)';
    cardIncoming.style.zIndex  = '3';

    // Force reflow
    cardIncoming.getBoundingClientRect();

    // Current racks focus away and drifts opposite direction with curve
    cardCur.style.transition = `transform ${DURATION}ms ${EASE}, opacity ${DURATION}ms ${EASE}, filter ${DURATION}ms ${EASE}`;
    cardCur.style.transform  = direction === 'next'
      ? 'scale(0.94) translateX(-4%)'
      : 'scale(0.94) translateX(4%)';
    cardCur.style.opacity = '0';
    cardCur.style.filter  = 'blur(10px)';

    // Behind card softly recedes further
    cardBehind.style.transition = `transform ${DURATION}ms ${EASE}, opacity ${DURATION}ms ${EASE}`;
    cardBehind.style.transform  = 'scale(1.1)';
    cardBehind.style.opacity    = '0';

    // Incoming eases into focus
    cardIncoming.style.transition = `transform ${DURATION}ms ${EASE}, opacity ${DURATION}ms ${EASE}, filter ${DURATION}ms ${EASE}`;
    cardIncoming.style.transform  = 'scale(1) translateX(0)';
    cardIncoming.style.opacity    = '1';
    cardIncoming.style.filter     = 'blur(0)';

    caption.classList.add('fading');
    setTimeout(() => {
      caption.textContent = img.caption;
      caption.classList.remove('fading');
    }, DURATION * 0.45);

    setTimeout(() => {
      cardCur.style.transition = 'none';
      cardCur.style.transform  = 'scale(1.06)';
      cardCur.style.opacity    = '0';
      cardCur.style.filter     = 'blur(6px)';
      cardCur.style.zIndex     = '1';
      cardCur.querySelector('img').src = IMAGES[nextAfter].src;

      cardBehind.style.transition = 'none';
      cardBehind.style.transform  = 'scale(1.06)';
      cardBehind.style.opacity    = '0';
      cardBehind.style.filter     = 'blur(6px)';
      cardBehind.style.zIndex     = '1';

      cardIncoming.style.transition = 'none';
      cardIncoming.style.transform  = 'scale(1) translateX(0)';
      cardIncoming.style.opacity    = '1';
      cardIncoming.style.filter     = 'blur(0)';
      cardIncoming.style.zIndex     = '2';

      cardCur.id      = 'gl-card-behind';
      cardIncoming.id = 'gl-card-current';
      cardBehind.id   = 'gl-card-incoming';

      resetGalleryZoom(); // new image — start it unzoomed
      reportDwell(current); // 'current' is still the outgoing image here
      current = targetIdx;
      imageEnteredAt = Date.now(); // start the clock on the new image
      updateUI();
      isAnimating = false;
    }, DURATION + 30);
  }

  function updateUI() {
    const n = IMAGES.length;
    document.getElementById('gl-counter').textContent =
      `${String(current + 1).padStart(2,'0')} / ${String(n).padStart(2,'0')}`;
    document.querySelectorAll('.gl-thumb').forEach((t, i) => t.classList.toggle('active', i === current));
    const active = document.querySelector('.gl-thumb.active');
    if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  // ─── EVENTS ──────────────────────────────────────────────────────
  function bindEvents() {
    document.getElementById('gl-close').addEventListener('click', requestBack);
    document.getElementById('gl-back').addEventListener('click', requestBack);
    document.getElementById('gl-back').addEventListener('touchend', (e) => { e.preventDefault(); requestBack(); });

    // Hardware/browser back button (mobile) — closes the gallery, not the page
    window.addEventListener('popstate', () => {
      const overlay = document.getElementById('gallery-overlay');
      if (!overlay || !overlay.classList.contains('open') || _historyDepth === 0) return;
      _historyDepth--;
      _popping = true;
      close();
      _popping = false;
    });

    document.getElementById('gl-arrow-prev').addEventListener('click', (e) => {
      e.stopPropagation();
      cardTo((current - 1 + IMAGES.length) % IMAGES.length, 'prev');
    });
    document.getElementById('gl-arrow-next').addEventListener('click', (e) => {
      e.stopPropagation();
      cardTo((current + 1) % IMAGES.length, 'next');
    });

    document.getElementById('gl-thumbs-track').addEventListener('click', (e) => {
      const thumb = e.target.closest('.gl-thumb');
      if (!thumb) return;
      e.stopPropagation();
      const idx = parseInt(thumb.dataset.idx);
      if (idx !== current) cardTo(idx, idx > current ? 'next' : 'prev');
    });

    // Swipe
    const stage = document.getElementById('gl-stage');
    stage.addEventListener('touchstart', e => {
      if (e.touches.length > 1) return; // multi-touch = pinch-zoom, not a swipe
      startX = e.touches[0].clientX; startY = e.touches[0].clientY;
    }, { passive: true });
    stage.addEventListener('touchend', e => {
      if (e.touches.length > 0) return; // still mid-pinch
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (glImgScale > 1.05) return; // zoomed in — single-finger drag pans instead
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        dx < 0
          ? cardTo((current + 1) % IMAGES.length, 'next')
          : cardTo((current - 1 + IMAGES.length) % IMAGES.length, 'prev');
      }
    }, { passive: true });

    bindGalleryZoom(stage);

    // Mouse drag
    let mStart = 0, mDrag = false;
    stage.addEventListener('mousedown', e => { mStart = e.clientX; mDrag = true; });
    window.addEventListener('mouseup', e => {
      if (!mDrag) return;
      mDrag = false;
      const dx = e.clientX - mStart;
      if (Math.abs(dx) > 50) {
        dx < 0
          ? cardTo((current + 1) % IMAGES.length, 'next')
          : cardTo((current - 1 + IMAGES.length) % IMAGES.length, 'prev');
      }
    });

    // Keyboard — arrows navigate, Backspace/Escape go back (PC)
    document.addEventListener('keydown', e => {
      const overlay = document.getElementById('gallery-overlay');
      if (!overlay || !overlay.classList.contains('open')) return;
      const t = e.target;
      const typing = t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable);
      if (typing) return;
      if (e.key === 'ArrowRight') cardTo((current + 1) % IMAGES.length, 'next');
      if (e.key === 'ArrowLeft')  cardTo((current - 1 + IMAGES.length) % IMAGES.length, 'prev');
      if (e.key === 'Escape' || e.key === 'Backspace') { e.preventDefault(); requestBack(); }
    });
  }

  // ─── PUBLIC API ──────────────────────────────────────────────────
  function open(startIndex = 0) {
    inject();
    const overlay = document.getElementById('gallery-overlay');
    if (!overlay) return;

    current = ((startIndex % IMAGES.length) + IMAGES.length) % IMAGES.length;

    // Track gallery open in GA4 — this is the real entry point,
    // since App.navigate() is never called for the Gallery button.
    if (typeof gtag === 'function') {
      gtag('event', 'gallery_open', { start_index: current });
    }
    imageEnteredAt = Date.now(); // start the dwell-time clock for the first image

    const cardCur    = document.getElementById('gl-card-current');
    const cardBehind = document.getElementById('gl-card-behind');
    const cardIn     = document.getElementById('gl-card-incoming');

    if (cardCur) {
      cardCur.style.cssText = 'transform: scale(1) translateX(0); opacity: 1; z-index: 2; filter: blur(0); transition: none;';
      cardCur.querySelector('img').src = IMAGES[current].src;
    }
    const nextIdx = (current + 1) % IMAGES.length;
    if (cardBehind) {
      cardBehind.style.cssText = 'transform: scale(1.06); opacity: 0; z-index: 1; filter: blur(6px); transition: none;';
      cardBehind.querySelector('img').src = IMAGES[nextIdx].src;
    }
    if (cardIn) {
      cardIn.style.cssText = 'transform: scale(1.08); opacity: 0; z-index: 3; filter: blur(8px); transition: none;';
    }

    document.getElementById('gl-caption').textContent = IMAGES[current].caption;
    document.getElementById('gl-caption').classList.remove('fading');
    updateUI();

    requestAnimationFrame(() => overlay.classList.add('open'));
    if (!_popping) pushGlState();
  }

  function close(skipHistory) {
    reportDwell(current); // capture dwell time for whichever image was showing when closed
    imageEnteredAt = 0;
    const overlay = document.getElementById('gallery-overlay');
    if (!overlay || !overlay.classList.contains('open')) return;
    overlay.classList.remove('open');

    // Closed from outside (e.g. closeAllModules) while we still own a
    // history entry — unwind it silently so back doesn't need an extra press.
    // skipHistory=true bypasses history.go() when another module's open()
    // is about to push a new state right after (tab switch) — see the
    // matching comment in floorplan.js's close() for why that race matters.
    if (!_popping && _historyDepth > 0) {
      const n = _historyDepth;
      _historyDepth = 0;
      if (!skipHistory) history.go(-n);
    }
    document.querySelectorAll('.panel-slot').forEach(s => {
      if (s.dataset.slot === 'gallery') s.classList.remove('active');
    });
  }

  return { open, close };

})();