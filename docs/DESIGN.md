# Design: sticky sessions for weighted routing rules

Status: **implemented on branch `feat/sticky-weighted-targets`** in `bifrost/` (2026-11-12).
Changing anything below needs a line in `DECISIONS.md`.

## Behaviour

| Rule `sticky_sessions` | Request has session ID | Target selection |
|---|---|---|
| false (default) | any | Unchanged: weighted random draw per request |
| true | no | Unchanged: weighted random draw per request |
| true | yes | Deterministic: weighted rendezvous hash of (session ID, rule ID, target) |

**Session ID** = `schemas.BifrostContextKeySessionID`, which Bifrost's HTTP transport already
fills from `x-bf-session-id`, the baggage `session-id` member, or a harness header
(`x-claude-code-session-id`, `x-session-affinity`, `x-session-id`, `session-id`, ...; see
`core/schemas/useragents.go` `HarnessSessionHeaders`). We add no new header.

## Algorithm: weighted rendezvous (highest random weight) hashing

For each valid target `t` (weight >= 0):

```
u_t   = splitmix64(fnv64a(sessionID + "\0" + ruleID + "\0" + identity(t))) mapped into (0, 1)
score = weight_t / -ln(u_t)
pick  = target with the highest score (ties broken by identity string)
identity(t) = provider + "\0" + model + "\0" + key_id     (the target table's unique index)
```

Properties (each covered by a test in `plugins/routing/rules/sticky_test.go`):

1. Same session + rule → same target, always.
2. Across many sessions, each target's share follows its weight (chi-square test, reusing the
   existing `requireTargetSplit` helper).
3. Target order does not matter (the DB can return targets in any order).
4. Removing a target moves only the sessions that were on it.
5. Weight edge cases match `selectWeightedTarget`: negatives filtered, zero never chosen while
   another target has weight, all-zero → uniform.

Why not `fnv(session) mod totalWeight` (the issue's suggestion): with a modulo bucket, any
weight change or added target reshuffles almost every session. Rendezvous hashing moves only
the minimum.

## Interaction with core session affinity (why the fix is small)

`core/sessionaffinity.go` already binds a session to the route that served it, and
`ResolveRoute` moves that route to the front of the chain **if the chain contains it**.
Before this change, a weighted rule re-rolled each turn, so the chain often lacked the bound
route and core deleted the binding as stale. With a stable pick:

- Normal turns: the rule picks target X every time → X stays bound.
- X fails, fallback Y serves: core's `Observe` rebinds the session to Y. Next turn, the rule
  still picks X, and if Y is in the rule's fallbacks, core moves Y to the front. So the
  session stays on Y until its binding expires or fails. We write no failover code.

## Code changes (branch `feat/sticky-weighted-targets`)

| File | Change |
|---|---|
| `framework/configstore/tables/routingrules.go` | `StickySessions bool` column, `json:"sticky_sessions"`, default false |
| `framework/configstore/migrations.go` | `add_sticky_sessions_column_to_routing_rules` (add/drop column, no backfill) |
| `framework/configstore/clientconfig.go` | Rule hash includes `sticky_sessions:true` **only when true**, so existing digests are unchanged |
| `plugins/routing/rules/engine.go` | `selectRuleTarget`, `selectStickyWeightedTarget`, `routingTargetIdentity`, `stickyHashUnit` |
| `transports/bifrost-http/handlers/routing.go` | `sticky_sessions` on create and update requests |
| `transports/config.schema.json`, `docs/openapi/openapi.json`, `helm-charts/bifrost/values.schema.json` | Field documented in schemas |
| `ui/...` | Switch in the rule sheet, types, form schema, strings in all 11 locales |

Tests: `plugins/routing/rules/sticky_test.go` (10 tests), `framework/configstore/routingrulesticky_test.go`.

## Open questions for maintainers (ask on #5409)

1. Per-rule flag (what we built) vs. the injectable selector hook the issue also proposes?
2. Should a rule-level opt-in eventually become the default when a session ID is present?
3. Is a routing-engine log line per sticky pick the right verbosity?
