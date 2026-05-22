// gallery.js — Procedural render gallery with hover zoom and lightbox
window.GalleryModule = (function () {

  const galleryItems = [
    { label: 'Aerial View', palette: ['#1a2035', '#0d3050', '#c8be9a'], type: 'aerial' },
    { label: 'Tower Elevation', palette: ['#201a10', '#3a2a14', '#c8a87a'], type: 'elevation' },
    { label: 'Garden Court', palette: ['#0d1a14', '#1a3020', '#8fa68a'], type: 'garden' },
    { label: 'Unit 1 Interior', palette: ['#1a1510', '#2a2018', '#c8be9a'], type: 'interior' },
    { label: 'Unit 2 Terrace', palette: ['#0d1a14', '#1a2820', '#7aa87a'], type: 'terrace' },
    { label: 'Lobby', palette: ['#18141a', '#2a2030', '#a07895'], type: 'lobby' },
    { label: 'Site at Dusk', palette: ['#1a1020', '#2a1830', '#c8a87a'], type: 'dusk' },
    { label: 'Cluster Plan', palette: ['#0a0a08', '#141410', '#8fa68a'], type: 'plan' },
    { label: 'Rooftop Deck', palette: ['#0d1525', '#182040', '#c8be9a'], type: 'rooftop' },
  ];

  function drawGalleryCard(canvas, item, seed = 0) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width, h = canvas.height;
    const rng = (n) => ((Math.sin(seed * 9.301 + n * 4.672) * 0.5 + 0.5));

    // BG
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, item.palette[0]);
    bg.addColorStop(1, item.palette[1]);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    if (item.type === 'aerial') {
      // Top-down city blocks
      for (let i = 0; i < 12; i++) {
        const bx = rng(i * 7) * w * 0.8 + w * 0.1;
        const by = rng(i * 3) * h * 0.8 + h * 0.1;
        const bw = 15 + rng(i * 5) * 30;
        const bh = 10 + rng(i * 2) * 20;
        ctx.fillStyle = `rgba(30,28,20,${0.6 + rng(i) * 0.4})`;
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = item.palette[2] + '44';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(bx, by, bw, bh);
      }
      // Tower dot
      ctx.fillStyle = item.palette[2];
      ctx.beginPath(); ctx.arc(w / 2, h / 2, 6, 0, Math.PI * 2); ctx.fill();
      const glow = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, 40);
      glow.addColorStop(0, item.palette[2] + '55');
      glow.addColorStop(1, 'transparent');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, w, h);
    } else if (item.type === 'elevation') {
      // Tower silhouette
      const tx = w / 2, ty = h * 0.85;
      ctx.fillStyle = '#1e1c14';
      ctx.fillRect(tx - 20, ty - h * 0.55, 40, h * 0.55);
      // floors
      for (let f = 0; f < 8; f++) {
        ctx.fillStyle = item.palette[2] + '55';
        ctx.fillRect(tx - 22, ty - (f + 1) * (h * 0.55 / 8) - 2, 44, 2);
      }
      // crown
      ctx.beginPath();
      ctx.moveTo(tx - 26, ty - h * 0.55);
      ctx.lineTo(tx, ty - h * 0.7);
      ctx.lineTo(tx + 26, ty - h * 0.55);
      ctx.fillStyle = item.palette[2];
      ctx.fill();
      // horizon
      ctx.fillStyle = '#252018';
      ctx.fillRect(0, ty, w, h - ty);
    } else if (item.type === 'garden') {
      // Landscape
      ctx.fillStyle = '#0d1a0d';
      ctx.fillRect(0, h * 0.5, w, h * 0.5);
      // paths
      ctx.strokeStyle = 'rgba(200,190,154,0.1)';
      ctx.lineWidth = 8;
      ctx.beginPath(); ctx.moveTo(0, h * 0.65); ctx.lineTo(w, h * 0.65); ctx.stroke();
      // trees (circles)
      for (let t = 0; t < 6; t++) {
        const tx2 = rng(t * 3) * w;
        const ty2 = h * 0.45 + rng(t) * h * 0.2;
        const r = 8 + rng(t * 2) * 16;
        ctx.beginPath(); ctx.arc(tx2, ty2, r, 0, Math.PI * 2);
        ctx.fillStyle = item.palette[2] + '55'; ctx.fill();
      }
    } else if (item.type === 'interior') {
      // Room perspective
      ctx.fillStyle = '#181510';
      // walls
      ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = '#1e1a14';
      const vanish = { x: w / 2, y: h * 0.4 };
      ctx.beginPath();
      ctx.moveTo(0, h); ctx.lineTo(vanish.x, vanish.y); ctx.lineTo(w, h); ctx.closePath();
      ctx.fillStyle = '#141210'; ctx.fill();
      // window
      ctx.fillStyle = '#1a3050';
      ctx.fillRect(w * 0.35, h * 0.1, w * 0.3, h * 0.4);
      ctx.strokeStyle = '#0a0a08'; ctx.lineWidth = 3;
      ctx.strokeRect(w * 0.35, h * 0.1, w * 0.3, h * 0.4);
      // light glow
      const ig = ctx.createRadialGradient(w / 2, h * 0.3, 0, w / 2, h * 0.3, 80);
      ig.addColorStop(0, item.palette[2] + '22'); ig.addColorStop(1, 'transparent');
      ctx.fillStyle = ig; ctx.fillRect(0, 0, w, h);
    } else if (item.type === 'plan') {
      // Architectural plan lines
      ctx.strokeStyle = item.palette[2] + '44';
      ctx.lineWidth = 1;
      // rooms
      const rooms = [[0.1, 0.1, 0.35, 0.35], [0.55, 0.1, 0.35, 0.35],
        [0.1, 0.55, 0.35, 0.35], [0.55, 0.55, 0.35, 0.35]];
      rooms.forEach(([rx, ry, rw, rh]) => {
        ctx.strokeStyle = item.palette[2] + '66';
        ctx.lineWidth = 1;
        ctx.strokeRect(rx * w, ry * h, rw * w, rh * h);
      });
      ctx.strokeStyle = item.palette[2] + '22';
      for (let i = 0; i < 8; i++) {
        ctx.beginPath(); ctx.moveTo(i * w / 8, 0); ctx.lineTo(i * w / 8, h); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * h / 8); ctx.lineTo(w, i * h / 8); ctx.stroke();
      }
    } else {
      // Generic atmospheric
      for (let s = 0; s < 8; s++) {
        const sg = ctx.createRadialGradient(
          rng(s) * w, rng(s * 3) * h, 0,
          rng(s) * w, rng(s * 3) * h, 60 + rng(s * 5) * 80
        );
        sg.addColorStop(0, item.palette[2] + '18');
        sg.addColorStop(1, 'transparent');
        ctx.fillStyle = sg;
        ctx.fillRect(0, 0, w, h);
      }
      // horizon
      ctx.fillStyle = item.palette[1] + 'aa';
      ctx.fillRect(0, h * 0.5, w, h * 0.5);
      // structure silhouette
      ctx.fillStyle = 'rgba(10,10,8,0.8)';
      for (let b = 0; b < 4; b++) {
        const bh2 = h * (0.2 + rng(b * 2) * 0.3);
        const bw2 = w * (0.06 + rng(b * 3) * 0.1);
        const bx2 = rng(b * 7) * w * 0.8 + w * 0.05;
        ctx.fillRect(bx2, h * 0.5 - bh2, bw2, bh2 + h * 0.5);
      }
    }

    // Label bar overlay
    const lbar = ctx.createLinearGradient(0, h - 32, 0, h);
    lbar.addColorStop(0, 'transparent');
    lbar.addColorStop(1, 'rgba(10,10,8,0.85)');
    ctx.fillStyle = lbar;
    ctx.fillRect(0, h - 32, w, 32);
  }

  function buildGrid() {
    const grid = document.getElementById('gallery-grid');
    if (!grid) return;
    grid.innerHTML = '';

    galleryItems.forEach((item, i) => {
      const div = document.createElement('div');
      div.className = 'gallery-item';

      const cv = document.createElement('canvas');
      cv.width = 480; cv.height = 360;
      div.appendChild(cv);

      const label = document.createElement('div');
      label.className = 'gallery-item-label';
      label.textContent = item.label;
      div.appendChild(label);

      drawGalleryCard(cv, item, i + 1);

      div.addEventListener('click', () => openLightbox(item, i));
      grid.appendChild(div);
    });
  }

  function openLightbox(item, seed) {
    const lb = document.getElementById('lightbox');
    const lbCanvas = document.getElementById('lightbox-canvas');
    lbCanvas.width = 800; lbCanvas.height = 600;
    drawGalleryCard(lbCanvas, item, seed + 1);
    lb.classList.add('active');
  }

  function bindEvents() {
    document.getElementById('lb-close').addEventListener('click', () => {
      document.getElementById('lightbox').classList.remove('active');
    });
    document.getElementById('lightbox').addEventListener('click', (e) => {
      if (e.target === document.getElementById('lightbox')) {
        document.getElementById('lightbox').classList.remove('active');
      }
    });
    document.getElementById('gallery-back').addEventListener('click', () => {
      document.getElementById('lightbox').classList.remove('active');
      window.App.goBack();
    });
  }

  return {
    activate() {
      buildGrid();
      bindEvents();
    }
  };
})();
