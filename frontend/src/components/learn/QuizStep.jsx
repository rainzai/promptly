import { useEffect, useRef, useState } from 'react'
import { answerQuestion, getProgress, getQuiz } from '../../api.js'
import Button from '../Button.jsx'
import Icon from '../Icon.jsx'
import Mascot from '../Mascot.jsx'
import { Alert, Eyebrow, RankCard } from '../ui.jsx'

const LETTERS = 'ABCD'

/** All questions in order, each with the level it belongs to. */
const questionsOf = (quiz) =>
  quiz.levels.flatMap((level) => level.questions.map((question) => ({ ...question, level })))

const firstOpen = (quiz) => questionsOf(quiz).find((q) => !q.result)?.question_id ?? null

function withResult(quiz, questionId, result) {
  return {
    ...quiz,
    answered: quiz.answered + 1,
    points_earned: quiz.points_earned + result.points_earned,
    levels: quiz.levels.map((level) => ({
      ...level,
      questions: level.questions.map((q) => (q.question_id === questionId ? { ...q, result } : q)),
    })),
  }
}

const dotColor = (question, current) => {
  if (question.result) return question.result.correct ? 'bg-emerald-500' : 'bg-rose-400'
  return current ? 'bg-crimson' : 'bg-line'
}

function LevelTrack({ quiz, currentId }) {
  return (
    <ol className="mt-6 grid grid-cols-5 gap-1.5 sm:gap-2" aria-label="Levels">
      {quiz.levels.map((level) => {
        const active = level.questions.some((q) => q.question_id === currentId)
        return (
          <li
            key={level.level}
            aria-current={active ? 'step' : undefined}
            className={`rounded-xl px-2 py-2 transition sm:px-3 ${
              active ? 'bg-white shadow-[0_10px_24px_-16px_rgba(70,30,20,0.6)] ring-1 ring-crimson/25' : ''
            }`}
          >
            <span className={`block truncate text-[11px] font-semibold ${active ? 'text-crimson' : 'text-muted'}`}>
              <span className="sm:hidden">L{level.level}</span>
              <span className="hidden sm:inline">
                {level.level}. {level.name}
              </span>
            </span>
            <span className="mt-1.5 flex gap-1">
              {level.questions.map((q) => (
                <span
                  key={q.question_id}
                  className={`h-1.5 flex-1 rounded-full ${dotColor(q, q.question_id === currentId)}`}
                />
              ))}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

const OPTION_STYLES = {
  idle: 'border-line bg-white hover:border-crimson/40',
  selected: 'border-crimson bg-[#fdf7f7] ring-1 ring-crimson',
  correct: 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500',
  wrong: 'border-rose-300 bg-rose-50',
  other: 'border-line bg-white opacity-55',
}

const BADGE_STYLES = {
  idle: 'bg-cream text-muted',
  selected: 'bg-crimson text-white',
  correct: 'bg-emerald-600 text-white',
  wrong: 'bg-rose-500 text-white',
  other: 'bg-cream text-faint',
}

function QuestionCard({ quiz, question, number, total, next, focusOnMount, onAnswered, onSync, onNext }) {
  const [selected, setSelected] = useState(null)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)
  const [rankUp, setRankUp] = useState(null)
  const cardRef = useRef(null)
  const headingRef = useRef(null)
  const nextRef = useRef(null)
  const result = question.result
  const { level } = question

  // Moving on from the previous question: bring the new one into view and announce it.
  useEffect(() => {
    if (!focusOnMount) return
    if (cardRef.current.getBoundingClientRect().top < 0) cardRef.current.scrollIntoView()
    headingRef.current.focus({ preventScroll: true })
  }, [focusOnMount])

  useEffect(() => {
    if (result) nextRef.current?.focus({ preventScroll: true })
  }, [result])

  const check = async (e) => {
    e.preventDefault()
    if (selected === null || pending || result) return
    setPending(true)
    setError(null)
    try {
      const answer = await answerQuestion(quiz.quiz_id, question.question_id, selected)
      onAnswered(question.question_id, answer)
      if (answer.subject_level.ranked_up) setRankUp(answer.subject_level)
    } catch (err) {
      // Already answered, e.g. in another tab: show that answer instead.
      if (err.status === 409) onSync()
      else setError(err.message)
    } finally {
      setPending(false)
    }
  }

  const stateOf = (i) => {
    if (result) {
      if (i === result.correct_answer) return 'correct'
      return i === result.your_answer ? 'wrong' : 'other'
    }
    return selected === i ? 'selected' : 'idle'
  }

  let nextLabel = 'See your results'
  if (next) nextLabel = next.level.level === level.level ? 'Next question' : `On to level ${next.level.level}`

  return (
    <form
      ref={cardRef}
      onSubmit={check}
      className="mt-4 scroll-mt-4 rounded-[26px] bg-white p-5 shadow-[0_30px_60px_-34px_rgba(70,30,20,0.5)] ring-1 ring-line sm:p-8"
    >
      <div className="flex items-center justify-between gap-3">
        <Eyebrow>
          Level {level.level} · {level.name}
        </Eyebrow>
        <span className="text-[0.8rem] font-medium whitespace-nowrap text-faint">
          {number} / {total}
        </span>
      </div>
      <h2
        ref={headingRef}
        tabIndex={-1}
        className="mt-3 text-[1.2rem] leading-snug font-semibold tracking-[-0.015em] text-ink outline-none sm:text-[1.45rem]"
      >
        {question.question}
      </h2>

      <fieldset disabled={Boolean(result) || pending} className="mt-5 sm:mt-6">
        <legend className="sr-only">Answer options</legend>
        <div className="grid gap-2.5">
          {question.options.map((option, i) => {
            const state = stateOf(i)
            return (
              <label
                key={i}
                className={`relative flex items-center gap-3.5 rounded-2xl border px-3.5 py-3 transition has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-crimson sm:px-4 sm:py-3.5 ${
                  OPTION_STYLES[state]
                } ${result ? '' : 'cursor-pointer'}`}
              >
                <input
                  type="radio"
                  name={`question-${question.question_id}`}
                  className="sr-only"
                  checked={selected === i}
                  onChange={() => setSelected(i)}
                />
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-full text-[0.85rem] font-bold transition ${BADGE_STYLES[state]}`}
                >
                  {state === 'correct' && <Icon name="check" className="size-4" strokeWidth={3} />}
                  {state === 'wrong' && <Icon name="close" className="size-4" strokeWidth={3} />}
                  {state !== 'correct' && state !== 'wrong' && LETTERS[i]}
                </span>
                <span className="flex-1 text-[0.98rem] leading-snug text-ink">
                  {option}
                  {state === 'correct' && <span className="sr-only"> (correct answer)</span>}
                  {state === 'wrong' && <span className="sr-only"> (your answer)</span>}
                </span>
              </label>
            )
          })}
        </div>
      </fieldset>

      {error && <Alert className="mt-4">{error}</Alert>}

      {result ? (
        <div className="mt-5 sm:mt-6">
          <div
            role="status"
            className={`rounded-2xl p-4 sm:p-5 ${
              result.correct ? 'bg-emerald-50 ring-1 ring-emerald-200' : 'bg-rose-50 ring-1 ring-rose-200'
            }`}
          >
            <p
              className={`flex items-center gap-2 font-semibold ${
                result.correct ? 'text-emerald-800' : 'text-rose-800'
              }`}
            >
              <Icon name={result.correct ? 'check' : 'close'} className="size-5" strokeWidth={2.5} />
              {result.correct
                ? `Correct! +${result.points_earned} points`
                : `Not quite. The answer is ${LETTERS[result.correct_answer]}.`}
            </p>
            <p className="mt-1.5 text-[0.95rem] leading-relaxed text-ink/80">{result.explanation}</p>
          </div>

          {rankUp && (
            <p className="mt-3 flex items-center gap-3 rounded-2xl bg-gold/12 px-4 py-3 text-[0.95rem] text-ink ring-1 ring-gold/30">
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-gold text-white">
                <Icon name="trophy" className="size-5" />
              </span>
              <span>
                <b className="font-semibold">Rank up!</b> You're now <b className="font-semibold">{rankUp.rank}</b> in{' '}
                {rankUp.subject}.
              </span>
            </p>
          )}

          <div className="mt-5 flex justify-end">
            <Button ref={nextRef} size="lg" className="w-full sm:w-auto" onClick={onNext}>
              {nextLabel} <Icon name="arrowRight" className="size-5" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-center text-[0.86rem] text-muted sm:text-left">
            Worth <b className="font-semibold text-ink">{level.points_per_question} points</b> if you get it right
          </p>
          <Button type="submit" size="lg" disabled={selected === null || pending}>
            {pending ? 'Checking…' : 'Check answer'}
          </Button>
        </div>
      )}
    </form>
  )
}

function headline(correct, total) {
  if (correct === total) return 'A perfect score!'
  if (correct >= total * 0.7) return 'Nicely done!'
  if (correct >= total * 0.4) return 'Good start!'
  return 'Keep at it!'
}

function Summary({ quiz, rank, onChooseAnother, onNewSlides }) {
  const questions = questionsOf(quiz)
  const correct = questions.filter((q) => q.result?.correct).length
  const maxPoints = quiz.levels.reduce((sum, l) => sum + l.points_per_question * l.questions.length, 0)
  const missed = questions.filter((q) => q.result && !q.result.correct)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  return (
    <section className="pt-4 sm:pt-10">
      <div className="relative isolate overflow-hidden rounded-[28px] bg-gradient-to-br from-[#9b2234] to-crimson-dark px-6 pt-8 pb-24 text-white shadow-[0_30px_60px_-30px_rgba(139,26,43,0.9)] sm:py-11 sm:pr-56 sm:pl-10 md:pr-64">
        <Mascot
          sticker
          eyeClassName="fill-gold"
          className="absolute right-5 -bottom-9 -z-10 w-28 rotate-[-8deg] text-ink sm:right-8 sm:-bottom-8 sm:w-44 md:w-52"
        />
        <p className="text-[11px] font-semibold tracking-[0.14em] text-white/70 uppercase">
          Quiz complete · {quiz.subject}
        </p>
        <h1 className="mt-3 text-[clamp(2rem,5.4vw,3rem)] leading-[1.05] font-bold tracking-[-0.04em]">
          {headline(correct, questions.length)}
        </h1>
        <p className="mt-3 max-w-md text-[1.02rem] leading-relaxed text-white/85">
          You got <b className="text-white">{correct} of {questions.length}</b> right and earned{' '}
          <b className="text-white">{quiz.points_earned}</b> of {maxPoints} points.
        </p>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-[minmax(0,1fr)_300px] md:items-start">
        <div className="rounded-[24px] bg-white p-5 ring-1 ring-line sm:p-6">
          <h2 className="font-semibold text-ink">By level</h2>
          <ul className="mt-2 divide-y divide-line">
            {quiz.levels.map((level) => {
              const right = level.questions.filter((q) => q.result?.correct).length
              return (
                <li key={level.level} className="flex items-center gap-3 py-2.5">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-cream text-[0.8rem] font-bold text-crimson">
                    {level.level}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-[0.95rem] font-medium text-ink">{level.name}</span>
                  <span className="flex gap-1" aria-label={`${right} of ${level.questions.length} right`}>
                    {level.questions.map((q) => (
                      <span key={q.question_id} className={`size-2.5 rounded-full ${dotColor(q, false)}`} />
                    ))}
                  </span>
                  <span className="w-14 text-right text-[0.85rem] text-muted">
                    {right * level.points_per_question} pts
                  </span>
                </li>
              )
            })}
          </ul>
        </div>
        {rank && (
          <div>
            <h2 className="mb-2 px-1 text-[0.86rem] font-semibold text-muted">Your rank in {rank.subject}</h2>
            <RankCard rank={rank} />
          </div>
        )}
      </div>

      {missed.length > 0 && (
        <div className="mt-4 rounded-[24px] bg-white p-5 ring-1 ring-line sm:p-6">
          <h2 className="font-semibold text-ink">Worth another look</h2>
          <ol className="mt-1 divide-y divide-line">
            {missed.map((q) => (
              <li key={q.question_id} className="py-4 last:pb-0">
                <p className="text-[11px] font-semibold tracking-[0.12em] text-faint uppercase">
                  Level {q.level.level} · {q.level.name}
                </p>
                <p className="mt-1 font-medium leading-snug text-ink">{q.question}</p>
                <p className="mt-2 flex items-start gap-2 text-[0.92rem] text-rose-700">
                  <Icon name="close" className="mt-0.5 size-4 shrink-0" strokeWidth={2.5} />
                  <span>
                    <span className="sr-only">Your answer: </span>
                    {q.options[q.result.your_answer]}
                  </span>
                </p>
                <p className="mt-1 flex items-start gap-2 text-[0.92rem] text-emerald-700">
                  <Icon name="check" className="mt-0.5 size-4 shrink-0" strokeWidth={2.5} />
                  <span>
                    <span className="sr-only">Correct answer: </span>
                    {q.options[q.result.correct_answer]}
                  </span>
                </p>
                <p className="mt-2 text-[0.9rem] leading-relaxed text-muted">{q.result.explanation}</p>
              </li>
            ))}
          </ol>
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={onChooseAnother}>
          Try another topic <Icon name="arrowRight" className="size-5" />
        </Button>
        <Button size="lg" variant="secondary" onClick={onNewSlides}>
          Upload new slides
        </Button>
      </div>
    </section>
  )
}

export default function QuizStep({ quiz, onQuizChange, onChooseAnother, onNewSlides }) {
  const [currentId, setCurrentId] = useState(() => firstOpen(quiz))
  const [advanced, setAdvanced] = useState(false)
  const [rank, setRank] = useState(null) // the student's rank in this subject, once known

  // Show the rank the student already has in this subject (none yet if it's new to them).
  useEffect(() => {
    let cancelled = false
    getProgress(quiz.user)
      .then((profile) => {
        const subject = quiz.subject.toLowerCase()
        const known = (profile.subjects ?? []).find((s) => s.subject.toLowerCase() === subject)
        if (!cancelled && known) setRank((current) => current ?? known)
      })
      .catch(() => {}) // The rank is a nice-to-have; the quiz works without it.
    return () => {
      cancelled = true
    }
  }, [quiz.user, quiz.subject])

  const questions = questionsOf(quiz)
  const index = questions.findIndex((q) => q.question_id === currentId)

  if (index === -1) {
    return <Summary quiz={quiz} rank={rank} onChooseAnother={onChooseAnother} onNewSlides={onNewSlides} />
  }

  const current = questions[index]
  const next = questions.find((q) => !q.result && q.question_id !== currentId) ?? null

  return (
    <section className="pt-4 sm:pt-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <Eyebrow>Prerequisite quiz</Eyebrow>
          <h1 className="mt-2 text-[clamp(1.7rem,4.4vw,2.4rem)] leading-[1.08] font-bold tracking-[-0.035em] text-balance text-ink">
            {quiz.subject}
          </h1>
          <p className="mt-2 text-[0.9rem] text-muted">
            {quiz.answered} of {questions.length} answered · {quiz.points_earned} points earned
          </p>
        </div>
        {rank && <RankCard rank={rank} className="sm:w-64 sm:shrink-0" />}
      </div>

      <LevelTrack quiz={quiz} currentId={currentId} />

      <QuestionCard
        key={current.question_id}
        quiz={quiz}
        question={current}
        number={index + 1}
        total={questions.length}
        next={next}
        focusOnMount={advanced}
        onAnswered={(questionId, answer) => {
          onQuizChange(withResult(quiz, questionId, answer))
          setRank(answer.subject_level)
        }}
        onSync={() => getQuiz(quiz.quiz_id).then(onQuizChange, () => {})}
        onNext={() => {
          setAdvanced(true)
          setCurrentId(next?.question_id ?? null)
        }}
      />
    </section>
  )
}
