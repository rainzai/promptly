import { useEffect, useState } from 'react'
import Button from './Button.jsx'
import Icon from './Icon.jsx'
import Logo from './Logo.jsx'

const LINKS = [
  { href: '/learn', label: 'Learn' },
  { href: '/play', label: 'Play' },
  { href: '/help', label: 'Peer help' },
  { href: '/expertise', label: 'Expertise' },
]

export default function Nav() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="relative z-40 mx-auto flex max-w-[1560px] items-center justify-between px-5 py-4 sm:px-8 lg:px-12 lg:py-6 xl:px-16">
      <Logo href="#top" />

      <nav className="hidden items-center gap-9 md:flex" aria-label="Main">
        {LINKS.map((link) => (
          <a
            key={link.href}
            href={link.href}
            className="text-[0.93rem] font-medium text-ink/85 transition-colors hover:text-crimson"
          >
            {link.label}
          </a>
        ))}
        <Button href="/learn" className="ml-1">
          Get started
        </Button>
      </nav>

      <button
        type="button"
        className="grid size-11 place-items-center rounded-full bg-white/80 text-ink shadow-sm ring-1 ring-black/5 backdrop-blur md:hidden"
        aria-label={open ? 'Close menu' : 'Open menu'}
        aria-expanded={open}
        aria-controls="mobile-menu"
        onClick={() => setOpen(!open)}
      >
        <Icon name={open ? 'close' : 'menu'} className="size-5" />
      </button>

      {open && (
        <nav
          id="mobile-menu"
          aria-label="Main"
          className="absolute inset-x-5 top-full rounded-2xl bg-white/95 p-2 shadow-[0_24px_60px_-20px_rgba(60,30,20,0.4)] ring-1 ring-black/5 backdrop-blur sm:inset-x-8 md:hidden"
        >
          {LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="block rounded-xl px-4 py-3 text-[1rem] font-medium text-ink hover:bg-cream"
            >
              {link.label}
            </a>
          ))}
          <Button href="/learn" className="mt-1 w-full" onClick={() => setOpen(false)}>
            Get started
          </Button>
        </nav>
      )}
    </header>
  )
}
