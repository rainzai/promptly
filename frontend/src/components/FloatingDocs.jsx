import Icon from './Icon.jsx'

// The study material floating towards the mascot: a PDF, slides, notes and a video.

function Doc({ className = '', children }) {
  return (
    <div
      className={`absolute rounded-xl bg-white p-3 shadow-[0_20px_40px_-18px_rgba(70,30,20,0.45)] ring-1 ring-black/5 motion-safe:animate-float ${className}`}
    >
      {children}
    </div>
  )
}

function Lines({ widths = ['w-full', 'w-4/5', 'w-full', 'w-3/5'] }) {
  return (
    <div className="mt-2.5 space-y-1.5">
      {widths.map((w, i) => (
        <span key={i} className={`block h-1.5 rounded-full bg-[#ebe4dc] ${w}`} />
      ))}
    </div>
  )
}

export default function FloatingDocs({ className = '' }) {
  return (
    <div className={`h-[250px] w-[300px] ${className}`}>
      <Doc className="left-[110px] top-[64px] h-[104px] w-[86px] rotate-[6deg] [animation-delay:-5s]">
        <Lines widths={['w-full', 'w-3/4', 'w-full', 'w-full', 'w-1/2']} />
      </Doc>
      <Doc className="left-[0px] top-[96px] h-[124px] w-[98px] -rotate-[11deg]">
        <span className="rounded bg-crimson px-1.5 py-0.5 text-[10px] font-bold tracking-wide text-white">
          PDF
        </span>
        <Lines />
      </Doc>
      <Doc className="left-[96px] top-[0px] h-[88px] w-[112px] -rotate-[4deg] [animation-delay:-2s]">
        <div className="flex gap-2">
          <span className="grid h-7 w-9 place-items-center rounded-md bg-gold/90">
            <span className="h-2.5 w-4 rounded-sm bg-white/90" />
          </span>
          <Lines widths={['w-10', 'w-8']} />
        </div>
        <Lines widths={['w-full', 'w-2/3']} />
      </Doc>
      <Doc className="left-[208px] top-[22px] h-[100px] w-[84px] rotate-[9deg] [animation-delay:-3.5s]">
        <span className="block h-2 w-10 rounded-full bg-[#d8cfc6]" />
        <Lines widths={['w-full', 'w-full', 'w-4/5', 'w-full']} />
      </Doc>
      <div className="absolute left-[196px] top-[146px] grid h-[54px] w-[74px] -rotate-[5deg] place-items-center rounded-xl bg-gradient-to-b from-[#a52537] to-crimson-dark shadow-[0_18px_30px_-14px_rgba(139,26,43,0.9)] motion-safe:animate-float [animation-delay:-1s]">
        <Icon name="play" className="size-6 text-white" />
      </div>
      {/* The documents flow into the mascot. */}
      <svg
        viewBox="0 0 90 70"
        className="absolute left-[268px] top-[-14px] w-[88px] text-ink/45"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="M4 52C14 20 44 6 78 22" strokeDasharray="1 6" />
        <path d="M68 12l11 10.5L64.5 27" />
      </svg>
    </div>
  )
}
