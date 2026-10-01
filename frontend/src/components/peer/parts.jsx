import Icon from '../Icon.jsx'

// Pieces shared by the help (student) and review (Peer Reviewer) pages.

export function PromptBlock({ label, action, children }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-[0.8rem] font-semibold tracking-[0.12em] text-faint uppercase">{label}</span>
        {action}
      </div>
      <p className="mt-2 rounded-xl bg-paper px-4 py-3 text-[0.95rem] leading-relaxed whitespace-pre-wrap text-ink ring-1 ring-line">
        {children}
      </p>
    </div>
  )
}

export function SkillChips({ skills, strengths = [] }) {
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Skills that would help">
      {skills.map((skill) => {
        const strong = strengths.includes(skill.name)
        return (
          <li
            key={skill.skill}
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[0.78rem] font-medium ${
              strong ? 'bg-crimson/8 text-crimson ring-1 ring-crimson/20' : 'bg-cream text-muted'
            }`}
          >
            {strong && <Icon name="star" className="size-3" />}
            {skill.name}
          </li>
        )
      })}
    </ul>
  )
}

/** The AI's estimate of how much better the revised prompt is. */
export function Improvement({ value }) {
  const better = value > 0
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.85rem] font-semibold ${
        better ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
      }`}
    >
      <Icon name="growth" className="size-4" />
      {better ? '+' : ''}
      {value}% predicted improvement
    </span>
  )
}

export function Checks({ checks }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
      {checks.map((check) => (
        <li
          key={check.label}
          className={`flex items-center gap-1.5 text-[0.88rem] ${check.ok ? 'text-emerald-700' : 'text-[#9a5b0f]'}`}
        >
          <Icon name={check.ok ? 'check' : 'alert'} className="size-4" strokeWidth={2.5} />
          {check.label}
          <span className="sr-only">{check.ok ? '(done)' : '(still missing)'}</span>
        </li>
      ))}
    </ul>
  )
}
