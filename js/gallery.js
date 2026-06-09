// gallery.js — Full-screen gallery with card flip/fan transitions
window.GalleryModule = (function () {

  const IMAGES = [
  
    { src: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1780928747/freepik__edit-img1-to-change-the-sunglasses-on-the-orange-t__10223_copy2_hunmds.jpg', caption: 'Grand Entrance',      label: '02' },
    { src: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1780926778/Brigade_High_35122-_%C2%AA_qvaqsy.jpg',  caption: 'Living Spaces',       label: '03' },
    { src: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1780928748/freepik__a-modern-luxury-indooroutdoor-lounge-with-a-serene__3441_bjy7ga.jpg', caption: 'Master Suite',        label: '04' },
    { src: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1780928750/freepik__design-a-luxurious-rooftop-outdoor-kitchen-with-a-__33482_qqyhyf.jpg', caption: 'Kitchen & Dining',    label: '05' },
    { src: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1780928754/freepik__design-a-highend-luxury-lobby-with-marble-floors-a__33481_ryap0w.jpg', caption: 'Balcony & Views',     label: '06' },
    { src: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1780928756/close-up-woman-relaxing-spa_ryzwuw.jpg',  caption: 'Clubhouse',           label: '07' },
    { src: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1780928829/beautiful-green-trees-bright-sunlight_h19cfq.jpg', caption: 'Landscape & Gardens', label: '10' },
    { src: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1780928756/patch-through-agreen-forest_mpveu7.jpg',  caption: 'Exterior View',       label: '01' },
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
      /* ── Overlay ── */
      #gallery-overlay {
        position: fixed; top: 0; left: 0; right: 0; bottom: 62px;
        z-index: 200; background: #080604;
        display: flex; flex-direction: column;
        opacity: 0; pointer-events: none;
        transition: opacity .38s cubic-bezier(0.22,1,0.36,1);
        overflow: hidden;
      }
      #gallery-overlay.open { opacity: 1; pointer-events: all; }

      /* grain */
      #gallery-overlay::before {
        content: ''; position: absolute; inset: 0; z-index: 0; pointer-events: none;
        background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E");
        background-size: 180px; opacity: .5;
      }

      /* ── HEADER ── */
      #gl-header {
        flex-shrink: 0; position: relative; z-index: 10;
        display: flex; align-items: center; justify-content: space-between;
        padding: 18px 20px 14px;
        background: linear-gradient(to bottom, rgba(8,6,4,.95) 60%, transparent);
      }
      #gl-title-wrap { min-width: 0; }
      #gl-label {
        font-family: 'Syne', sans-serif; font-size: 9px; font-weight: 700;
        letter-spacing: .22em; text-transform: uppercase;
        color: rgba(200,190,154,.40); margin: 0 0 4px;
      }
      #gl-caption {
        font-family: 'Cormorant Garamond', serif; font-style: italic;
        font-size: 22px; font-weight: 300; color: rgba(200,190,154,.80);
        margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        transition: opacity .2s;
      }
      #gl-caption.fading { opacity: 0; }
      #gl-close {
        flex-shrink: 0; width: 36px; height: 36px;
        border: 1px solid rgba(200,190,154,.22); background: rgba(200,190,154,.06);
        border-radius: 8px; display: flex; align-items: center; justify-content: center;
        cursor: pointer; color: rgba(200,190,154,.65); font-size: 16px;
        transition: background .2s; -webkit-tap-highlight-color: transparent; margin-left: 16px;
      }
      #gl-close:hover { background: rgba(200,190,154,.14); }

      /* ── CARD STAGE ── */
      #gl-stage {
        flex: 1; position: relative; z-index: 2;
        display: flex; align-items: center; justify-content: center;
        perspective: 1000px; overflow: hidden;
      }

      /* Stack of cards — prev behind, current on top, next to the right */
      .gl-card {
        position: absolute;
        width: min(calc(100vw - 70px), calc((100dvh - 120px) * 1.6));
        height: min(calc(100dvh - 120px), calc((100vw - 70px) / 1.6));
        border-radius: 4px; overflow: hidden;
        border: 1px solid rgba(200,190,154,.10);
        background: #0d0b07;
        will-change: transform, opacity;
        cursor: pointer;
      }
      .gl-card img {
        width: 100%; height: 100%; object-fit: cover;
        display: block; pointer-events: none;
        user-select: none; -webkit-user-drag: none;
      }

      /* Default resting state */
      #gl-card-behind {
        transform: scale(0.88) translateY(18px);
        opacity: 0.35;
        z-index: 1;
        box-shadow: 0 8px 40px rgba(0,0,0,.5);
      }
      #gl-card-current {
        transform: scale(1) translateY(0);
        opacity: 1;
        z-index: 2;
        box-shadow: 0 16px 60px rgba(0,0,0,.7), 0 0 0 1px rgba(200,190,154,.12);
      }
      #gl-card-incoming {
        transform: translateX(110%) scale(0.92) rotate(4deg);
        opacity: 0;
        z-index: 3;
      }

      /* ── Animate OUT (current flies left) ── */
      #gl-card-current.exit-left {
        transition: transform 480ms cubic-bezier(0.4,0,0.2,1), opacity 480ms ease;
        transform: translateX(-115%) scale(0.9) rotate(-5deg);
        opacity: 0;
      }
      #gl-card-current.exit-right {
        transition: transform 480ms cubic-bezier(0.4,0,0.2,1), opacity 480ms ease;
        transform: translateX(115%) scale(0.9) rotate(5deg);
        opacity: 0;
      }

      /* ── Behind card rises ── */
      #gl-card-behind.rise {
        transition: transform 480ms cubic-bezier(0.22,1,0.36,1), opacity 480ms ease;
        transform: scale(1) translateY(0);
        opacity: 1;
      }

      /* ── Incoming slides in ── */
      #gl-card-incoming.enter {
        transition: transform 480ms cubic-bezier(0.22,1,0.36,1), opacity 360ms ease;
        transform: translateX(0) scale(1) rotate(0deg);
        opacity: 1;
      }
      #gl-card-incoming.enter-from-left {
        transform: translateX(-110%) scale(0.92) rotate(-4deg);
        opacity: 0;
      }
      #gl-card-incoming.enter-from-left.enter {
        transform: translateX(0) scale(1) rotate(0deg);
        opacity: 1;
      }

      /* ── Arrows ── */
      .gl-arrow {
        position: absolute; top: 50%; transform: translateY(-50%);
        z-index: 10; width: 40px; height: 40px;
        background: rgba(10,8,5,.55); border: 1px solid rgba(200,190,154,.22);
        border-radius: 10px; display: flex; align-items: center; justify-content: center;
        cursor: pointer; transition: background .2s;
        -webkit-tap-highlight-color: transparent;
      }
      .gl-arrow:hover { background: rgba(200,190,154,.16); border-color: rgba(200,190,154,.55); }
      #gl-arrow-prev { left: 16px; }
      #gl-arrow-next { right: 16px; }
      .gl-arrow svg { width: 16px; height: 16px; stroke: rgba(200,190,154,.70); fill: none; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }

      /* Vignette */
      #gl-vignette {
        position: absolute; inset: 0; z-index: 3; pointer-events: none;
        background: radial-gradient(ellipse 90% 80% at 50% 50%, transparent 50%, rgba(4,3,2,.55) 100%);
      }

      /* ── FOOTER ── */
      #gl-footer {
        flex-shrink: 0; position: relative; z-index: 10;
        display: flex; flex-direction: column; align-items: center; gap: 10px;
        padding: 12px 20px 16px;
        background: linear-gradient(to top, rgba(8,6,4,.95) 60%, transparent);
      }
      #gl-counter {
        font-family: 'Syne', sans-serif; font-size: 9px; font-weight: 700;
        letter-spacing: .20em; text-transform: uppercase; color: rgba(200,190,154,.28);
      }
      #gl-dots { display: flex; gap: 6px; align-items: center; }
      .gl-dot {
        height: 4px; width: 4px; border-radius: 2px;
        background: rgba(200,190,154,.22);
        transition: width .3s, background .3s; flex-shrink: 0;
      }
      .gl-dot.active { width: 20px; background: rgba(200,190,154,.80); }
      #gl-thumbs {
        display: flex; gap: 6px; overflow-x: auto; scrollbar-width: none;
        padding: 2px 2px 0; max-width: 100%;
      }
      #gl-thumbs::-webkit-scrollbar { display: none; }
      .gl-thumb {
        flex-shrink: 0; width: 44px; height: 30px;
        border-radius: 3px; overflow: hidden;
        border: 1.5px solid rgba(200,190,154,.12);
        cursor: pointer; opacity: .4;
        transition: opacity .22s, border-color .22s, transform .22s;
      }
      .gl-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; pointer-events: none; }
      .gl-thumb.active { opacity: 1; border-color: rgba(200,190,154,.75); transform: scaleY(1.08); }
      .gl-thumb:not(.active):hover { opacity: .7; }

      @media (max-width: 520px) {
        .gl-card { width: 86vw; height: 62vw; }
        #gl-arrow-prev { left: 6px; } #gl-arrow-next { right: 6px; }
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

        <div id="gl-stage">
          <!-- behind card (next in stack) -->
          <div class="gl-card" id="gl-card-behind">
            <img src="${IMAGES[1 % IMAGES.length].src}" alt=""/>
          </div>
          <!-- current card -->
          <div class="gl-card" id="gl-card-current">
            <img src="${IMAGES[0].src}" alt="${IMAGES[0].caption}"/>
          </div>
          <!-- incoming card (off-screen) -->
          <div class="gl-card" id="gl-card-incoming">
            <img src="" alt=""/>
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

  // ─── CARD TRANSITION ─────────────────────────────────────────────
  // Direction: 'next' = current flies left, incoming slides from right
  //            'prev' = current flies right, incoming slides from left
  function cardTo(targetIdx, direction) {
    if (isAnimating || targetIdx === current) return;
    isAnimating = true;

    const cardCur      = document.getElementById('gl-card-current');
    const cardBehind   = document.getElementById('gl-card-behind');
    const cardIncoming = document.getElementById('gl-card-incoming');
    const caption      = document.getElementById('gl-caption');

    const img = IMAGES[targetIdx];
    const nextAfter = (targetIdx + 1) % IMAGES.length;

    // Stage incoming card off-screen
    cardIncoming.querySelector('img').src = img.src;
    cardIncoming.querySelector('img').alt = img.caption;
    // Remove all state classes, set start position
    cardIncoming.className = 'gl-card';
    if (direction === 'next') {
      cardIncoming.style.cssText = 'transform: translateX(110%) scale(0.92) rotate(4deg); opacity: 0; z-index: 3;';
    } else {
      cardIncoming.style.cssText = 'transform: translateX(-110%) scale(0.92) rotate(-4deg); opacity: 0; z-index: 3;';
    }

    // Force reflow
    cardIncoming.getBoundingClientRect();

    const DURATION = 480;

    // Fly current card out
    cardCur.style.transition = `transform ${DURATION}ms cubic-bezier(0.4,0,0.2,1), opacity ${DURATION}ms ease`;
    cardCur.style.transform  = direction === 'next'
      ? 'translateX(-115%) scale(0.9) rotate(-5deg)'
      : 'translateX(115%) scale(0.9) rotate(5deg)';
    cardCur.style.opacity = '0';

    // Rise the behind card (acts as a depth hint)
    cardBehind.style.transition = `transform ${DURATION}ms cubic-bezier(0.22,1,0.36,1), opacity ${DURATION}ms ease`;
    cardBehind.style.transform  = 'scale(1) translateY(0)';
    cardBehind.style.opacity    = '0.6';

    // Slide incoming card in
    cardIncoming.style.transition = `transform ${DURATION}ms cubic-bezier(0.22,1,0.36,1), opacity ${DURATION * 0.75}ms ease`;
    cardIncoming.style.transform  = 'translateX(0) scale(1) rotate(0deg)';
    cardIncoming.style.opacity    = '1';

    // Caption fade
    caption.classList.add('fading');
    setTimeout(() => {
      caption.textContent = img.caption;
      caption.classList.remove('fading');
    }, DURATION * 0.4);

    // After animation: reset all cards to new positions
    setTimeout(() => {
      // Current (was flying out) → now becomes the behind stack card
      cardCur.style.transition  = 'none';
      cardCur.style.transform   = 'scale(0.88) translateY(18px)';
      cardCur.style.opacity     = '0.35';
      cardCur.style.zIndex      = '1';
      cardCur.querySelector('img').src = IMAGES[nextAfter].src;

      // Behind → reset behind style
      cardBehind.style.transition = 'none';
      cardBehind.style.transform  = 'scale(0.88) translateY(18px)';
      cardBehind.style.opacity    = '0.35';
      cardBehind.style.zIndex     = '1';

      // Incoming → becomes new current
      cardIncoming.style.transition = 'none';
      cardIncoming.style.transform  = 'scale(1) translateY(0)';
      cardIncoming.style.opacity    = '1';
      cardIncoming.style.zIndex     = '2';
      cardIncoming.style.boxShadow  = '0 16px 60px rgba(0,0,0,.7), 0 0 0 1px rgba(200,190,154,.12)';

      // Swap DOM references by renaming IDs
      cardCur.id      = 'gl-card-behind';
      cardIncoming.id = 'gl-card-current';
      cardBehind.id   = 'gl-card-incoming';

      current = targetIdx;
      updateUI();
      isAnimating = false;
    }, DURATION + 40);
  }

  function updateUI() {
    const n = IMAGES.length;
    document.getElementById('gl-counter').textContent =
      `${String(current + 1).padStart(2,'0')} / ${String(n).padStart(2,'0')}`;
    document.querySelectorAll('.gl-dot').forEach((d, i) => d.classList.toggle('active', i === current));
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

    document.getElementById('gl-thumbs').addEventListener('click', (e) => {
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

    // Reset all cards to their resting state
    const cardCur    = document.getElementById('gl-card-current');
    const cardBehind = document.getElementById('gl-card-behind');
    const cardIn     = document.getElementById('gl-card-incoming');

    if (cardCur) {
      cardCur.style.cssText = 'transform: scale(1) translateY(0); opacity: 1; z-index: 2; box-shadow: 0 16px 60px rgba(0,0,0,.7), 0 0 0 1px rgba(200,190,154,.12); transition: none;';
      cardCur.querySelector('img').src = IMAGES[current].src;
    }
    const nextIdx = (current + 1) % IMAGES.length;
    if (cardBehind) {
      cardBehind.style.cssText = 'transform: scale(0.88) translateY(18px); opacity: 0.35; z-index: 1; transition: none;';
      cardBehind.querySelector('img').src = IMAGES[nextIdx].src;
    }
    if (cardIn) {
      cardIn.style.cssText = 'transform: translateX(110%) scale(0.92) rotate(4deg); opacity: 0; z-index: 3; transition: none;';
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