import { useState } from 'react'
import Button from './Button.jsx'
import Icon from './Icon.jsx'
import { useUserName } from '../user.js'

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

/** A score from 0 to 100 as a ring, with a label under the number. */
export function ScoreRing({ score, label, className = 'size-24', numberClassName = 'text-[1.6rem]' }) {
  const r = 50
  return (
    <div className={`relative shrink-0 ${className}`}>
      <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#f2e8e2" strokeWidth="10" />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          stroke="currentColor"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(score / 100) * 2 * Math.PI * r} 999`}
          className="text-crimson transition-[stroke-dasharray] duration-700"
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <span className={`leading-none font-bold text-ink ${numberClassName}`}>{score}</span>
        {label && <span className="mt-1 text-[0.65rem] font-semibold tracking-wider text-muted uppercase">{label}</span>}
      </div>
    </div>
  )
}

/** One skill: its name, a bar for the score, and an optional line under it. */
export function SkillRow({ name, score, children }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[0.92rem] font-semibold text-ink">{name}</span>
        <span className="text-[0.92rem] font-semibold text-ink tabular-nums">{score ?? '–'}</span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line">
        <span
          className="block h-full rounded-full bg-gradient-to-r from-crimson to-[#c23a50] transition-[width] duration-700"
          style={{ width: `${score ?? 0}%` }}
        />
      </div>
      {children && <div className="mt-1.5 text-[0.85rem] leading-snug text-muted">{children}</div>}
    </div>
  )
}

export function Card({ className = '', children }) {
  return <div className={`rounded-[24px] bg-white p-5 ring-1 ring-line sm:p-6 ${className}`}>{children}</div>
}

export function CopyButton({ text, className = '' }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard blocked: the text is still there to select by hand.
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-[0.82rem] font-semibold text-ink shadow-sm ring-1 ring-line transition hover:bg-cream ${className}`}
    >
      <Icon name={copied ? 'check' : 'copy'} className="size-4" />
      {copied ? 'Copied' : 'Copy'}
    </button>
  )
}

const MINUTE = 60 * 1000

export function timeAgo(date) {
  const minutes = Math.round((Date.now() - new Date(date).getTime()) / MINUTE)
  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} h ago`
  return new Date(date).toLocaleDateString()
}

/** Renders children(name) once the student has said what to call them. */
export function NameGate({ why, children }) {
  const [name, setName] = useUserName()
  const [draft, setDraft] = useState('')
  if (name) return children(name)
  return (
    <form
      className="mx-auto max-w-md pt-10 text-center sm:pt-16"
      onSubmit={(e) => {
        e.preventDefault()
        if (draft.trim()) setName(draft.trim())
      }}
    >
      <Eyebrow>Before we start</Eyebrow>
      <h1 className="mt-3 text-[clamp(1.8rem,4.4vw,2.4rem)] leading-tight font-bold tracking-[-0.035em] text-ink">
        What should we call you?
      </h1>
      <p className="mt-3 text-[1rem] leading-relaxed text-muted">{why}</p>
      <input
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        maxLength={40}
        autoComplete="nickname"
        aria-label="Your name"
        placeholder="Your name"
        className="mt-6 block w-full rounded-xl border border-line bg-white px-4 py-3 text-center text-[1rem] text-ink outline-none transition placeholder:text-faint focus:border-crimson focus:ring-3 focus:ring-crimson/12"
      />
      <Button type="submit" size="lg" className="mt-4 w-full" disabled={!draft.trim()}>
        Continue <Icon name="arrowRight" className="size-5" />
      </Button>
    </form>
  )
}

export const fieldClass =
  'mt-1.5 block w-full rounded-xl border border-line bg-paper px-4 py-3 text-[1rem] leading-relaxed text-ink outline-none transition placeholder:text-faint focus:border-crimson focus:ring-3 focus:ring-crimson/12'
