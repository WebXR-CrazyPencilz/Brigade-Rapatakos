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

  // ─── INJECT ──────────────────────────────────────────────────────
  function inject() {
    if (injected) return;
    injected = true;

    const style = document.createElement('style');
    style.textContent = `
      /* ── Overlay — full bleed, no padding, no card ── */
      #gallery-overlay {
        position: fixed; top: 0; left: 0; right: 0; bottom: 62px;
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
        padding: 18px 20px 40px;
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
        flex-shrink: 0; width: 38px; height: 38px;
        border: 1px solid rgba(200,185,165,.25); background: rgba(20,16,12,.55);
        backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px);
        border-radius: 10px; display: flex; align-items: center; justify-content: center;
        cursor: pointer; color: rgba(230,220,205,.85); font-size: 16px;
        transition: background .2s, border-color .2s;
        -webkit-tap-highlight-color: transparent; margin-left: 16px;
      }
      #gl-close:hover { background: rgba(122,62,30,.35); border-color: rgba(122,62,30,.65); }

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
        z-index: 20; width: 44px; height: 44px;
        background: rgba(15,12,9,.45); border: 1px solid rgba(200,185,165,.20);
        backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px);
        border-radius: 12px; display: flex; align-items: center; justify-content: center;
        cursor: pointer; transition: background .2s, border-color .2s, transform .2s;
        -webkit-tap-highlight-color: transparent;
      }
      .gl-arrow:hover { background: rgba(122,62,30,.35); border-color: rgba(122,62,30,.65); transform: translateY(-50%) scale(1.06); }
      #gl-arrow-prev { left: 18px; }
      #gl-arrow-next { right: 18px; }
      .gl-arrow svg { width: 17px; height: 17px; stroke: rgba(230,220,205,.90); fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

      /* ── FOOTER — floating thumbnail strip OVER the image ── */
      #gl-footer {
        position: absolute; left: 0; right: 0; bottom: 0; z-index: 30;
        display: flex; flex-direction: column; align-items: center; gap: 10px;
        padding: 36px 20px 18px;
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
        background: rgba(20,16,12,.45);
        border: 1px solid rgba(200,185,165,.14);
        border-radius: 14px;
        backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px);
        box-shadow: 0 10px 32px rgba(0,0,0,.35);
      }
      #gl-thumbs-track::-webkit-scrollbar { display: none; }

      .gl-thumb {
        flex-shrink: 0; width: 60px; height: 42px;
        border-radius: 8px; overflow: hidden;
        border: 2px solid transparent;
        cursor: pointer; opacity: .60;
        transition: opacity .28s cubic-bezier(0.22,1,0.36,1),
                    border-color .28s cubic-bezier(0.22,1,0.36,1),
                    transform .35s cubic-bezier(0.34,1.56,0.64,1);
        background: #2a1e14;
      }
      .gl-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; pointer-events: none; }
      .gl-thumb.active {
        opacity: 1; border-color: #c9a23a; transform: translateY(-4px) scale(1.10);
        box-shadow: 0 6px 16px rgba(201,162,58,.35);
      }
      .gl-thumb:not(.active):hover { opacity: .88; transform: translateY(-2px); }

      @media (max-width: 520px) {
        #gl-header { padding: 14px 14px 32px; }
        #gl-caption { font-size: 18px; }
        .gl-arrow { width: 38px; height: 38px; }
        #gl-arrow-prev { left: 8px; } #gl-arrow-next { right: 8px; }
        .gl-thumb { width: 46px; height: 32px; }
        #gl-footer { padding: 28px 12px 14px; }
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

      current = targetIdx;
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
    document.getElementById('gl-close').addEventListener('click', close);

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
    stage.addEventListener('touchstart', e => { startX = e.touches[0].clientX; startY = e.touches[0].clientY; }, { passive: true });
    stage.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        dx < 0
          ? cardTo((current + 1) % IMAGES.length, 'next')
          : cardTo((current - 1 + IMAGES.length) % IMAGES.length, 'prev');
      }
    }, { passive: true });

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

    // Keyboard
    document.addEventListener('keydown', e => {
      const overlay = document.getElementById('gallery-overlay');
      if (!overlay || !overlay.classList.contains('open')) return;
      if (e.key === 'ArrowRight') cardTo((current + 1) % IMAGES.length, 'next');
      if (e.key === 'ArrowLeft')  cardTo((current - 1 + IMAGES.length) % IMAGES.length, 'prev');
      if (e.key === 'Escape')     close();
    });
  }

  // ─── PUBLIC API ──────────────────────────────────────────────────
  function open(startIndex = 0) {
    inject();
    const overlay = document.getElementById('gallery-overlay');
    if (!overlay) return;

    current = ((startIndex % IMAGES.length) + IMAGES.length) % IMAGES.length;

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
  }

  function close() {
    const overlay = document.getElementById('gallery-overlay');
    if (overlay) overlay.classList.remove('open');
    document.querySelectorAll('.panel-slot').forEach(s => {
      if (s.dataset.slot === 'gallery') s.classList.remove('active');
    });
  }

  return { open, close };

})();
