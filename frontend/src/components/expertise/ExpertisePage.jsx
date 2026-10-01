import { useEffect, useState } from 'react'
import { getExpertise } from '../../api.js'
import { useUserName } from '../../user.js'
import AppLayout from '../AppLayout.jsx'
import Icon from '../Icon.jsx'
import Working from '../Working.jsx'
import { Alert, Card, Eyebrow, NameGate, ScoreRing, SkillRow } from '../ui.jsx'
import ReviewerStatus from './ReviewerStatus.jsx'

export function SkillsCard({ expertise, className = '' }) {
  return (
    <Card className={className}>
      <h2 className="font-semibold text-ink">Skills</h2>
      <div className="mt-4 space-y-5">
        {expertise.skills.map((skill) => (
          <SkillRow key={skill.skill} name={skill.name} score={skill.score}>
            {skill.description[0].toUpperCase() + skill.description.slice(1)}
            {' · '}
            <span className="whitespace-nowrap text-faint">
              {skill.results
                ? `${skill.results} ${skill.results === 1 ? 'result' : 'results'}`
                : skill.skill === 'iteration'
                  ? 'revise a prompt to show it'
                  : 'not shown yet'}
            </span>
          </SkillRow>
        ))}
      </div>
    </Card>
  )
}

function Expertise({ user }) {
  const [, setName] = useUserName()
  const [expertise, setExpertise] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    getExpertise(user).then(
      (data) => !cancelled && setExpertise(data),
      (err) => !cancelled && setError(err.message),
    )
    return () => {
      cancelled = true
    }
  }, [user])

  if (error) return <Alert className="mt-10">{error}</Alert>
  if (!expertise) return <Working title="Loading your expertise" />

  return (
    <section className="pt-4 sm:pt-10">
      <div className="flex items-center gap-5 sm:gap-7">
        <ScoreRing score={expertise.overall} label="overall" className="size-24 sm:size-28" />
        <div className="min-w-0">
          <Eyebrow>Prompt expertise</Eyebrow>
          <h1 className="mt-2 truncate text-[clamp(1.9rem,5vw,2.8rem)] leading-[1.05] font-bold tracking-[-0.04em] text-ink">
            {expertise.user}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-[0.95rem] text-muted">
            <span className="font-semibold text-ink">Level {expertise.level}</span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[0.8rem] font-semibold ${
                expertise.reviewer ? 'bg-gold/15 text-[#8a5410]' : 'bg-cream text-muted'
              }`}
            >
              {expertise.reviewer && <Icon name="award" className="size-3.5" />}
              {expertise.status}
            </span>
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-[minmax(0,1fr)_320px] md:items-start">
        <SkillsCard expertise={expertise} />
        <ReviewerStatus expertise={expertise} />
      </div>

      <p className="mt-6 text-[0.86rem] leading-relaxed text-faint">
        Scores are the average of your last 10 results per skill, from {expertise.challenges}{' '}
        {expertise.challenges === 1 ? 'challenge' : 'challenges'} and {expertise.reviews}{' '}
        {expertise.reviews === 1 ? 'review' : 'reviews'}. There's no leaderboard: this is about
        your own skills, not about ranking students.
      </p>
      <button
        type="button"
        onClick={() => setName('')}
        className="mt-4 text-[0.88rem] font-medium text-muted underline decoration-line underline-offset-4 hover:text-crimson"
      >
        Not {expertise.user}? Switch name
      </button>
    </section>
  )
}

export default function ExpertisePage() {
  return (
    <AppLayout title="Your expertise">
      <NameGate why="Your prompting skills are tracked under your name.">
        {(name) => <Expertise user={name} />}
      </NameGate>
    </AppLayout>
  )
}
