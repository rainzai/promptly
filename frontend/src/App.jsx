import Hero from './components/Hero.jsx'
import LearnPage from './components/learn/LearnPage.jsx'

// Two pages so far, so no router: links between them load the page fresh.
const onLearnPage = window.location.pathname.replace(/\/+$/, '') === '/learn'

export default function App() {
  return (
    <div className="min-h-svh overflow-x-hidden bg-paper font-sans text-ink antialiased">
      {onLearnPage ? <LearnPage /> : <Hero />}
    </div>
  )
}
