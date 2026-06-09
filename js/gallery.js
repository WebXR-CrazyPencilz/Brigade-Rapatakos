// gallery.js — Full-screen gallery overlay with 3D cube slide transitions
window.GalleryModule = (function () {

  const IMAGES = [
    { src: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1780928756/patch-through-agreen-forest_mpveu7.jpg',  caption: 'Exterior View',       label: '01' },
    { src: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1780928747/freepik__edit-img1-to-change-the-sunglasses-on-the-orange-t__10223_copy2_hunmds.jpg', caption: 'Grand Entrance',      label: '02' },
    { src: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1780926778/Brigade_High_35122-_%C2%AA_qvaqsy.jpg',  caption: 'Living Spaces',       label: '03' },
    { src: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1780928748/freepik__a-modern-luxury-indooroutdoor-lounge-with-a-serene__3441_bjy7ga.jpg', caption: 'Master Suite',        label: '04' },
    { src: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1780928750/freepik__design-a-luxurious-rooftop-outdoor-kitchen-with-a-__33482_qqyhyf.jpg', caption: 'Kitchen & Dining',    label: '05' },
    { src: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1780928754/freepik__design-a-highend-luxury-lobby-with-marble-floors-a__33481_ryap0w.jpg', caption: 'Balcony & Views',     label: '06' },
    { src: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1780928756/close-up-woman-relaxing-spa_ryzwuw.jpg',  caption: 'Clubhouse',           label: '07' },
    { src: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1780928748/freepik__a-modern-luxury-indooroutdoor-lounge-with-a-serene__3441_bjy7ga.jpg', caption: 'Amenities',           label: '08' },
    { src: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1780928747/freepik__edit-img1-to-change-the-sunglasses-on-the-orange-t__10223_copy2_hunmds.jpg', caption: 'Swimming Pool',       label: '09' },
    { src: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1780928829/beautiful-green-trees-bright-sunlight_h19cfq.jpg', caption: 'Landscape & Gardens', label: '10' },
  ];

  let current     = 0;
  let isAnimating = false;
  let startX      = 0;
  let startY      = 0;
  let injected    = false;

  // ─── INJECT STYLES & HTML ────────────────────────────────────────
  function inject() {
    if (injected) return;
    injected = true;

    const style = document.createElement('style');
    style.textContent = `
      /* ── Overlay shell ── */
      #gallery-overlay {
        position: fixed;
        top: 0; left: 0; right: 0;
        bottom: 62px;           /* sits above bottom panel */
        z-index: 200;
        background: #07060400;
        opacity: 0;
        pointer-events: none;
        transition: opacity .38s cubic-bezier(0.22,1,0.36,1);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        background: #080604;
      }
      #gallery-overlay.open {
        opacity: 1;
        pointer-events: all;
      }

      /* ── Grain texture — BEHIND everything (z-index:0) ── */
      #gallery-overlay::before {
        content: '';
        position: absolute; inset: 0;
        z-index: 0;
        pointer-events: none;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
        background-size: 180px 180px;
        opacity: .5;
      }

      /* ── HEADER ── */
      #gl-header {
        flex-shrink: 0;
        position: relative; z-index: 10;
        display: flex; align-items: center; justify-content: space-between;
        padding: 18px 20px 14px;
        background: linear-gradient(to bottom, rgba(8,6,4,.95) 60%, transparent);
      }
      #gl-title-wrap { min-width: 0; }
      #gl-label {
        font-family: 'Syne', sans-serif;
        font-size: 9px; font-weight: 700;
        letter-spacing: .22em; text-transform: uppercase;
        color: rgba(200,190,154,.40);
        margin: 0 0 4px;
      }
      #gl-caption {
        font-family: 'Cormorant Garamond', serif;
        font-style: italic; font-size: 22px; font-weight: 300;
        color: rgba(200,190,154,.80);
        margin: 0;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        transition: opacity .25s;
      }
      #gl-caption.fading { opacity: 0; }

      #gl-close {
        flex-shrink: 0;
        width: 36px; height: 36px;
        border: 1px solid rgba(200,190,154,.22);
        background: rgba(200,190,154,.06);
        border-radius: 8px;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
        color: rgba(200,190,154,.65); font-size: 16px;
        transition: background .2s, border-color .2s;
        -webkit-tap-highlight-color: transparent;
        margin-left: 16px;
      }
      #gl-close:hover { background: rgba(200,190,154,.14); border-color: rgba(200,190,154,.5); }

      /* ── CUBE STAGE ── */
      #gl-scene {
        flex: 1;
        position: relative; z-index: 2;
        display: flex; align-items: center; justify-content: center;
        perspective: 1200px;
        overflow: hidden;
        /* no ::after vignette — was blocking arrows */
      }

      /* Vignette as a sibling div so it never blocks pointer events */
      #gl-vignette {
        position: absolute; inset: 0; z-index: 3;
        pointer-events: none;
        background: radial-gradient(ellipse 85% 75% at 50% 50%, transparent 50%, rgba(4,3,2,.60) 100%);
      }

      #gl-cube {
        position: relative;
        transform-style: preserve-3d;
        /* Size: fill available space nicely on all screens */
        width: min(72vw, 580px);
        height: min(48vw, 390px);
      }

      .gl-face {
        position: absolute; inset: 0;
        overflow: hidden;
        border: 1px solid rgba(200,190,154,.10);
        border-radius: 3px;
        background: #0d0b07;
        backface-visibility: hidden;
        -webkit-backface-visibility: hidden;
      }
      .gl-face img {
        width: 100%; height: 100%;
        object-fit: cover; display: block;
        pointer-events: none;
        user-select: none; -webkit-user-drag: none;
      }

      /*
        Half-width of cube = half of min(72vw, 580px) in translateZ.
        We use a CSS variable so mobile override is easy.
      */
      :root { --gl-tz: min(36vw, 290px); }

      #gl-face-current { transform: rotateY(  0deg) translateZ(var(--gl-tz)); }
      #gl-face-next    { transform: rotateY( 90deg) translateZ(var(--gl-tz)); }
      #gl-face-prev    { transform: rotateY(-90deg) translateZ(var(--gl-tz)); }

      #gl-cube.to-next { transform: rotateY(-90deg); }
      #gl-cube.to-prev { transform: rotateY( 90deg); }

      /* ── ARROWS — z-index:4 so they sit above vignette ── */
      .gl-arrow {
        position: absolute; top: 50%; transform: translateY(-50%);
        z-index: 4;
        width: 40px; height: 40px;
        background: rgba(10,8,5,.55);
        border: 1px solid rgba(200,190,154,.22);
        border-radius: 10px;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
        transition: background .2s, border-color .2s;
        -webkit-tap-highlight-color: transparent;
      }
      .gl-arrow:hover { background: rgba(200,190,154,.16); border-color: rgba(200,190,154,.55); }
      #gl-arrow-prev { left: 16px; }
      #gl-arrow-next { right: 16px; }
      .gl-arrow svg {
        width: 16px; height: 16px;
        stroke: rgba(200,190,154,.70); fill: none;
        stroke-width: 2; stroke-linecap: round; stroke-linejoin: round;
      }

      /* ── FOOTER ── */
      #gl-footer {
        flex-shrink: 0;
        position: relative; z-index: 10;
        display: flex; flex-direction: column; align-items: center;
        gap: 10px;
        padding: 12px 20px 16px;
        background: linear-gradient(to top, rgba(8,6,4,.95) 60%, transparent);
      }

      /* Counter */
      #gl-counter {
        font-family: 'Syne', sans-serif;
        font-size: 9px; font-weight: 700;
        letter-spacing: .20em; text-transform: uppercase;
        color: rgba(200,190,154,.28);
      }

      /* Dots */
      #gl-dots { display: flex; gap: 6px; align-items: center; }
      .gl-dot {
        height: 4px; width: 4px; border-radius: 2px;
        background: rgba(200,190,154,.22);
        transition: width .3s, background .3s;
        flex-shrink: 0;
      }
      .gl-dot.active {
        width: 20px;
        background: rgba(200,190,154,.80);
      }

      /* Thumbnails */
      #gl-thumbs {
        display: flex; gap: 6px;
        overflow-x: auto; scrollbar-width: none;
        padding: 2px 2px 0;
        max-width: 100%;
      }
      #gl-thumbs::-webkit-scrollbar { display: none; }
      .gl-thumb {
        flex-shrink: 0;
        width: 44px; height: 30px;
        border-radius: 3px; overflow: hidden;
        border: 1.5px solid rgba(200,190,154,.12);
        cursor: pointer; opacity: .4;
        transition: opacity .22s, border-color .22s, transform .22s;
      }
      .gl-thumb img {
        width: 100%; height: 100%; object-fit: cover;
        display: block; pointer-events: none;
      }
      .gl-thumb.active {
        opacity: 1;
        border-color: rgba(200,190,154,.75);
        transform: scaleY(1.08);
      }
      .gl-thumb:not(.active):hover { opacity: .7; }

      /* ── Mobile tweaks ── */
      @media (max-width: 520px) {
        :root { --gl-tz: 44vw; }
        #gl-cube { width: 88vw; height: 60vw; }
        #gl-caption { font-size: 17px; }
        #gl-arrow-prev { left: 6px; }
        #gl-arrow-next { right: 6px; }
        .gl-thumb { width: 36px; height: 24px; }
      }
    `;
    document.head.appendChild(style);

    const thumbsHTML = IMAGES.map((img, i) => `
      <div class="gl-thumb${i === 0 ? ' active' : ''}" data-idx="${i}">
        <img src="${img.src}" alt="${img.caption}" loading="lazy"/>
      </div>`).join('');

    const dotsHTML = IMAGES.map((_, i) =>
      `<div class="gl-dot${i === 0 ? ' active' : ''}"></div>`).join('');

    document.body.insertAdjacentHTML('beforeend', `
      <div id="gallery-overlay">

        <div id="gl-header">
          <div id="gl-title-wrap">
            <p id="gl-label">Gallery</p>
            <p id="gl-caption">${IMAGES[0].caption}</p>
          </div>
          <div id="gl-close">✕</div>
        </div>

        <div id="gl-scene">
          <div id="gl-cube">
            <div class="gl-face" id="gl-face-current">
              <img src="${IMAGES[0].src}" alt="${IMAGES[0].caption}"/>
            </div>
            <div class="gl-face" id="gl-face-next">
              <img src="${IMAGES[1 % IMAGES.length].src}" alt="${IMAGES[1 % IMAGES.length].caption}"/>
            </div>
            <div class="gl-face" id="gl-face-prev">
              <img src="${IMAGES[IMAGES.length - 1].src}" alt=""/>
            </div>
          </div>

          <div id="gl-vignette"></div>

          <div class="gl-arrow" id="gl-arrow-prev">
            <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
          </div>
          <div class="gl-arrow" id="gl-arrow-next">
            <svg viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18"/></svg>
          </div>
        </div>

        <div id="gl-footer">
          <div id="gl-counter">01 / ${String(IMAGES.length).padStart(2,'0')}</div>
          <div id="gl-dots">${dotsHTML}</div>
          <div id="gl-thumbs">${thumbsHTML}</div>
        </div>

      </div>
    `);

    bindEvents();
  }

  // ─── CUBE TRANSITION ─────────────────────────────────────────────
  function cubeTo(targetIdx, direction) {
    if (isAnimating || targetIdx === current) return;
    isAnimating = true;

    const cube     = document.getElementById('gl-cube');
    const faceNext = document.getElementById('gl-face-next');
    const facePrev = document.getElementById('gl-face-prev');
    const faceCur  = document.getElementById('gl-face-current');
    const caption  = document.getElementById('gl-caption');

    const img = IMAGES[targetIdx];

    // Load arriving face
    if (direction === 'next') {
      faceNext.querySelector('img').src = img.src;
      faceNext.querySelector('img').alt = img.caption;
    } else {
      facePrev.querySelector('img').src = img.src;
      facePrev.querySelector('img').alt = img.caption;
    }

    const duration = 560;
    cube.style.transition = `transform ${duration}ms cubic-bezier(0.22,1,0.36,1)`;
    cube.classList.add(direction === 'next' ? 'to-next' : 'to-prev');

    // Caption fade swap
    caption.classList.add('fading');
    setTimeout(() => {
      caption.textContent = img.caption;
      caption.classList.remove('fading');
    }, duration * 0.45);

    // After rotation: snap-reset cube, restage faces
    setTimeout(() => {
      cube.style.transition = 'none';
      cube.classList.remove('to-next', 'to-prev');

      faceCur.querySelector('img').src = img.src;
      faceCur.querySelector('img').alt = img.caption;

      const afterIdx  = (targetIdx + 1) % IMAGES.length;
      const beforeIdx = (targetIdx - 1 + IMAGES.length) % IMAGES.length;
      faceNext.querySelector('img').src = IMAGES[afterIdx].src;
      facePrev.querySelector('img').src = IMAGES[beforeIdx].src;

      current = targetIdx;
      updateUI();
      isAnimating = false;
    }, duration + 30);
  }

  function jumpTo(targetIdx) {
    if (targetIdx === current || isAnimating) return;
    cubeTo(targetIdx, targetIdx > current ? 'next' : 'prev');
  }

  // ─── UI SYNC ─────────────────────────────────────────────────────
  function updateUI() {
    const n = IMAGES.length;
    document.getElementById('gl-counter').textContent =
      `${String(current + 1).padStart(2,'0')} / ${String(n).padStart(2,'0')}`;

    document.querySelectorAll('.gl-dot').forEach((d, i) =>
      d.classList.toggle('active', i === current));

    document.querySelectorAll('.gl-thumb').forEach((t, i) =>
      t.classList.toggle('active', i === current));

    const active = document.querySelector('.gl-thumb.active');
    if (active) active.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  // ─── EVENTS ──────────────────────────────────────────────────────
  function bindEvents() {
    document.getElementById('gl-close').addEventListener('click', close);

    document.getElementById('gl-arrow-prev').addEventListener('click', (e) => {
      e.stopPropagation();
      cubeTo((current - 1 + IMAGES.length) % IMAGES.length, 'prev');
    });
    document.getElementById('gl-arrow-next').addEventListener('click', (e) => {
      e.stopPropagation();
      cubeTo((current + 1) % IMAGES.length, 'next');
    });

    // Thumbnail clicks
    document.getElementById('gl-thumbs').addEventListener('click', (e) => {
      const thumb = e.target.closest('.gl-thumb');
      if (!thumb) return;
      e.stopPropagation();
      jumpTo(parseInt(thumb.dataset.idx));
    });

    // Touch swipe on scene
    const scene = document.getElementById('gl-scene');
    scene.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }, { passive: true });
    scene.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        dx < 0
          ? cubeTo((current + 1) % IMAGES.length, 'next')
          : cubeTo((current - 1 + IMAGES.length) % IMAGES.length, 'prev');
      }
    }, { passive: true });

    // Mouse drag
    let mStart = 0, mDrag = false;
    scene.addEventListener('mousedown', e => { mStart = e.clientX; mDrag = true; });
    window.addEventListener('mouseup', e => {
      if (!mDrag) return;
      mDrag = false;
      const dx = e.clientX - mStart;
      if (Math.abs(dx) > 50) {
        dx < 0
          ? cubeTo((current + 1) % IMAGES.length, 'next')
          : cubeTo((current - 1 + IMAGES.length) % IMAGES.length, 'prev');
      }
    });

    // Keyboard
    document.addEventListener('keydown', e => {
      const overlay = document.getElementById('gallery-overlay');
      if (!overlay || !overlay.classList.contains('open')) return;
      if (e.key === 'ArrowRight') cubeTo((current + 1) % IMAGES.length, 'next');
      if (e.key === 'ArrowLeft')  cubeTo((current - 1 + IMAGES.length) % IMAGES.length, 'prev');
      if (e.key === 'Escape')     close();
    });
  }

  // ─── PUBLIC API ──────────────────────────────────────────────────
  function open(startIndex = 0) {
    inject();
    const overlay = document.getElementById('gallery-overlay');
    if (!overlay) return;

    current = ((startIndex % IMAGES.length) + IMAGES.length) % IMAGES.length;

    const faceCur  = document.getElementById('gl-face-current');
    const faceNext = document.getElementById('gl-face-next');
    const facePrev = document.getElementById('gl-face-prev');
    const cube     = document.getElementById('gl-cube');

    // Instant reset — no transition flash
    cube.style.transition = 'none';
    cube.classList.remove('to-next', 'to-prev');

    const nextIdx = (current + 1) % IMAGES.length;
    const prevIdx = (current - 1 + IMAGES.length) % IMAGES.length;
    faceCur.querySelector('img').src  = IMAGES[current].src;
    faceNext.querySelector('img').src = IMAGES[nextIdx].src;
    facePrev.querySelector('img').src = IMAGES[prevIdx].src;

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