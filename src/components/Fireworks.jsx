import { useEffect, useRef } from 'react'

// ── Configuration ─────────────────────────────────────────────────────────────
const CFG = {
  maxRockets: 3,
  burstCount: 2,            // rockets per burst
  burstSpacing: 400,        // ms between rockets in a burst
  gapMin: 25000,            // min gap between bursts (ms)
  gapMax: 25000,            // max gap between bursts (ms)
  particleDensity: 2.0,
  maxDpr: 2,
}

// ── Color palette ─────────────────────────────────────────────────────────────
const PALETTES = [
  ['#FFD700', '#FFA500', '#FF8C00', '#FFEC8B'],        // Gold
  ['#FF4500', '#FF6347', '#FF0000', '#FF7F50'],         // Red/Orange
  ['#00BFFF', '#1E90FF', '#87CEFA', '#00CED1'],         // Blue
  ['#00FF7F', '#32CD32', '#7FFF00', '#ADFF2F'],         // Green
  ['#FF69B4', '#FF1493', '#FF00FF', '#DA70D6'],         // Pink/Magenta
  ['#EE82EE', '#9400D3', '#8A2BE2', '#DA70D6'],         // Violet
  ['#FFFFFF', '#FFD700', '#FFF8DC', '#FFFACD'],         // White/Gold
  ['#FF4500', '#FFD700', '#FF69B4', '#00BFFF', '#7FFF00'], // Multicolor
]

function randPalette() { return PALETTES[Math.floor(Math.random() * PALETTES.length)] }
function rand(a, b) { return a + Math.random() * (b - a) }
function randInt(a, b) { return Math.floor(rand(a, b + 1)) }
function choice(arr) { return arr[Math.floor(Math.random() * arr.length)] }

// ── Explosion types ───────────────────────────────────────────────────────────
const EXPLOSION_TYPES = ['chrysanthemum', 'peony', 'willow', 'palm', 'starburst', 'double']

// ── Particle factory ──────────────────────────────────────────────────────────
function createParticle(x, y, color, vx, vy, opts = {}) {
  return {
    x, y, vx, vy, color,
    alpha: opts.alpha ?? 1,
    size: opts.size ?? rand(1.5, 3.5),
    gravity: opts.gravity ?? 0.04,
    drag: opts.drag ?? 0.97,
    life: 0,
    maxLife: opts.maxLife ?? rand(60, 120),
    trail: opts.trail ?? true,
    trailPts: [],
    glow: opts.glow ?? true,
    twinkle: opts.twinkle ?? (Math.random() < 0.3),
  }
}

function explode(x, y, type, palette, particles) {
  const density = CFG.particleDensity
  switch (type) {
    case 'chrysanthemum': {
      const count = Math.floor(rand(260, 380) * density)
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2 + rand(-0.05, 0.05)
        const speed = rand(5, 12)
        const color = choice(palette)
        particles.push(createParticle(x, y, color,
          Math.cos(angle) * speed, Math.sin(angle) * speed,
          { maxLife: rand(100, 170), gravity: 0.035, drag: 0.96, size: rand(2, 4.5), glow: true }
        ))
      }
      break
    }
    case 'peony': {
      const count = Math.floor(rand(200, 300) * density)
      for (let i = 0; i < count; i++) {
        const angle = rand(0, Math.PI * 2)
        const speed = rand(3.5, 10)
        particles.push(createParticle(x, y, choice(palette),
          Math.cos(angle) * speed, Math.sin(angle) * speed,
          { maxLife: rand(90, 140), gravity: 0.045, drag: 0.965, size: rand(2.5, 5.5) }
        ))
      }
      break
    }
    case 'willow': {
      const count = Math.floor(rand(140, 220) * density)
      for (let i = 0; i < count; i++) {
        const angle = rand(-Math.PI, 0)
        const speed = rand(3, 8)
        particles.push(createParticle(x, y, choice(['#FFD700', '#FFA500', '#FFEC8B', '#FFFACD']),
          Math.cos(angle) * speed, Math.sin(angle) * speed * 0.5,
          { maxLife: rand(120, 190), gravity: 0.055, drag: 0.985, size: rand(1.5, 3.5), trail: true }
        ))
      }
      break
    }
    case 'ring': {
      const count = Math.floor(rand(130, 200) * density)
      const speed = rand(6, 11)
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2
        particles.push(createParticle(x, y, choice(palette),
          Math.cos(angle) * speed, Math.sin(angle) * speed,
          { maxLife: rand(80, 120), gravity: 0.015, drag: 0.99, size: rand(2.5, 4.5) }
        ))
      }
      break
    }
    case 'palm': {
      const count = Math.floor(rand(100, 160) * density)
      for (let i = 0; i < count; i++) {
        const angle = rand(-Math.PI * 0.7, -Math.PI * 0.3)
        const speed = rand(6, 13)
        particles.push(createParticle(x, y, choice(['#FFD700', '#FFA500', '#FF8C00']),
          Math.cos(angle) * speed, Math.sin(angle) * speed,
          { maxLife: rand(110, 180), gravity: 0.06, drag: 0.98, size: rand(2.5, 5), trail: true }
        ))
      }
      break
    }
    case 'starburst': {
      const arms = randInt(8, 14)
      const perArm = Math.floor(rand(14, 24) * density)
      for (let a = 0; a < arms; a++) {
        const baseAngle = (a / arms) * Math.PI * 2
        for (let j = 0; j < perArm; j++) {
          const angle = baseAngle + rand(-0.12, 0.12)
          const speed = rand(4, 11)
          particles.push(createParticle(x, y, choice(palette),
            Math.cos(angle) * speed, Math.sin(angle) * speed,
            { maxLife: rand(80, 130), gravity: 0.04, drag: 0.97, size: rand(2, 4.5) }
          ))
        }
      }
      break
    }
    case 'double': {
      // First burst
      explode(x, y, 'chrysanthemum', palette, particles)
      // Delayed secondary (stored as pending)
      return { secondary: true, x, y, delay: rand(200, 400), palette }
    }
    default:
      explode(x, y, 'peony', palette, particles)
  }
  return null
}

// ── Rocket factory ────────────────────────────────────────────────────────────
function createRocket(canvasW, canvasH) {
  const x = rand(canvasW * 0.1, canvasW * 0.9)
  // Keep targetX close to launch x — slight drift only (±10% of canvas width)
  const drift = rand(-canvasW * 0.10, canvasW * 0.10)
  const targetX = Math.max(canvasW * 0.05, Math.min(canvasW * 0.95, x + drift))
  const targetY = rand(canvasH * 0.08, canvasH * 0.78)
  const dx = targetX - x
  const dy = targetY - canvasH
  const dist = Math.sqrt(dx * dx + dy * dy)
  const speed = rand(9, 16)
  const type = choice(EXPLOSION_TYPES)
  const palette = randPalette()
  return {
    x, y: canvasH,
    targetX, targetY,
    vx: (dx / dist) * speed,
    vy: (dy / dist) * speed,
    trail: [],
    trailLen: randInt(14, 28),
    color: choice(palette),
    palette,
    type,
    exploded: false,
    size: rand(2.5, 4),
  }
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Fireworks() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    const dpr = Math.min(window.devicePixelRatio || 1, CFG.maxDpr)
    let W = 0, H = 0

    function resize() {
      W = window.innerWidth
      H = window.innerHeight
      canvas.width = W * dpr
      canvas.height = H * dpr
      canvas.style.width = W + 'px'
      canvas.style.height = H + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    window.addEventListener('resize', resize)

    let rockets = []
    let particles = []
    let pendingSecondary = []
    let rafId = null
    let lastTime = 0
    let launchTimer = 0
    let burstFired = 0         // rockets fired in current burst
    let inBurst = true         // currently firing a burst?
    let nextEventIn = 0        // ms until next rocket (burst) or next burst (gap)

    // Reduced motion
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) return

    function launchRocket() {
      if (rockets.length < CFG.maxRockets) {
        rockets.push(createRocket(W, H))
      }
    }

    function drawGlow(x, y, r, color, alpha) {
      const g = ctx.createRadialGradient(x, y, 0, x, y, r)
      g.addColorStop(0, color.replace(')', `,${alpha})`).replace('rgb', 'rgba').replace('#', 'rgba(').replace(/rgba\(([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})/, (_, r, g, b) =>
        `rgba(${parseInt(r, 16)},${parseInt(g, 16)},${parseInt(b, 16)}`))
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, r, 0, Math.PI * 2)
      ctx.fill()
    }

    function hexToRgb(hex) {
      const r = parseInt(hex.slice(1, 3), 16)
      const g = parseInt(hex.slice(3, 5), 16)
      const b = parseInt(hex.slice(5, 7), 16)
      return { r, g, b }
    }

    function colorWithAlpha(color, alpha) {
      if (color.startsWith('#')) {
        const { r, g, b } = hexToRgb(color)
        return `rgba(${r},${g},${b},${alpha})`
      }
      return color
    }

    function animate(ts) {
      rafId = requestAnimationFrame(animate)
      const dt = Math.min(ts - lastTime, 50)
      lastTime = ts

      // Burst → gap → burst pattern
      launchTimer += dt
      if (launchTimer >= nextEventIn) {
        launchTimer = 0
        if (inBurst) {
          launchRocket()
          burstFired++
          if (burstFired >= CFG.burstCount) {
            // Burst done — enter gap
            inBurst = false
            burstFired = 0
            nextEventIn = rand(CFG.gapMin, CFG.gapMax)
          } else {
            nextEventIn = CFG.burstSpacing
          }
        } else {
          // Gap done — start new burst
          inBurst = true
          nextEventIn = CFG.burstSpacing
          launchRocket()
          burstFired = 1
        }
      }

      // Pending secondary explosions
      pendingSecondary = pendingSecondary.filter(s => {
        s.delay -= dt
        if (s.delay <= 0) {
          explode(s.x, s.y, 'peony', s.palette, particles)
          return false
        }
        return true
      })

      // ── Clear fully transparent each frame ─────────────────────────────────
      ctx.globalCompositeOperation = 'source-over'
      ctx.clearRect(0, 0, W, H)

      ctx.globalCompositeOperation = 'screen'

      // ── Draw rockets ────────────────────────────────────────────────────────
      rockets = rockets.filter(r => {
        if (r.exploded) return false

        // Move
        r.x += r.vx
        r.y += r.vy
        r.vy += 0.04 // slight gravity on ascent

        // Trail
        r.trail.unshift({ x: r.x, y: r.y })
        if (r.trail.length > r.trailLen) r.trail.length = r.trailLen

        // Force-explode if rocket escapes viewport
        if (r.x < -20 || r.x > W + 20 || r.y < -40) {
          r.exploded = true
          return false
        }

        // Check arrival
        const dx = r.targetX - r.x
        const dy = r.targetY - r.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 8 || r.y <= r.targetY) {
          // Explode
          const result = explode(r.x, r.y, r.type, r.palette, particles)
          if (result?.secondary) pendingSecondary.push(result)
          r.exploded = true
          return false
        }

        // Draw trail
        for (let i = 0; i < r.trail.length; i++) {
          const p = r.trail[i]
          const a = (1 - i / r.trail.length) * 0.9
          const s = r.size * (1 - i / r.trail.length)
          ctx.globalAlpha = a
          ctx.fillStyle = i < 3 ? '#FFFFFF' : r.color
          ctx.beginPath()
          ctx.arc(p.x, p.y, Math.max(0.5, s), 0, Math.PI * 2)
          ctx.fill()
        }

        // Glow head
        ctx.globalAlpha = 1
        const { r: cr, g: cg, b: cb } = hexToRgb(r.color.startsWith('#') ? r.color : '#FFD700')
        const grd = ctx.createRadialGradient(r.x, r.y, 0, r.x, r.y, r.size * 4)
        grd.addColorStop(0, `rgba(255,255,255,1)`)
        grd.addColorStop(0.3, `rgba(${cr},${cg},${cb},0.9)`)
        grd.addColorStop(1, `rgba(${cr},${cg},${cb},0)`)
        ctx.fillStyle = grd
        ctx.beginPath()
        ctx.arc(r.x, r.y, r.size * 4, 0, Math.PI * 2)
        ctx.fill()

        // Trailing sparks
        if (Math.random() < 0.4) {
          particles.push(createParticle(
            r.x + rand(-2, 2), r.y + rand(-2, 2),
            choice(['#FFD700', '#FFA500', '#FFFFFF']),
            rand(-0.5, 0.5), rand(0.5, 2),
            { maxLife: rand(15, 30), gravity: 0.1, drag: 0.9, size: rand(0.8, 1.8) }
          ))
        }

        return true
      })

      // ── Draw particles ──────────────────────────────────────────────────────
      particles = particles.filter(p => {
        p.life++
        if (p.life >= p.maxLife) return false

        const progress = p.life / p.maxLife
        p.vx *= p.drag
        p.vy *= p.drag
        p.vy += p.gravity
        p.x += p.vx
        p.y += p.vy

        const alpha = p.twinkle
          ? (1 - progress) * (0.5 + 0.5 * Math.sin(p.life * 0.5))
          : Math.pow(1 - progress, 1.4)

        if (alpha <= 0.01) return false

        // Trail
        if (p.trail) {
          p.trailPts.unshift({ x: p.x, y: p.y })
          if (p.trailPts.length > 12) p.trailPts.length = 12
          for (let i = 1; i < p.trailPts.length; i++) {
            const ta = alpha * (1 - i / p.trailPts.length) * 0.6
            ctx.globalAlpha = ta
            ctx.strokeStyle = colorWithAlpha(p.color, ta)
            ctx.lineWidth = p.size * (1 - i / p.trailPts.length)
            ctx.beginPath()
            ctx.moveTo(p.trailPts[i - 1].x, p.trailPts[i - 1].y)
            ctx.lineTo(p.trailPts[i].x, p.trailPts[i].y)
            ctx.stroke()
          }
        }

        // Glow halo
        if (p.glow && alpha > 0.15) {
          const glowR = p.size * 6
          const { r, g, b } = hexToRgb(p.color.startsWith('#') ? p.color : '#FFD700')
          const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowR)
          grd.addColorStop(0, `rgba(${r},${g},${b},${alpha * 0.6})`)
          grd.addColorStop(1, `rgba(${r},${g},${b},0)`)
          ctx.globalAlpha = 1
          ctx.fillStyle = grd
          ctx.beginPath()
          ctx.arc(p.x, p.y, glowR, 0, Math.PI * 2)
          ctx.fill()
        }

        // Core dot
        ctx.globalAlpha = alpha
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()

        // White sparkle center
        if (alpha > 0.5) {
          ctx.globalAlpha = alpha * 0.7
          ctx.fillStyle = '#FFFFFF'
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * 0.4, 0, Math.PI * 2)
          ctx.fill()
        }

        return true
      })

      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = 'source-over'

    }

    // Handle visibility
    function onVisibility() {
      if (!document.hidden) lastTime = performance.now()
    }
    document.addEventListener('visibilitychange', onVisibility)

    // Kick off first burst immediately
    launchRocket()
    burstFired = 1
    nextEventIn = CFG.burstSpacing

    lastTime = performance.now()
    rafId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100vw', height: '100vh',
        pointerEvents: 'none',
        zIndex: 9999,
      }}
    />
  )
}
