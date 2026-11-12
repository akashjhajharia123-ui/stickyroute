import FadeContent from '../components/rb/FadeContent.jsx'
import SpotlightCard from '../components/rb/SpotlightCard.jsx'
import Tilt3D from '../components/Tilt3D.jsx'

const STEPS = [
  { title: 'Turn it on per rule', body: <>One field on a routing rule, off by default: <code>"sticky_sessions": true</code>. From the dashboard, the API or <code>config.json</code>.</> },
  { title: 'Reuse the session ID Bifrost already reads', body: <><code>x-bf-session-id</code>, or the headers Claude Code, Codex and OpenCode send, scoped to the caller’s virtual key and user.</> },
  { title: 'Score every target, pick the highest', body: <>Weighted rendezvous hashing: <code>score = weight / −ln(hash(session, rule, target))</code>.</> },
  { title: 'Let Bifrost handle failover', body: <>If the chosen provider fails, session affinity binds the conversation to the fallback that answered. A stable pick lets that binding survive.</> },
]

const PROPERTIES = [
  { title: 'Same session, same target', body: 'Every message of a conversation lands on the same provider.' },
  { title: 'The split stays exact', body: '70.08% of 100,000 sessions picked the 70% target.' },
  { title: 'Changes move only what must move', body: 'Remove a target and only its own conversations move. Target order never matters.' },
]

const QUALITY = [
  'Routing engine change with tests: stickiness, a chi-square check of the split, target order, minimal movement, NaN weights, affinity opt-out, per-caller scoping.',
  'Database migration, API fields, config, OpenAPI and Helm schemas, and a dashboard switch in 11 languages.',
  'Existing rules keep their config hash, so upgrading rewrites nothing.',
  'Reviewed by CodeRabbit and an independent reviewer; every finding fixed or answered on the PR.',
]

export default function HowItWorks() {
  return (
    <section id="how" aria-labelledby="how-title">
      <div className="wrap">
        <FadeContent blur duration={0.8}>
          <h2 id="how-title">How it works</h2>
        </FadeContent>
        <ol className="steps">
          {STEPS.map((s, i) => (
            <FadeContent key={s.title} delay={i * 0.1} duration={0.7}>
              <Tilt3D as="li">
                <span className="step-num">{i + 1}</span>
                <h3>{s.title}</h3>
                <p>{s.body}</p>
              </Tilt3D>
            </FadeContent>
          ))}
        </ol>
        <div className="cards">
          {PROPERTIES.map(p => (
            <Tilt3D key={p.title}>
              <SpotlightCard className="card" spotlightColor="rgba(240, 149, 79, 0.2)">
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </SpotlightCard>
            </Tilt3D>
          ))}
        </div>

        <h3 className="sub-title" id="quality">Built as an upstream contribution</h3>
        <ul className="checklist">
          {QUALITY.map(q => <li key={q}>{q}</li>)}
          <li>Open upstream as <a href="https://github.com/maximhq/bifrost/pull/9908">pull request #9908</a>, linked to issue <a href="https://github.com/maximhq/bifrost/issues/5409">#5409</a>.</li>
        </ul>
      </div>
    </section>
  )
}
