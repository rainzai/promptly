import Nav from './components/Nav.jsx'
import Hero from './components/Hero.jsx'

export default function App() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-cream font-sans text-ink antialiased">
      {/* Full-bleed Amsterdam canal, blurred so the content stays legible */}
      <div className="pointer-events-none fixed inset-0 scale-110 bg-[url('/bg.png')] bg-cover bg-center blur-[11px]" />

      <div className="relative z-10">
        <Nav />
        <Hero />
      </div>
    </div>
  )
}
