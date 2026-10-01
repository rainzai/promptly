import Hero from './components/Hero.jsx'
import ExpertisePage from './components/expertise/ExpertisePage.jsx'
import LearnPage from './components/learn/LearnPage.jsx'
import HelpPage from './components/peer/HelpPage.jsx'
import ReviewPage from './components/peer/ReviewPage.jsx'
import PlayPage from './components/play/PlayPage.jsx'

// A handful of pages, so no router: links between them load the page fresh.
const PAGES = {
  '/learn': LearnPage,
  '/play': PlayPage,
  '/expertise': ExpertisePage,
  '/help': HelpPage,
  '/review': ReviewPage,
}

const Page = PAGES[window.location.pathname.replace(/\/+$/, '')] ?? Hero

export default function App() {
  return (
    <div className="min-h-svh overflow-x-hidden bg-paper font-sans text-ink antialiased">
      <Page />
    </div>
  )
}
