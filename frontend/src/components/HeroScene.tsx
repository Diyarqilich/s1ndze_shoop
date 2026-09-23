import { useEffect, useRef } from 'react'

/**
 * Replaces the old 2x2 real-photo grid with a single generated, animated
 * "hologram" sneaker (an original stylized high-top silhouette — no brand
 * marks) plus a small bear mascot that playfully dodges the cursor and
 * flushes red while it's fleeing. Everything here is decorative — the
 * hero's real content (heading, subtitle, CTAs) lives in the text column
 * next to this — so the whole scene is aria-hidden.
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
    const sneaker = { x: 0, y: 0 }
    const bearHome = { xFrac: 0.78, yFrac: 0.7 }

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

      // Subtle parallax: the sneaker drifts slightly away from the cursor,
      // giving the scene a sense of depth.
      let snkTX = 0
      let snkTY = 0
      if (mouse) {
        const nx = (mouse.x - cx) / cx
        const ny = (mouse.y - cy) / cy
        snkTX = nx * -12
        snkTY = ny * -9
      }
      sneaker.x += (snkTX - sneaker.x) * 0.08
      sneaker.y += (snkTY - sneaker.y) * 0.08
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
        ref={sneakerRef}
        className="anim-float absolute left-1/2 top-1/2 w-[78%] max-w-[340px] -translate-x-1/2 -translate-y-1/2"
        style={{ '--float-duration': '5.5s', '--float-rot': '-2deg' } as React.CSSProperties}
      >
        <svg viewBox="0 0 320 190" className="hologram-piece w-full">
          <defs>
            <linearGradient id="heroSnkBody" x1="40" y1="20" x2="200" y2="110" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ff4b4b" />
              <stop offset="60%" stopColor="#d4102a" />
              <stop offset="100%" stopColor="#9c0e22" />
            </linearGradient>
            <linearGradient id="heroSnkCap" x1="180" y1="60" x2="260" y2="130" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#fafafa" />
              <stop offset="100%" stopColor="#d6d6d6" />
            </linearGradient>
          </defs>

          {/* outsole */}
          <path
            d="M38,146 Q34,136 50,133 L250,124 Q272,126 277,140 Q280,153 262,158 L64,164 Q36,161 38,146 Z"
            fill="#f0f0f0"
          />
          <g stroke="#00000022" strokeWidth="2.5" strokeLinecap="round">
            <line x1="78" y1="151" x2="78" y2="160" />
            <line x1="116" y1="147" x2="116" y2="157" />
            <line x1="154" y1="143" x2="154" y2="154" />
            <line x1="192" y1="139" x2="192" y2="150" />
            <line x1="228" y1="134" x2="228" y2="146" />
          </g>
          <path d="M44,134 L246,126 Q266,128 270,138 L267,144 L58,150 Q40,147 44,134 Z" fill="#ffffff" />

          {/* main body: heel + collar + tongue + vamp */}
          <path
            d="M50,128 C40,106 38,78 45,57 C50,41 60,29 76,25 C88,22 98,27 98,37 C98,45 92,49 88,55
               C100,65 118,63 128,53 C124,43 128,31 140,27 C150,24 158,29 158,39 C158,49 150,55 148,63
               C168,59 186,61 200,68 C196,84 196,104 204,122 C170,127 120,129 60,131 C55,131 51,131 50,128 Z"
            fill="url(#heroSnkBody)"
          />
          <path d="M200,68 C196,84 196,104 204,122" stroke="#7c0c1c" strokeWidth="2" fill="none" strokeOpacity="0.6" />

          {/* toe cap */}
          <path
            d="M200,68 C224,78 244,94 254,112 C259,121 258,127 249,130 L204,122 C196,104 196,84 200,68 Z"
            fill="url(#heroSnkCap)"
          />
          <path d="M212,78 Q234,90 246,108" stroke="#00000015" strokeWidth="1.5" fill="none" />

          {/* heel shading */}
          <path
            d="M50,128 C40,106 38,78 45,57 C50,41 60,29 76,25 L82,33 Q64,43 58,63 Q52,90 60,120 Z"
            fill="#000000"
            fillOpacity="0.18"
          />

          {/* ankle collar */}
          <path d="M76,25 C86,21 96,24 97,34 C98,43 93,48 88,53 C79,49 71,41 67,31 Q70,27 76,25 Z" fill="#181818" />
          <path d="M78,27 Q86,24 92,31" stroke="#ff6b6b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          <ellipse cx="64" cy="36" rx="8" ry="9" fill="#181818" stroke="#ff6b6b" strokeWidth="1.5" transform="rotate(-30 64 36)" />

          {/* tongue */}
          <path
            d="M124,50 C118,41 120,29 133,24 C144,20 154,26 154,37 C154,47 146,53 144,60 L129,57 C126,55 125,52 124,50 Z"
            fill="#141414"
            stroke="#ff4b4b"
            strokeWidth="2"
          />

          {/* laces */}
          <g stroke="#f5f5f5" strokeWidth="3.5" strokeLinecap="round">
            <line x1="94" y1="57" x2="140" y2="41" />
            <line x1="90" y1="69" x2="136" y2="53" />
            <line x1="98" y1="81" x2="140" y2="65" />
          </g>
          <g fill="#0d0d0d">
            <circle cx="94" cy="57" r="2.4" />
            <circle cx="140" cy="41" r="2.4" />
            <circle cx="90" cy="69" r="2.4" />
            <circle cx="136" cy="53" r="2.4" />
            <circle cx="98" cy="81" r="2.4" />
            <circle cx="140" cy="65" r="2.4" />
          </g>
        </svg>
      </div>

      <div ref={bearRef} className="hero-bear absolute left-[68%] top-[68%] w-[15%] max-w-[64px]">
        <svg viewBox="0 0 100 100" fill="none" className="hero-bear-svg w-full drop-shadow-[0_0_10px_rgba(233,30,140,0.5)]">
          <circle cx="25" cy="25" r="15" fill="#0d0d0d" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="75" cy="25" r="15" fill="#0d0d0d" stroke="currentColor" strokeWidth="2.5" />
          <circle cx="25" cy="25" r="7" fill="currentColor" fillOpacity="0.5" />
          <circle cx="75" cy="25" r="7" fill="currentColor" fillOpacity="0.5" />
          <circle cx="50" cy="55" r="34" fill="#0d0d0d" stroke="currentColor" strokeWidth="2.5" />
          <ellipse cx="50" cy="66" rx="15" ry="11" fill="currentColor" fillOpacity="0.35" stroke="currentColor" strokeWidth="2" />
          <circle cx="50" cy="61" r="3" fill="currentColor" />
          <g className="hero-bear-eyes-calm">
            <circle cx="38" cy="50" r="3.5" fill="currentColor" />
            <circle cx="62" cy="50" r="3.5" fill="currentColor" />
          </g>
          <g className="hero-bear-eyes-alert">
            <path d="M34,50 Q38,46 42,50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M58,50 Q62,46 66,50" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" fill="none" />
          </g>
        </svg>
      </div>
    </div>
  )
}
