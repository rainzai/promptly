import Button from './Button.jsx'

const STEP_TRAIL = [
  'Upload',
  'Map',
  'Diagnose',
  'Train',
  'Prove',
  'Progress',
  'Compete',
]

const HINTS = [
  {
    icon: '📤',
    label: 'Upload your material',
    sub: 'slides, PDFs, notes',
  },
  {
    icon: '🗺️',
    label: 'Trace back to the basics',
    sub: 'find the foundations you missed',
  },
  {
    icon: '🏆',
    label: 'Rebuild, prove, compete',
    sub: 'earn XP and beat your friends',
  },
]

export default function Hero() {
  return (
    <main
      id="top"
      className="relative z-10 flex min-h-[calc(100vh-74px)] items-center justify-start px-[clamp(20px,4vw,56px)] py-[clamp(20px,4vh,52px)] max-[900px]:min-h-0 max-[900px]:py-16"
    >
      {/* Text panel */}
      <div className="w-full max-w-[1100px]">
        <p className="mb-6 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-faint">
          {STEP_TRAIL.map((step, i) => (
            <span key={step}>
              {step}
              {i < STEP_TRAIL.length - 1 && (
                <em
                  className="px-[3px] not-italic text-crimson"
                  aria-hidden="true"
                >
                  {' '}
                  →{' '}
                </em>
              )}
            </span>
          ))}
        </p>

        <h1 className="max-w-[26ch] text-[clamp(2.2rem,4.4vw,4rem)] font-black leading-[1.02] tracking-[-0.035em] text-ink">
          Learn by going back to the foundations.
        </h1>

        <div className="mt-8 flex flex-wrap items-end justify-between gap-[clamp(24px,4vw,56px)]">
          <p className="max-w-[46rem] flex-[1_1_32rem] text-[clamp(1rem,1.3vw,1.18rem)] leading-relaxed text-muted">
            YouLearn AI takes your slides, PDFs and notes and walks you
            backwards to the basics you missed — then rebuilds you forward,
            layer by layer, until you&apos;re exam-ready.
          </p>
          <Button size="lg">
            Start learning <span aria-hidden="true">→</span>
          </Button>
        </div>

        <ul className="mt-[clamp(32px,5vh,56px)] grid w-full grid-cols-3 gap-6 border-t border-line pt-8 max-[820px]:grid-cols-1 max-[820px]:gap-4">
          {HINTS.map((hint) => (
            <li key={hint.label} className="flex items-start gap-3">
              <span className="text-[1.25rem] leading-tight" aria-hidden="true">
                {hint.icon}
              </span>
              <span>
                <b className="block text-[0.95rem] font-bold leading-tight text-ink">
                  {hint.label}
                </b>
                <small className="text-[0.82rem] text-faint">{hint.sub}</small>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
