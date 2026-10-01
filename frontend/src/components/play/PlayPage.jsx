import { useEffect, useState } from 'react'
import { createChallenge, getChallenge, getExpertise, revealChallenge, submitAttempt } from '../../api.js'
import { useSearchParam } from '../../url.js'
import AppLayout from '../AppLayout.jsx'
import Button from '../Button.jsx'
import Icon from '../Icon.jsx'
import Markdown from '../Markdown.jsx'
import Working from '../Working.jsx'
import { SkillsCard } from '../expertise/ExpertisePage.jsx'
import { Alert, Card, Eyebrow, Lead, NameGate, ScoreRing, SkillRow, Title, fieldClass } from '../ui.jsx'

const HOW_IT_WORKS = [
  { icon: 'book', title: 'Read the answer', text: 'An AI wrote it for a hidden prompt.' },
  { icon: 'message', title: 'Write the prompt', text: 'Scored on intent, audience, structure and constraints.' },
  { icon: 'refresh', title: 'Revise once', text: 'Use the hints. Your revision also scores Iteration.' },
]

function Intro({ user, error, onStart }) {
  const [expertise, setExpertise] = useState(null)

  useEffect(() => {
    let cancelled = false
    getExpertise(user).then((data) => !cancelled && setExpertise(data), () => {})
    return () => {
      cancelled = true
    }
  }, [user])

  return (
    <section className="grid gap-10 pt-4 sm:pt-10 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start lg:gap-14">
      <div>
        <Eyebrow>Play · Reverse prompting</Eyebrow>
        <Title className="mt-3">Can you guess the prompt?</Title>
        <Lead className="mt-4">
          You get an answer an AI wrote. Write the prompt you think produced it. The closer you get,
          the better you understand what makes prompts work.
        </Lead>
        <ol className="mt-8 space-y-4">
          {HOW_IT_WORKS.map((step, i) => (
            <li key={step.title} className="flex items-start gap-3.5">
              <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-crimson shadow-sm ring-1 ring-line">
                <Icon name={step.icon} className="size-5" strokeWidth={1.75} />
              </span>
              <span className="leading-snug">
                <b className="block text-[0.95rem] font-semibold text-ink">
                  {i + 1}. {step.title}
                </b>
                <span className="text-[0.9rem] text-muted">{step.text}</span>
              </span>
            </li>
          ))}
        </ol>
        {error && <Alert className="mt-6">{error}</Alert>}
        <Button size="lg" className="mt-8 w-full sm:w-auto" onClick={onStart}>
          Start a challenge <Icon name="arrowRight" className="size-5" />
        </Button>
      </div>
      {expertise && (
        <div>
          <div className="mb-2 flex items-baseline justify-between px-1">
            <span className="text-[0.86rem] font-semibold text-muted">Your expertise</span>
            <a href="/expertise" className="text-[0.86rem] font-semibold text-crimson hover:underline">
              Level {expertise.level} · {expertise.status}
            </a>
          </div>
          <SkillsCard expertise={expertise} />
        </div>
      )}
    </section>
  )
}

function Difficulty({ level }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-[0.8rem] font-medium text-muted">
      Difficulty
      <span className="flex gap-0.5" aria-label={`${level} of 3`}>
        {[1, 2, 3].map((n) => (
          <span key={n} className={`size-2 rounded-full ${n <= level ? 'bg-crimson' : 'bg-line'}`} />
        ))}
      </span>
    </span>
  )
}

function AttemptScores({ attempt, number, showTips }) {
  return (
    <>
      <div className="flex items-center gap-4">
        <ScoreRing score={attempt.overall} className="size-16" numberClassName="text-[1.1rem]" />
        <div className="min-w-0">
          <p className="text-[0.8rem] font-semibold tracking-[0.12em] text-faint uppercase">Attempt {number}</p>
          <p className="mt-1 line-clamp-2 text-[0.92rem] leading-snug text-ink/80 italic">“{attempt.prompt}”</p>
        </div>
      </div>
      <div className="mt-5 space-y-4">
        {attempt.scores.map((s) => (
          <SkillRow key={s.skill} name={s.name} score={s.score}>
            {showTips && s.tip}
          </SkillRow>
        ))}
      </div>
    </>
  )
}

function Finished({ challenge, change, onNext }) {
  const [first, last] = [challenge.attempts[0], challenge.attempts.at(-1)]
  const levelUp = change && change.expertise.level > change.level_before
  return (
    <div className="space-y-4">
      <div className="rounded-[24px] bg-[#fdf7f7] p-5 ring-1 ring-crimson/20 sm:p-6">
        <Eyebrow>The hidden prompt</Eyebrow>
        <p className="mt-3 text-[0.98rem] leading-relaxed whitespace-pre-wrap text-ink">{challenge.hidden_prompt}</p>
        <p className="mt-4 text-[0.85rem] text-muted">
          Theme: {challenge.theme}
          {challenge.attempts.length > 1 && (
            <>
              {' · '}You went from <b className="text-ink">{first.overall}</b> to{' '}
              <b className="text-ink">{last.overall}</b>
            </>
          )}
        </p>
      </div>

      {change?.became_reviewer && (
        <div className="flex items-center gap-4 rounded-[24px] bg-gradient-to-br from-[#9b2234] to-crimson-dark p-5 text-white shadow-[0_24px_50px_-26px_rgba(139,26,43,0.9)]">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-gold text-white">
            <Icon name="award" className="size-6" />
          </span>
          <div className="flex-1">
            <p className="font-semibold">You unlocked Peer Reviewer!</p>
            <p className="text-[0.9rem] text-white/80">You can now help other students write better prompts.</p>
          </div>
          <Button href="/review" variant="secondary" className="hidden sm:inline-flex">
            Review
          </Button>
        </div>
      )}
      {levelUp && !change.became_reviewer && (
        <p className="flex items-center gap-3 rounded-2xl bg-gold/12 px-4 py-3 text-[0.95rem] text-ink ring-1 ring-gold/30">
          <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gold text-white">
            <Icon name="trophy" className="size-5" />
          </span>
          <span>
            <b className="font-semibold">Level up!</b> You're now level {change.expertise.level}.
          </span>
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={onNext}>
          Next challenge <Icon name="arrowRight" className="size-5" />
        </Button>
        <Button size="lg" variant="secondary" href={change?.became_reviewer ? '/review' : '/expertise'}>
          {change?.became_reviewer ? 'Review requests' : 'See your expertise'}
        </Button>
      </div>
    </div>
  )
}

function ChallengeView({ challenge, change, onUpdate, onNext }) {
  const { attempts } = challenge
  const [draft, setDraft] = useState(attempts.at(-1)?.prompt ?? '')
  const [pending, setPending] = useState(null) // 'attempt' | 'reveal'
  const [error, setError] = useState(null)
  const revising = attempts.length > 0

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

  const submit = (e) => {
    e.preventDefault()
    run('attempt', async () => {
      const result = await submitAttempt(challenge.challenge_id, draft.trim())
      onUpdate(result.challenge, result.change)
    })
  }

  const reveal = () =>
    run('reveal', async () => onUpdate(await revealChallenge(challenge.challenge_id), change))

  return (
    <section className="pt-4 sm:pt-8">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
        <div>
          <Eyebrow>Reverse prompting</Eyebrow>
          <h1 className="mt-2 text-[clamp(1.7rem,4.4vw,2.4rem)] leading-[1.08] font-bold tracking-[-0.035em] text-ink">
            {challenge.finished ? 'Here’s how you did' : 'What prompt produced this answer?'}
          </h1>
        </div>
        <Difficulty level={challenge.difficulty} />
      </div>

      <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] lg:items-start">
        <Card className="lg:sticky lg:top-6">
          <p className="flex items-center gap-2 text-[0.8rem] font-semibold tracking-[0.12em] text-faint uppercase">
            <span className="grid size-6 place-items-center rounded-full bg-crimson text-white">
              <Icon name="message" className="size-3.5" />
            </span>
            The AI's answer
          </p>
          <Markdown className="mt-4">{challenge.answer}</Markdown>
        </Card>

        <div className="space-y-4">
          {attempts.map((attempt, i) => {
            const latest = i === attempts.length - 1
            return latest ? (
              <Card key={i}>
                <AttemptScores attempt={attempt} number={i + 1} showTips />
              </Card>
            ) : (
              <details key={i} className="group rounded-[24px] bg-white ring-1 ring-line">
                <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-4 text-[0.92rem] font-semibold text-ink sm:px-6">
                  Attempt {i + 1}: {attempt.overall} overall
                  <Icon name="chevronRight" className="size-4 text-faint transition group-open:rotate-90" />
                </summary>
                <div className="px-5 pb-5 sm:px-6 sm:pb-6">
                  <AttemptScores attempt={attempt} number={i + 1} showTips />
                </div>
              </details>
            )
          })}

          {challenge.finished ? (
            <Finished challenge={challenge} change={change} onNext={onNext} />
          ) : (
            <form onSubmit={submit}>
              <Card>
                <label htmlFor="prompt" className="flex items-baseline justify-between gap-3">
                  <span className="font-semibold text-ink">{revising ? 'Revise your prompt' : 'Your prompt'}</span>
                  <span className="text-[0.8rem] text-faint">
                    Attempt {attempts.length + 1} of {challenge.max_attempts}
                  </span>
                </label>
                <textarea
                  id="prompt"
                  rows={revising ? 6 : 5}
                  value={draft}
                  maxLength={2000}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Write the prompt you think a student sent to get this answer…"
                  className={`${fieldClass} mt-3 resize-y`}
                />
                <p className="mt-2 text-[0.84rem] text-muted">
                  {revising
                    ? 'Use the hints above. Your revision also scores Iteration.'
                    : 'Look at who it’s written for, how it’s laid out and what limits it keeps to.'}
                </p>
                {error && <Alert className="mt-4">{error}</Alert>}
                <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  {revising && (
                    <Button variant="secondary" disabled={Boolean(pending)} onClick={reveal}>
                      {pending === 'reveal' ? 'Revealing…' : 'Reveal the prompt'}
                    </Button>
                  )}
                  <Button type="submit" disabled={Boolean(pending) || draft.trim().length < 3}>
                    {pending === 'attempt' ? 'Scoring…' : revising ? 'Score my revision' : 'Score my prompt'}
                  </Button>
                </div>
              </Card>
            </form>
          )}
        </div>
      </div>
    </section>
  )
}

function Play({ user }) {
  const [challengeId, setChallengeId] = useSearchParam('challenge')
  const [challenge, setChallenge] = useState(null)
  const [change, setChange] = useState(null) // expertise change from the latest attempt
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState(null)
  const [loadError, setLoadError] = useState(null)

  const needLoad = Boolean(challengeId) && challenge?.challenge_id !== challengeId

  useEffect(() => {
    if (!needLoad) return
    let cancelled = false
    setLoadError(null)
    getChallenge(challengeId).then(
      (data) => !cancelled && setChallenge(data),
      (err) => !cancelled && setLoadError(err),
    )
    return () => {
      cancelled = true
    }
  }, [challengeId, needLoad])

  const start = async () => {
    setStarting(true)
    setError(null)
    try {
      const created = await createChallenge(user)
      setChallenge(created)
      setChange(null)
      setChallengeId(created.challenge_id)
    } catch (err) {
      setError(err.message)
    } finally {
      setStarting(false)
    }
  }

  if (starting) {
    return (
      <Working
        title="Writing a challenge for you"
        messages={['Thinking of a task a student might have…', 'Letting the AI answer it…']}
      />
    )
  }
  if (!challengeId) return <Intro user={user} error={error} onStart={start} />
  if (loadError) {
    return (
      <section className="py-16 text-center">
        <h1 className="text-[1.8rem] font-bold tracking-tight text-ink">
          {loadError.status === 404 ? 'This challenge has expired' : 'Something went wrong'}
        </h1>
        <p className="mt-3 text-muted">
          {loadError.status === 404 ? 'Challenges are kept until the server restarts.' : loadError.message}
        </p>
        <Button size="lg" className="mt-8" onClick={start}>
          Start a new challenge
        </Button>
      </section>
    )
  }
  if (needLoad) return <Working title="Loading your challenge" />
  return (
    <ChallengeView
      key={challenge.challenge_id}
      challenge={challenge}
      change={change}
      onUpdate={(updated, updatedChange) => {
        setChallenge(updated)
        // Celebrate what the whole challenge achieved, not just its last attempt.
        setChange((previous) =>
          previous && updatedChange
            ? {
                ...updatedChange,
                level_before: previous.level_before,
                became_reviewer: previous.became_reviewer || updatedChange.became_reviewer,
              }
            : updatedChange,
        )
      }}
      onNext={start}
    />
  )
}

export default function PlayPage() {
  return (
    <AppLayout title="Play" wide>
      <NameGate why="Your prompting skills are tracked under your name.">
        {(name) => <Play user={name} />}
      </NameGate>
    </AppLayout>
  )
}
