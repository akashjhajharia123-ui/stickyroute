import './App.css'
import Demo from './sections/Demo.jsx'
import Hero from './sections/Hero.jsx'
import HowItWorks from './sections/HowItWorks.jsx'
import Problem from './sections/Problem.jsx'
import Results from './sections/Results.jsx'

const REPO_URL = 'https://github.com/akashjhajharia123-ui/stickyroute'

function Nav() {
  return (
    <header className="nav">
      <div className="wrap nav-inner">
        <a className="brand" href="#top"><span className="brand-mark" aria-hidden="true" />StickyRoute</a>
        <nav aria-label="Sections">
          <a href="#demo">Demo</a>
          <a href="#results">Results</a>
          <a href="#how">How it works</a>
          <a href={REPO_URL}>GitHub</a>
        </nav>
      </div>
    </header>
  )
}

function Footer() {
  return (
    <footer>
      <div className="wrap footer-inner">
        <p><b>StickyRoute</b> · Geek Room Global AI Hackathon 2026 · Bifrost track, Problem 04</p>
        <p>Team: Akash, Rahul, Kanishk, Ronak · Built with help from Claude Code; every change was reviewed and tested by the team.</p>
        <p>
          <a href={REPO_URL}>Project repo</a> · <a href="https://github.com/akashjhajharia123-ui/bifrost/tree/feat/sticky-weighted-targets">Bifrost fork</a> ·{' '}
          <a href="https://github.com/maximhq/bifrost">Bifrost</a> · Animations by <a href="https://reactbits.dev">React Bits</a>
        </p>
      </div>
    </footer>
  )
}

export default function App() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Problem />
        <Demo />
        <Results />
        <HowItWorks />
      </main>
      <Footer />
    </>
  )
}
