import { lazy, Suspense, useEffect, useState } from 'react'
import BlurText from '../components/rb/BlurText.jsx'
import CountUp from '../components/rb/CountUp.jsx'
import ShinyText from '../components/rb/ShinyText.jsx'
import StarBorder from '../components/rb/StarBorder.jsx'

// three.js is large, so the 3D highway loads in its own chunk after the page is readable.
const Hyperspeed = lazy(() => import('../components/rb/Hyperspeed.jsx'))

const WIDE_SCREEN_PX = 760
// Start the 3D scene after the headline has animated in: compiling its shaders blocks the main
// thread for a moment, which otherwise stalls the headline animation.
const HIGHWAY_DELAY_MS = 1200
const CLAUDE_BLUES = ['#4f8df5', '#7fb0ff', '#2f6fdf']
const GPT_ORANGES = ['#f0954f', '#ffb27a', '#e2733a']

/** The 3D highway only on wide screens without reduced motion; phones get a static glow. */
function useShow3D() {
  const query = `(min-width: ${WIDE_SCREEN_PX}px) and (prefers-reduced-motion: no-preference)`
  const [show, setShow] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(query)
    const onChange = () => setShow(mq.matches)
    const timer = setTimeout(onChange, HIGHWAY_DELAY_MS)
    mq.addEventListener('change', onChange)
    return () => {
      clearTimeout(timer)
      mq.removeEventListener('change', onChange)
    }
  }, [query])
  return show
}

export default function Hero() {
  const show3D = useShow3D()
  return (
    <section className="hero" id="top">
      <div className="hero-bg" aria-hidden="true">
        {show3D ? (
          <Suspense fallback={null}>
            <Hyperspeed
              curve="winding"
              speed={0.8}
              density={34}
              headColors={CLAUDE_BLUES}
              tailColors={GPT_ORANGES}
              poleColors={['#4f8df5']}
              glow={0.7}
              interactive
            />
          </Suspense>
        ) : null}
      </div>
      <div className="hero-scrim" aria-hidden="true" />

      <div className="wrap hero-content">
        <p className="eyebrow">
          <ShinyText text="For the Bifrost AI gateway · fixes maximhq/bifrost#5409" color="#9fb3d6" shineColor="#ffffff" speed={3} />
        </p>
        <h1 className="hero-title">
          <BlurText text="One conversation." animateBy="words" delay={60} stepDuration={0.22} trigger="load" className="line" />
          <BlurText text="One provider." animateBy="words" delay={60} stepDuration={0.22} trigger="load" className="line" />
          <BlurText text="The split still holds." animateBy="words" delay={60} stepDuration={0.22} trigger="load" className="line accent" />
        </h1>
        <p className="lede">
          Bifrost splits AI traffic across providers, say 70% Claude and 30% GPT, but it rolls that split on
          every message, so one conversation keeps jumping between providers. StickyRoute adds one opt-in
          setting that keeps each conversation on one provider, while conversations still split 70/30.
        </p>
        <div className="cta">
          <StarBorder as="a" href="#demo" color="#7fb0ff" radius={12} className="cta-star">
            Try the live demo
          </StarBorder>
          <a className="btn" href="https://github.com/maximhq/bifrost/pull/9908">View pull request #9908</a>
        </div>
        <dl className="hero-stats" aria-label="Measured on a real Bifrost gateway">
          <div>
            <dt>Conversations that switched provider, Bifrost today</dt>
            <dd><CountUp to={974} duration={1.6} /> / 1,000</dd>
          </div>
          <div>
            <dt>With <code>sticky_sessions</code></dt>
            <dd className="good">0 / 1,000</dd>
          </div>
          <div>
            <dt>Split over 100,000 sessions for a 70% target</dt>
            <dd><CountUp to={70.08} decimals={2} duration={1.6} suffix="%" /></dd>
          </div>
        </dl>
        <p className="hero-hint">Tip: click and hold the highway to boost.</p>
      </div>
    </section>
  )
}
