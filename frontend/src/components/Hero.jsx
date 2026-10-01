import Button from './Button.jsx'
import DeskProps from './DeskProps.jsx'
import HeroVisual from './HeroVisual.jsx'
import Icon from './Icon.jsx'
import Nav from './Nav.jsx'

const STEP_TRAIL = ['Upload', 'Map', 'Diagnose', 'Train', 'Prove', 'Progress', 'Compete']

const FEATURES = [
  { icon: 'upload', title: 'Upload', sub: 'your materials' },
  { icon: 'brain', title: 'Get a plan', sub: 'that fits your level' },
  { icon: 'growth', title: 'Build mastery', sub: 'and track your progress' },
]

function HeroCopy() {
  return (
    <div className="relative z-10 max-w-[560px] pt-6 sm:pt-10 lg:pt-[clamp(40px,9vh,110px)]">
      <ol
        aria-label="How it works"
        className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5 text-[10.5px] font-medium tracking-[0.12em] text-muted uppercase sm:text-[11px] xl:text-[10px] xl:tracking-[0.08em] wide:text-[11px] wide:tracking-[0.12em]"
      >
        {STEP_TRAIL.map((step, i) => (
          <li key={step} className="flex items-center gap-1.5">
            {step}
            {i < STEP_TRAIL.length - 1 && <Icon name="arrowRight" className="size-3 text-faint" />}
          </li>
        ))}
      </ol>

      <h1 className="mt-6 text-[clamp(2.6rem,4.8vw,4.45rem)] leading-[1.02] font-bold tracking-[-0.045em] text-ink sm:mt-8">
        Your personal <br className="hidden sm:block" />
        AI tutor for uni.
      </h1>

      <p className="mt-5 max-w-[27rem] text-[1.05rem] leading-relaxed text-muted sm:mt-6 sm:text-[1.15rem]">
        Turn your slides, PDFs and notes into an interactive learning journey — built around you.
      </p>

      <Button href="#start" size="lg" className="mt-8 w-full sm:w-auto">
        Start learning <Icon name="arrowRight" className="size-5" />
      </Button>

      <ul className="mt-10 grid grid-cols-3 gap-3 sm:mt-12 sm:flex sm:gap-0 lg:grid xl:flex">
        {FEATURES.map((feature, i) => (
          <li
            key={feature.title}
            className={`flex min-w-0 flex-col gap-2.5 sm:flex-row sm:items-center sm:gap-3 sm:px-4 sm:first:pl-0 lg:flex-col lg:items-start lg:px-3 xl:flex-row xl:items-center 2xl:px-4 ${
              i > 0 ? 'sm:border-l sm:border-ink/10' : ''
            }`}
          >
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/80 text-ink/70 shadow-sm ring-1 ring-black/5">
              <Icon name={feature.icon} className="size-5" strokeWidth={1.75} />
            </span>
            <span className="leading-tight 2xl:whitespace-nowrap">
              <b className="block text-[0.84rem] font-semibold text-ink">{feature.title}</b>
              <small className="text-[0.74rem] text-muted">{feature.sub}</small>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

export default function Hero() {
  return (
    <section id="top" className="relative isolate overflow-hidden lg:min-h-svh">
      {/* Desktop: the Amsterdam canal fills the hero, washed out behind the copy. */}
      <img
        src="/bg.webp"
        alt=""
        fetchPriority="high"
        className="absolute inset-0 -z-20 hidden size-full object-cover object-bottom lg:block"
      />
      <div className="absolute inset-0 -z-10 hidden bg-[radial-gradient(ellipse_70%_85%_at_8%_32%,rgba(251,248,244,0.97)_0%,rgba(251,248,244,0.9)_45%,rgba(251,248,244,0)_100%)] lg:block" />
      <div className="absolute inset-x-0 top-0 -z-10 hidden h-40 bg-gradient-to-b from-paper/80 to-transparent lg:block" />
      <DeskProps />

      <Nav />

      <div className="mx-auto grid max-w-[1560px] px-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-8 lg:px-12 xl:px-16">
        <HeroCopy />
        <HeroVisual />
      </div>
    </section>
  )
}
