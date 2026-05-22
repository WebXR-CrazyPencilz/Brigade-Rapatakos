// locationmap.js — Minimalist map with invisible hotspots
window.LocationMapModule = (function () {
  let canvas, ctx, raf;
  let hoveredSpot = null;
  let tooltip = null;
  let pulseT = 0;

  // Hotspot definitions (relative to canvas %)
  const hotspots = [
    { id: 'site', x: 0.5, y: 0.5, label: 'ARCH Residences', sub: 'Project Site', category: 'project', radius: 18 },
    { id: 'metro', x: 0.68, y: 0.38, label: 'Metro Station', sub: '5 min walk', category: 'transport', radius: 12 },
    { id: 'park', x: 0.28, y: 0.42, label: 'Riverside Park', sub: '8 min walk', category: 'amenity', radius: 12 },
    { id: 'mall', x: 0.72, y: 0.62, label: 'City Mall', sub: '10 min drive', category: 'amenity', radius: 12 },
    { id: 'hospital', x: 0.22, y: 0.7, label: 'Medical Centre', sub: '7 min drive', category: 'health', radius: 12 },
    { id: 'school', x: 0.6, y: 0.75, label: 'International School', sub: '6 min walk', category: 'education', radius: 12 },
    { id: 'airport', x: 0.82, y: 0.28, label: 'Airport', sub: '22 min drive', category: 'transport', radius: 12 },
    { id: 'cafe', x: 0.38, y: 0.32, label: 'Artisan Café District', sub: '3 min walk', category: 'lifestyle', radius: 12 },
  ];

  const catColors = {
    project: '#c8be9a',
    transport: '#8fa6c8',
    amenity: '#8fa68a',
    health: '#c88a8a',
    education: '#c8b08a',
    lifestyle: '#a88ac8',
  };

  function resize() {
    canvas.width = canvas.parentElement.clientWidth;
    canvas.height = canvas.parentElement.clientHeight;
  }

  function drawMap() {
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // ── Background ──
    ctx.fillStyle = '#0c0c0a';
    ctx.fillRect(0, 0, w, h);

    // ── Base road network (lines) ──
    ctx.strokeStyle = 'rgba(200,190,154,0.06)';
    ctx.lineWidth = 14; ctx.lineCap = 'round';

    // Major roads
    const roads = [
      [[0, 0.5 * h], [w, 0.5 * h]],                     // horizontal
      [[0.5 * w, 0], [0.5 * w, h]],                      // vertical
      [[0, 0.3 * h], [w, 0.3 * h]],                      // secondary H
      [[0, 0.75 * h], [w, 0.75 * h]],                    // secondary H2
      [[0.3 * w, 0], [0.3 * w, h]],                      // secondary V
      [[0.7 * w, 0], [0.7 * w, h]],                      // secondary V2
      [[0.1 * w, 0.1 * h], [0.5 * w, 0.5 * h]],         // diagonal
      [[w, 0.15 * h], [0.5 * w, 0.5 * h]],               // diagonal2
    ];
    roads.forEach(([a, b]) => {
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    });

    // Road centre lines (thinner, lighter)
    ctx.strokeStyle = 'rgba(200,190,154,0.04)';
    ctx.lineWidth = 2;
    ctx.setLineDash([12, 10]);
    roads.forEach(([a, b]) => {
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    });
    ctx.setLineDash([]);

    // ── City blocks (filled rectangles) ──
    const blocks = [
      [0.05, 0.05, 0.2, 0.22],
      [0.32, 0.06, 0.15, 0.18],
      [0.52, 0.05, 0.16, 0.22],
      [0.73, 0.05, 0.22, 0.22],
      [0.05, 0.33, 0.22, 0.14],
      [0.73, 0.32, 0.22, 0.15],
      [0.05, 0.52, 0.22, 0.2],
      [0.32, 0.55, 0.14, 0.18],
      [0.53, 0.55, 0.14, 0.18],
      [0.73, 0.52, 0.22, 0.2],
      [0.05, 0.77, 0.22, 0.2],
      [0.32, 0.78, 0.35, 0.18],
      [0.73, 0.77, 0.22, 0.18],
    ];
    blocks.forEach(([bx, by, bw, bh]) => {
      ctx.fillStyle = 'rgba(28,28,22,0.7)';
      ctx.beginPath();
      ctx.roundRect(bx * w, by * h, bw * w, bh * h, 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(200,190,154,0.05)';
      ctx.lineWidth = 0.5; ctx.stroke();
    });

    // ── Water body (river) ──
    ctx.fillStyle = 'rgba(30,50,80,0.3)';
    ctx.beginPath();
    ctx.moveTo(0, 0.25 * h);
    ctx.bezierCurveTo(0.2 * w, 0.22 * h, 0.4 * w, 0.28 * h, 0.6 * w, 0.24 * h);
    ctx.bezierCurveTo(0.8 * w, 0.20 * h, 1.0 * w, 0.25 * h, 1.0 * w, 0.25 * h);
    ctx.lineTo(w, 0.32 * h);
    ctx.bezierCurveTo(0.8 * w, 0.28 * h, 0.6 * w, 0.34 * h, 0.4 * w, 0.32 * h);
    ctx.bezierCurveTo(0.2 * w, 0.30 * h, 0, 0.32 * h, 0, 0.32 * h);
    ctx.closePath();
    ctx.fill();

    // ── Green space ──
    ctx.fillStyle = 'rgba(30,55,30,0.25)';
    ctx.beginPath();
    ctx.ellipse(0.28 * w, 0.44 * h, 60, 45, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(100,160,100,0.15)';
    ctx.lineWidth = 1; ctx.stroke();

    // ── Hotspots ──
    hotspots.forEach(spot => {
      const sx = spot.x * w, sy = spot.y * h;
      const col = catColors[spot.category] || '#c8be9a';
      const isHover = hoveredSpot && hoveredSpot.id === spot.id;

      if (isHover || spot.id === 'site') {
        // Pulsing ring on hover or main site
        const pulse = 0.5 + Math.sin(pulseT * (spot.id === 'site' ? 2.5 : 4)) * 0.5;
        const pr = spot.radius + 8 + pulse * 10;
        ctx.beginPath(); ctx.arc(sx, sy, pr, 0, Math.PI * 2);
        ctx.strokeStyle = col + Math.round(40 * pulse).toString(16).padStart(2, '0');
        ctx.lineWidth = 1; ctx.stroke();

        // Inner fill
        ctx.beginPath(); ctx.arc(sx, sy, spot.radius, 0, Math.PI * 2);
        ctx.fillStyle = col + '22'; ctx.fill();
        ctx.strokeStyle = col + 'aa'; ctx.lineWidth = 1.5; ctx.stroke();

        // Dot
        ctx.beginPath(); ctx.arc(sx, sy, 4, 0, Math.PI * 2);
        ctx.fillStyle = col; ctx.fill();
      } else {
        // Invisible until hover — very subtle
        const a = 0.0; // fully transparent unless hovered
        ctx.beginPath(); ctx.arc(sx, sy, spot.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,0,0,${a})`; ctx.fill();
      }
    });

    // ── Scale bar ──
    ctx.strokeStyle = 'rgba(200,190,154,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(24, h - 24); ctx.lineTo(24 + 80, h - 24); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(24, h - 20); ctx.lineTo(24, h - 28); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(104, h - 20); ctx.lineTo(104, h - 28); ctx.stroke();
    ctx.font = '400 9px Syne'; ctx.fillStyle = 'rgba(200,190,154,0.4)';
    ctx.textAlign = 'left'; ctx.fillText('500m', 24, h - 10);

    // ── Compass ──
    drawCompass(w - 50, 50, 22);

    // ── Legend (bottom right) ──
    drawLegend(w - 20, h - 20);
  }

  function drawCompass(x, y, r) {
    ctx.save();
    ctx.strokeStyle = 'rgba(200,190,154,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#c8be9a';
    ctx.font = '600 9px Syne'; ctx.textAlign = 'center';
    ctx.fillText('N', x, y - r + 11);
    ctx.fillStyle = 'rgba(240,236,224,0.3)';
    ctx.font = '400 7px Syne';
    ctx.fillText('S', x, y + r - 3);
    ctx.fillText('E', x + r - 3, y + 3);
    ctx.fillText('W', x - r + 3, y + 3);
    ctx.strokeStyle = '#c8be9a'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x, y - r + 6); ctx.lineTo(x, y + 3); ctx.stroke();
    ctx.restore();
  }

  function drawLegend(x, y) {
    const entries = Object.entries(catColors);
    entries.forEach(([cat, col], i) => {
      const ly = y - (entries.length - i) * 16;
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(x - 90, ly, 3, 0, Math.PI * 2); ctx.fill();
      ctx.font = '400 8px Syne'; ctx.fillStyle = 'rgba(240,236,224,0.35)';
      ctx.textAlign = 'left';
      ctx.fillText(cat.charAt(0).toUpperCase() + cat.slice(1), x - 82, ly + 3);
    });
  }

  function drawTooltip(spot) {
    const w = canvas.width, h = canvas.height;
    const sx = spot.x * w, sy = spot.y * h;
    const col = catColors[spot.category] || '#c8be9a';
    const tw = 160, th = 52;
    let tx = sx + 20, ty = sy - 30;
    if (tx + tw > w - 10) tx = sx - tw - 10;
    if (ty < 10) ty = sy + 20;

    ctx.save();
    ctx.fillStyle = 'rgba(22,22,20,0.95)';
    ctx.beginPath(); ctx.roundRect(tx, ty, tw, th, 3); ctx.fill();
    ctx.strokeStyle = col + '66'; ctx.lineWidth = 1; ctx.stroke();

    ctx.fillStyle = col;
    ctx.font = '600 10px Syne';
    ctx.textAlign = 'left';
    ctx.fillText(spot.label.toUpperCase(), tx + 12, ty + 18);

    ctx.fillStyle = 'rgba(240,236,224,0.4)';
    ctx.font = '300 9px Syne';
    ctx.fillText(spot.sub, tx + 12, ty + 34);

    // Arrow connector
    ctx.strokeStyle = col + '55'; ctx.lineWidth = 1;
    ctx.setLineDash([3, 4]);
    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(tx, ty + th / 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  function frame() {
    pulseT += 0.04;
    drawMap();
    if (hoveredSpot) drawTooltip(hoveredSpot);
    raf = requestAnimationFrame(frame);
  }

  function bindEvents() {
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      const w = canvas.width, h = canvas.height;

      hoveredSpot = null;
      for (const spot of hotspots) {
        const sx = spot.x * w, sy = spot.y * h;
        if (Math.hypot(mx - sx, my - sy) < spot.radius + 8) {
          hoveredSpot = spot;
          canvas.style.cursor = 'pointer';
          break;
        }
      }
      if (!hoveredSpot) canvas.style.cursor = 'crosshair';
    });

    canvas.addEventListener('mouseleave', () => { hoveredSpot = null; });

    canvas.addEventListener('click', () => {
      // Future: navigate to amenity detail or external map
    });

    document.getElementById('map-back').addEventListener('click', () => {
      window.App.goBack();
    });
  }

  return {
    activate() {
      canvas = document.getElementById('map-canvas');
      ctx = canvas.getContext('2d');
      resize();
      window.addEventListener('resize', resize);
      bindEvents();
      if (raf) cancelAnimationFrame(raf);
      hoveredSpot = null;
      frame();
    }
  };
})();
