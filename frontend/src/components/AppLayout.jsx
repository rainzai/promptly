import { useEffect, useState } from 'react'
import Icon from './Icon.jsx'
import Logo from './Logo.jsx'
import { useUserName } from '../user.js'

// The header and page frame shared by every page of the app (not the landing page).

export const APP_LINKS = [
  { href: '/learn', label: 'Learn', icon: 'book' },
  { href: '/play', label: 'Play', icon: 'target' },
  { href: '/expertise', label: 'Expertise', icon: 'growth' },
  { href: '/help', label: 'Get help', icon: 'message' },
  { href: '/review', label: 'Review', icon: 'award' },
]

const current = window.location.pathname.replace(/\/+$/, '')

function NavLinks({ onNavigate, mobile = false }) {
  return APP_LINKS.map((link) => {
    const active = link.href === current
    return (
      <a
        key={link.href}
        href={link.href}
        aria-current={active ? 'page' : undefined}
        onClick={onNavigate}
        className={
          mobile
            ? `flex items-center gap-3 rounded-xl px-4 py-3 text-[1rem] font-medium ${
                active ? 'bg-crimson/8 text-crimson' : 'text-ink hover:bg-cream'
              }`
            : `rounded-full px-3.5 py-2 text-[0.9rem] font-medium transition-colors ${
                active ? 'bg-white text-crimson shadow-sm ring-1 ring-line' : 'text-ink/75 hover:text-crimson'
              }`
        }
      >
        {mobile && <Icon name={link.icon} className="size-5" strokeWidth={1.75} />}
        {link.label}
      </a>
    )
  })
}

export default function AppLayout({ title, wide = false, children }) {
  const [open, setOpen] = useState(false)
  const [name] = useUserName()

  useEffect(() => {
    document.title = `${title} — Promptly`
  }, [title])

  useEffect(() => {
    if (!open) return
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div className="relative isolate min-h-svh">
      <div className="absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(ellipse_55%_60%_at_85%_0%,rgba(139,26,43,0.07),transparent_70%),radial-gradient(ellipse_50%_55%_at_0%_10%,rgba(227,150,47,0.08),transparent_70%)]" />
      <header className="relative z-40 mx-auto flex max-w-[1180px] items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:py-6">
        <Logo />
        <nav aria-label="App" className="hidden items-center gap-1 lg:flex">
          <NavLinks />
        </nav>
        <div className="flex items-center gap-2">
          {name && (
            <a
              href="/expertise"
              className="hidden max-w-[11rem] items-center gap-2 rounded-full bg-white py-1.5 pr-3.5 pl-1.5 text-[0.88rem] font-medium text-ink shadow-sm ring-1 ring-line sm:flex"
            >
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-cream text-crimson">
                <Icon name="user" className="size-4" />
              </span>
              <span className="truncate">{name}</span>
            </a>
          )}
          <button
            type="button"
            className="grid size-11 place-items-center rounded-full bg-white/80 text-ink shadow-sm ring-1 ring-black/5 backdrop-blur lg:hidden"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            aria-controls="app-menu"
            onClick={() => setOpen(!open)}
          >
            <Icon name={open ? 'close' : 'menu'} className="size-5" />
          </button>
        </div>

        {open && (
          <nav
            id="app-menu"
            aria-label="App"
            className="absolute inset-x-5 top-full rounded-2xl bg-white/95 p-2 shadow-[0_24px_60px_-20px_rgba(60,30,20,0.4)] ring-1 ring-black/5 backdrop-blur sm:inset-x-8 lg:hidden"
          >
            <NavLinks mobile onNavigate={() => setOpen(false)} />
          </nav>
        )}
      </header>
      <main className={`mx-auto w-full px-5 pb-20 sm:px-8 ${wide ? 'max-w-[1180px]' : 'max-w-[880px]'}`}>
        {children}
      </main>
    </div>
  )
}
