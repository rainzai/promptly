import Icon from '../Icon.jsx'

// Small building blocks shared by the steps of the learning flow.

export function Eyebrow({ className = '', children }) {
  return (
    <p className={`text-[11px] font-semibold tracking-[0.14em] text-crimson uppercase ${className}`}>
      {children}
    </p>
  )
}

export function Title({ className = '', children }) {
  return (
    <h1
      className={`text-[clamp(2rem,5.4vw,3.1rem)] leading-[1.06] font-bold tracking-[-0.04em] text-balance text-ink ${className}`}
    >
      {children}
    </h1>
  )
}

export function Lead({ className = '', children }) {
  return (
    <p className={`max-w-[36rem] text-[1.02rem] leading-relaxed text-muted sm:text-[1.1rem] ${className}`}>
      {children}
    </p>
  )
}

export function Alert({ className = '', children }) {
  return (
    <p
      role="alert"
      className={`flex items-start gap-2.5 rounded-2xl bg-rose-50 px-4 py-3 text-[0.92rem] leading-snug text-rose-800 ring-1 ring-rose-200 ${className}`}
    >
      <Icon name="alert" className="mt-px size-[18px] shrink-0" />
      <span>{children}</span>
    </p>
  )
}

/** The student's rank in a subject and how far it is to the next one. */
export function RankCard({ rank, className = '' }) {
  const toNext = rank.points_to_next
  const fraction = toNext == null ? 1 : rank.points / (rank.points + toNext)
  return (
    <div className={`flex items-center gap-3 rounded-2xl bg-white px-4 py-3 ring-1 ring-line ${className}`}>
      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gold/15 text-gold">
        <Icon name="award" className="size-5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-3">
          <b className="text-[0.95rem] font-semibold text-ink">{rank.rank}</b>
          <span className="text-[0.8rem] font-medium whitespace-nowrap text-muted">{rank.points} pts</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-line">
          <span
            className="block h-full rounded-full bg-gradient-to-r from-crimson to-[#c23a50] transition-[width] duration-700"
            style={{ width: `${fraction * 100}%` }}
          />
        </div>
        <p className="mt-1 text-[0.75rem] text-faint">
          {rank.next_rank ? `${toNext} pts to ${rank.next_rank}` : 'Highest rank reached'}
        </p>
      </div>
    </div>
  )
}
