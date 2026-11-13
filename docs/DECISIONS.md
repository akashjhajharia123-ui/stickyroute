# Decisions log

Append only. Newest at the bottom. Format: date, decision, why, who.

- 2026-11-12. **Track: Bifrost Problem 04, issue maximhq/bifrost#5409.** Least crowded option
  with a real, upvoted upstream issue; judges are Bifrost engineers. Tavily track skipped (its
  prize is API credits; both Tavily problems are saturated). Team.
- 2026-11-12. **Per-rule `sticky_sessions` flag, default false.** Matches the issue's proposed
  shape, keeps existing behaviour unchanged, follows the `chain_rule` precedent end to end.
- 2026-11-12. **Weighted rendezvous hashing, not `hash mod totalWeight`.** Keeps the split exact,
  ignores target order, and moves the minimum number of sessions when targets change.
- 2026-11-12. **Reuse Bifrost's existing session ID** (`BifrostContextKeySessionID`); no new header.
- 2026-11-12. **No failover code of our own.** Core session affinity already rebinds a session to
  the fallback that served it; a stable pick is what lets that binding survive.
- 2026-11-12. **Hash includes `sticky_sessions` only when true**, so no config_hash backfill
  migration is needed and upgrades rewrite no stored rule.
- 2026-11-12. **Benchmark and dashboard live outside the upstream fork** (`bench/`, `dashboard/`),
  so the upstream PR contains only the feature.

## 2026-11-13: Team name

The team is **Team Matrixx** (Akash, Rahul, Kanishk, Ronak). Use this name on the deck, the demo video and the hackathon submission.
