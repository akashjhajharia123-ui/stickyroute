# StickyRoute: team workspace

This file is read by every Claude Code session working on this project. Several
teammates run separate Claude sessions on separate machines; **the files in this
repo are the only shared memory between them.** Read before you act, write down
what you did before you stop.

## Start of every session

1. Read `docs/BRIEF.md` (what we are building and why).
2. Read `docs/DESIGN.md` (the agreed design: do not deviate silently).
3. Read `docs/STATUS.md` (who is doing what, what is blocked).
4. Read `docs/DECISIONS.md` (choices already made; don't reopen them).
5. Work only inside the track you were assigned in `docs/STATUS.md`.

## End of every session

- Update **your own section** of `docs/STATUS.md`: done / in progress / blocked.
- If you changed a shared choice (config name, header, file format), append it to
  `docs/DECISIONS.md` with the date and reason, and tell the team.
- Commit on your track branch, never on `main` directly.

## Layout

| Path | What | Owner track |
|---|---|---|
| `bifrost/` | Our fork of maximhq/bifrost (its own git repo). The upstream change lives here. | A (core), B (tests) |
| `bench/` | Benchmark harness: replays multi-turn sessions through Bifrost, writes results. | C |
| `dashboard/` | Results page built from `bench/results/*.json`. | C |
| `web/` | Public website (React + React Bits), live at https://akashjhajharia123-ui.github.io/stickyroute/ via the `gh-pages` branch. | A |
| `docs/` | Brief, design, interfaces, decisions, status, pitch, judge Q&A. | D (anyone may edit their STATUS section) |

## Rules

- Inside `bifrost/`, follow `bifrost/AGENTS.md` and the existing code style. Keep the
  upstream diff minimal: no drive-by refactors, no files outside the routing change.
- Tests first: a behaviour change needs a failing test before the fix.
- Run `go test ./rules/...` from `bifrost/plugins/routing` before pushing core changes.
- Never commit API keys. Keys live in environment variables only (see `docs/INTERFACES.md`).
- Benchmark numbers in docs and slides must come from a committed results file.
  No estimated or invented numbers.
- No public action (GitHub comment, upstream PR, hackathon submission, Discord post)
  without a human on the team doing it.
- If something is unclear, write it under "Blocked / questions" in STATUS.md rather
  than guessing.
