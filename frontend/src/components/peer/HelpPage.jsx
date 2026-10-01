import { useEffect, useState } from 'react'
import { askForHelp, getMyHelpRequests, rateReview } from '../../api.js'
import AppLayout from '../AppLayout.jsx'
import Button from '../Button.jsx'
import Icon from '../Icon.jsx'
import { Alert, Card, CopyButton, Eyebrow, Lead, NameGate, Title, fieldClass, timeAgo } from '../ui.jsx'
import { Checks, Improvement, PromptBlock, SkillChips } from './parts.jsx'

const POLL_MS = 10000

const STATUS = {
  waiting: { label: 'Waiting for a reviewer', className: 'bg-gold/15 text-[#8a5410]' },
  reviewed: { label: 'New suggestion', className: 'bg-crimson text-white' },
  rated: { label: 'Done', className: 'bg-cream text-muted' },
}

function AskForm({ user, onCreated }) {
  const [goal, setGoal] = useState('')
  const [prompt, setPrompt] = useState('')
  const [answer, setAnswer] = useState('')
  const [checked, setChecked] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      onCreated(await askForHelp(user, goal.trim(), prompt.trim(), answer.trim()))
      setGoal('')
      setPrompt('')
      setAnswer('')
      setChecked(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setPending(false)
    }
  }

  const ready = goal.trim().length >= 10 && prompt.trim().length >= 3 && checked

  return (
    <form onSubmit={submit}>
      <Card className="space-y-5">
        <label className="block">
          <span className="font-semibold text-ink">What are you trying to achieve?</span>
          <textarea
            rows={2}
            value={goal}
            maxLength={1000}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="e.g. An explanation of regression I can follow as a first-year psychology student"
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className="font-semibold text-ink">Your prompt</span>
          <textarea
            rows={3}
            value={prompt}
            maxLength={4000}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="The prompt you sent to the AI"
            className={fieldClass}
          />
        </label>
        <label className="block">
          <span className="font-semibold text-ink">
            What went wrong? <span className="font-normal text-muted">(optional)</span>
          </span>
          <textarea
            rows={3}
            value={answer}
            maxLength={6000}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Paste the part of the AI's answer that wasn't what you wanted"
            className={fieldClass}
          />
        </label>

        <div className="rounded-2xl bg-cream p-4">
          <p className="flex items-start gap-2.5 text-[0.9rem] leading-relaxed text-ink/85">
            <Icon name="shield" className="mt-0.5 size-[18px] shrink-0 text-crimson" />
            <span>
              Reviewers only see these three fields: never your name or the rest of your
              conversation. Leave out personal details, assignment drafts and anything sensitive.
              Reviewers help you <i>ask</i> better; they won't do the task for you.
            </span>
          </p>
          <label className="mt-3 flex cursor-pointer items-center gap-2.5 text-[0.92rem] font-medium text-ink">
            <input
              type="checkbox"
              checked={checked}
              onChange={(e) => setChecked(e.target.checked)}
              className="size-[18px] accent-crimson"
            />
            There's nothing personal or sensitive in here
          </label>
        </div>

        {error && <Alert>{error}</Alert>}
        <div className="flex justify-end">
          <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={!ready || pending}>
            {pending ? 'Sending…' : 'Ask for help'}
          </Button>
        </div>
      </Card>
    </form>
  )
}

function RequestCard({ request, user, onChange }) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)
  const { review } = request
  const status = STATUS[request.status]

  const rate = async (helped) => {
    setPending(true)
    setError(null)
    try {
      onChange(await rateReview(request.request_id, user, helped))
    } catch (err) {
      setError(err.message)
    } finally {
      setPending(false)
    }
  }

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <div className="min-w-0">
          <h3 className="font-semibold text-ink">{request.title}</h3>
          <p className="mt-0.5 text-[0.82rem] text-faint">Asked {timeAgo(request.created_at)}</p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-[0.78rem] font-semibold ${status.className}`}>
          {status.label}
        </span>
      </div>

      <details className="group mt-4">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-[0.88rem] font-medium text-muted hover:text-crimson">
          <Icon name="chevronRight" className="size-4 transition group-open:rotate-90" />
          What you asked
        </summary>
        <div className="mt-3 space-y-3">
          <p className="text-[0.92rem] text-ink/85">
            <b className="font-semibold text-ink">Goal:</b> {request.goal}
          </p>
          <PromptBlock label="Your prompt">{request.prompt}</PromptBlock>
          <SkillChips skills={request.skills} />
        </div>
      </details>

      {review ? (
        <div className="mt-5 space-y-4 border-t border-line pt-5">
          <PromptBlock label={`Suggested by ${review.reviewer}`} action={<CopyButton text={review.revised_prompt} />}>
            {review.revised_prompt}
          </PromptBlock>
          {review.note && (
            <p className="text-[0.92rem] leading-relaxed text-ink/85">
              <b className="font-semibold text-ink">Why:</b> {review.note}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Improvement value={review.predicted_improvement} />
            <Checks checks={review.checks} />
          </div>

          {request.helped === null ? (
            <div className="rounded-2xl bg-cream p-4">
              <p className="text-[0.92rem] text-ink">
                Try it in your AI chat, then tell {review.reviewer} whether it helped.
              </p>
              {error && <Alert className="mt-3">{error}</Alert>}
              <div className="mt-3 flex flex-wrap gap-2">
                <Button disabled={pending} onClick={() => rate(true)}>
                  <Icon name="thumbUp" className="size-4" /> It helped
                </Button>
                <Button variant="secondary" disabled={pending} onClick={() => rate(false)}>
                  <Icon name="thumbDown" className="size-4" /> It didn't help
                </Button>
              </div>
            </div>
          ) : (
            <p className="flex items-center gap-2 text-[0.9rem] text-muted">
              <Icon name={request.helped ? 'thumbUp' : 'thumbDown'} className="size-4" />
              You said this {request.helped ? 'helped' : "didn't help"}. Thanks for letting{' '}
              {review.reviewer} know.
            </p>
          )}
        </div>
      ) : (
        <p className="mt-4 flex items-center gap-2.5 text-[0.9rem] text-muted">
          <span className="relative flex size-2.5">
            <span className="absolute inline-flex size-full rounded-full bg-gold opacity-60 motion-safe:animate-ping" />
            <span className="relative inline-flex size-2.5 rounded-full bg-gold" />
          </span>
          A Peer Reviewer will suggest a better prompt. It shows up here.
        </p>
      )}
    </Card>
  )
}

function Help({ user }) {
  const [requests, setRequests] = useState(null)
  const [error, setError] = useState(null)
  const waiting = requests?.some((r) => r.status === 'waiting')

  useEffect(() => {
    let cancelled = false
    const load = () =>
      getMyHelpRequests(user).then(
        (data) => {
          if (cancelled) return
          setRequests(data)
          setError(null)
        },
        (err) => !cancelled && setError(err.message),
      )
    load()
    // Reviews arrive while the student waits, so check again every few seconds.
    const timer = waiting ? setInterval(() => document.hidden || load(), POLL_MS) : null
    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [user, waiting])

  const replace = (updated) =>
    setRequests((list) => list.map((r) => (r.request_id === updated.request_id ? updated : r)))

  return (
    <section className="pt-4 sm:pt-10">
      <Eyebrow>Peer help</Eyebrow>
      <Title className="mt-3">Ask a peer for prompt help</Title>
      <Lead className="mt-4">
        Not getting what you want from an AI assistant? A student who's good at prompting suggests a
        better prompt. You try it, and tell them whether it helped.
      </Lead>

      <div className="mt-8">
        <AskForm user={user} onCreated={(created) => setRequests((list) => [created, ...(list ?? [])])} />
      </div>

      {error && <Alert className="mt-6">{error}</Alert>}
      {requests?.length > 0 && (
        <div className="mt-12">
          <h2 className="text-[1.2rem] font-semibold tracking-tight text-ink">Your requests</h2>
          <div className="mt-4 space-y-4">
            {requests.map((request) => (
              <RequestCard key={request.request_id} request={request} user={user} onChange={replace} />
            ))}
          </div>
        </div>
      )}
    </section>
  )
}

export default function HelpPage() {
  return (
    <AppLayout title="Get prompt help">
      <NameGate why="So you can find your requests again. Reviewers never see your name.">
        {(name) => <Help user={name} />}
      </NameGate>
    </AppLayout>
  )
}
