// A small inline icon set (24px grid, stroked), so the page needs no icon package.

function gearPath(teeth = 8, outer = 10, inner = 7.6) {
  const points = []
  for (let i = 0; i < teeth * 4; i++) {
    const angle = (i / (teeth * 4)) * Math.PI * 2
    const r = i % 4 < 2 ? outer : inner
    points.push(`${(12 + r * Math.cos(angle)).toFixed(2)} ${(12 + r * Math.sin(angle)).toFixed(2)}`)
  }
  return `M${points.join('L')}Z`
}

const GEAR = gearPath()

const ICONS = {
  upload: (
    <>
      <path d="M16 16l-4-4-4 4" />
      <path d="M12 12v9" />
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </>
  ),
  nodes: (
    <>
      <circle cx="12" cy="5" r="2.5" />
      <circle cx="5" cy="18" r="2.5" />
      <circle cx="19" cy="18" r="2.5" />
      <path d="M10.8 7.2 6.3 15.8M13.2 7.2l4.5 8.6M7.5 18h9" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.6-4.6" />
    </>
  ),
  book: (
    <>
      <path d="M2 4h6a4 4 0 0 1 4 4v13a3 3 0 0 0-3-3H2z" />
      <path d="M22 4h-6a4 4 0 0 0-4 4v13a3 3 0 0 1 3-3h7z" />
    </>
  ),
  trophy: (
    <>
      <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5a3.5 3.5 0 0 1-3.5 3.5" />
      <path d="M12 14v4M8 21h8M9.5 18h5" />
    </>
  ),
  growth: (
    <>
      <path d="M3 3v18h18" />
      <path d="M7 15l4-4 3 3 6-6" />
      <path d="M16 8h4v4" />
    </>
  ),
  landmark: (
    <>
      <path d="M3 9.5 12 4l9 5.5z" />
      <path d="M5.5 12.5V18M10 12.5V18M14 12.5V18M18.5 12.5V18M3 21h18" />
    </>
  ),
  gear: (
    <>
      <path d={GEAR} />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <circle cx="12" cy="12" r="5.5" />
      <circle cx="12" cy="12" r="1.6" fill="currentColor" />
    </>
  ),
  lock: (
    <>
      <rect x="4" y="11" width="16" height="10" rx="2.5" />
      <path d="M8 11V7.5a4 4 0 0 1 8 0V11" />
    </>
  ),
  flame: (
    <path
      fill="currentColor"
      d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.07-2.14-.22-4.05 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.15.43-2.29 1-3a2.5 2.5 0 0 0 2.5 2.5z"
    />
  ),
  crown: (
    <>
      <path fill="currentColor" d="M3 8l4.5 4L12 5l4.5 7L21 8l-2 10H5z" />
      <path d="M5 21h14" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" fill="currentColor" stroke="none" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0z" fill="currentColor" stroke="none" />
    </>
  ),
  star: (
    <path
      fill="currentColor"
      d="M12 2.5l2.9 6.2 6.6.7-5 4.5 1.4 6.6L12 17.2l-5.9 3.3 1.4-6.6-5-4.5 6.6-.7z"
    />
  ),
  award: (
    <>
      <circle cx="12" cy="8.5" r="6" />
      <path d="M15.5 13.5 17 22l-5-3-5 3 1.5-8.5" />
    </>
  ),
  brain: (
    <>
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M12 5v13M9 9.5c1 .5 2 .5 3 0M12 13c1 .6 2 .6 3 0" />
    </>
  ),
  bars: <path d="M6 20v-5M12 20V9M18 20V4" />,
  copy: (
    <>
      <rect x="9" y="9" width="11" height="11" rx="2.5" />
      <path d="M15 9V6.5A2.5 2.5 0 0 0 12.5 4h-6A2.5 2.5 0 0 0 4 6.5v6A2.5 2.5 0 0 0 6.5 15H9" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 11a8 8 0 0 0-14.3-4.9L4 8" />
      <path d="M4 4v4h4M4 13a8 8 0 0 0 14.3 4.9L20 16M20 20v-4h-4" />
    </>
  ),
  shield: <path d="M12 3l7.5 3v5.5c0 4.6-3.2 8.4-7.5 9.5-4.3-1.1-7.5-4.9-7.5-9.5V6z" />,
  message: (
    <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H10l-5 4v-4.5A2.5 2.5 0 0 1 4 13.5z" />
  ),
  thumbUp: (
    <>
      <path d="M7 11v9H4.5A1.5 1.5 0 0 1 3 18.5v-6A1.5 1.5 0 0 1 4.5 11z" />
      <path d="M7 11l4-7.5a2 2 0 0 1 3.6 1.5L14 9h5.2a2 2 0 0 1 2 2.4l-1.3 6.5a2.5 2.5 0 0 1-2.5 2.1H7" />
    </>
  ),
  thumbDown: (
    <g transform="rotate(180 12 12)">
      <path d="M7 11v9H4.5A1.5 1.5 0 0 1 3 18.5v-6A1.5 1.5 0 0 1 4.5 11z" />
      <path d="M7 11l4-7.5a2 2 0 0 1 3.6 1.5L14 9h5.2a2 2 0 0 1 2 2.4l-1.3 6.5a2.5 2.5 0 0 1-2.5 2.1H7" />
    </g>
  ),
  play: <path fill="currentColor" stroke="none" d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z" />,
  arrowRight: <path d="M5 12h14M13 6l6 6-6 6" />,
  arrowLeft: <path d="M19 12H5M11 6l-6 6 6 6" />,
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  alert: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M12 7.5v5.5M12 16.5h.01" />
    </>
  ),
  chevronRight: <path d="M9 6l6 6-6 6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
}

export default function Icon({ name, className = 'size-5', strokeWidth = 2 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {ICONS[name]}
    </svg>
  )
}
