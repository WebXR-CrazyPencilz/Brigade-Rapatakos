// gallery.js — Full-screen gallery overlay with 3D cube slide transitions
window.GalleryModule = (function () {

  // ─── ALL IMAGES (pulled from home.js IMAGES array + extras) ──────
  const IMAGES = [
    { src: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1780926126/a_ah6xbh.jpg',  caption: 'Exterior View',        label: '01' },
    { src: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1780926127/b_nkoj38.jpg',  caption: 'Grand Entrance',       label: '02' },
    { src: 'https://ik.imagekit.io/pwzaetheh/Home/c.jpg',                                 caption: 'Living Spaces',        label: '03' },
    { src: 'https://ik.imagekit.io/pwzaetheh/Home/d.jpg',                                 caption: 'Master Suite',         label: '04' },
    { src: 'https://ik.imagekit.io/pwzaetheh/Home/e.jpg',                                 caption: 'Kitchen & Dining',     label: '05' },
    { src: 'https://ik.imagekit.io/pwzaetheh/Home/g.jpg',                                 caption: 'Balcony & Views',      label: '06' },
    { src: 'https://ik.imagekit.io/pwzaetheh/Home/h.jpg',                                 caption: 'Clubhouse',            label: '07' },
    { src: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1780926131/i_toh5q7.jpg',  caption: 'Amenities',            label: '08' },
    { src: 'https://ik.imagekit.io/pwzaetheh/Home/j.jpg',                                 caption: 'Swimming Pool',        label: '09' },
    { src: 'https://ik.imagekit.io/pwzaetheh/Home/l.jpg',                                 caption: 'Landscape & Gardens',  label: '10' },
    { src: 'https://ik.imagekit.io/pwzaetheh/Home/m.jpg',                                 caption: 'Night Elevation',      label: '11' },
    { src: 'https://ik.imagekit.io/pwzaetheh/Home/n.jpg',                                 caption: 'Aerial Perspective',   label: '12' },
  ];

  let current    = 0;
  let isAnimating = false;
  let startX     = 0;
  let startY     = 0;
  let injected   = false;

  // ─── INJECT STYLES & HTML ─────────────────────────────────────────
  function inject() {
    if (injected) return;
    injected = true;

    /* ── Styles ── */
    const style = document.createElement('style');
    style.textContent = `
      @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300;1,400&display=swap');

      /* ── Overlay shell ── */
      #gallery-overlay {
        position: fixed; inset: 0; bottom: 62px; z-index: 200;
        background: #080604;
        opacity: 0; pointer-events: none;
        transform: translateY(6px);
        transition: opacity .38s cubic-bezier(0.22,1,0.36,1),
                    transform .38s cubic-bezier(0.22,1,0.36,1);
        overflow: hidden;
        display: flex; flex-direction: column;
      }
      #gallery-overlay.open {
        opacity: 1; pointer-events: all; transform: translateY(0);
      }

      /* ── Header bar ── */
      #gl-header {
        position: absolute; top: 0; left: 0; right: 0; z-index: 10;
        display: flex; align-items: center; justify-content: space-between;
        padding: 20px 24px 0;
        pointer-events: none;
      }
      #gl-title-wrap { pointer-events: none; }
      #gl-title {
        font-family: 'Syne', sans-serif; font-size: 10px; font-weight: 700;
        letter-spacing: .22em; text-transform: uppercase;
        color: rgba(200,190,154,.45); margin: 0 0 3px;
      }
      #gl-caption {
        font-family: 'Cormorant Garamond', serif; font-style: italic;
        font-size: 20px; font-weight: 300; color: rgba(200,190,154,.72);
        margin: 0; transition: opacity .3s;
        min-height: 28px;
      }
      #gl-close {
        pointer-events: all; width: 38px; height: 38px;
        border: 1px solid rgba(200,190,154,.22);
        background: rgba(200,190,154,.06);
        border-radius: 9px; display: flex; align-items: center;
        justify-content: center; cursor: pointer;
        color: rgba(200,190,154,.6); font-size: 17px;
        transition: background .2s, border-color .2s;
        -webkit-tap-highlight-color: transparent;
      }
      #gl-close:hover { background: rgba(200,190,154,.14); border-color: rgba(200,190,154,.5); }

      /* ── 3-D cube stage ── */
      #gl-scene {
        flex: 1; display: flex; align-items: center; justify-content: center;
        perspective: 1100px; perspective-origin: 50% 50%;
        overflow: hidden;
      }
      #gl-cube {
        width: min(78vw, 520px); height: min(52vw, 350px);
        position: relative; transform-style: preserve-3d;
        /* transition set dynamically per direction */
      }
      .gl-face {
        position: absolute; inset: 0;
        display: flex; align-items: center; justify-content: center;
        background: #0d0b07; overflow: hidden;
        border: 1px solid rgba(200,190,154,.08);
        border-radius: 4px;
        backface-visibility: hidden; -webkit-backface-visibility: hidden;
      }
      .gl-face img {
        width: 100%; height: 100%;
        object-fit: cover; display: block; pointer-events: none;
        user-select: none; -webkit-user-drag: none;
      }
      /* face transforms (cube right/left) */
      #gl-face-current  { transform: rotateY(0deg)   translateZ(calc(min(39vw, 260px))); }
      #gl-face-next     { transform: rotateY(90deg)   translateZ(calc(min(39vw, 260px))); }
      #gl-face-prev     { transform: rotateY(-90deg)  translateZ(calc(min(39vw, 260px))); }
      /* cube rotations applied to #gl-cube */
      #gl-cube.to-next  { transform: rotateY(-90deg); }
      #gl-cube.to-prev  { transform: rotateY(90deg);  }

      /* ── Bottom strip: counter + dots + thumbs ── */
      #gl-footer {
        position: absolute; bottom: 0; left: 0; right: 0; z-index: 10;
        padding: 0 20px 18px; display: flex;
        flex-direction: column; align-items: center; gap: 12px;
      }

      /* Dots */
      #gl-dots { display: flex; gap: 7px; }
      .gl-dot {
        width: 4px; height: 4px; border-radius: 50%;
        background: rgba(200,190,154,.22);
        transition: background .3s, transform .3s, width .3s;
      }
      .gl-dot.active {
        background: rgba(200,190,154,.85);
        width: 18px; border-radius: 2px; transform: none;
      }

      /* Counter */
      #gl-counter {
        font-family: 'Syne', sans-serif; font-size: 9px; font-weight: 700;
        letter-spacing: .20em; color: rgba(200,190,154,.30);
        text-transform: uppercase;
      }

      /* Thumbnails strip */
      #gl-thumbs {
        display: flex; gap: 7px; overflow-x: auto; padding: 0 4px 2px;
        scrollbar-width: none; max-width: 100%;
      }
      #gl-thumbs::-webkit-scrollbar { display: none; }
      .gl-thumb {
        flex-shrink: 0; width: 42px; height: 28px;
        border-radius: 3px; overflow: hidden; cursor: pointer;
        border: 1.5px solid rgba(200,190,154,.12);
        transition: border-color .22s, transform .22s, opacity .22s;
        opacity: .45;
      }
      .gl-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; pointer-events: none; }
      .gl-thumb.active {
        border-color: rgba(200,190,154,.75); opacity: 1;
        transform: scaleY(1.06);
      }
      .gl-thumb:hover { opacity: .75; }

      /* ── Prev/Next arrow buttons ── */
      .gl-arrow {
        position: absolute; top: 50%; transform: translateY(-50%);
        z-index: 10; width: 38px; height: 38px;
        background: rgba(200,190,154,.07); border: 1px solid rgba(200,190,154,.20);
        border-radius: 9px; display: flex; align-items: center; justify-content: center;
        cursor: pointer; transition: background .2s;
        -webkit-tap-highlight-color: transparent;
      }
      .gl-arrow:hover { background: rgba(200,190,154,.16); }
      #gl-arrow-prev { left: 14px; }
      #gl-arrow-next { right: 14px; }
      .gl-arrow svg { width: 16px; height: 16px; stroke: rgba(200,190,154,.65); fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

      /* ── Grain overlay for atmosphere ── */
      #gallery-overlay::before {
        content: ''; position: absolute; inset: 0; z-index: 1;
        pointer-events: none;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.035'/%3E%3C/svg%3E");
        background-size: 180px 180px; opacity: .45;
      }

      /* ── Vignette ── */
      #gl-scene::after {
        content: ''; position: absolute; inset: 0; pointer-events: none;
        background: radial-gradient(ellipse 80% 70% at 50% 50%, transparent 55%, rgba(4,3,2,.55) 100%);
      }

      /* mobile */
      @media (max-width: 480px) {
        #gl-cube { width: 88vw; height: 60vw; }
        #gl-face-current { transform: rotateY(0deg)   translateZ(44vw); }
        #gl-face-next    { transform: rotateY(90deg)  translateZ(44vw); }
        #gl-face-prev    { transform: rotateY(-90deg) translateZ(44vw); }
        #gl-caption { font-size: 16px; }
      }
    `;
    document.head.appendChild(style);

    /* ── Build thumbs HTML ── */
    const thumbsHTML = IMAGES.map((img, i) => `
      <div class="gl-thumb${i === 0 ? ' active' : ''}" data-idx="${i}">
        <img src="${img.src}" alt="${img.caption}" loading="lazy"/>
      </div>`).join('');

    const dotsHTML = IMAGES.map((_, i) =>
      `<div class="gl-dot${i === 0 ? ' active' : ''}"></div>`).join('');

    /* ── Insert overlay ── */
    document.body.insertAdjacentHTML('beforeend', `
      <div id="gallery-overlay">

        <!-- Header -->
        <div id="gl-header">
          <div id="gl-title-wrap">
            <p id="gl-title">Gallery</p>
            <p id="gl-caption">${IMAGES[0].caption}</p>
          </div>
          <div id="gl-close">✕</div>
        </div>

        <!-- Cube stage -->
        <div id="gl-scene">
          <div id="gl-cube">
            <div class="gl-face" id="gl-face-current">
              <img src="${IMAGES[0].src}" alt="${IMAGES[0].caption}"/>
            </div>
            <div class="gl-face" id="gl-face-next">
              <img src="${IMAGES[1].src}" alt="${IMAGES[1].caption}"/>
            </div>
            <div class="gl-face" id="gl-face-prev">
              <img src="${IMAGES[IMAGES.length - 1].src}" alt=""/>
            </div>
          </div>

          <!-- Arrows (inside scene for centering) -->
          <div class="gl-arrow" id="gl-arrow-prev">
            <svg viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
          </div>
          <div class="gl-arrow" id="gl-arrow-next">
            <svg viewBox="0 0 24 24"><polyline points="9 6 15 12 9 18"/></svg>
          </div>
        </div>

        <!-- Footer -->
        <div id="gl-footer">
          <div id="gl-counter">01 / ${String(IMAGES.length).padStart(2,'0')}</div>
          <div id="gl-dots">${dotsHTML}</div>
          <div id="gl-thumbs">${thumbsHTML}</div>
        </div>

      </div>
    `);

    bindEvents();
  }

  // ─── CUBE TRANSITION ──────────────────────────────────────────────
  function cubeTo(targetIdx, direction /* 'next' | 'prev' */) {
    if (isAnimating || targetIdx === current) return;
    isAnimating = true;

    const cube    = document.getElementById('gl-cube');
    const faceCur = document.getElementById('gl-face-current');
    const faceNext = document.getElementById('gl-face-next');
    const facePrev = document.getElementById('gl-face-prev');

    const img = IMAGES[targetIdx];

    // Load image into the arriving face
    if (direction === 'next') {
      faceNext.querySelector('img').src = img.src;
      faceNext.querySelector('img').alt = img.caption;
    } else {
      facePrev.querySelector('img').src = img.src;
      facePrev.querySelector('img').alt = img.caption;
    }

    // Preload the face after/before for next rotation
    const afterIdx = ((targetIdx + 1) % IMAGES.length);
    const beforeIdx = ((targetIdx - 1 + IMAGES.length) % IMAGES.length);

    // Apply cube rotation
    const duration = 580; // ms
    cube.style.transition = `transform ${duration}ms cubic-bezier(0.22,1,0.36,1)`;
    cube.classList.add(direction === 'next' ? 'to-next' : 'to-prev');

    // Update caption mid-transition
    setTimeout(() => {
      document.getElementById('gl-caption').textContent = img.caption;
    }, duration * 0.4);

    // After transition: reset cube instantly, swap face contents
    setTimeout(() => {
      cube.style.transition = 'none';
      cube.classList.remove('to-next', 'to-prev');

      // Current face gets the arrived image
      faceCur.querySelector('img').src = img.src;
      faceCur.querySelector('img').alt = img.caption;

      // Pre-stage next faces for future transitions
      faceNext.querySelector('img').src = IMAGES[afterIdx].src;
      facePrev.querySelector('img').src = IMAGES[beforeIdx].src;

      current = targetIdx;
      updateUI();
      isAnimating = false;
    }, duration + 20);
  }

  // ─── DIRECT JUMP (thumbnail click) ───────────────────────────────
  function jumpTo(targetIdx) {
    if (targetIdx === current || isAnimating) return;
    const dir = targetIdx > current ? 'next' : 'prev';
    // For non-adjacent jumps, just prep the target face immediately
    cubeTo(targetIdx, dir);
  }

  // ─── UPDATE DOTS, COUNTER, THUMBS ─────────────────────────────────
  function updateUI() {
    const idx = current;
    const n   = IMAGES.length;

    // counter
    document.getElementById('gl-counter').textContent =
      `${String(idx + 1).padStart(2,'0')} / ${String(n).padStart(2,'0')}`;

    // dots
    document.querySelectorAll('.gl-dot').forEach((d, i) =>
      d.classList.toggle('active', i === idx));

    // thumbs
    document.querySelectorAll('.gl-thumb').forEach((t, i) => {
      t.classList.toggle('active', i === idx);
    });

    // scroll active thumb into view
    const activeThumb = document.querySelector('.gl-thumb.active');
    if (activeThumb) activeThumb.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  // ─── BIND EVENTS ─────────────────────────────────────────────────
  function bindEvents() {
    // Close
    document.getElementById('gl-close').addEventListener('click', close);

    // Arrows
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

    // Swipe on cube scene
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

    // Mouse drag on cube
    let mStartX = 0, mDragging = false;
    scene.addEventListener('mousedown', e => { mStartX = e.clientX; mDragging = true; });
    window.addEventListener('mouseup', e => {
      if (!mDragging) return;
      mDragging = false;
      const dx = e.clientX - mStartX;
      if (Math.abs(dx) > 50) {
        dx < 0
          ? cubeTo((current + 1) % IMAGES.length, 'next')
          : cubeTo((current - 1 + IMAGES.length) % IMAGES.length, 'prev');
      }
    });

    // Keyboard
    document.addEventListener('keydown', (e) => {
      const overlay = document.getElementById('gallery-overlay');
      if (!overlay || !overlay.classList.contains('open')) return;
      if (e.key === 'ArrowRight') cubeTo((current + 1) % IMAGES.length, 'next');
      if (e.key === 'ArrowLeft')  cubeTo((current - 1 + IMAGES.length) % IMAGES.length, 'prev');
      if (e.key === 'Escape')     close();
    });
  }

  // ─── PUBLIC API ───────────────────────────────────────────────────
  function open(startIndex = 0) {
    inject();
    const overlay = document.getElementById('gallery-overlay');
    if (!overlay) return;

    // Reset to requested slide
    current = ((startIndex % IMAGES.length) + IMAGES.length) % IMAGES.length;
    const faceCur  = document.getElementById('gl-face-current');
    const faceNext = document.getElementById('gl-face-next');
    const facePrev = document.getElementById('gl-face-prev');
    const cube     = document.getElementById('gl-cube');

    cube.style.transition = 'none';
    cube.classList.remove('to-next', 'to-prev');

    const nextIdx = (current + 1) % IMAGES.length;
    const prevIdx = (current - 1 + IMAGES.length) % IMAGES.length;

    faceCur.querySelector('img').src  = IMAGES[current].src;
    faceNext.querySelector('img').src = IMAGES[nextIdx].src;
    facePrev.querySelector('img').src = IMAGES[prevIdx].src;

    document.getElementById('gl-caption').textContent = IMAGES[current].caption;
    updateUI();

    requestAnimationFrame(() => overlay.classList.add('open'));
  }

  function close() {
    const overlay = document.getElementById('gallery-overlay');
    if (overlay) overlay.classList.remove('open');

    // Deactivate the panel-slot button
    document.querySelectorAll('.panel-slot').forEach(s => {
      if (s.dataset.slot === 'gallery') s.classList.remove('active');
    });
  }

  return { open, close };

})();