import { useState } from 'react'
import { createQuiz } from '../../api.js'
import { saveName, savedName } from '../../user.js'
import Button from '../Button.jsx'
import Icon from '../Icon.jsx'
import Working from '../Working.jsx'
import { Alert, Eyebrow, Lead, Title } from '../ui.jsx'

const WRITING = [
  'Deciding what matters most for this lecture…',
  'Writing questions, from easy to hard…',
  'Double-checking every answer…',
  'Almost there…',
]

export default function TopicStep({ lecture, onQuiz, onNewSlides }) {
  const [choice, setChoice] = useState(null) // index into lecture.prerequisites
  const [name, setName] = useState(savedName)
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(null) // AbortController while the quiz is written

  const topic = choice === null ? null : lecture.prerequisites[choice].name

  const start = async (e) => {
    e.preventDefault()
    const user = name.trim()
    if (!topic || !user) return
    saveName(user)
    const controller = new AbortController()
    setPending(controller)
    setError(null)
    try {
      onQuiz(await createQuiz(lecture.lecture_id, user, topic, controller.signal))
    } catch (err) {
      if (err.name !== 'AbortError') setError(err.message)
    } finally {
      setPending(null)
    }
  }

  if (pending) {
    return (
      <Working
        title={`Writing your quiz on ${topic}`}
        messages={WRITING}
        note="15 questions in 5 levels. This can take up to half a minute."
        onCancel={() => pending.abort()}
      />
    )
  }

  return (
    <form onSubmit={start} className="pt-4 sm:pt-10">
      <Eyebrow>
        Your lecture · {lecture.page_count} {lecture.page_count === 1 ? 'page' : 'pages'}
      </Eyebrow>
      <Title className="mt-3">{lecture.title}</Title>
      <Lead className="mt-4">
        To follow this lecture, you should know the topics below. Pick one to test yourself on;
        the one you feel least sure about is a good start.
      </Lead>
      {lecture.truncated && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-gold/12 px-3.5 py-1.5 text-[0.85rem] text-[#8a5410]">
          <Icon name="alert" className="size-4" />
          These slides are long, so only the first part was used.
        </p>
      )}

      <fieldset className="mt-8 sm:mt-10">
        <legend className="sr-only">Choose a prerequisite</legend>
        <div className="grid gap-3 md:grid-cols-2">
          {lecture.prerequisites.map((prerequisite, i) => (
            <label
              key={i}
              className="group relative flex cursor-pointer gap-4 rounded-2xl border border-line bg-white p-4 shadow-[0_1px_2px_rgba(28,25,23,0.05)] transition hover:border-crimson/40 has-checked:border-crimson has-checked:bg-[#fdf7f7] has-checked:shadow-[0_16px_32px_-20px_rgba(139,26,43,0.7)] has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-crimson sm:p-5"
            >
              <input
                type="radio"
                name="prerequisite"
                className="sr-only"
                checked={choice === i}
                onChange={() => setChoice(i)}
              />
              <span className="grid size-9 shrink-0 place-items-center rounded-full bg-cream text-[0.9rem] font-semibold text-crimson transition group-has-checked:bg-crimson group-has-checked:text-white">
                {choice === i ? <Icon name="check" className="size-4" strokeWidth={3} /> : i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-semibold leading-snug text-ink">{prerequisite.name}</span>
                <span className="mt-1 block text-[0.9rem] leading-snug text-muted">
                  {prerequisite.description}
                </span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-8 rounded-[24px] bg-white p-4 shadow-[0_24px_50px_-30px_rgba(70,30,20,0.45)] ring-1 ring-line sm:p-6">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <label className="block">
            <span className="text-[0.86rem] font-semibold text-ink">Your name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={40}
              autoComplete="nickname"
              placeholder="So your points have a home"
              className="mt-1.5 block w-full rounded-xl border border-line bg-paper px-4 py-3 text-[1rem] text-ink outline-none transition placeholder:text-faint focus:border-crimson focus:ring-3 focus:ring-crimson/12"
            />
          </label>
          <Button type="submit" size="lg" disabled={!topic || !name.trim()}>
            Start quiz <Icon name="arrowRight" className="size-5" />
          </Button>
        </div>
        <p className="mt-3 text-[0.84rem] leading-snug text-muted">
          {topic ? (
            <>
              15 questions on <b className="font-semibold text-ink">{topic}</b>, in 5 levels from
              recall to challenge. Harder levels earn more points.
            </>
          ) : (
            'Pick a topic above to start.'
          )}
        </p>
      </div>

      {error && <Alert className="mt-4">{error}</Alert>}

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onNewSlides}
          className="inline-flex items-center gap-2 rounded-full text-[0.92rem] font-medium text-muted transition hover:text-crimson"
        >
          <Icon name="arrowLeft" className="size-4" /> Upload different slides
        </button>
        <a
          href="/play"
          className="inline-flex items-center gap-2 rounded-full text-[0.92rem] font-semibold text-crimson hover:underline"
        >
          Practise prompting on these slides <Icon name="arrowRight" className="size-4" />
        </a>
      </div>
    </form>
  )
}
