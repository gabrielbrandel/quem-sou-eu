type IconProps = {
  className?: string
}

export function PlayIcon({ className }: IconProps) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <path d="M3 1.8v10.4L12 7 3 1.8z" fill="currentColor" />
    </svg>
  )
}

export function PeopleIcon({ className }: IconProps) {
  return (
    <svg className={className} width="18" height="14" viewBox="0 0 18 14" aria-hidden>
      <circle cx="6" cy="4" r="2.4" fill="currentColor" />
      <path d="M1.5 12.5c0-2.4 2-4 4.5-4s4.5 1.6 4.5 4" fill="currentColor" />
      <circle cx="12.5" cy="4.2" r="2" fill="currentColor" />
      <path d="M10.2 12.5c.4-1.7 1.7-2.9 3.5-2.9 1.9 0 3.3 1.3 3.3 2.9" fill="currentColor" />
    </svg>
  )
}

export function ThemeCardsIcon({ className }: IconProps) {
  return (
    <svg className={className} width="28" height="28" viewBox="0 0 28 28" aria-hidden>
      <rect x="3" y="7" width="14" height="16" rx="3" fill="#2a2a2a" stroke="#ffcc00" strokeWidth="1.5" />
      <rect x="9" y="4" width="14" height="16" rx="3" fill="#f4efdf" stroke="#ffcc00" strokeWidth="1.5" />
      <path
        d="M16 8.2l1.05 2.15 2.35.35-1.7 1.65.4 2.35L16 13.6l-2.1 1.1.4-2.35-1.7-1.65 2.35-.35L16 8.2z"
        fill="#ffcc00"
      />
    </svg>
  )
}

export function MenuDotsIcon({ className }: IconProps) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <circle cx="3" cy="8" r="1.4" fill="currentColor" />
      <circle cx="8" cy="8" r="1.4" fill="currentColor" />
      <circle cx="13" cy="8" r="1.4" fill="currentColor" />
    </svg>
  )
}

export function CrownIcon({ className }: IconProps) {
  return (
    <svg className={className} width="18" height="16" viewBox="0 0 18 16" aria-hidden>
      <path
        d="M1.5 12.5 3 5.5l3.2 3L9 2.8l2.8 5.7 3.2-3 1.5 7H1.5z"
        fill="#ffcc00"
        stroke="#c99700"
        strokeWidth="1"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function QrIcon({ className }: IconProps) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 16 16" aria-hidden>
      <path
        fill="currentColor"
        d="M1 1h6v6H1V1zm1.5 1.5v3h3v-3h-3zM9 1h6v6H9V1zm1.5 1.5v3h3v-3h-3zM1 9h6v6H1V9zm1.5 1.5v3h3v-3h-3zM9 9h2.2v2.2H9V9zm2.8 0H14v2.2h-2.2V9zM9 11.8h2.2V14H9v-2.2zm2.8 0H14V14h-2.2v-2.2z"
      />
    </svg>
  )
}
