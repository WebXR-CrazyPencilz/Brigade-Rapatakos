function cloudThumb(url) {
  return url.replace('/upload/', '/upload/w_300,h_90,c_fill,q_auto,f_auto/')
}

// ─── ROOMS ─────────────────────────────────────────────────────
const rooms = {
  lobby:                 { image: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1779452949/Lobby_jghq0s.jpg',                     label: 'LOBBY', startYaw: 1.6 },
  lobbytobedroom:        { image: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1779452950/lobby_to_bedroom_roap7j.jpg',           label: 'LOBBY TO BEDROOM' },
  lobbytoliving:         { image: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1779452948/lobby_to_living_q2fovk.jpg',          label: 'LOBBY TO LIVING ' },
  livinganddining:       { image: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1779452940/living_and_dinning_ffksm6.jpg',         label: 'LIVING AND DINING' },
  dining:                { image: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1779452952/dinning_j4i7ee.jpg',                   label: 'DINING' },
  commontoilet:          { image: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1779452951/common_toilet_jcuw0j.jpg',                   label: 'COMMON TOILET' },
  kitchen:               { image: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1779452942/kitchen_eqqkax.jpg',                   label: 'KITCHEN' },
  utility:               { image: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1779452959/utility_kxt7al.jpg',                   label: 'UTILITY' },
  masterbedroomcorridor: { image: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1779452954/master_bedroom_corridor_asofvk.jpg',   label: 'MASTER BEDROOM CORRIDOR' },
  masterbedroom:         { image: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1779452948/master_bedroom_l6vlvj.jpg',            label: 'MASTER BEDROOM' },
  masterbedroomtoilet:   { image: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1779452955/master_bedroom_toilet_rjuw83.jpg',     label: 'MASTER BEDROOM TOILET' },
  kidsbedroom:           { image: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1779452940/kids_bedroom_j6s0us.jpg',             label: 'KIDS BEDROOM' },
  guestbedroomcorridor:  { image: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1779452934/guest_bedroom_corridor_itet77.jpg',  label: 'GUEST BEDROOM CORRIDOR' },
  guestbedroom:          { image: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1779452942/guest_bedroom_wjb5du.jpg',            label: 'GUEST BEDROOM' },
  guestbedroomtoilet:    { image: 'https://res.cloudinary.com/dp5ifzgge/image/upload/v1779452933/guest_bedroom_toilet_filqsa.jpg',     label: 'GUEST BEDROOM TOILET',  },
}

const thumbnails = Object.fromEntries(
  Object.entries(rooms).map(([key, val]) => [key, { image: cloudThumb(val.image) }])
)


// ─── HOTSPOTS ──────────────────────────────────────────────────
const hotspots = {

  // ── lobby ──────────────────────────────────────────────────
  lobby: [
    { target: 'lobbytobedroom',  position: [0.10,  -2.2,  0 ] },
    { target: 'lobbytoliving',  position: [0.1,  -2.2,  0 ] }
  ],
  // ── Living Room ────────────────────────────────────────────
  livinganddining: [
    { target: 'commontoilet',  position: [0.10,  -2.2,  0 ] },
    { target: 'lobbytoliving',  position: [0.1,  -2.2,  0 ] }
  ],

  lobbytobedroom: [
   { target: 'masterbedroom', position: [0.10,  -2.2,  0 ] }
  ],

  // ── Master Corridor ────────────────────────────────────────
  masterbedroomcorridor: [
 
  ],

  // ── Master Bedroom ─────────────────────────────────────────
  masterbedroom: [
    
  ],

  // ── Master Toilet ──────────────────────────────────────────
  masterbedroomtoilet: [

  ],

  // ── Kids Bedroom ───────────────────────────────────────────
  kidsbedroom: [

  ],

  guestbedroomcorridor: [
    
  ],

  // ── Guest Bedroom 1 ────────────────────────────────────────
  guestbedroom: [

  ],

  // ── Guest Toilet 1 ─────────────────────────────────────────
  guestbedroomtoilet: [

  ],

  // ── lobby ──────────────────────────────────────────────────
  lobby: [

  ],

  // ── lobby to Living 1 ──────────────────────────────────────
  lobbytoliving: [

    
  ],

  // ── lobby to Living 2 ──────────────────────────────────────
  lobbytobedroom: [

  ],

  // ── Living to Kitchen ──────────────────────────────────────
  livingtokitchen: [

  ],

  // ── Kitchen ────────────────────────────────────────────────
  kitchen: [

  ],

  // ── Utility ────────────────────────────────────────────────
  utility: [

  ],

}

// ─── SCENE ─────────────────────────────────────────────────────
const scene = new THREE.Scene()
scene.add(new THREE.AmbientLight(0xffffff, 1.2))

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
camera.position.set(0, 0, 0.1)

const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
document.body.appendChild(renderer.domElement)

// ─── SPHERE ────────────────────────────────────────────────────
const sGeo = new THREE.SphereGeometry(10, 64, 64)
sGeo.scale(-1, 1, 1)
const panoMaterial = new THREE.MeshBasicMaterial()
scene.add(new THREE.Mesh(sGeo, panoMaterial))

// ─── STATE ─────────────────────────────────────────────────────
let currentRoom   = 'foyer'
let hotspotMeshes = []
let labelSprites  = []
let camRX = 0, camRY = 0
let isTransitioning = false
const minFov = 30, maxFov = 90

// ─── TEXTURE CACHE ─────────────────────────────────────────────
const textureCache = {}
const loader = new THREE.TextureLoader()

function loadTexture(key, onDone) {
  if (textureCache[key]) { onDone && onDone(textureCache[key]); return }
  loader.load(
    rooms[key].image,
    (tex) => {
      tex.minFilter       = THREE.LinearFilter
      tex.magFilter       = THREE.LinearFilter
      tex.generateMipmaps = false
      if (typeof THREE.SRGBColorSpace !== 'undefined') tex.colorSpace = THREE.SRGBColorSpace
      textureCache[key] = tex
      onDone && onDone(tex)
    },
    undefined,
    (err) => { console.warn('Texture load failed:', rooms[key].image, err); onDone && onDone(null) }
  )
}

function preloadInitial() {
  const priority = ['lobby', 'livingtobedroom', 'livingtokitchen', 'foyertoliving2', 'masterbedroomcorridor', 'kidsbedroomcorridor']
  priority.forEach((k, i) => setTimeout(() => loadTexture(k), i * 150))
}

let preloadQueue = [], isPreloading = false

function preloadConnected(key) {
  const connected = (hotspots[key] || []).map(h => h.target)
  connected.forEach(k => {
    if (!textureCache[k] && !preloadQueue.includes(k)) preloadQueue.unshift(k)
  })
  processPreloadQueue()
}

function processPreloadQueue() {
  if (isPreloading || preloadQueue.length === 0) return
  isPreloading = true
  const nextKey = preloadQueue.shift()
  setTimeout(() => {
    if (!textureCache[nextKey]) {
      loadTexture(nextKey, () => { isPreloading = false; processPreloadQueue() })
    } else { isPreloading = false; processPreloadQueue() }
  }, 400)
}

// ─── LABEL SPRITE — auto-sizes pill to text length ─────────────
function makeLabelSprite(text) {
  const H         = 80
  const FONT_SIZE = 36
  const ICON_W    = 52
  const PAD_L     = 20
  const PAD_R     = 24

  // measure text width first
  const tmp = document.createElement('canvas').getContext('2d')
  tmp.font  = `500 ${FONT_SIZE}px Arial`
  const textW = tmp.measureText(text).width
  const W     = Math.ceil(ICON_W + textW + PAD_L + PAD_R)

  const canvas  = document.createElement('canvas')
  canvas.width  = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // pill background
  const pillR = H / 2
  ctx.clearRect(0, 0, W, H)
  ctx.beginPath()
  ctx.moveTo(pillR, 0)
  ctx.lineTo(W - pillR, 0)
  ctx.quadraticCurveTo(W, 0,   W, pillR)
  ctx.lineTo(W, H - pillR)
  ctx.quadraticCurveTo(W, H,   W - pillR, H)
  ctx.lineTo(pillR, H)
  ctx.quadraticCurveTo(0, H,   0, H - pillR)
  ctx.lineTo(0, pillR)
  ctx.quadraticCurveTo(0, 0,   pillR, 0)
  ctx.closePath()
  ctx.fillStyle = 'rgba(10, 8, 5, 0.82)'
  ctx.fill()

  // gold border
  ctx.strokeStyle = 'rgba(201, 162, 58, 0.9)'
  ctx.lineWidth   = 4
  ctx.stroke()

  // arrow icon
  ctx.fillStyle    = '#c9a23a'
  ctx.font         = `bold ${FONT_SIZE + 4}px Arial`
  ctx.textAlign    = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('↑', PAD_L, H / 2)

  // room name
  ctx.fillStyle    = '#f0ebe0'
  ctx.font         = `500 ${FONT_SIZE}px Arial`
  ctx.textAlign    = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, PAD_L + ICON_W, H / 2 + 1)

  const tex = new THREE.CanvasTexture(canvas)
  tex.minFilter       = THREE.LinearFilter
  tex.generateMipmaps = false

  const mat    = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false })
  const sprite = new THREE.Sprite(mat)

  const worldH = 0.55
  const worldW = worldH * (W / H)
  sprite.scale.set(worldW, worldH, 1)
  return sprite
}

// ─── FADE ──────────────────────────────────────────────────────
const fadeOverlay = document.getElementById('fade-overlay')

function fadeOut(cb) {
  if (fadeOverlay) {
    fadeOverlay.style.transition    = 'opacity 0.2s ease'
    fadeOverlay.style.opacity       = '1'
    fadeOverlay.style.pointerEvents = 'all'
    setTimeout(cb, 220)
  } else { cb() }
}

function fadeIn() {
  if (fadeOverlay) {
    fadeOverlay.style.transition    = 'opacity 0.25s ease'
    fadeOverlay.style.opacity       = '0'
    fadeOverlay.style.pointerEvents = 'none'
  }
}

// ─── LOAD ROOM ─────────────────────────────────────────────────
function loadRoom(key) {
  console.log('➡️ Loading room:', key)
  if (!rooms[key]) { console.error('❌ Invalid room key:', key); return }
  if (isTransitioning) return
  isTransitioning = true

  fadeOut(() => {
    currentRoom = key
    camRX = rooms[key].startPitch ?? 0
    camRY = rooms[key].startYaw  ?? 0

    const labelEl = document.getElementById('room-label')
    if (labelEl) labelEl.innerText = rooms[key].label

    document.querySelectorAll('.room-btn').forEach(b => b.classList.remove('active'))
    const activeBtn = document.getElementById('btn-' + key)
    if (activeBtn) {
      activeBtn.classList.add('active')
      activeBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }

    loadTexture(key, (tex) => {
      if (!tex) {
        console.error('🚫 Texture failed:', key)
        isTransitioning = false
        fadeIn()
        return
      }
      panoMaterial.map = tex
      panoMaterial.needsUpdate = true

      const loading = document.getElementById('loading')
      if (loading) {
        loading.style.transition = 'opacity 0.5s'
        loading.style.opacity    = '0'
        setTimeout(() => { if (loading.parentNode) loading.parentNode.removeChild(loading) }, 500)
      }

      createHotspots(key)
      preloadConnected(key)
      fadeIn()
      isTransitioning = false
    })
  })
}

// ─── CREATE HOTSPOTS + LABELS ──────────────────────────────────
function createHotspots(roomKey) {
  hotspotMeshes.forEach(h => scene.remove(h))
  labelSprites.forEach(s => scene.remove(s))
  hotspotMeshes = []
  labelSprites  = []

  const data = hotspots[roomKey]
  if (!data) return

  data.forEach(h => {
    const [hx, hy, hz] = h.position

    // Ring
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.25, 0.42, 32),
      new THREE.MeshBasicMaterial({ color: 0xc9a23a, side: THREE.DoubleSide, transparent: true, opacity: 0.92 })
    )
    ring.position.set(hx, hy, hz)
    ring.rotation.x      = -Math.PI / 2
    ring.userData.target = h.target
    scene.add(ring)
    hotspotMeshes.push(ring)

    // Dot
    const dot = new THREE.Mesh(
      new THREE.CircleGeometry(0.10, 24),
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide, transparent: true, opacity: 0.6 })
    )
    dot.position.set(hx, hy + 0.001, hz)
    dot.rotation.x      = -Math.PI / 2
    dot.userData.target = h.target
    scene.add(dot)
    hotspotMeshes.push(dot)

    // Label sprite
    const label  = rooms[h.target] ? rooms[h.target].label : h.target
    const sprite = makeLabelSprite(label)
    const baseY  = hy + 0.95
    sprite.position.set(hx, baseY, hz)
    sprite.userData.target = h.target
    sprite.userData.baseY  = baseY
    scene.add(sprite)
    labelSprites.push(sprite)
  })
}

// ─── RAYCASTER ─────────────────────────────────────────────────
const raycaster  = new THREE.Raycaster()
const mouse      = new THREE.Vector2()
let   mouseMoved = false

renderer.domElement.addEventListener('mousedown', () => { mouseMoved = false })
renderer.domElement.addEventListener('mousemove', () => { mouseMoved = true })
renderer.domElement.addEventListener('mouseup', (e) => {
  if (mouseMoved) return
  mouse.x =  (e.clientX / window.innerWidth)  * 2 - 1
  mouse.y = -(e.clientY / window.innerHeight) * 2 + 1
  raycaster.setFromCamera(mouse, camera)
  const hits = raycaster.intersectObjects([...hotspotMeshes, ...labelSprites])
  if (hits.length > 0) {
    const target = hits[0].object.userData.target
    if (target) { closePanel(); loadRoom(target) }
  }
})

// ─── PANEL ─────────────────────────────────────────────────────
function buildPanel() {
  const list   = document.getElementById('room-list')
  const footer = document.getElementById('panel-footer')
  if (!list) return

  const keys = Object.keys(rooms)
  if (footer) footer.textContent = `${keys.length} SPACES`

  keys.forEach((key, index) => {
    const btn      = document.createElement('div')
    btn.className  = 'room-btn' + (key === currentRoom ? ' active' : '')
    btn.id         = 'btn-' + key
    const thumbSrc = thumbnails[key]?.image || rooms[key].image

    btn.innerHTML = `
      <img class="thumb" src="${thumbSrc}" alt="${rooms[key].label}" loading="lazy" />
      <span class="room-num">${String(index + 1).padStart(2, '0')}</span>
      <div class="room-name">${rooms[key].label}</div>
    `
    btn.addEventListener('click', () => {
      if (key === currentRoom) return
      closePanel(); loadRoom(key)
    })
    list.appendChild(btn)
  })
}

const toggle = document.getElementById('toggle')
const panel  = document.getElementById('side-panel')
if (toggle) toggle.innerHTML = '❯'

function closePanel() {
  if (!panel || !toggle) return
  panel.classList.remove('open')
  toggle.classList.remove('open')
  toggle.innerHTML = '❯'
}

if (toggle) {
  toggle.addEventListener('click', (e) => {
    e.stopPropagation()
    const isOpen = panel.classList.toggle('open')
    toggle.classList.toggle('open', isOpen)
    toggle.innerHTML = isOpen ? '❮' : '❯'
  })
}

document.addEventListener('click', (e) => {
  if (!panel || !toggle) return
  if (!panel.contains(e.target) && e.target !== toggle) closePanel()
})

// ─── DRAG ──────────────────────────────────────────────────────
let isDown = false, px = 0, py = 0

renderer.domElement.addEventListener('mousedown', e => { isDown = true; px = e.clientX; py = e.clientY })
renderer.domElement.addEventListener('mouseup',    () => isDown = false)
renderer.domElement.addEventListener('mouseleave', () => isDown = false)
renderer.domElement.addEventListener('mousemove',  e => {
  if (!isDown) return
  camRY += (e.clientX - px) * 0.003
  camRX += (e.clientY - py) * 0.003
  camRX  = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camRX))
  px = e.clientX; py = e.clientY
})

// ─── TOUCH ─────────────────────────────────────────────────────
let ttx = 0, tty = 0, tMoved = false

renderer.domElement.addEventListener('touchstart', e => {
  ttx = e.touches[0].clientX; tty = e.touches[0].clientY; tMoved = false
})
renderer.domElement.addEventListener('touchmove', e => {
  e.preventDefault()
  tMoved = true
  camRY += (e.touches[0].clientX - ttx) * 0.003
  camRX += (e.touches[0].clientY - tty) * 0.003
  camRX  = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, camRX))
  ttx = e.touches[0].clientX; tty = e.touches[0].clientY
}, { passive: false })

renderer.domElement.addEventListener('touchend', e => {
  if (tMoved) return
  const touch = e.changedTouches[0]
  mouse.x =  (touch.clientX / window.innerWidth)  * 2 - 1
  mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1
  raycaster.setFromCamera(mouse, camera)
  const hits = raycaster.intersectObjects([...hotspotMeshes, ...labelSprites])
  if (hits.length > 0) {
    const target = hits[0].object.userData.target
    if (target) loadRoom(target)
  }
})

// ─── PINCH ZOOM ────────────────────────────────────────────────
let lastPinchDist = null
renderer.domElement.addEventListener('touchstart', e => {
  if (e.touches.length === 2) lastPinchDist = null
}, { passive: true })
renderer.domElement.addEventListener('touchmove', e => {
  if (e.touches.length !== 2) return
  const dx   = e.touches[0].clientX - e.touches[1].clientX
  const dy   = e.touches[0].clientY - e.touches[1].clientY
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (lastPinchDist !== null) {
    camera.fov = Math.max(minFov, Math.min(maxFov, camera.fov - (dist - lastPinchDist) * 0.1))
    camera.updateProjectionMatrix()
  }
  lastPinchDist = dist
}, { passive: true })

// ─── ZOOM ──────────────────────────────────────────────────────
renderer.domElement.addEventListener('wheel', (e) => {
  camera.fov = Math.max(minFov, Math.min(maxFov, camera.fov + e.deltaY * 0.05))
  camera.updateProjectionMatrix()
}, { passive: true })

// ─── RESIZE ────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

// ─── ANIMATE ───────────────────────────────────────────────────
let lastFrame = 0

function animate(ts) {
  requestAnimationFrame(animate)

  if (ts - lastFrame > 33) {
    lastFrame = ts
    const t = ts * 0.001

    hotspotMeshes.forEach(h => {
      if (h.geometry.type === 'RingGeometry') {
        const s = 1 + Math.sin(t * 2) * 0.07
        h.scale.set(s, s, s)
        h.material.opacity = 0.7 + Math.sin(t * 2) * 0.25
      }
    })

    labelSprites.forEach((s, i) => {
      const offset       = i * 0.8
      s.position.y       = s.userData.baseY + Math.sin(t * 1.8 + offset) * 0.04
      s.material.opacity = 0.82 + Math.sin(t * 1.4 + offset) * 0.15
    })
  }

  camera.rotation.order = 'YXZ'
  camera.rotation.y = -camRY
  camera.rotation.x = -camRX
  renderer.render(scene, camera)
}

// ─── INIT ──────────────────────────────────────────────────────
buildPanel()
preloadInitial()
loadRoom('lobby')
animate(0)