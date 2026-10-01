import { useEffect, useState } from 'react'
import Button from './Button.jsx'
import Mascot from './Mascot.jsx'

// Shown while the AI reads slides or writes a quiz, which can take up to a minute.
export default function Working({ title, messages = [], note, onCancel }) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (messages.length < 2) return
    const timer = setInterval(() => setIndex((i) => Math.min(i + 1, messages.length - 1)), 4500)
    return () => clearInterval(timer)
  }, [messages.length])

  return (
    <section aria-busy="true" className="flex flex-col items-center py-14 text-center sm:py-24">
      <div className="relative">
        <span className="absolute inset-x-4 -bottom-2 h-5 rounded-[50%] bg-ink/10 blur-md" />
        <Mascot
          sticker
          className="relative w-28 text-ink drop-shadow-[0_14px_22px_rgba(60,20,20,0.22)] motion-safe:animate-bob sm:w-36"
        />
      </div>
      <h1 className="mt-10 text-[clamp(1.7rem,4.4vw,2.4rem)] leading-tight font-bold tracking-[-0.035em] text-balance text-ink">
        {title}
      </h1>
      <p aria-live="polite" className="mt-3 min-h-[1.6em] text-[1.02rem] text-muted">
        {messages[index]}
      </p>
      <div className="mt-6 h-1.5 w-56 overflow-hidden rounded-full bg-line">
        <span className="block h-full w-1/3 rounded-full bg-crimson motion-safe:animate-indeterminate" />
      </div>
      {note && <p className="mt-5 max-w-sm text-[0.88rem] text-faint">{note}</p>}
      {onCancel && (
        <Button variant="secondary" className="mt-8" onClick={onCancel}>
          Cancel
        </Button>
      )}
    </section>
  )
}
