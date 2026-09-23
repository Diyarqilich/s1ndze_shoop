import { useEffect, useRef } from 'react'

/**
 * Replaces the old 2x2 real-photo grid with a single generated, animated
 * "hologram" composition (t-shirt + sneaker line art) plus a small bear
 * mascot that playfully dodges the cursor. Everything here is decorative —
 * the hero's real content (heading, subtitle, CTAs) lives in the text
 * column next to this — so the whole scene is aria-hidden.
 *
 * Perf/accessibility, per how this is meant to behave:
 * - One requestAnimationFrame loop drives all motion via direct
 *   `style.transform` writes (refs), never React state — so mouse-move
 *   never triggers a re-render.
 * - Disabled on touch devices (no fine pointer) and when the user has
 *   prefers-reduced-motion on; the CSS-only float/hologram-glow still
 *   apply in both of those cases (reduced-motion trims those too, in
 *   index.css), so the scene never just goes static-and-broken.
 */
export function HeroScene() {
  const containerRef = useRef<HTMLDivElement>(null)
  const teeRef = useRef<HTMLDivElement>(null)
  const sneakerRef = useRef<HTMLDivElement>(null)
  const bearRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const finePointer = window.matchMedia('(pointer: fine)').matches
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!finePointer || reducedMotion) return

    let raf = 0
    let mouse: { x: number; y: number } | null = null
    const bear = { x: 0, y: 0 }
    const tee = { x: 0, y: 0 }
    const sneaker = { x: 0, y: 0 }
    const bearHome = { xFrac: 0.7, yFrac: 0.72 }

    const onMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      mouse = { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }
    const onLeave = () => {
      mouse = null
    }
    container.addEventListener('mousemove', onMove, { passive: true })
    container.addEventListener('mouseleave', onLeave, { passive: true })

    const tick = () => {
      const rect = container.getBoundingClientRect()
      const cx = rect.width / 2
      const cy = rect.height / 2

      // Subtle parallax: tee drifts slightly toward the cursor, sneaker
      // drifts the opposite way — gives the scene a sense of depth.
      let teeTX = 0
      let teeTY = 0
      let snkTX = 0
      let snkTY = 0
      if (mouse) {
        const nx = (mouse.x - cx) / cx
        const ny = (mouse.y - cy) / cy
        teeTX = nx * 10
        teeTY = ny * 8
        snkTX = nx * -14
        snkTY = ny * -10
      }
      tee.x += (teeTX - tee.x) * 0.08
      tee.y += (teeTY - tee.y) * 0.08
      sneaker.x += (snkTX - sneaker.x) * 0.08
      sneaker.y += (snkTY - sneaker.y) * 0.08
      if (teeRef.current) teeRef.current.style.transform = `translate(${tee.x.toFixed(2)}px, ${tee.y.toFixed(2)}px)`
      if (sneakerRef.current) sneakerRef.current.style.transform = `translate(${sneaker.x.toFixed(2)}px, ${sneaker.y.toFixed(2)}px)`

      // Bear flees the cursor when it gets close, eases back to its resting
      // spot otherwise.
      const bearHomeX = rect.width * bearHome.xFrac
      const bearHomeY = rect.height * bearHome.yFrac
      let targetX = bear.x * 0.9
      let targetY = bear.y * 0.9
      let fleeing = false
      if (mouse) {
        const bx = bearHomeX + bear.x
        const by = bearHomeY + bear.y
        const dx = bx - mouse.x
        const dy = by - mouse.y
        const dist = Math.hypot(dx, dy)
        const THRESHOLD = 140
        if (dist < THRESHOLD) {
          fleeing = true
          const strength = (THRESHOLD - dist) / THRESHOLD
          const nx2 = dist > 0.01 ? dx / dist : 1
          const ny2 = dist > 0.01 ? dy / dist : 0
          targetX = bear.x + nx2 * strength * 22
          targetY = bear.y + ny2 * strength * 22
          const mag = Math.hypot(targetX, targetY)
          const maxR = 65
          if (mag > maxR) {
            targetX = (targetX / mag) * maxR
            targetY = (targetY / mag) * maxR
          }
        }
      }
      bear.x += (targetX - bear.x) * 0.18
      bear.y += (targetY - bear.y) * 0.18
      if (bearRef.current) {
        bearRef.current.style.transform = `translate(${bear.x.toFixed(2)}px, ${bear.y.toFixed(2)}px) rotate(${(bear.x * 0.15).toFixed(2)}deg)`
        bearRef.current.classList.toggle('is-fleeing', fleeing)
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    return () => {
      cancelAnimationFrame(raf)
      container.removeEventListener('mousemove', onMove)
      container.removeEventListener('mouseleave', onLeave)
    }
  }, [])

  return (
    <div ref={containerRef} aria-hidden="true" className="relative h-full min-h-[320px] w-full select-none">
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <span className="font-display text-[22vw] font-extrabold leading-none tracking-tighter text-white/[0.07] sm:text-[9rem]">
          S1NDZE
        </span>
      </div>

      <div className="hologram-scanline" />

      <div
        ref={teeRef}
        className="anim-float absolute left-[6%] top-[8%] w-[46%] max-w-[190px]"
        style={{ '--float-duration': '5s', '--float-rot': '-3deg' } as React.CSSProperties}
      >
        <svg viewBox="0 0 200 200" fill="none" className="hologram-piece w-full">
          <defs>
            <linearGradient id="heroTeeGrad" x1="0" y1="0" x2="200" y2="200" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ff4fac" />
              <stop offset="35%" stopColor="#7c5cff" />
              <stop offset="65%" stopColor="#4fd8ff" />
              <stop offset="100%" stopColor="#ff4fac" />
            </linearGradient>
          </defs>
          <path
            d="M70,40 L38,58 L55,92 L70,76 L70,172 L130,172 L130,76 L145,92 L162,58 L130,40 Q124,56 100,56 Q76,56 70,40 Z"
            fill="url(#heroTeeGrad)"
            fillOpacity="0.22"
            stroke="url(#heroTeeGrad)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      <div
        ref={sneakerRef}
        className="anim-float absolute bottom-[10%] right-[2%] w-[58%] max-w-[260px]"
        style={{ '--float-duration': '6s', '--float-rot': '2deg' } as React.CSSProperties}
      >
        <svg viewBox="0 0 240 140" fill="none" className="hologram-piece w-full">
          <defs>
            <linearGradient id="heroSnkGrad" x1="0" y1="0" x2="240" y2="140" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#4fd8ff" />
              <stop offset="50%" stopColor="#ff4fac" />
              <stop offset="100%" stopColor="#7c5cff" />
            </linearGradient>
          </defs>
          <path
            d="M14,92 Q10,82 20,76 Q34,64 58,58 L96,48 Q128,39 160,42 Q188,45 203,58 Q214,67 214,78 L212,90 Q222,96 220,106 Q217,115 203,116 L34,118 Q14,117 14,92 Z"
            fill="url(#heroSnkGrad)"
            fillOpacity="0.2"
            stroke="url(#heroSnkGrad)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="M188,46 Q206,44 212,56 Q216,64 210,70 L200,60 Q194,52 188,46 Z"
            fill="url(#heroSnkGrad)"
            fillOpacity="0.3"
            stroke="url(#heroSnkGrad)"
            strokeWidth="2"
          />
          <path
            d="M12,100 L218,104 Q226,112 216,122 Q206,130 186,130 L40,130 Q14,129 10,114 Q9,106 12,100 Z"
            fill="url(#heroSnkGrad)"
            fillOpacity="0.4"
            stroke="url(#heroSnkGrad)"
            strokeWidth="2.5"
          />
          <line x1="86" y1="70" x2="150" y2="54" stroke="url(#heroSnkGrad)" strokeWidth="2" strokeOpacity="0.7" strokeLinecap="round" />
          <line x1="92" y1="82" x2="154" y2="66" stroke="url(#heroSnkGrad)" strokeWidth="2" strokeOpacity="0.7" strokeLinecap="round" />
          <line x1="98" y1="94" x2="158" y2="78" stroke="url(#heroSnkGrad)" strokeWidth="2" strokeOpacity="0.7" strokeLinecap="round" />
          <line x1="40" y1="113" x2="40" y2="124" stroke="url(#heroSnkGrad)" strokeWidth="1.5" strokeOpacity="0.5" />
          <line x1="80" y1="115" x2="80" y2="127" stroke="url(#heroSnkGrad)" strokeWidth="1.5" strokeOpacity="0.5" />
          <line x1="120" y1="116" x2="120" y2="128" stroke="url(#heroSnkGrad)" strokeWidth="1.5" strokeOpacity="0.5" />
          <line x1="160" y1="117" x2="160" y2="129" stroke="url(#heroSnkGrad)" strokeWidth="1.5" strokeOpacity="0.5" />
        </svg>
      </div>

      <div ref={bearRef} className="hero-bear absolute left-[68%] top-[68%] w-[15%] max-w-[64px]">
        <svg viewBox="0 0 100 100" fill="none" className="hero-bear-svg w-full drop-shadow-[0_0_10px_rgba(233,30,140,0.5)]">
          <circle cx="25" cy="25" r="15" fill="#0d0d0d" stroke="#E91E8C" strokeWidth="2.5" />
          <circle cx="75" cy="25" r="15" fill="#0d0d0d" stroke="#E91E8C" strokeWidth="2.5" />
          <circle cx="25" cy="25" r="7" fill="#E91E8C" fillOpacity="0.5" />
          <circle cx="75" cy="25" r="7" fill="#E91E8C" fillOpacity="0.5" />
          <circle cx="50" cy="55" r="34" fill="#0d0d0d" stroke="#E91E8C" strokeWidth="2.5" />
          <ellipse cx="50" cy="66" rx="15" ry="11" fill="#E91E8C" fillOpacity="0.35" stroke="#E91E8C" strokeWidth="2" />
          <circle cx="50" cy="61" r="3" fill="#E91E8C" />
          <g className="hero-bear-eyes-calm">
            <circle cx="38" cy="50" r="3.5" fill="#E91E8C" />
            <circle cx="62" cy="50" r="3.5" fill="#E91E8C" />
          </g>
          <g className="hero-bear-eyes-alert">
            <path d="M34,50 Q38,46 42,50" stroke="#E91E8C" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M58,50 Q62,46 66,50" stroke="#E91E8C" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </g>
        </svg>
      </div>
    </div>
  )
}
