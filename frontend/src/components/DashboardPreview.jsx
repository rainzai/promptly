import { Fragment } from 'react'
import Icon from './Icon.jsx'

// A static mock of the app, used as the hero illustration.

const STEPS = [
  ['upload', 'Upload'],
  ['nodes', 'Map'],
  ['search', 'Diagnose'],
  ['book', 'Train'],
  ['trophy', 'Progress'],
  ['growth', 'Compete'],
]

const PATH = [
  ['landmark', 'Foundations'],
  ['nodes', 'Core Concepts'],
  ['gear', 'Applied Concepts'],
  ['target', 'Target Topic'],
]

const LEADERS = [
  ['You', 860],
  ['Friend A', 740],
  ['Friend B', 680],
  ['Friend C', 620],
  ['Friend D', 540],
]

const BADGES = [
  { icon: 'award', label: 'First Steps', gold: false },
  { icon: 'growth', label: 'Statistics Master', gold: true },
  { icon: 'star', label: 'Pandas Pro', gold: false },
]

const panel =
  'rounded-[22px] border border-white/80 bg-paper/95 shadow-[0_40px_90px_-30px_rgba(70,30,20,0.45)] backdrop-blur-md'

function Card({ className = '', children }) {
  return (
    <div
      className={`rounded-2xl border border-line/80 bg-white shadow-[0_1px_2px_rgba(28,25,23,0.05)] ${className}`}
    >
      {children}
    </div>
  )
}

function Steps() {
  return (
    <Card className="flex items-start justify-between px-2.5 py-2.5 sm:px-4">
      {STEPS.map(([icon, label], i) => (
        <Fragment key={label}>
          <div className="flex min-w-0 flex-col items-center gap-1">
            <span className="grid size-8 place-items-center rounded-full bg-crimson text-white shadow-[0_6px_14px_-6px_rgba(139,26,43,0.9)] sm:size-9">
              <Icon name={icon} className="size-4" />
            </span>
            <span className="text-[9.5px] font-medium text-crimson-dark sm:text-[10.5px]">{label}</span>
          </div>
          {i < STEPS.length - 1 && (
            <Icon name="arrowRight" className="mt-3 hidden size-3.5 shrink-0 text-faint sm:block" />
          )}
        </Fragment>
      ))}
    </Card>
  )
}

function LearningPath() {
  return (
    <div className="mt-2.5 grid grid-cols-2 gap-2 sm:flex sm:items-center sm:gap-1.5">
      {PATH.map(([icon, label], i) => {
        const target = i === PATH.length - 1
        return (
          <Fragment key={label}>
            <div
              className={`flex flex-1 flex-col items-center gap-1 rounded-xl border px-1.5 py-2.5 text-center ${
                target
                  ? 'border-crimson bg-crimson text-white shadow-[0_12px_24px_-12px_rgba(139,26,43,0.9)]'
                  : 'border-line bg-white text-crimson'
              }`}
            >
              <Icon name={icon} className="size-5" />
              <span className={`text-[11px] font-medium leading-tight ${target ? 'text-white' : 'text-ink'}`}>
                {label}
              </span>
            </div>
            {i < PATH.length - 1 && (
              <Icon name="chevronRight" className="hidden size-3.5 shrink-0 text-crimson/50 sm:block" />
            )}
          </Fragment>
        )
      })}
    </div>
  )
}

function QuizCard() {
  return (
    <Card className="p-3">
      <div className="flex items-center gap-2 border-b border-line pb-1.5">
        <Icon name="bars" className="size-3.5 text-crimson" strokeWidth={2.5} />
        <span className="text-[11.5px] font-semibold text-ink">Quick placement</span>
        <span className="ml-auto h-1 w-10 rounded-full bg-line">
          <span className="block h-full w-2/3 rounded-full bg-crimson" />
        </span>
      </div>
      <p className="mt-2 text-[11.5px] font-medium leading-snug text-ink">
        Which of the following best describes a prior in Bayesian statistics?
      </p>
      <ul className="mt-2 space-y-0.5">
        {['w-[80%]', 'w-[64%]', 'w-[72%]', 'w-[56%]'].map((width, i) => (
          <li
            key={width}
            className={`flex items-center gap-2 rounded-md px-1.5 py-[3px] ${
              i === 1 ? 'bg-crimson/5 ring-1 ring-crimson/25' : ''
            }`}
          >
            <span className={`text-[10px] font-semibold ${i === 1 ? 'text-crimson' : 'text-faint'}`}>
              {'ABCD'[i]}
            </span>
            <span className={`h-1.5 rounded-full ${i === 1 ? 'bg-crimson/30' : 'bg-[#ebe4dc]'} ${width}`} />
          </li>
        ))}
      </ul>
      <div className="mt-2 flex items-center justify-between">
        <span className="rounded-full bg-crimson px-3 py-1 text-[10.5px] font-semibold text-white">
          Next question
        </span>
        <span className="text-[10.5px] font-medium text-faint">2/3</span>
      </div>
    </Card>
  )
}

function CheckpointCard() {
  return (
    <Card className="flex h-full flex-col p-3">
      <div className="flex items-center gap-2">
        <Icon name="award" className="size-4 text-crimson" />
        <span className="text-[12px] font-semibold text-ink">Mastery checkpoint</span>
      </div>
      <p className="mt-1.5 text-[11px] leading-snug text-muted">
        Connect multiple concepts in a challenging question.
      </p>
      <div className="my-2 grid flex-1 place-items-center">
        <span className="grid size-11 place-items-center rounded-full bg-[#f3eee9] text-muted">
          <Icon name="lock" className="size-5" />
        </span>
      </div>
      <span className="rounded-lg bg-[#f0eae4] py-2 text-center text-[11px] font-medium text-faint">
        Unlocks next stage
      </span>
    </Card>
  )
}

export function MainPanel({ className = '' }) {
  return (
    <div className={`${panel} p-3 sm:p-4 ${className}`}>
      <Steps />
      <h3 className="mt-3.5 text-[14px] font-semibold text-ink sm:mt-4">Your Learning Path</h3>
      <LearningPath />
      <div className="mt-3.5 grid gap-3 sm:grid-cols-2">
        <div>
          <h3 className="mb-2 text-[13px] font-semibold text-ink">Choose your topic</h3>
          <QuizCard />
        </div>
        <div className="hidden sm:block sm:pt-[27px]">
          <CheckpointCard />
        </div>
      </div>
    </div>
  )
}

function XpRing() {
  const r = 50
  const progress = 0.72
  return (
    <Card className="order-1 grid place-items-center p-2.5">
      <div className="relative size-[86px] sm:size-[92px]">
        <svg viewBox="0 0 120 120" className="size-full -rotate-90">
          <circle cx="60" cy="60" r={r} fill="none" stroke="#f2e8e2" strokeWidth="10" />
          <circle
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${progress * 2 * Math.PI * r} 999`}
            className="text-crimson"
          />
        </svg>
        <Icon name="star" className="absolute -top-1 left-1/2 size-4 -translate-x-1/2 text-gold" />
        <div className="absolute inset-0 grid place-content-center text-center">
          <span className="text-[22px] font-bold leading-none text-ink">860</span>
          <span className="mt-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">XP</span>
          <span className="text-[9px] text-faint">Level 4</span>
        </div>
      </div>
    </Card>
  )
}

function Leaderboard() {
  return (
    <Card className="order-3 col-span-2 p-2.5 md:order-2 md:col-span-1">
      <div className="text-[12.5px] font-semibold text-ink">Leaderboard</div>
      <div className="mt-0.5 flex items-center gap-1 text-[10px] text-faint">
        <Icon name="lock" className="size-2.5" strokeWidth={2.5} /> Private · 5 friends
      </div>
      <ol className="mt-1.5 space-y-px">
        {LEADERS.map(([name, xp], i) => (
          <li
            key={name}
            className={`flex items-center gap-2 rounded-lg px-1.5 py-[3px] text-[11px] ${
              i === 0 ? 'bg-crimson/8 font-semibold text-crimson' : 'text-ink'
            }`}
          >
            <span className="w-2.5 text-[10px] font-medium text-faint">{i + 1}</span>
            {i === 0 ? (
              <span className="grid size-[18px] place-items-center rounded-full bg-gold/15 text-gold">
                <Icon name="crown" className="size-3" />
              </span>
            ) : (
              <span className="grid size-[18px] place-items-center overflow-hidden rounded-full bg-[#ece6e0] text-[#b9b0a7]">
                <Icon name="user" className="mt-1 size-4" />
              </span>
            )}
            <span className="flex-1">{name}</span>
            <span className={`text-[10px] ${i === 0 ? 'text-crimson' : 'text-muted'}`}>{xp} XP</span>
          </li>
        ))}
      </ol>
    </Card>
  )
}

function Streak() {
  return (
    <Card className="order-2 flex flex-col justify-center gap-2 p-2.5 md:order-3">
      <div className="flex items-center gap-2">
        <span className="grid size-8 place-items-center rounded-full bg-gold/15 text-gold">
          <Icon name="flame" className="size-[18px]" />
        </span>
        <div>
          <div className="text-[10px] text-faint">Current streak</div>
          <div className="text-[14px] font-bold leading-tight text-ink">7 days</div>
        </div>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: 8 }, (_, i) => (
          <span
            key={i}
            className={`size-2 rounded-full ${i < 6 ? 'bg-crimson' : 'border border-crimson/40'}`}
          />
        ))}
      </div>
    </Card>
  )
}

function Badges() {
  return (
    <Card className="order-4 col-span-2 p-2.5 md:col-span-1">
      <div className="text-[12.5px] font-semibold text-ink">Badges</div>
      <div className="mt-1.5 grid grid-cols-3 gap-1 text-center">
        {BADGES.map((badge) => (
          <div key={badge.label} className="flex flex-col items-center gap-1">
            <span
              className={`grid size-8 place-items-center rounded-full text-white shadow-[0_6px_12px_-6px_rgba(0,0,0,0.5)] ${
                badge.gold
                  ? 'bg-gradient-to-b from-[#f2b552] to-[#d4851c]'
                  : 'bg-gradient-to-b from-[#a8283b] to-crimson-dark'
              }`}
            >
              <Icon name={badge.icon} className="size-4" />
            </span>
            <span className="text-[9px] leading-tight text-muted">{badge.label}</span>
          </div>
        ))}
      </div>
    </Card>
  )
}

export function SidePanel({ className = '' }) {
  return (
    <div className={`${panel} grid grid-cols-2 gap-2 p-2 md:grid-cols-1 ${className}`}>
      <XpRing />
      <Leaderboard />
      <Streak />
      <Badges />
    </div>
  )
}
