import CountUp from '../components/rb/CountUp.jsx'
import FadeContent from '../components/rb/FadeContent.jsx'
import ProviderGrid from '../components/ProviderGrid.jsx'
import Tilt3D from '../components/Tilt3D.jsx'
import { sampleToRows } from '../lib/simulate.js'
import { useJson } from '../lib/useJson.js'

const GRID_ROWS = 30
const REPO = 'https://github.com/akashjhajharia123-ui/stickyroute/blob/main'

function Kpi({ label, value, of, note, good }) {
  return (
    <Tilt3D as="dl" className="kpi">
      <dt>{label}</dt>
      <dd className={good ? 'good' : undefined}>
        {good ? value : <CountUp to={value} duration={1.4} />}
        <span className="of"> / {of}</span>
      </dd>
      {note ? <dd className="kpi-note">{note}</dd> : null}
    </Tilt3D>
  )
}

function ModeGrids({ data, legend }) {
  const byMode = Object.fromEntries(data.modes.map(m => [m.mode, m]))
  return (
    <>
      <div className="panels">
        {['random', 'sticky'].map(mode => {
          const m = byMode[mode]
          const title = mode === 'random' ? 'Bifrost today' : 'With sticky_sessions'
          return (
            <figure className="panel" key={mode}>
              <figcaption>
                <h3>{title}</h3>
                <p>{m.summary.sessions_with_any_switch} of {m.sessions_total} conversations switched · first {Math.min(GRID_ROWS, m.sample.length)} shown</p>
              </figcaption>
              <ProviderGrid rows={sampleToRows(m.sample.slice(0, GRID_ROWS))} label={`${title}: who answered each message`} />
            </figure>
          )
        })}
      </div>
      <div className="legend" aria-hidden="true">{legend}</div>
    </>
  )
}

function RoutingProof() {
  const { data, error } = useJson('data/routing-proof.json')
  if (error) return <p className="note">Results could not be loaded: {error}</p>
  if (!data) return null
  const byMode = Object.fromEntries(data.modes.map(m => [m.mode, m]))
  const r = byMode.random
  const s = byMode.sticky
  return (
    <>
      <div className="kpis">
        <Kpi label="Bifrost today: conversations that switched" value={r.summary.sessions_with_any_switch} of={r.sessions_total} note={`${r.summary.provider_switches_per_session} switches per conversation`} />
        <Kpi label="With sticky_sessions" value={s.summary.sessions_with_any_switch} of={s.sessions_total} note="no conversation switched" good />
        <dl className="kpi"><dt>Split with sticky_sessions</dt><dd><CountUp to={s.summary.share_by_provider['upstream-a'] * 100} decimals={1} suffix="%" duration={1.4} /></dd><dd className="kpi-note">target 70%; 70.08% over 100,000 sessions</dd></dl>
      </div>
      <ModeGrids data={data} legend={<><span><i className="sw a" />Provider A</span><span><i className="sw b" />Provider B</span></>} />
      <p className="note">
        The gateway built from our branch, two local OpenAI-compatible upstreams, a 70/30 rule, 1,000
        conversations × 10 messages, Bifrost’s session affinity on. Source: <a href={`${REPO}/bench/results/routing-proof.json`}>routing-proof.json</a>.
      </p>
    </>
  )
}

function RealGemini() {
  const { data, error } = useJson('data/real-gemini.json')
  if (error || !data) return null
  const byMode = Object.fromEntries(data.modes.map(m => [m.mode, m]))
  const r = byMode.random
  const s = byMode.sticky
  return (
    <>
      <h3 className="sub-title">And with a real AI provider</h3>
      <div className="kpis">
        <Kpi label="Bifrost today: conversations that switched model" value={r.summary.sessions_with_any_switch} of={r.sessions_total} note={`${r.summary.provider_switches_per_session} switches per 6-message conversation`} />
        <Kpi label="With sticky_sessions" value={s.summary.sessions_with_any_switch} of={s.sessions_total} note="real Gemini traffic, 120/120 requests answered" good />
      </div>
      <ModeGrids data={data} legend={<><span><i className="sw a" />{data.models.A}</span><span><i className="sw b" />{data.models.B}</span></>} />
      <p className="note">
        Real Gemini free-tier traffic through the same gateway, 70/30 across two Gemini models. This run
        confirms routing only: the two models share a cache, so it cannot measure cache savings. Details in
        the <a href={`${REPO}/bench/README.md`}>benchmark README</a>.
      </p>
    </>
  )
}

export default function Results() {
  return (
    <section id="results" className="band" aria-labelledby="results-title">
      <div className="wrap">
        <FadeContent blur duration={0.8}>
          <h2 id="results-title">Measured on a real Bifrost gateway</h2>
        </FadeContent>
        <RoutingProof />
        <RealGemini />
      </div>
    </section>
  )
}
