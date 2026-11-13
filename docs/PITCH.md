# Pitch deck: slide-by-slide text

Ten slides. Numbers marked **[real run]** must be filled from `bench/results/real-70-30.json`
once it exists; do not present them before then.

## 1. Title
**StickyRoute: session-sticky weighted routing for Bifrost**
Team Matrixx · Geek Room Global AI Hackathon · Bifrost track, Problem 04
Upstream issue: maximhq/bifrost#5409

## 2. The problem
Teams split traffic across providers with Bifrost's weighted routing rules: 70% Claude,
30% GPT. But the split is drawn **per request**, not per conversation.
- Turn 1 on Claude, turn 2 on GPT, turn 3 on Claude...
- Conversations break (different message formats and tool calling).
- Every switch throws away the provider's prompt cache, so the long prefix is billed again.
- The model's style changes mid-thread.

## 3. It is worse than it looks
Bifrost already ships session affinity, but it only holds while the routing chain offers the
session's previous provider. Each re-roll to the other target hands it a chain without it, and
the binding is dropped. **Weighted rules quietly defeat the affinity Bifrost already has.**

## 4. Measured on a real Bifrost gateway
Picture: the dashboard's "who served each turn" grids (random vs sticky).
- Random (Bifrost today): **974 of 1,000 conversations switched provider**, 3.76 switches per
  10-turn conversation.
- Sticky: **0 of 1,000.**
(Source: `bench/results/routing-proof.json`, local fake upstreams behind the real gateway.)

## 5. The fix
One opt-in flag per rule: `"sticky_sessions": true`.
- Requests with a session ID (`x-bf-session-id` or Claude Code / Codex / OpenCode headers,
  which Bifrost already reads) always get the same target.
- Requests without one, and rules without the flag: unchanged.
- No new header, no new store, no failover code.

## 6. How: weighted rendezvous hashing
`score = weight / -ln(hash(session, rule, target))`, highest wins.
- Same session → same target.
- Split stays exact: 70.08% over 100,000 sessions.
- Target order irrelevant; removing a target moves only its own sessions.
Why not `hash mod total`: one weight change would reshuffle almost every session.

## 7. Failover for free
If the pinned provider fails, Bifrost's existing affinity binds the session to the fallback
that served it. Our stable pick is what lets that binding survive. Zero new failover code.

## 8. Built like an upstream contribution
- Engine change + 10 Go tests (stickiness, chi-square split, order, minimal movement, edge cases).
- Migration, API fields, config/OpenAPI/Helm schemas, UI switch in 11 languages.
- Existing rules keep their config hash, so no backfill migration and no spurious resyncs.
- All routing, configstore and HTTP handler test suites pass; UI builds with 0 type errors.

## 9. Impact with real providers [real run]
Cached-input ratio and cost per conversation, random vs sticky, 70/30 Claude/GPT.
Fill only from the committed real results file.

## 10. Status and ask
- Upstream PR: link (opened by the team).
- What's next: an injectable selector hook (the issue's alternative), per-team stickiness TTL.
- Built with AI assistance (Claude Code); every line reviewed and owned by the team.
