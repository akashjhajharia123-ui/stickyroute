import { useCallback, useEffect, useRef, useState } from 'react'
import ProviderGrid from '../components/ProviderGrid.jsx'
import { buildTargets, simulate, summarise } from '../lib/simulate.js'

const STEP_MS = 70
const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** Rows revealed up to `shown` messages; later cells stay empty. */
function reveal(rows, shown) {
  return rows.map(row => row.map((cls, t) => (t < shown ? cls : null)))
}

function Stats({ rows, done }) {
  const s = summarise(rows)
  const show = v => (done ? v : '…')
  return (
    <dl className="panel-stats">
      <div><dt>Conversations that switched</dt><dd>{show(`${s.switched} / ${rows.length}`)}</dd></div>
      <div><dt>Switches per conversation</dt><dd>{show(s.perConversation.toFixed(2))}</dd></div>
      <div><dt>Started on Claude</dt><dd>{show(`${Math.round(s.shareA * 100)}%`)}</dd></div>
    </dl>
  )
}

export default function Demo() {
  const [share, setShare] = useState(70)
  const [conversations, setConversations] = useState(100)
  const [turns, setTurns] = useState(10)
  const [run, setRun] = useState(() => ({ ...simulate(buildTargets(70), 100, 10), share: 70 }))
  const [shown, setShown] = useState(0)
  const timer = useRef(null)

  const start = useCallback(() => {
    clearInterval(timer.current)
    setRun({ ...simulate(buildTargets(share), conversations, turns), share })
    if (reduceMotion()) {
      setShown(turns)
      return
    }
    setShown(0)
    timer.current = setInterval(() => {
      setShown(n => {
        if (n + 1 >= turns) clearInterval(timer.current)
        return Math.min(n + 1, turns)
      })
    }, STEP_MS)
  }, [share, conversations, turns])

  useEffect(() => {
    start()
    return () => clearInterval(timer.current)
    // Run once on mount; later runs come from the button.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const total = run.random[0]?.length ?? 0
  const done = shown >= total
  const stickyShare = Math.round(summarise(run.sticky).shareA * 100)

  return (
    <section id="demo" aria-labelledby="demo-title">
      <div className="wrap">
        <h2 id="demo-title">Live demo</h2>
        <p className="section-lede">
          This runs the gateway’s exact selection code in your browser: a JavaScript port that matches the Go
          code on 8,000 out of 8,000 test picks. Each row is a conversation, each cell a message, coloured by
          the provider that answered.
        </p>

        <form className="controls" onSubmit={e => { e.preventDefault(); start() }}>
          <label className="control">
            <span>Claude share <output>{share}%</output></span>
            <input type="range" min="10" max="90" step="5" value={share} onChange={e => setShare(Number(e.target.value))} />
          </label>
          <label className="control">
            <span>Conversations</span>
            <select value={conversations} onChange={e => setConversations(Number(e.target.value))}>
              {[50, 100, 200].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <label className="control">
            <span>Messages each</span>
            <select value={turns} onChange={e => setTurns(Number(e.target.value))}>
              {[6, 10, 16].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <button className="btn primary" type="submit" disabled={!done}>Run conversations</button>
        </form>

        <div className="legend" aria-hidden="true">
          <span><i className="sw a" />Claude</span><span><i className="sw b" />GPT</span>
        </div>

        <div className="panels">
          <figure className="panel">
            <figcaption><h3>Bifrost today</h3><p>A new weighted draw on every message.</p></figcaption>
            <ProviderGrid rows={reveal(run.random, shown)} label="Provider per message, Bifrost today" />
            <Stats rows={run.random} done={done} />
          </figure>
          <figure className="panel">
            <figcaption><h3>With <code>sticky_sessions</code></h3><p>One pick per conversation, from its session ID.</p></figcaption>
            <ProviderGrid rows={reveal(run.sticky, shown)} label="Provider per message, with sticky sessions" />
            <Stats rows={run.sticky} done={done} />
          </figure>
        </div>
        <p className="note" role="status">
          {done
            ? `Target split ${run.share}/${100 - run.share}. With sticky sessions, ${stickyShare}% of these ${run.sticky.length} conversations started on Claude and none switched. Run again for new session IDs; with more conversations the split gets closer to the setting.`
            : 'Running…'}
        </p>
      </div>
    </section>
  )
}
