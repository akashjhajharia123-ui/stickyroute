import FadeContent from '../components/rb/FadeContent.jsx'
import SpotlightCard from '../components/rb/SpotlightCard.jsx'

const PROBLEMS = [
  { title: 'Conversations break', body: 'Providers format messages and tool calls differently. Switching mid-thread causes errors and lost context.' },
  { title: 'The prompt cache is thrown away', body: 'Providers cache the conversation so repeat turns are cheaper. Caches are per provider, so every switch pays full price again.' },
  { title: 'The model changes mid-thread', body: 'Style and capability jump between turns, and users notice.' },
]

export default function Problem() {
  return (
    <section className="band" aria-labelledby="problem-title">
      <div className="wrap">
        <FadeContent blur duration={0.8}>
          <h2 id="problem-title">The problem: the waiter changes with every dish</h2>
          <p className="section-lede">
            A restaurant owner says “Waiter A serves 70% of tables, Waiter B 30%.” Sensible. Now imagine the
            waiter changes with every dish at the same table. That is what weighted routing does to AI
            conversations today.
          </p>
        </FadeContent>
        <div className="cards">
          {PROBLEMS.map((p, i) => (
            <FadeContent key={p.title} delay={i * 0.12} duration={0.7}>
              <SpotlightCard className="card" spotlightColor="rgba(127, 176, 255, 0.22)">
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </SpotlightCard>
            </FadeContent>
          ))}
        </div>
        <p className="note">
          It also undoes a feature Bifrost already has: session affinity keeps a conversation on its last
          provider only while routing still offers that provider, and every random re-roll to the other target
          drops it.
        </p>
      </div>
    </section>
  )
}
