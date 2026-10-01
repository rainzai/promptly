import Button from './Button.jsx'

function FoundationMark() {
  return (
    <svg
      className="shrink-0 text-crimson"
      viewBox="0 0 32 32"
      width="28"
      height="28"
      aria-hidden="true"
    >
      <rect x="4" y="22" width="24" height="5.2" rx="2.6" fill="currentColor" />
      <rect
        x="7"
        y="14.4"
        width="18"
        height="5.2"
        rx="2.6"
        fill="currentColor"
        opacity="0.68"
      />
      <rect
        x="10"
        y="6.8"
        width="12"
        height="5.2"
        rx="2.6"
        fill="currentColor"
        opacity="0.4"
      />
    </svg>
  )
}

const linkClass =
  'text-[0.95rem] font-medium text-ink/80 no-underline transition-colors hover:text-crimson'

export default function Nav() {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between gap-5 bg-gradient-to-b from-cream/90 to-transparent px-[clamp(20px,4vw,56px)] py-[18px]">
      <a
        href="#top"
        className="flex items-center gap-2.5 text-[1.18rem] font-extrabold tracking-tight text-ink no-underline"
      >
        <FoundationMark />
        <span>YouLearn AI</span>
      </a>

      <nav className="flex items-center gap-[26px]">
        <a href="#how" className={`${linkClass} max-[640px]:hidden`}>
          How it works
        </a>
        <a href="#topics" className={`${linkClass} max-[640px]:hidden`}>
          Topics
        </a>
        <Button>Get started</Button>
      </nav>
    </header>
  )
}
