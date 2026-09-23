import { useEffect, useRef } from 'react'
import type { CSSProperties } from 'react'

/**
 * Animated fashion hero scene.
 *
 * Replaces the old sneaker + bear illustration with a stylized clothing
 * composition: hoodie, T-shirt, denim jacket, jeans and a floating tag.
 *
 * Motion is driven by one requestAnimationFrame loop and direct DOM writes,
 * so mouse movement does not trigger React re-renders. The scene respects
 * prefers-reduced-motion and disables pointer interaction on coarse pointers.
 */
export function HeroScene() {
  const containerRef = useRef<HTMLDivElement>(null)
  const hoodieRef = useRef<HTMLDivElement>(null)
  const shirtRef = useRef<HTMLDivElement>(null)
  const jacketRef = useRef<HTMLDivElement>(null)
  const jeansRef = useRef<HTMLDivElement>(null)
  const tagRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const finePointer = window.matchMedia('(pointer: fine)').matches
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!finePointer || reducedMotion) return

    let raf = 0
    let mouse: { x: number; y: number } | null = null

    const pieces = {
      hoodie: { x: 0, y: 0, rx: 0, ry: 0 },
      shirt: { x: 0, y: 0, rx: 0, ry: 0 },
      jacket: { x: 0, y: 0, rx: 0, ry: 0 },
      jeans: { x: 0, y: 0, rx: 0, ry: 0 },
      tag: { x: 0, y: 0, rx: 0, ry: 0 },
    }

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

      const nx = mouse ? (mouse.x - cx) / Math.max(cx, 1) : 0
      const ny = mouse ? (mouse.y - cy) / Math.max(cy, 1) : 0

      // Each layer has a different parallax strength to create depth.
      const targets = {
        hoodie: { x: nx * -14, y: ny * -10, rx: ny * 1.8, ry: nx * -2.2 },
        shirt: { x: nx * -8, y: ny * -6, rx: ny * 1.2, ry: nx * -1.5 },
        jacket: { x: nx * 11, y: ny * 8, rx: ny * -1.4, ry: nx * 2.0 },
        jeans: { x: nx * -7, y: ny * 5, rx: ny * 0.8, ry: nx * -1.1 },
        tag: { x: nx * 20, y: ny * 14, rx: ny * -3, ry: nx * 4 },
      }

      const ease = 0.075

      for (const [name, target] of Object.entries(targets)) {
        const piece = pieces[name as keyof typeof pieces]
        piece.x += (target.x - piece.x) * ease
        piece.y += (target.y - piece.y) * ease
        piece.rx += (target.rx - piece.rx) * ease
        piece.ry += (target.ry - piece.ry) * ease
      }

      const setTransform = (
        ref: React.RefObject<HTMLDivElement | null>,
        piece: { x: number; y: number; rx: number; ry: number },
        extraRotation = 0,
      ) => {
        if (!ref.current) return
        ref.current.style.transform =
          `translate(${piece.x.toFixed(2)}px, ${piece.y.toFixed(2)}px) ` +
          `rotateX(${piece.rx.toFixed(2)}deg) rotateY(${piece.ry.toFixed(2)}deg) ` +
          `rotate(${extraRotation}deg)`
      }

      setTransform(hoodieRef, pieces.hoodie)
      setTransform(shirtRef, pieces.shirt, -1.5)
      setTransform(jacketRef, pieces.jacket, 2)
      setTransform(jeansRef, pieces.jeans, -2)
      setTransform(tagRef, pieces.tag, 8)

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
    <div
      ref={containerRef}
      aria-hidden="true"
      className="relative h-full min-h-[320px] w-full select-none"
      style={{ perspective: '900px' }}
    >
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden">
        <span className="font-display text-[22vw] font-extrabold leading-none tracking-tighter text-white/[0.07] sm:text-[9rem]">
          S1NDZE
        </span>
      </div>

      <div className="hologram-scanline" />

      {/* Soft ambient glow behind the clothes. */}
      <div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[58%] w-[58%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-600/15 blur-3xl"
        style={{ animation: 'hero-fashion-glow 4.5s ease-in-out infinite' }}
      />

      {/* Denim jacket: rear layer. */}
      <div
        ref={jacketRef}
        className="anim-float absolute left-[19%] top-[17%] w-[55%] max-w-[245px]"
        style={{
          '--float-duration': '6.2s',
          '--float-rot': '1.5deg',
          transformStyle: 'preserve-3d',
          zIndex: 2,
        } as CSSProperties}
      >
        <svg viewBox="0 0 300 270" className="hologram-piece w-full drop-shadow-[0_24px_28px_rgba(0,0,0,0.35)]">
          <defs>
            <linearGradient id="heroDenim" x1="55" y1="20" x2="250" y2="250" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#56718f" />
              <stop offset="55%" stopColor="#294968" />
              <stop offset="100%" stopColor="#152b43" />
            </linearGradient>
            <linearGradient id="heroDenimLight" x1="80" y1="60" x2="220" y2="220" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#7f9ab5" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#3b5873" stopOpacity="0.15" />
            </linearGradient>
          </defs>

          <path
            d="M74 72 L111 42 L150 64 L189 42 L226 72 L249 206 Q218 231 150 237 Q82 231 51 206 Z"
            fill="url(#heroDenim)"
            stroke="#9db2c6"
            strokeOpacity="0.35"
            strokeWidth="3"
          />
          <path d="M111 42 L150 64 L189 42 L177 229 L150 237 L123 229 Z" fill="#203c58" fillOpacity="0.9" />
          <path d="M74 72 L103 97 L91 185 L51 206 Z" fill="url(#heroDenimLight)" />
          <path d="M226 72 L197 97 L209 185 L249 206 Z" fill="#0f2439" fillOpacity="0.3" />

          <path d="M111 42 L150 64 L189 42" fill="none" stroke="#b7c8d8" strokeWidth="3" strokeLinejoin="round" />
          <path d="M123 75 L150 92 L177 75" fill="none" stroke="#b7c8d8" strokeWidth="2" strokeOpacity="0.55" />
          <path d="M94 105 L122 115 L122 151 L94 143 Z" fill="#355673" stroke="#9db2c6" strokeOpacity="0.45" />
          <path d="M178 115 L206 105 L206 143 L178 151 Z" fill="#355673" stroke="#9db2c6" strokeOpacity="0.45" />

          <g fill="#d9e2ea">
            <circle cx="150" cy="100" r="4" />
            <circle cx="150" cy="126" r="4" />
            <circle cx="150" cy="152" r="4" />
            <circle cx="150" cy="178" r="4" />
          </g>
          <path d="M150 65 V230" stroke="#b9c9d7" strokeOpacity="0.3" strokeWidth="2" />
          <path d="M69 201 Q150 224 231 201" fill="none" stroke="#b9c9d7" strokeOpacity="0.18" strokeWidth="3" />
        </svg>
      </div>

      {/* T-shirt: floating behind the hoodie, slightly offset. */}
      <div
        ref={shirtRef}
        className="anim-float absolute left-[38%] top-[13%] w-[46%] max-w-[210px]"
        style={{
          '--float-duration': '5.7s',
          '--float-rot': '-1deg',
          transformStyle: 'preserve-3d',
          zIndex: 3,
        } as CSSProperties}
      >
        <svg viewBox="0 0 260 260" className="hologram-piece w-full drop-shadow-[0_22px_24px_rgba(0,0,0,0.32)]">
          <defs>
            <linearGradient id="heroShirt" x1="50" y1="30" x2="220" y2="235" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#f7f7f7" />
              <stop offset="55%" stopColor="#dedede" />
              <stop offset="100%" stopColor="#aaa" />
            </linearGradient>
          </defs>
          <path
            d="M86 48 L111 28 Q130 43 149 28 L174 48 L224 76 L201 116 L176 103 L180 226 Q130 244 80 226 L84 103 L59 116 L36 76 Z"
            fill="url(#heroShirt)"
            stroke="#fff"
            strokeOpacity="0.75"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="M111 29 Q130 52 149 29" fill="none" stroke="#a8a8a8" strokeWidth="4" />
          <path d="M83 103 L112 112 L112 223" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="3" />
          <path d="M177 103 L148 112 L148 223" fill="none" stroke="#777" strokeOpacity="0.22" strokeWidth="3" />
          <path d="M103 150 Q130 137 157 150" fill="none" stroke="#d41431" strokeWidth="5" strokeLinecap="round" />
          <path d="M110 166 Q130 156 150 166" fill="none" stroke="#d41431" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.65" />
        </svg>
      </div>

      {/* Hoodie: main focal point. */}
      <div
        ref={hoodieRef}
        className="anim-float absolute left-1/2 top-[25%] w-[66%] max-w-[300px] -translate-x-1/2"
        style={{
          '--float-duration': '5.2s',
          '--float-rot': '-1.2deg',
          transformStyle: 'preserve-3d',
          zIndex: 5,
        } as CSSProperties}
      >
        <svg viewBox="0 0 340 300" className="hologram-piece w-full drop-shadow-[0_30px_34px_rgba(0,0,0,0.5)]">
          <defs>
            <linearGradient id="heroHoodie" x1="60" y1="40" x2="285" y2="280" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#ff4f55" />
              <stop offset="48%" stopColor="#e31935" />
              <stop offset="100%" stopColor="#920d25" />
            </linearGradient>
            <linearGradient id="heroHoodInside" x1="120" y1="42" x2="220" y2="110" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#191919" />
              <stop offset="100%" stopColor="#070707" />
            </linearGradient>
          </defs>

          {/* sleeves + body */}
          <path
            d="M105 74 L55 91 Q42 96 34 111 L18 164 Q14 179 28 186 L69 205 L90 159 L88 253 Q130 273 170 274 Q210 273 252 253 L250 159 L270 205 L311 186 Q326 179 322 164 L306 111 Q298 96 285 91 L235 74 L207 51 Q170 69 133 51 Z"
            fill="url(#heroHoodie)"
            stroke="#ff7373"
            strokeOpacity="0.45"
            strokeWidth="3"
            strokeLinejoin="round"
          />

          {/* hood */}
          <path
            d="M116 64 Q120 24 170 20 Q220 24 224 64 L207 101 Q170 120 133 101 Z"
            fill="url(#heroHoodInside)"
            stroke="#ff666b"
            strokeWidth="3"
          />
          <path d="M133 67 Q170 92 207 67" fill="none" stroke="#2c2c2c" strokeWidth="6" />

          {/* hood strings */}
          <g stroke="#f7d4d5" strokeWidth="3" strokeLinecap="round">
            <line x1="145" y1="80" x2="141" y2="126" />
            <line x1="195" y1="80" x2="199" y2="126" />
          </g>
          <g fill="#f7d4d5">
            <circle cx="141" cy="128" r="5" />
            <circle cx="199" cy="128" r="5" />
          </g>

          {/* chest panel */}
          <path d="M111 117 Q170 135 229 117 L235 245 Q170 263 105 245 Z" fill="#000" fillOpacity="0.08" />
          <path d="M108 191 Q170 214 232 191 L232 217 Q170 240 108 217 Z" fill="#770c20" fillOpacity="0.42" />
          <path d="M110 191 Q170 212 230 191" fill="none" stroke="#ff7c7c" strokeOpacity="0.3" strokeWidth="2" />

          {/* minimal chest mark */}
          <path d="M151 150 L170 139 L189 150 L170 161 Z" fill="#fff" fillOpacity="0.92" />
          <path d="M155 151 L170 157 L185 151" fill="none" stroke="#e31935" strokeWidth="2" />

          {/* sleeve highlights */}
          <path d="M55 96 Q74 110 91 121" fill="none" stroke="#ff8a8a" strokeOpacity="0.5" strokeWidth="4" />
          <path d="M285 96 Q266 110 249 121" fill="none" stroke="#790d21" strokeOpacity="0.55" strokeWidth="4" />
        </svg>
      </div>

      {/* Jeans: foreground base layer. */}
      <div
        ref={jeansRef}
        className="anim-float absolute left-[30%] top-[61%] w-[55%] max-w-[250px]"
        style={{
          '--float-duration': '6.8s',
          '--float-rot': '1deg',
          transformStyle: 'preserve-3d',
          zIndex: 6,
        } as CSSProperties}
      >
        <svg viewBox="0 0 300 210" className="hologram-piece w-full drop-shadow-[0_20px_25px_rgba(0,0,0,0.42)]">
          <defs>
            <linearGradient id="heroJeans" x1="40" y1="30" x2="260" y2="180" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#607fa2" />
              <stop offset="55%" stopColor="#315779" />
              <stop offset="100%" stopColor="#172f4c" />
            </linearGradient>
          </defs>
          <path d="M51 32 Q91 17 132 31 L149 83 L176 31 Q214 17 249 32 L274 173 Q218 195 150 189 Q82 195 26 173 Z" fill="url(#heroJeans)" stroke="#8ba6c0" strokeOpacity="0.45" strokeWidth="3" />
          <path d="M132 31 L150 83 L176 31" fill="#1d3d5d" fillOpacity="0.85" />
          <path d="M70 44 L85 164" stroke="#a7bad0" strokeOpacity="0.3" strokeWidth="3" />
          <path d="M230 44 L215 164" stroke="#0d2137" strokeOpacity="0.55" strokeWidth="4" />
          <path d="M92 38 Q150 52 208 38" fill="none" stroke="#d5e0eb" strokeOpacity="0.38" strokeWidth="3" />
          <path d="M88 58 L117 68 L113 101 L84 94 Z" fill="#274b6d" stroke="#a6bbcf" strokeOpacity="0.35" />
          <path d="M183 68 L212 58 L216 94 L187 101 Z" fill="#274b6d" stroke="#a6bbcf" strokeOpacity="0.35" />
          <path d="M150 84 L150 185" stroke="#c0d0df" strokeOpacity="0.24" strokeWidth="3" />
          <path d="M29 171 Q83 190 150 184 Q217 190 271 171" fill="none" stroke="#b4c7d9" strokeOpacity="0.24" strokeWidth="3" />
        </svg>
      </div>

      {/* Floating clothing tag. */}
      <div
        ref={tagRef}
        className="anim-float absolute left-[72%] top-[23%] w-[17%] max-w-[72px]"
        style={{
          '--float-duration': '4.4s',
          '--float-rot': '4deg',
          transformStyle: 'preserve-3d',
          zIndex: 8,
        } as CSSProperties}
      >
        <svg viewBox="0 0 100 130" className="hologram-piece w-full drop-shadow-[0_10px_18px_rgba(0,0,0,0.45)]">
          <path d="M20 9 H75 L91 25 V119 H9 V9 Z" fill="#151515" stroke="#ff3e55" strokeWidth="3" />
          <circle cx="25" cy="24" r="5" fill="#ff3e55" />
          <path d="M37 48 H67" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
          <path d="M37 61 H67" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeOpacity="0.55" />
          <path d="M37 83 H63" stroke="#ff3e55" strokeWidth="4" strokeLinecap="round" />
          <text x="50" y="106" textAnchor="middle" fill="#fff" fontSize="10" fontWeight="700" fontFamily="sans-serif">
            S1NDZE
          </text>
        </svg>
      </div>
    </div>
  )
}