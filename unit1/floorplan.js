;(function () {
  'use strict'

  // ─── CONFIG ─────────────────────────────────────────────────────
  const FP_IMAGE_URL = 'https://ik.imagekit.io/pwzaetheh/24-4BHK%20%20F_Even%20Floor_TOP%20VIEW_Enlarged_Tower_03.jpg?updatedAt=1777903887248'

  // The viewBox matches the image's natural pixel size.
  // All polygon coordinates are based on these dimensions.
  const VP_W = 1009
  const VP_H = 567

  // ─── ZONES ──────────────────────────────────────────────────────
  const zones = [
    { room: 'living',       label: 'LIVING ROOM',       points: '478,206 702,206 702,506 478,506',  fill: 'rgba(0,220,0,0)',    stroke: 'rgba(0,220,0,0)' },
    { room: 'masterbedroom', label: 'MASTER BEDROOM', points: '235,184 356,184 356,455 235,455',  fill: 'rgba(255,200,0,0)',  stroke: 'rgba(255,200,0,0)' },
    { room: 'kidsbedroom',   label: 'KIDS BEDROOM',   points: '360,248 475,248 475,506 360,506',  fill: 'rgba(60,140,255,0)', stroke: 'rgba(60,140,255,0)' },
    { room: 'guestbedroom', label: 'GUEST BEDROOM', points: '704,248 820,248 820,455 704,455',  fill: 'rgba(255,80,140,0)', stroke: 'rgba(255,80,140,0)'},
    { room: 'kitchen',        label: 'KITCHEN',       points: '482,70 705,70 705,205 482,205',    fill: 'rgba(255,80,80,0)',  stroke: 'rgba(255,80,80,0)' },
    { room: 'bedroom3',       label: 'BEDROOM 3', points: '236,70 478,70 478,188 236,188',    fill: 'rgba(180,60,255,0)',     stroke: 'rgba(180,60,255,0)' },
    { room: 'foyer',         label: 'LOBBY',         points: '705,67 820,67 820,248 705,248',    fill: 'rgba(0,204,204,0)',  stroke: 'rgba(0,204,204,0)' }
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
      border-radius: 6px;
      overflow: hidden;
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
      background: linear-gradient(135deg, #c9a23a 0%, #e8c9a 60%, #c9a23a 100%);
      color: #07060a;
      border: none;
      box-shadow: 0 4px 20px rgba(0,0,0,0.5);
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
    })

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