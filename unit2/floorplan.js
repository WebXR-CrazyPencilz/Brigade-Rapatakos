;(function () {
  'use strict'
  // ─── CONFIG ─────────────────────────────────────────────────────
  const FP_IMAGE_URL = 'https://ik.imagekit.io/pwzaetheh/07-3BHK(L)?updatedAt=1778319775172'

  // The viewBox matches the image's natural pixel size.
  // All polygon coordinates are based on these dimensions.
  const VP_W = 1009
  const VP_H = 567

  // ─── ZONES ──────────────────────────────────────────────────────
  const zones = [
    { room: 'living',          points: '372,218 600,218 600,365 372,365',  label: 'LIVING  ', fill: 'transparent',      stroke: 'transparent' },
    { room: 'masterbedroom',   points: '325,368 556,368 556,515 325,515',  label: 'MASTER BEDROOM', fill: 'transparent',    stroke: 'transparent' },
    { room: 'kidsbedroom',     points: '325,68 528,68 528,214 325,214',    label: 'KIDS BEDROOM', fill: 'transparent',   stroke: 'transparent' },
    
    { room: 'kitchen',         points: '602,218 715,218 715,417 602,417',  label: 'KITCHEN', fill: 'transparent',    stroke: 'transparent' },
    { room: 'guestbedroom',    points: '532,68 715,68 715,214 532,214',    label: 'GUEST BEDROOM', fill: 'transparent',   stroke: 'transparent' },
    { room: 'lobby',           points: '560,420 715,420 715,515 560,515',  label: 'LOBBY', fill: 'transparent',    stroke: 'transparent' }
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

    //    a position:relative wrapper, so it always matches the image.
    const wrap = document.createElement('div')
    wrap.style.cssText = `
      position: relative;
      display: inline-block;
      line-height: 0;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 0 0 1px rgba(201,162,58,0.6), 0 0 40px rgba(201,162,58,0.15), 0 20px 60px rgba(0,0,0,0.5);
      outline: 1px solid rgba(201,162,58,0.2);
      outline-offset: 14px;
    `

    // ── The floorplan image
    const img = document.createElement('img')
    img.id = 'fp-img'
    img.alt = 'Floor Plan'
    img.src = FP_IMAGE_URL
    img.style.cssText = `
      display: block;
      max-width: 92vw;
      max-height: 88vh;
      width: auto;
      height: auto;
      border-radius: 6px;
      user-select: none;
      -webkit-user-drag: none;
    `
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
      background: rgba(10, 8, 5, 0.88);
      color: #f0ebe0;
      border: 5px solid rgba(201, 162, 58, 0.7);
      padding: 10px 40px;
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

    // ── Hover effect
    svg.addEventListener('mouseover', e => {
      const z = e.target.closest('.fpz')
      if (!z) return
      z.style.filter = 'brightness(1.6)'
      showTip(z.dataset.label || z.dataset.room)
    })

    svg.addEventListener('mouseout', e => {
      const z = e.target.closest('.fpz')
      if (!z) return
      z.style.filter = ''
      hideTip()
    })

    // ── Click → go to 360 viewer
    svg.addEventListener('click', e => {
      const z = e.target.closest('.fpz')
      if (!z) return
      goTo360(z.dataset.room)
    })
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