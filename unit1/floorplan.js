;(function () {
  'use strict'

  const FP_IMAGE_URL = 'https://ik.imagekit.io/pwzaetheh/Dimension/4BHKF.jpg?updatedAt=1779451208452'
  const VP_W = 1009
  const VP_H = 567

  const zones = [
    { room: 'living',        label: 'LIVING ROOM',   points: '478,206 702,206 702,506 478,506' },
    { room: 'masterbedroom', label: 'MASTER BEDROOM',points: '235,184 356,184 356,455 235,455' },
    { room: 'kidsbedroom',   label: 'KIDS BEDROOM',  points: '360,248 475,248 475,506 360,506' },
    { room: 'guestbedroom',  label: 'GUEST BEDROOM', points: '704,248 820,248 820,455 704,455' },
    { room: 'kitchen',       label: 'KITCHEN',       points: '482,70 705,70 705,205 482,205'   },
    { room: 'bedroom3',      label: 'BEDROOM 3',     points: '236,70 478,70 478,188 236,188'   },
    { room: 'foyer',         label: 'LOBBY',         points: '705,67 820,67 820,248 705,248'   },
  ]

  function injectLayer() {
    if (document.getElementById('fp-layer')) return

    const layer = document.createElement('div')
    layer.id = 'fp-layer'
    layer.style.cssText = `
      position: fixed; inset: 0; z-index: 10;
      display: none; background: #f2ede8; overflow: hidden;
    `

    const img = document.createElement('img')
    img.id  = 'fp-img'
    img.alt = 'Floor Plan'
    img.src = FP_IMAGE_URL
    img.style.cssText = `
      position: absolute;
      left: 50%; top: 50%;
      transform: translate(-50%, -50%);
      width: 96%; max-height: 92%;
      object-fit: contain; height: auto;
      display: block;
      user-select: none; -webkit-user-drag: none;
    `

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.id = 'fp-svg'
    svg.setAttribute('viewBox', `0 0 ${VP_W} ${VP_H}`)
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
    svg.style.cssText = `position: absolute; pointer-events: none; overflow: visible;`

    const tip = document.createElement('div')
    tip.id = 'fp-tip'
    tip.style.cssText = `
      position: fixed; bottom: 36px; left: 50%; transform: translateX(-50%);
      background: rgba(201,162,58,0.95); color: #07060a;
      box-shadow: 0 4px 20px rgba(0,0,0,0.4); font-weight: 700;
      padding: 7px 20px; border-radius: 20px; font-size: 11px;
      letter-spacing: 2px; text-transform: uppercase;
      pointer-events: none; opacity: 0; transition: opacity 0.2s;
      font-family: inherit; z-index: 20; white-space: nowrap;
    `

    layer.appendChild(img)
    layer.appendChild(svg)
    layer.appendChild(tip)
    document.body.appendChild(layer)

    function syncSVG() {
      const rect = img.getBoundingClientRect()
      const lr   = layer.getBoundingClientRect()
      svg.style.left   = (rect.left - lr.left) + 'px'
      svg.style.top    = (rect.top  - lr.top)  + 'px'
      svg.style.width  = rect.width  + 'px'
      svg.style.height = rect.height + 'px'
    }

    img.addEventListener('load', () => { syncSVG(); buildZones() })
    if (img.complete && img.naturalWidth) { syncSVG(); buildZones() }

    const ro = new ResizeObserver(syncSVG)
    ro.observe(layer)
    window.addEventListener('resize', syncSVG)
  }

  let zonesBuilt = false
  function buildZones() {
    if (zonesBuilt) return
    zonesBuilt = true
    const svg = document.getElementById('fp-svg')
    if (!svg) return

    zones.forEach(zone => {
      const poly = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
      poly.setAttribute('class', 'fpz')
      poly.setAttribute('points', zone.points)
      poly.setAttribute('fill', 'transparent')
      poly.setAttribute('stroke', 'transparent')
      poly.setAttribute('stroke-width', '2')
      poly.setAttribute('vector-effect', 'non-scaling-stroke')
      poly.dataset.room  = zone.room
      poly.dataset.label = zone.label
      poly.style.cssText = `cursor: pointer; pointer-events: all; transition: fill 0.15s, filter 0.15s;`
      svg.appendChild(poly)
    })

    svg.addEventListener('mouseover', e => {
      const z = e.target.closest('.fpz'); if (!z) return
      z.setAttribute('fill', 'rgba(201,162,58,0.12)')
      z.setAttribute('stroke', 'rgba(255,255,255,0.9)')
      z.setAttribute('stroke-width', '2.5')
      z.style.filter = 'drop-shadow(0 0 8px rgba(255,255,255,0.8))'
      showTip(z.dataset.label || z.dataset.room)
    })
    svg.addEventListener('mouseout', e => {
      const z = e.target.closest('.fpz'); if (!z) return
      z.setAttribute('fill', 'transparent')
      z.setAttribute('stroke', 'transparent')
      z.style.filter = ''
      hideTip()
    })
    svg.addEventListener('click', e => {
      const z = e.target.closest('.fpz'); if (!z) return
      goTo360(z.dataset.room)
    })
    svg.addEventListener('touchend', e => {
      const t = e.changedTouches[0]
      const z = document.elementFromPoint(t.clientX, t.clientY)?.closest('.fpz')
      if (!z) return
      e.preventDefault()
      goTo360(z.dataset.room)
    }, { passive: false })
  }

  function showTip(text) {
    const tip = document.getElementById('fp-tip')
    if (tip) { tip.textContent = text; tip.style.opacity = '1' }
  }
  function hideTip() {
    const tip = document.getElementById('fp-tip')
    if (tip) tip.style.opacity = '0'
  }
  function goTo360(roomKey) {
    if (window.AppView) window.AppView.switchTo('360')
    if (typeof loadRoom === 'function') loadRoom(roomKey)
  }

  function show() {
    const layer = document.getElementById('fp-layer')
    if (layer) layer.style.display = 'block'
    requestAnimationFrame(() => {
      const img = document.getElementById('fp-img')
      const svg = document.getElementById('fp-svg')
      const l   = document.getElementById('fp-layer')
      if (!img || !svg || !l || !img.naturalWidth) return
      const rect = img.getBoundingClientRect()
      const lr   = l.getBoundingClientRect()
      svg.style.left   = (rect.left - lr.left) + 'px'
      svg.style.top    = (rect.top  - lr.top)  + 'px'
      svg.style.width  = rect.width  + 'px'
      svg.style.height = rect.height + 'px'
    })
  }
  function hide() {
    const layer = document.getElementById('fp-layer')
    if (layer) layer.style.display = 'none'
    hideTip()
  }

  window.FloorPlan = { show, hide }
  injectLayer()
})()