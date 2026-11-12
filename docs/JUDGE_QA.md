# Likely judge questions and answers

Every teammate should be able to answer these without notes.

**Why not just use a single-target rule?**
That gives up weighted splits entirely, which is the feature people want (cost, quota,
gradual migration). Sticky keeps the split across conversations and stability within one.

**Doesn't Bifrost's session affinity already solve this?**
No. `ResolveRoute` only keeps a session on its bound route if the routing chain contains it.
A weighted re-roll to the other target produces a chain without it, so the binding is dropped
as stale. Our routing proof shows it: with affinity on, 974/1000 conversations still switched.

**Why rendezvous hashing instead of `hash(session) mod totalWeight`?**
With mod, changing a weight or adding a target reshuffles almost every session. Rendezvous
moves only the sessions whose target was removed or lost share. It's also independent of
target order, which matters because the DB can return targets in any order.

**Is the split still accurate?**
Yes. Unit test: chi-square on 20,000 keys at p = 1e-6, the same helper Bifrost uses for the
random selector. Independent Python re-implementation over 100,000 sessions: 70.08% for a
70% target. In the 1,000-session routing proof: 72.7% (normal sampling noise at n = 1,000).

**What if the pinned provider goes down?**
Bifrost core's affinity binds the session to whichever fallback served it. Our pick stays
the same, and if the fallback is in the rule's fallback list, core moves it to the front. So
the session stays on the working provider. We added no failover code.

**What if there is no session ID?**
Unchanged weighted random selection. Same for rules without the flag. Default is off.

**Where does the session ID come from?**
Bifrost's existing ingestion: `x-bf-session-id`, the baggage `session-id`, or harness headers
(Claude Code, OpenCode, Codex). Capped at 255 characters by Bifrost's `NormalizeSessionID`.

**Can a client abuse it to pick a provider?**
A client can choose a session ID, and so could pick one that hashes to a given target. That
gives no more control than the existing ability to name a provider in the model string, and
the rule's targets still bound where it can go.

**Performance cost?**
One FNV-1a hash plus a mixer and one `math.Log` per target, only for matched sticky rules.
Microseconds, no I/O, no state.

**Why does the config hash only include the flag when true?**
So every rule stored before this change keeps its exact hash. Otherwise every rule would look
changed on upgrade and config.json would overwrite UI edits. The existing pinned-digest test
proves the digests did not move.

**How did you use AI?**
Claude Code helped research, implement and test. The team reviewed every line, and every
claim in the deck comes from a committed results file or a passing test.

**What would you do next?**
Ask maintainers whether they prefer the per-rule flag or an injectable selector hook (the
issue's alternative), add a plugin-level test combining sticky rules with core affinity
through a fallback, and run the real-provider cache benchmark at larger scale.
