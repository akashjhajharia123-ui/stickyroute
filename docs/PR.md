# Upstream PR description (draft: a human opens the PR)

**Title:** feat(routing): session-sticky target selection for weighted routing rules

Closes #5409

## Problem

`selectWeightedTarget` draws a fresh random target per request, so turns of one
conversation land on different providers under a weighted rule. Besides breaking
cross-provider conversations and discarding provider prompt caches, it defeats core
session affinity: `ResolveRoute` keeps a session on its bound route only while the chain
offers it, and a re-roll to the other target drops the binding as stale.

Measured with the HTTP gateway built from this branch, two local OpenAI-compatible
upstreams and a 70/30 rule, 1,000 sessions × 10 turns, affinity on: 974 sessions switched
provider with the current behaviour, 0 with `sticky_sessions: true`.

## Change

- `TableRoutingRule.StickySessions` (`sticky_sessions`, default false) + migration
  `add_sticky_sessions_column_to_routing_rules`.
- `rules.selectRuleTarget`: when the matched rule is sticky and the request has a session id
  (`BifrostContextKeySessionID`), pick with weighted rendezvous hashing over
  (session id, rule id, provider/model/key_id); otherwise the existing random draw.
- `GenerateRoutingRuleHash` includes the flag only when true, so existing digests are
  unchanged (the pinned-digest test still passes) and no backfill is needed.
- HTTP create/update fields, config/OpenAPI/Helm schemas, UI switch with strings in all locales.

This follows the issue's config-gated proposal. Happy to switch to the injectable selector
hook instead if maintainers prefer that shape.

## Tests

- `plugins/routing/rules/sticky_test.go`: same key same target; chi-square split for 70/30,
  50/30/20 and all-zero weights (reusing `requireTargetSplit`); zero weight never chosen;
  negative/empty input; target order independence; removing a target moves only its
  sessions; key pins distinguished; engine-level sticky vs non-sticky vs no session.
- `framework/configstore/routingrulesticky_test.go`: enabling the flag changes the hash.
- `go test` passes for `plugins/routing/...`, `framework/configstore`,
  `transports/bifrost-http/handlers`; UI `vite build` + `tsc` clean; `i18n:check` passes.

## Notes for reviewers

- No new failover logic: once the pick is stable, core affinity's existing rebind-to-fallback
  behaviour applies.
- AI assistance (Claude Code) was used; the authors reviewed and tested all changes.
