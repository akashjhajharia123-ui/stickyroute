# Status

Each person edits **only their own section**. Update at the end of every session.
Deadline: **2026-11-15 23:59** (submission). Judging: 2026-11-29.

## Overall (2026-11-12)

- [x] Research and track choice (see `DECISIONS.md`)
- [x] Feature implemented and committed in `bifrost/` on branch `feat/sticky-weighted-targets` (commit `117b7b7`)
- [x] Go tests: routing plugin, configstore, HTTP handlers all pass
- [x] UI: switch added; i18n check passes; UI build + typecheck 0 errors
- [ ] Fork maximhq/bifrost on GitHub and push the branch (human: needs a GitHub account)
- [ ] Comment on #5409 that the team is working on it (human)
- [x] Routing proof on the real gateway (no keys): 974/1000 conversations switched provider
      today vs 0/1000 with sticky (`bench/results/routing-proof.json`)
- [x] Dashboard (`dashboard/index.html`) renders the routing proof
- [x] Drafts for D: `docs/PITCH.md`, `docs/DEMO_SCRIPT.md`, `docs/JUDGE_QA.md`, `docs/PR.md`
- [ ] Benchmark with real providers (needs API keys in env vars; set model names in `bench/real/config.json`)
- [ ] Dashboard view of the real-provider run
- [ ] README, deck, demo video, judge Q&A
- [ ] Upstream PR opened (human), linked to #5409
- [ ] Hackathon submission (human)

## A: core (Claude)

Done: feature code (see `DESIGN.md` table).
Next:
- Run Bifrost locally with a sticky rule and send `x-bf-session-id` requests by hand; confirm
  the routing log shows the sticky line and turns stay on one provider.
- Check `tests/scripts/migration-checker` passes with the new column.
- Run the broader suites touched: `make test-plugins`, configstore tests on Postgres if the
  Makefile supports it.
Blocked / questions: none.

## B: tests and review (Claude)

Next:
- Review commit `117b7b7` against `DESIGN.md` and `bifrost/AGENTS.md`; list issues in this section.
- Add a test in `plugins/routing` (plugin level) proving a sticky rule plus core session
  affinity keeps a session on one provider across turns, including after a fallback serves.
- Add a UI test for the switch if the repo has tests for the chain_rule switch.
- Draft the upstream PR description in `docs/PR.md`.
Blocked / questions: none.

## C: benchmark and dashboard (Claude)

Next: see `bench/README.md`. Run the routing proof (no keys needed), then the cache/cost run
with real keys. Commit results to `bench/results/`. Build `dashboard/` from them.
Blocked / questions: needs API keys for two cache-capable providers.

## D: product and pitch (no Claude)

Next:
- Ask on Discord: one or two submissions allowed? How does Nov 29 judging run?
- Follow `bench/README.md` setup on your own laptop from scratch; note every snag here.
- Review `docs/PITCH.md` and `docs/JUDGE_QA.md`; rehearse.
- Record the demo video from `docs/DEMO_SCRIPT.md`.
Blocked / questions: none.
