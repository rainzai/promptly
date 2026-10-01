import Mascot from './Mascot.jsx'

export default function Logo({ href = '/' }) {
  return (
    <a href={href} className="flex items-center gap-3 rounded-full text-ink">
      <span className="grid size-11 place-items-center rounded-full bg-crimson shadow-[0_8px_18px_-8px_rgba(139,26,43,0.9)]">
        <Mascot sticker className="w-8 text-ink" />
      </span>
      <span className="text-[1.2rem] font-semibold tracking-tight">Promptly</span>
    </a>
  )
}
