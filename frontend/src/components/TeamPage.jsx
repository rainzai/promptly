import AppLayout from './AppLayout.jsx'
import Button from './Button.jsx'
import Icon from './Icon.jsx'
import { Eyebrow, Lead, Title } from './ui.jsx'

// The people who built Promptly, in the order of the hackathon pitch.
const TEAM = [
  { name: 'Ron', role: 'Lead Engineer', tint: 'from-crimson to-[#c23a50]' },
  { name: 'Andrei', role: 'UX Expert', tint: 'from-gold to-[#f0b45a]' },
  { name: 'Tanishq', role: 'Ideator', tint: 'from-ink to-[#57534e]' },
  { name: 'Sean', role: 'System Engineer', tint: 'from-crimson-dark to-crimson' },
  { name: 'Lucas', role: 'Frontend Dev', tint: 'from-[#c2701e] to-gold' },
]

export default function TeamPage() {
  return (
    <AppLayout title="Team" wide>
      <section className="pt-4 sm:pt-10">
        <Eyebrow>The team</Eyebrow>
        <Title className="mt-3">Made by Team 12</Title>
        <Lead className="mt-4">
          Five students built Promptly during an AI hackathon at the University of Amsterdam, to help
          students learn with AI, not just from it.
        </Lead>

        <ul className="mt-10 flex flex-wrap justify-center gap-4 sm:mt-12">
          {TEAM.map((person) => (
            <li
              key={person.name}
              className="flex basis-[calc(50%-0.5rem)] flex-col items-center rounded-[26px] bg-white px-4 pt-6 pb-5 text-center shadow-[0_24px_50px_-34px_rgba(70,30,20,0.45)] ring-1 ring-line sm:basis-[calc(33.333%-0.7rem)] lg:basis-0 lg:flex-1"
            >
              <span
                aria-hidden="true"
                className={`grid size-20 place-items-center rounded-[24px] bg-gradient-to-br text-[1.9rem] font-bold text-white sm:size-24 ${person.tint}`}
              >
                {person.name[0]}
              </span>
              <b className="mt-4 text-[1.1rem] font-semibold text-ink">{person.name}</b>
              <span className="mt-0.5 text-[0.9rem] text-muted">{person.role}</span>
            </li>
          ))}
        </ul>

        <div className="mt-12 flex flex-col items-start gap-5 rounded-[26px] bg-cream px-6 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="max-w-[34rem] text-[0.98rem] leading-relaxed text-ink">
            Promptly is open source. Try it with your own slides, or take the code and build on it.
          </p>
          <div className="flex w-full shrink-0 flex-col gap-3 sm:w-auto sm:flex-row">
            <Button href="https://github.com/seanzlli/promptly" variant="secondary" className="whitespace-nowrap">
              Source on GitHub
            </Button>
            <Button href="/learn" className="whitespace-nowrap">
              Start learning <Icon name="arrowRight" className="size-5" />
            </Button>
          </div>
        </div>
      </section>
    </AppLayout>
  )
}
