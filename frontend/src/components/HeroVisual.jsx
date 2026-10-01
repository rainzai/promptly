import { MainPanel, SidePanel } from './DashboardPreview.jsx'
import FloatingDocs from './FloatingDocs.jsx'
import Mascot from './Mascot.jsx'

// A glove gripping the dashboard's top edge (y = 30): the back of the hand above
// the edge, four fingertips curling over it.
function Hand({ className = '' }) {
  return (
    <svg viewBox="0 0 64 46" className={className} aria-hidden="true">
      <g fill="#fff" stroke="currentColor" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 30C4 14 16 4 32 4s28 10 28 26a7 9 0 0 1-14 0a7 9 0 0 1-14 0a7 9 0 0 1-14 0a7 9 0 0 1-14 0z" />
        <path d="M18 30v-6M32 30v-7M46 30v-6" fill="none" />
      </g>
    </svg>
  )
}

// The mascot hides behind the main panel and peeks over its top edge.
function PeekingMascot() {
  const anchor = 'pointer-events-none absolute top-0 left-1/2 lg:left-[392px]'
  return (
    <>
      <div className={`${anchor} z-0`}>
        <Mascot
          sticker
          className="absolute bottom-[-20px] left-0 w-[150px] -translate-x-1/2 text-ink drop-shadow-[0_14px_22px_rgba(60,20,20,0.3)] motion-safe:animate-bob sm:bottom-[-24px] sm:w-[180px] lg:bottom-[-30px] lg:w-[292px]"
        />
      </div>
      <div className={`${anchor} z-20 text-ink`}>
        <Hand className="absolute top-[-21px] left-[-92px] w-[44px] sm:left-[-108px] lg:top-[-33px] lg:left-[-168px] lg:w-[70px]" />
        <Hand className="absolute top-[-21px] left-[48px] w-[44px] -scale-x-100 sm:left-[64px] lg:top-[-33px] lg:left-[98px] lg:w-[70px]" />
      </div>
    </>
  )
}

export default function HeroVisual() {
  return (
    <div
      role="img"
      aria-label="Preview of the Promptly app: your learning path, a placement question, XP, your prompt expertise and badges"
      className="relative isolate -mx-5 mt-14 sm:-mx-8 lg:mx-0 lg:mt-0 lg:mr-[clamp(0px,3.5vw,64px)] lg:justify-self-end"
    >
      {/* Phones and tablets: the canal photo sits behind the preview. */}
      <img
        src="/bg.webp"
        alt=""
        loading="lazy"
        className="absolute inset-0 -z-10 size-full object-cover object-[72%_100%] lg:hidden"
      />
      <div className="absolute inset-x-0 top-0 -z-10 h-40 bg-gradient-to-b from-paper to-transparent lg:hidden" />

      <div className="relative mx-auto max-w-[560px] px-5 pt-32 pb-12 sm:px-8 sm:pt-36 md:max-w-[860px] lg:h-[840px] lg:w-[780px] lg:max-w-none lg:p-0 lg:[zoom:0.6] xl:[zoom:0.78] wide:[zoom:0.9] 2xl:[zoom:1]">
        <FloatingDocs className="absolute top-[14px] left-[8px] z-30 hidden lg:block" />

        <div className="lg:absolute lg:top-[262px] lg:left-[10px] lg:w-[760px] lg:origin-left lg:[transform:perspective(2400px)_rotateY(-8deg)_rotateX(3deg)_rotate(1.4deg)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-start lg:gap-2">
            <div className="relative md:flex-1 lg:w-[520px] lg:flex-none">
              <PeekingMascot />
              <MainPanel className="relative z-10" />
            </div>
            <SidePanel className="relative z-10 md:mt-10 md:w-[230px] md:shrink-0 lg:mt-12" />
          </div>
        </div>
      </div>
    </div>
  )
}
