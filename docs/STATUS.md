# Status

Each person edits **only their own section**. Update at the end of every session.
Deadline: **2026-11-15 23:59** (submission). Judging: 2026-11-29.

## Overall (updated 2026-11-12, late)

- [x] Research and track choice (see `DECISIONS.md`)
- [x] Feature implemented in `bifrost/` on `feat/sticky-weighted-targets` (commits `117b7b7` + review fixes `594b5b6`)
- [x] Go tests: routing plugin (also with `-race`), configstore, HTTP handlers all pass
- [x] UI: switch added; i18n check passes; UI build + typecheck 0 errors
- [x] Fork: https://github.com/akashjhajharia123-ui/bifrost/tree/feat/sticky-weighted-targets
- [x] Team repo: https://github.com/akashjhajharia123-ui/stickyroute (teammates invited)
- [x] Commented on #5409; draft PR https://github.com/maximhq/bifrost/pull/9908
- [x] Review done: independent reviewer agent + CodeRabbit. Fixes in `594b5b6` (see B section)
- [x] Routing proof on the real gateway: 974/1000 conversations switched today vs 0/1000 sticky
- [x] Website with live simulator in `site/` (JS port matches Go on 8,000/8,000 picks), on branch `gh-pages`
- [x] Website live: https://akashjhajharia123-ui.github.io/stickyroute/
- [x] Replied to all 5 CodeRabbit comments on PR #9908 (4 fixed in `594b5b6`, harness case promised as follow-up)
- [ ] Cache/cost benchmark with real providers (free route: Gemini + Groq keys needed)
- [ ] Deck (cover done in the Slides artifact; to finish, then Canva), demo video
- [ ] Mark PR #9908 "Ready for review"
- [ ] Hackathon submission (human)

## A: core (Akash + Claude)

Done: feature, review fixes, docs, website, routing proof.
Next: CodeRabbit replies (after approval), deck, real-provider benchmark once keys exist.
Blocked / questions: GitHub Pages must be switched on by a human (auto-mode safety check).

## B: tests and review (Rahul)

Done by Akash's Claude (independent reviewer agent + CodeRabbit), fixed in `594b5b6`:
- MEDIUM: NaN weight could win sticky selection. Fixed, test added.
- MAJOR (CodeRabbit): honour `x-bf-session-affinity: off`. Fixed via `schemas.IsSessionAffinityActive`, test added.
- MAJOR (CodeRabbit): scope sticky key per caller. Fixed via `bifrost.SessionStateKey(ctx, "sticky-route", ruleID)`, test added.
- MAJOR (CodeRabbit): tests moved into `engine_test.go` and `frameworkconfighash_test.go`.
- MEDIUM: docs gaps (OpenAPI YAML source, routing-rules page, config.json table). Fixed; `openapi.json` regenerated with `bundle.py`, identical.
- MEDIUM: API round-trip test added (`TestRoutingRuleStickySessionsRoundTrip`).
Open (deliberately not done yet):
- CodeRabbit asks for a provider-harness case and the reviewer for a Playwright e2e test of the switch.
  Both need the full harness/e2e stack to run; adding them unrun would be worse than not adding them.
  Rahul: if you have time, try `make run-e2e-ui` for the routing-rules spec and add a toggle-and-persist case.
- LOW: UI badge for sticky rules in the rule info sheet / tree view (optional).
Blocked / questions: none.

## C: benchmark and dashboard (Kanishk)

Done: routing proof (`bench/results/routing-proof.json`), dashboard, website results section.
Next: free cache benchmark (Gemini + Groq), see the prompt in chat / `bench/README.md` section 2.
Blocked / questions: needs free API keys created by a human.

## D: product and pitch (Ronak, no Claude)

Next:
- Ask on Discord: one or two submissions allowed? How does Nov 29 judging run?
- Open the website once Pages is on; try the demo on your phone; note anything confusing.
- Review `docs/PITCH.md` and `docs/JUDGE_QA.md`; rehearse.
- Record the demo video from `docs/DEMO_SCRIPT.md` (use the website demo for the visuals).
Blocked / questions: none.
