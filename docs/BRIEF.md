# Brief: StickyRoute

**Hackathon:** Geek Room Global AI Hackathon (hackculture.io/hackathons/ai-global-hackathon)
**Track:** Bifrost by Maxim AI, Problem Statement 04, "Build a Feature the Open-Source Gateway Is Missing"
**Prototype deadline:** 2026-11-15 23:59. **Live judging:** 2026-11-29.
**Judging criteria:** innovation, technical execution, problem and impact, use of AI, UX, scalability and potential.
**Problem 04 requirements:** real operator problem solved end to end; public extension points;
works with a standard Bifrost install with clear setup; tests, docs, upstream-PR quality.

## One-line pitch

Weighted routing in Bifrost re-rolls the provider on every request, so one conversation
bounces between providers, breaking it and throwing away the prompt cache. StickyRoute
pins each session to one weighted target, keeps the overall split exact, and we measure
what it saves.

## The problem (verified against Bifrost `dev`, 2026-11-12)

- Upstream issue: **maximhq/bifrost#5409**, "Session-sticky target selection for weighted
  Routing Rules". Open, unassigned, no PR as of 2026-11-12.
- `selectWeightedTarget` in `bifrost/plugins/routing/rules/engine.go` draws
  `rand.Float64()` on every request. (The issue names an older path,
  `plugins/governance/routing.go`; the code has since moved.)
- Bifrost core already has session affinity (`bifrost/core/sessionaffinity.go`).
  `ResolveRoute` keeps a session on the route that last served it **only if this
  request's chain contains that route.** With a weighted rule, a re-roll that lands on the
  other target gives a chain without the bound route, and core **deletes the binding as
  stale**. So weighted rules actively defeat the affinity Bifrost already ships.
- Consequences: conversations switch provider mid-thread (format and tool-calling
  differences, errors), provider-side prompt caches (Anthropic prompt caching, OpenAI
  cached tokens) are lost on every switch, and behaviour changes between turns.

## The fix

When a request carries a session ID, pick the weighted target with **weighted rendezvous
hashing** over (session ID, rule ID, target identity) instead of a random draw:

- Same session → same target, every turn.
- Across many sessions the split still follows the weights.
- Changing a rule's targets only moves the sessions that must move.
- Failover is already handled: core's affinity binds the session to whichever route
  served it, and since our pick is stable, the chain keeps containing the bound route.

See `DESIGN.md` for details.

## Deliverables

1. The change in our fork of Bifrost plus tests, ready as an upstream PR linked to #5409.
2. Benchmark (`bench/`): multi-turn sessions through a real Bifrost with a 70/30 rule
   across two cache-capable providers; random vs sticky vs single-provider baseline.
3. Results dashboard (`dashboard/`).
4. README, docs, pitch deck, demo video, judge Q&A (`docs/`).

## Team (3 Claude accounts, 4 people)

- **A (Claude): core.** Engine change, config gate, wiring.
- **B (Claude): tests and review.** Tests first, CI, reviews every PR against DESIGN.md.
- **C (Claude): benchmark and dashboard.**
- **D (no Claude): product and pitch.** Owns decisions, Discord, manual QA on a clean
  machine, recording the demo, leading judging rehearsal. Drafts are prepared in `docs/`.

Every teammate must be able to explain the hashing, the weight split and the failover in
live judging. The submission must say AI tools were used.
