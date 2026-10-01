import { useEffect, useState } from 'react'
import { getLecture, getQuiz } from '../../api.js'
import Button from '../Button.jsx'
import Icon from '../Icon.jsx'
import Logo from '../Logo.jsx'
import Mascot from '../Mascot.jsx'
import QuizStep from './QuizStep.jsx'
import TopicStep from './TopicStep.jsx'
import UploadStep from './UploadStep.jsx'
import Working from './Working.jsx'

const STEPS = ['Upload slides', 'Pick a topic', 'Quiz']

// Where the student is lives in the URL (/learn?lecture=…&quiz=…), so a reload or
// the back button picks up from there through the backend's GET endpoints.
function readRoute() {
  const params = new URLSearchParams(window.location.search)
  return { lectureId: params.get('lecture'), quizId: params.get('quiz') }
}

function useRoute() {
  const [route, setRoute] = useState(readRoute)

  useEffect(() => {
    const onPopState = () => setRoute(readRoute())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const go = ({ lectureId = null, quizId = null }) => {
    const params = new URLSearchParams()
    if (lectureId) params.set('lecture', lectureId)
    if (quizId) params.set('quiz', quizId)
    const query = params.toString()
    window.history.pushState(null, '', query ? `?${query}` : window.location.pathname)
    setRoute({ lectureId, quizId })
    window.scrollTo(0, 0)
  }

  return [route, go]
}

function Stepper({ step }) {
  return (
    <ol aria-label="Progress" className="flex items-center gap-2 sm:gap-3">
      {STEPS.map((label, i) => {
        const done = i < step
        const current = i === step
        return (
          <li
            key={label}
            aria-current={current ? 'step' : undefined}
            className="flex items-center gap-2 sm:gap-3"
          >
            <span
              className={`grid size-7 place-items-center rounded-full text-[12px] font-semibold transition ${
                done || current ? 'bg-crimson text-white' : 'bg-white text-faint ring-1 ring-line'
              } ${current ? 'ring-4 ring-crimson/15' : ''}`}
            >
              {done ? <Icon name="check" className="size-3.5" strokeWidth={3} /> : i + 1}
            </span>
            <span
              className={`text-[13px] font-medium ${current ? 'text-ink' : 'text-muted'} ${
                current ? 'sr-only lg:not-sr-only' : 'sr-only xl:not-sr-only'
              }`}
            >
              {label}
              {done && <span className="sr-only"> (done)</span>}
            </span>
            {i < STEPS.length - 1 && <span className="h-px w-4 bg-ink/15 sm:w-8" />}
          </li>
        )
      })}
    </ol>
  )
}

function LoadError({ error, onRetry, onRestart }) {
  const expired = error.status === 404
  return (
    <section className="flex flex-col items-center py-16 text-center sm:py-24">
      <Mascot sticker className="w-24 text-ink opacity-90 sm:w-28" eyeClassName="fill-faint" />
      <h1 className="mt-8 text-[clamp(1.7rem,4.4vw,2.4rem)] leading-tight font-bold tracking-[-0.035em] text-ink">
        {expired ? 'This session has expired' : 'Something went wrong'}
      </h1>
      <p className="mt-3 max-w-md text-[1.02rem] leading-relaxed text-muted">
        {expired
          ? 'Lectures and quizzes are only kept until the server restarts. Upload your slides to start again.'
          : error.message}
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {!expired && <Button onClick={onRetry}>Try again</Button>}
        <Button variant={expired ? 'primary' : 'secondary'} onClick={onRestart}>
          Start over
        </Button>
      </div>
    </section>
  )
}

export default function LearnPage() {
  const [route, go] = useRoute()
  const [lecture, setLecture] = useState(null)
  const [quiz, setQuiz] = useState(null)
  // A failed load only counts for the route it was for, so navigating away clears it.
  const [failure, setFailure] = useState(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    document.title = 'Start learning — Promptly'
  }, [])

  const needLecture = Boolean(route.lectureId) && lecture?.lecture_id !== route.lectureId
  const needQuiz = Boolean(route.quizId) && quiz?.quiz_id !== route.quizId

  useEffect(() => {
    if (!needLecture && !needQuiz) return
    let cancelled = false
    Promise.all([needLecture && getLecture(route.lectureId), needQuiz && getQuiz(route.quizId)])
      .then(([loadedLecture, loadedQuiz]) => {
        if (cancelled) return
        if (loadedLecture) setLecture(loadedLecture)
        if (loadedQuiz) setQuiz(loadedQuiz)
      })
      .catch((error) => !cancelled && setFailure({ route, error }))
    return () => {
      cancelled = true
    }
  }, [route, needLecture, needQuiz, attempt])

  const step = route.quizId ? 2 : route.lectureId ? 1 : 0
  const loadError = failure?.route === route ? failure.error : null

  let view
  if (loadError) {
    view = (
      <LoadError
        error={loadError}
        onRetry={() => {
          setFailure(null)
          setAttempt((n) => n + 1)
        }}
        onRestart={() => go({})}
      />
    )
  } else if (needLecture || needQuiz) {
    view = <Working title="Picking up where you left off" />
  } else if (step === 2) {
    view = (
      <QuizStep
        key={quiz.quiz_id}
        quiz={quiz}
        onQuizChange={setQuiz}
        onChooseAnother={() => go({ lectureId: quiz.lecture_id })}
        onNewSlides={() => go({})}
      />
    )
  } else if (step === 1) {
    view = (
      <TopicStep
        key={lecture.lecture_id}
        lecture={lecture}
        onQuiz={(newQuiz) => {
          setQuiz(newQuiz)
          go({ lectureId: lecture.lecture_id, quizId: newQuiz.quiz_id })
        }}
        onNewSlides={() => go({})}
      />
    )
  } else {
    view = (
      <UploadStep
        onLecture={(newLecture) => {
          setLecture(newLecture)
          go({ lectureId: newLecture.lecture_id })
        }}
      />
    )
  }

  return (
    <div className="relative isolate min-h-svh">
      <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(ellipse_55%_60%_at_85%_0%,rgba(139,26,43,0.07),transparent_70%),radial-gradient(ellipse_50%_55%_at_0%_10%,rgba(227,150,47,0.08),transparent_70%)]" />
      <header className="mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:py-6">
        <Logo />
        <Stepper step={step} />
      </header>
      <main className="mx-auto w-full max-w-[880px] px-5 pb-20 sm:px-8">{view}</main>
    </div>
  )
}
