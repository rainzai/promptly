import Button from '../Button.jsx'
import Icon from '../Icon.jsx'
import { Card } from '../ui.jsx'

/** Peer Reviewer status: what it lets you do, or what it still takes. */
export default function ReviewerStatus({ expertise, className = '' }) {
  const rated = expertise.helped + expertise.not_helped

  if (expertise.reviewer) {
    return (
      <Card className={className}>
        <span className="grid size-12 place-items-center rounded-full bg-gradient-to-b from-[#f2b552] to-[#d4851c] text-white shadow-[0_10px_20px_-10px_rgba(212,133,28,0.9)]">
          <Icon name="award" className="size-6" />
        </span>
        <h2 className="mt-4 text-[1.15rem] font-semibold text-ink">You're a Peer Reviewer</h2>
        <p className="mt-1.5 text-[0.92rem] leading-relaxed text-muted">
          Help other students tell the AI what they need. Reviewing also counts towards your
          expertise.
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3 text-center">
          <div className="rounded-xl bg-cream px-3 py-2.5">
            <dt className="text-[0.75rem] text-muted">Reviews</dt>
            <dd className="text-[1.2rem] font-bold text-ink">{expertise.reviews}</dd>
          </div>
          <div className="rounded-xl bg-cream px-3 py-2.5">
            <dt className="text-[0.75rem] text-muted">Found it helpful</dt>
            <dd className="text-[1.2rem] font-bold text-ink">
              {rated ? `${expertise.helped} / ${rated}` : '–'}
            </dd>
          </div>
        </dl>
        <Button href="/review" className="mt-5 w-full">
          Review requests <Icon name="arrowRight" className="size-4" />
        </Button>
      </Card>
    )
  }

  const paused = expertise.status !== 'Learner'
  return (
    <Card className={className}>
      <span className="grid size-12 place-items-center rounded-full bg-cream text-muted">
        <Icon name="lock" className="size-6" />
      </span>
      <h2 className="mt-4 text-[1.15rem] font-semibold text-ink">
        {paused ? 'Peer Reviewer: paused' : 'Unlock Peer Reviewer'}
      </h2>
      <p className="mt-1.5 text-[0.92rem] leading-relaxed text-muted">
        {paused
          ? 'Most students you helped said your reviews didn’t help. Sharpen your skills with a few more challenges to start reviewing again.'
          : 'Show steady skill over several challenges, then help other students write better prompts.'}
      </p>
      <ul className="mt-4 space-y-2.5">
        {expertise.requirements.map((req) => (
          <li key={req.label} className="flex items-start gap-2.5 text-[0.9rem]">
            <span
              className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-full ${
                req.met ? 'bg-emerald-500 text-white' : 'border-[1.5px] border-[#d9d0c7]'
              }`}
            >
              {req.met && <Icon name="check" className="size-3" strokeWidth={3} />}
            </span>
            <span className={req.met ? 'text-muted' : 'text-ink'}>
              {req.label}
              {req.progress && <span className="ml-1.5 text-faint tabular-nums">({req.progress})</span>}
              <span className="sr-only">{req.met ? ' (done)' : ' (not yet)'}</span>
            </span>
          </li>
        ))}
      </ul>
      <Button href="/play" className="mt-5 w-full">
        Play a challenge <Icon name="arrowRight" className="size-4" />
      </Button>
    </Card>
  )
}
