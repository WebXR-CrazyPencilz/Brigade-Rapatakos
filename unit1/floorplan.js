;(function () {
  'use strict'

  const FP_IMAGE_URL = 'https://ik.imagekit.io/pwzaetheh/Dimension/3BHK(L)-c.jpg?updatedAt=1779450444040'
  const VP_W = 1009
  const VP_H = 567

  const zones = [
    { room: 'living',        label: 'LIVING',        points: '372,218 600,218 600,365 372,365' },
    { room: 'masterbedroom', label: 'MASTER BEDROOM',points: '325,368 556,368 556,515 325,515' },
    { room: 'kidsbedroom',   label: 'KIDS BEDROOM',  points: '325,68 528,68 528,214 325,214'   },
    { room: 'kitchen',       label: 'KITCHEN',       points: '602,218 715,218 715,417 602,417' },
    { room: 'guestbedroom',  label: 'GUEST BEDROOM', points: '532,68 715,68 715,214 532,214'   },
    { room: 'lobby',         label: 'LOBBY',         points: '560,420 715,420 715,515 560,515' },
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
    img.style.cssText = `
      position: absolute;
      left: 50%; top: 50%;
      transform: translate(-50%, -50%);
      width: 96%; max-height: 92%;
      object-fit: contain; height: auto;
      display: block;
      opacity: 0; transition: opacity 0.25s ease;
      user-select: none; -webkit-user-drag: none;
    `

    const spinner = document.createElement('div')
    spinner.id = 'fp-spinner'
    spinner.style.cssText = `
      position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
      width: 34px; height: 34px;
      border: 2.5px solid rgba(122,62,30,.20); border-top-color: rgba(122,62,30,.85);
      border-radius: 50%; animation: fpSpin 0.75s linear infinite;
    `
    const spinKeyframes = document.createElement('style')
    spinKeyframes.textContent = '@keyframes fpSpin { to { transform: translate(-50%, -50%) rotate(360deg); } }'
    document.head.appendChild(spinKeyframes)

    const errorMsg = document.createElement('div')
    errorMsg.id = 'fp-error'
    errorMsg.textContent = 'Floor plan image failed to load. Retrying…'
    errorMsg.style.cssText = `
      position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
      display: none; font-family: inherit; font-size: 12px; letter-spacing: 1px;
      text-transform: uppercase; color: rgba(122,62,30,.75); text-align: center;
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
    layer.appendChild(spinner)
    layer.appendChild(errorMsg)
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

    function showImage() {
      spinner.style.display = 'none'
      errorMsg.style.display = 'none'
      img.style.opacity = '1'
      syncSVG()
      buildZones()
    }

    let retryCount = 0
    const MAX_RETRIES = 3

    function loadImage() {
      spinner.style.display = ''
      errorMsg.style.display = 'none'
      img.style.opacity = '0'

      img.onload = showImage

      img.onerror = () => {
        retryCount++
        if (retryCount <= MAX_RETRIES) {
          console.warn(`Floor plan image failed to load (attempt ${retryCount}/${MAX_RETRIES}), retrying…`)
          setTimeout(() => {
            img.src = FP_IMAGE_URL + (FP_IMAGE_URL.includes('?') ? '&' : '?') + 'retry=' + retryCount
          }, 800 * retryCount)
        } else {
          spinner.style.display = 'none'
          errorMsg.textContent = 'Floor plan image could not be loaded.'
          errorMsg.style.display = ''
          console.error('Floor plan image failed after', MAX_RETRIES, 'retries:', FP_IMAGE_URL)
        }
      }

      img.src = FP_IMAGE_URL
    }

    loadImage()

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
    if (typeof gtag === 'function') {
      const zone = zones.find(z => z.room === roomKey);
      gtag('event', 'floorplan_zone_click', {
        unit_number: window.UNIT_NUMBER || null,
        room: roomKey,
        room_label: zone ? zone.label : null
      });
    }
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