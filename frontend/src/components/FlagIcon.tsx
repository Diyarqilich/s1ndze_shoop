/**
 * Windows (and some Linux browsers) have no colour glyphs for regional-indicator
 * emoji, so flag emoji like 🇺🇿 render as plain letter pairs ("UZ", "RU", "GB")
 * instead of a flag. Real inline SVGs always render the same everywhere, so we
 * use those instead of emoji for the language switcher.
 */
export type FlagCode = 'uz' | 'ru' | 'en'

function UzFlag() {
  return (
    <svg viewBox="0 0 60 30" className="h-full w-full" aria-hidden="true">
      <rect width="60" height="30" fill="#1eb53a" />
      <rect width="60" height="9" fill="#0099b5" />
      <rect y="9" width="60" height="1.6" fill="#ce1126" />
      <rect y="10.6" width="60" height="8.8" fill="#fff" />
      <rect y="19.4" width="60" height="1.6" fill="#ce1126" />
      <circle cx="9" cy="4.5" r="3.3" fill="#fff" />
      <circle cx="10.1" cy="4.5" r="2.75" fill="#0099b5" />
      {Array.from({ length: 12 }).map((_, i) => {
        const angle = (i / 12) * Math.PI * 2
        const cx = 16 + Math.cos(angle) * 2.2
        const cy = 4.5 + Math.sin(angle) * 2.2
        return <circle key={i} cx={cx} cy={cy} r="0.5" fill="#fff" />
      })}
    </svg>
  )
}

function RuFlag() {
  return (
    <svg viewBox="0 0 60 30" className="h-full w-full" aria-hidden="true">
      <rect width="60" height="30" fill="#fff" />
      <rect y="10" width="60" height="10" fill="#0039a6" />
      <rect y="20" width="60" height="10" fill="#d52b1e" />
    </svg>
  )
}

function GbFlag() {
  return (
    <svg viewBox="0 0 60 30" className="h-full w-full" aria-hidden="true">
      <rect width="60" height="30" fill="#00247d" />
      <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
      <path d="M0,0 L26,12 L0,12 Z" fill="#cf142b" />
      <path d="M60,0 L34,12 L60,12 Z" fill="#cf142b" />
      <path d="M0,30 L26,18 L0,18 Z" fill="#cf142b" />
      <path d="M60,30 L34,18 L60,18 Z" fill="#cf142b" />
      <rect x="24" width="12" height="30" fill="#fff" />
      <rect y="9" width="60" height="12" fill="#fff" />
      <rect x="26.5" width="7" height="30" fill="#cf142b" />
      <rect y="11.5" width="60" height="7" fill="#cf142b" />
    </svg>
  )
}

export function FlagIcon({ code, className = 'h-3.5 w-5' }: { code: FlagCode; className?: string }) {
  const Flag = code === 'uz' ? UzFlag : code === 'ru' ? RuFlag : GbFlag
  return (
    <span className={`inline-block overflow-hidden rounded-[2px] ring-1 ring-black/10 ${className}`}>
      <Flag />
    </span>
  )
}
