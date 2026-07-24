;(function () {
  'use strict'

  // ─── CONFIG ─────────────────────────────────────────────────────
  const FP_IMAGE_URL = 'https://ik.imagekit.io/pwzaetheh/Units/unit07_4bhk_(f)_even_tower_03.jpg'

  // The viewBox matches the image's natural pixel size.
  // All polygon coordinates are based on these dimensions.
  const VP_W = 1009
  const VP_H = 567

  // ─── ZONES ──────────────────────────────────────────────────────
  const zones = [
    { room: 'living',       label: 'LIVING ROOM',       points: '498,224 730,224 730,521 498,521',  fill: 'rgba(0,220,0,0)',    stroke: 'rgba(0,220,0,0)' },
    { room: 'masterbedroom', label: 'MASTER BEDROOM', points: '258,202 382,202 382,474 258,474',  fill: 'rgba(255,200,0,0)',  stroke: 'rgba(255,200,0,0)' },
    { room: 'kidsbedroom',   label: 'KIDS BEDROOM',   points: '382,264 498,264 498,474 382,474',  fill: 'rgba(60,140,255,0)', stroke: 'rgba(60,140,255,0)' },
    { room: 'guestbedroom', label: 'GUEST BEDROOM', points: '725,260 840,260 840,470 725,470',  fill: 'rgba(255,80,140,0)', stroke: 'rgba(255,80,140,0)'},
    { room: 'kitchen',        label: 'KITCHEN',       points: '505,90 728,90 728,205 505,205',    fill: 'rgba(255,80,80,0)',  stroke: 'rgba(255,80,80,0)' },
    { room: 'bedroom3',       label: 'BEDROOM 3', points: '253,90 508,90 508,204 253,204',    fill: 'rgba(180,60,255,0)',     stroke: 'rgba(180,60,255,0)' },
    { room: 'foyer',         label: 'LOBBY',         points: '725,84 840,84 840,260 725,260',    fill: 'rgba(0,204,204,0)',  stroke: 'rgba(0,204,204,0)' }
  ]

  // ─── INJECT LAYER ───────────────────────────────────────────────
  function injectLayer () {
    if (document.getElementById('fp-layer')) return

    // ── Outer container (fullscreen dark backdrop)
    const layer = document.createElement('div')
    layer.id = 'fp-layer'
    layer.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 10;
      display: none;
      align-items: center;
      justify-content: center;
      background: #ffffff;
    `

    // ── Wrapper: image + SVG stacked on top of each other
    //    The KEY idea from R&D: SVG is position:absolute inside
    //    a position:relative wrapper, so it always matches the image.
    const wrap = document.createElement('div')
    wrap.style.cssText = `
      position: relative;
      display: inline-block;
      line-height: 0;
      overflow: hidden;
      box-shadow: none;
    `

    // ── The floorplan image
    const img = document.createElement('img')
    img.id = 'fp-img'
    img.alt = 'Floor Plan'
    img.src = FP_IMAGE_URL
    img.style.cssText = `
      display: block;
      max-width: 100vw;
      max-height: 100vh;
      width: auto;
      height: auto;
      user-select: none;
      -webkit-user-drag: none;
    `

    // ── SVG overlay — sits exactly on top of the image
    //    width:100% height:100% means it always matches image size.
    //    viewBox uses the image's natural pixel dimensions,
    //    so all polygon coordinates are always correct — no JS math needed!
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.id = 'fp-svg'
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
    svg.setAttribute('viewBox', `0 0 ${VP_W} ${VP_H}`)
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
    svg.style.cssText = `
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      overflow: visible;
    `

    // ── Tooltip
    const tip = document.createElement('div')
    tip.id = 'fp-tip'
    tip.style.cssText = `
      position: fixed;
      bottom: 36px;
      left: 50%;
      transform: translateX(-50%);
      background: #7a3e1e;
      color: #ffffff;
      border: none;
      box-shadow: 0 2px 8px rgba(0,0,0,0.25);
      font-weight: 700;
      padding: 6px 18px;
      border-radius: 20px;
      font-size: 12px;
      letter-spacing: 1.5px;
      text-transform: uppercase;
      pointer-events: none;
      opacity: 0;
      transition: opacity 0.2s;
      font-family: inherit;
      z-index: 20;
    `

    wrap.appendChild(img)
    wrap.appendChild(svg)
    layer.appendChild(wrap)
    layer.appendChild(tip)
    document.body.appendChild(layer)

    // Build zones once image is loaded
    img.addEventListener('load', buildZones)
    // If image was cached and already loaded
    if (img.complete) buildZones()
  }

  // ─── BUILD POLYGON ZONES ─────────────────────────────────────────
  let zonesBuilt = false

  function buildZones () {
    if (zonesBuilt) return
    zonesBuilt = true

    const svg = document.getElementById('fp-svg')
    if (!svg) return

    zones.forEach(zone => {
      // Polygon shape
      const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
      poly.setAttribute('class', 'fpz')
      poly.setAttribute('points', zone.points)
      poly.setAttribute('fill', zone.fill)
      poly.setAttribute('stroke', zone.stroke)
      poly.setAttribute('stroke-width', '2')
      poly.setAttribute('vector-effect', 'non-scaling-stroke')
      poly.dataset.room  = zone.room
      poly.dataset.label = zone.label
      poly.style.cssText = `
        cursor: pointer;
        pointer-events: all;
        transition: filter 0.15s;
      `
      svg.appendChild(poly)

      // Label text in the center of each zone
      const pts = zone.points.trim().split(/\s+/).map(p => p.split(',').map(Number))
      const cx  = pts.reduce((s, p) => s + p[0], 0) / pts.length
      const cy  = pts.reduce((s, p) => s + p[1], 0) / pts.length

     
    })

    // ── Hover effect (desktop)
    svg.addEventListener('mouseover', e => {
      const z = e.target.closest('.fpz')
      if (!z) return
      z.setAttribute('stroke', 'rgba(255,255,255,1)')
      z.setAttribute('stroke-width', '3')
      z.style.filter = 'drop-shadow(0 0 8px rgba(255,255,255,1)) drop-shadow(0 0 4px rgba(255,255,255,0.8))'
      showTip(z.dataset.label || z.dataset.room)
    })

    svg.addEventListener('mouseout', e => {
      const z = e.target.closest('.fpz')
      if (!z) return
      z.setAttribute('stroke', 'rgba(0,0,0,0)')
      z.style.filter = ''
      hideTip()
    })

    // ── Click → go to 360 viewer (desktop / synthetic click)
    svg.addEventListener('click', e => {
      const z = e.target.closest('.fpz')
      if (!z) return
      goTo360(z.dataset.room)
    })

    // ── Touch → go to 360 viewer (mobile). Mirrors the desktop click
    // path but uses touchend directly instead of relying on the browser
    // to fire a synthetic click afterward — that synthetic-click timing
    // is inconsistent across mobile browsers, especially through a
    // pointer-events layering like this SVG-over-image setup, and was
    // missing here entirely (present in the other unit's floor plan file).
    svg.addEventListener('touchend', e => {
      const t = e.changedTouches[0]
      const z = document.elementFromPoint(t.clientX, t.clientY)?.closest('.fpz')
      if (!z) return
      e.preventDefault()
      goTo360(z.dataset.room)
    }, { passive: false })
  }

  // ─── TOOLTIP ────────────────────────────────────────────────────
  function showTip (text) {
    const tip = document.getElementById('fp-tip')
    if (!tip) return
    tip.textContent = text
    tip.style.opacity = '1'
  }

  function hideTip () {
    const tip = document.getElementById('fp-tip')
    if (tip) tip.style.opacity = '0'
  }

  // ─── GO TO 360 ───────────────────────────────────────────────────
  function goTo360 (roomKey) {
    if (window.AppView) window.AppView.switchTo('360')
    if (typeof loadRoom === 'function') loadRoom(roomKey)
  }

  // ─── SHOW / HIDE ─────────────────────────────────────────────────
  function show () {
    const layer = document.getElementById('fp-layer')
    if (layer) layer.style.display = 'flex'
    // No sizeSVG needed — CSS + viewBox handles everything!
  }

  function hide () {
    const layer = document.getElementById('fp-layer')
    if (layer) layer.style.display = 'none'
    hideTip()
  }

  // ─── PUBLIC API ──────────────────────────────────────────────────
  window.FloorPlan = { show, hide }

  // ─── INIT ────────────────────────────────────────────────────────
  injectLayer()

})()