import { useCallback, useEffect, useState } from 'react'
import { checkReview, getExpertise, getHelpRequest, getReviewQueue, submitReview } from '../../api.js'
import { useSearchParam } from '../../url.js'
import AppLayout from '../AppLayout.jsx'
import Button from '../Button.jsx'
import Icon from '../Icon.jsx'
import Markdown from '../Markdown.jsx'
import Working from '../Working.jsx'
import ReviewerStatus from '../expertise/ReviewerStatus.jsx'
import { Alert, Card, Eyebrow, Lead, NameGate, Title, fieldClass, timeAgo } from '../ui.jsx'
import { Checks, Improvement, PromptBlock, SkillChips } from './parts.jsx'

function Queue({ reviewer, onOpen }) {
  const [items, setItems] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setItems(await getReviewQueue(reviewer))
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [reviewer])

  useEffect(() => {
    load()
  }, [load])

  return (
    <section className="pt-4 sm:pt-10">
      <Eyebrow>Peer review</Eyebrow>
      <Title className="mt-3">Help a student prompt better</Title>
      <Lead className="mt-4">
        Improve their prompt so the AI gives them what they need. Help them ask; don't do the task
        for them. Requests that match your strengths come first.
      </Lead>

      <div className="mt-8 flex items-center justify-between">
        <h2 className="text-[1.1rem] font-semibold text-ink">
          Open requests{items ? ` (${items.length})` : ''}
        </h2>
        <Button variant="secondary" disabled={loading} onClick={load}>
          <Icon name="refresh" className={`size-4 ${loading ? 'motion-safe:animate-spin' : ''}`} /> Refresh
        </Button>
      </div>
      {error && <Alert className="mt-4">{error}</Alert>}
      {items?.length === 0 && (
        <Card className="mt-4 text-center">
          <p className="font-semibold text-ink">No open requests right now</p>
          <p className="mt-1 text-[0.92rem] text-muted">Check back soon, or sharpen your skills with a challenge.</p>
          <Button href="/play" variant="secondary" className="mt-4">
            Play a challenge
          </Button>
        </Card>
      )}
      <ul className="mt-4 space-y-3">
        {items?.map(({ request, match, strengths }) => (
          <li key={request.request_id}>
            <button
              type="button"
              onClick={() => onOpen(request.request_id)}
              className="group block w-full rounded-[22px] bg-white p-5 text-left ring-1 ring-line transition hover:-translate-y-px hover:ring-crimson/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="font-semibold text-ink">{request.title}</h3>
                  <p className="mt-1 line-clamp-2 text-[0.9rem] text-muted">{request.goal}</p>
                </div>
                <span className="shrink-0 text-right">
                  <b className="block text-[1.15rem] font-bold text-crimson">{match}%</b>
                  <span className="text-[0.75rem] text-faint">match</span>
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <SkillChips skills={request.skills} strengths={strengths} />
                <span className="flex items-center gap-1 text-[0.82rem] text-faint">
                  {timeAgo(request.created_at)}
                  <Icon name="chevronRight" className="size-4 text-crimson transition group-hover:translate-x-0.5" />
                </span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

function Workspace({ reviewer, requestId, onBack }) {
  const [request, setRequest] = useState(null)
  const [loadError, setLoadError] = useState(null)
  const [revised, setRevised] = useState('')
  const [note, setNote] = useState('')
  const [check, setCheck] = useState(null) // {text, result}: the AI check of a draft
  const [pending, setPending] = useState(null) // 'check' | 'send'
  const [error, setError] = useState(null)
  const [sent, setSent] = useState(null)

  useEffect(() => {
    let cancelled = false
    getHelpRequest(requestId).then(
      (data) => {
        if (cancelled) return
        setRequest(data)
        setRevised(data.prompt)
      },
      (err) => !cancelled && setLoadError(err),
    )
    return () => {
      cancelled = true
    }
  }, [requestId])

  if (loadError) {
    return (
      <section className="py-16 text-center">
        <Alert className="mx-auto max-w-md text-left">{loadError.message}</Alert>
        <Button className="mt-6" onClick={onBack}>
          Back to requests
        </Button>
      </section>
    )
  }
  if (!request) return <Working title="Loading the request" />

  const draft = `${revised.trim()}\n${note.trim()}`
  const checked = check?.text === draft ? check.result : null
  const unchanged = revised.trim() === request.prompt.trim()

  const run = async (kind, action) => {
    setPending(kind)
    setError(null)
    try {
      await action()
    } catch (err) {
      setError(err.message)
    } finally {
      setPending(null)
    }
  }

  const runCheck = () =>
    run('check', async () => {
      const result = await checkReview(requestId, reviewer, revised.trim(), note.trim() || null)
      setCheck({ text: draft, result })
    })

  const send = (e) => {
    e.preventDefault()
    run('send', async () => setSent(await submitReview(requestId, reviewer, revised.trim(), note.trim() || null)))
  }

  if (sent) {
    const { expertise, level_before: before } = sent.change
    return (
      <section className="mx-auto max-w-lg py-12 text-center sm:py-16">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-500 text-white shadow-[0_16px_30px_-14px_rgba(16,120,80,0.7)]">
          <Icon name="check" className="size-8" strokeWidth={2.5} />
        </span>
        <h1 className="mt-6 text-[clamp(1.8rem,4.4vw,2.4rem)] leading-tight font-bold tracking-[-0.035em] text-ink">
          Sent to the student
        </h1>
        <p className="mt-3 text-[1rem] leading-relaxed text-muted">
          They'll try your prompt and say whether it helped. This review counts towards your
          expertise{expertise.level > before ? `, and you're now level ${expertise.level}` : ''}.
        </p>
        <div className="mt-5 flex justify-center">
          <Improvement value={sent.check.predicted_improvement} />
        </div>
        <Button size="lg" className="mt-8" onClick={onBack}>
          Back to requests
        </Button>
      </section>
    )
  }

  return (
    <section className="pt-4 sm:pt-8">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full text-[0.92rem] font-medium text-muted transition hover:text-crimson"
      >
        <Icon name="arrowLeft" className="size-4" /> All requests
      </button>
      <h1 className="mt-4 text-[clamp(1.7rem,4.4vw,2.4rem)] leading-[1.08] font-bold tracking-[-0.035em] text-ink">
        {request.title}
      </h1>
      <p className="mt-2 text-[0.88rem] text-faint">Asked {timeAgo(request.created_at)} · anonymous</p>

      <Card className="mt-6 space-y-4">
        <div>
          <span className="text-[0.8rem] font-semibold tracking-[0.12em] text-faint uppercase">Goal</span>
          <p className="mt-1.5 text-[1rem] leading-relaxed text-ink">{request.goal}</p>
        </div>
        <PromptBlock label="Current prompt">{request.prompt}</PromptBlock>
        {request.ai_response && (
          <details className="group">
            <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-[0.88rem] font-medium text-muted hover:text-crimson">
              <Icon name="chevronRight" className="size-4 transition group-open:rotate-90" />
              The answer they got
            </summary>
            <div className="mt-3 rounded-xl bg-paper p-4 ring-1 ring-line">
              <Markdown>{request.ai_response}</Markdown>
            </div>
          </details>
        )}
        <SkillChips skills={request.skills} />
      </Card>

      <form onSubmit={send} className="mt-4">
        <Card className="space-y-5">
          <div className="rounded-2xl bg-cream px-4 py-3 text-[0.9rem] leading-relaxed text-ink/85">
            <b className="font-semibold text-ink">Your task:</b> improve the prompt while keeping the
            student's goal. Help them ask; don't answer the task yourself.
          </div>
          <label className="block">
            <span className="font-semibold text-ink">Improved prompt</span>
            <textarea
              rows={6}
              value={revised}
              maxLength={4000}
              onChange={(e) => setRevised(e.target.value)}
              className={`${fieldClass} resize-y`}
            />
          </label>
          <label className="block">
            <span className="font-semibold text-ink">
              Why it's better <span className="font-normal text-muted">(optional)</span>
            </span>
            <textarea
              rows={2}
              value={note}
              maxLength={1000}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. I said who the answer is for and asked for one everyday example."
              className={fieldClass}
            />
          </label>

          {checked && (
            <div className="space-y-3 rounded-2xl p-4 ring-1 ring-line">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[0.8rem] font-semibold tracking-[0.12em] text-faint uppercase">AI check</span>
                <Improvement value={checked.predicted_improvement} />
              </div>
              <Checks checks={checked.checks} />
              {!checked.integrity_ok && (
                <Alert>
                  This does the task for the student, so it can't be sent. {checked.integrity_note}
                </Alert>
              )}
            </div>
          )}
          {check && !checked && (
            <p className="text-[0.86rem] text-faint">You changed the prompt since the last check.</p>
          )}
          {error && <Alert>{error}</Alert>}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" disabled={Boolean(pending) || unchanged} onClick={runCheck}>
              {pending === 'check' ? 'Checking…' : 'Check with AI'}
            </Button>
            <Button
              type="submit"
              disabled={Boolean(pending) || unchanged || checked?.integrity_ok === false}
            >
              {pending === 'send' ? 'Sending…' : 'Send to student'}
            </Button>
          </div>
        </Card>
      </form>
    </section>
  )
}

function Review({ reviewer }) {
  const [expertise, setExpertise] = useState(null)
  const [error, setError] = useState(null)
  const [requestId, setRequestId] = useSearchParam('request')

  useEffect(() => {
    let cancelled = false
    getExpertise(reviewer).then(
      (data) => !cancelled && setExpertise(data),
      (err) => !cancelled && setError(err.message),
    )
    return () => {
      cancelled = true
    }
  }, [reviewer])

  if (error) return <Alert className="mt-10">{error}</Alert>
  if (!expertise) return <Working title="Checking your reviewer status" />
  if (!expertise.reviewer) {
    return (
      <section className="grid gap-8 pt-4 sm:pt-10 md:grid-cols-[minmax(0,1fr)_340px] md:items-start">
        <div>
          <Eyebrow>Peer review</Eyebrow>
          <Title className="mt-3">Help other students prompt better</Title>
          <Lead className="mt-4">
            Peer Reviewers improve the prompts of students who aren't getting what they want from
            an AI assistant. It's a role you earn: show steady prompting skill over several reverse-prompt
            challenges.
          </Lead>
        </div>
        <ReviewerStatus expertise={expertise} />
      </section>
    )
  }
  if (requestId) {
    return <Workspace key={requestId} reviewer={reviewer} requestId={requestId} onBack={() => setRequestId(null)} />
  }
  return <Queue reviewer={reviewer} onOpen={setRequestId} />
}

export default function ReviewPage() {
  return (
    <AppLayout title="Peer review">
      <NameGate why="Peer Reviewers review under their name.">
        {(name) => <Review reviewer={name} />}
      </NameGate>
    </AppLayout>
  )
}
