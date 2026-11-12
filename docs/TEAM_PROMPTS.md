# Opening prompts for each teammate's Claude

Each person clones the team repo, opens Claude Code in the repo folder, and pastes their
prompt as the first message. `CLAUDE.md` is loaded automatically.

## Person A: core

```
You are track A (core) on the StickyRoute hackathon project. Read CLAUDE.md, then
docs/BRIEF.md, docs/DESIGN.md, docs/DECISIONS.md and docs/STATUS.md. The feature is
already implemented in bifrost/ on branch feat/sticky-weighted-targets. Your job is the
"A: core" list in docs/STATUS.md. Work only on files listed under A in DESIGN.md unless
STATUS.md says otherwise. Follow bifrost/AGENTS.md. Run the relevant Go tests before you
finish, and update the A section of STATUS.md when you stop.
```

## Person B: tests and review

```
You are track B (tests and review) on the StickyRoute hackathon project. Read CLAUDE.md,
then docs/BRIEF.md, docs/DESIGN.md, docs/DECISIONS.md and docs/STATUS.md. First review
the latest commit on bifrost/ branch feat/sticky-weighted-targets as a strict Bifrost
maintainer would: correctness, concurrency, style per bifrost/AGENTS.md, missing tests.
Write findings in the B section of STATUS.md before fixing anything. Then do the rest of
the B list. Tests first. Do not change engine logic without a note in DECISIONS.md.
```

## Person C: benchmark and dashboard

```
You are track C (benchmark and dashboard) on the StickyRoute hackathon project. Read
CLAUDE.md, then docs/BRIEF.md, docs/INTERFACES.md, docs/STATUS.md and bench/README.md.
Results must follow the format in docs/INTERFACES.md section 4 exactly. Never invent or
estimate numbers; every number in the dashboard must come from a committed file in
bench/results/. API keys come from environment variables only. Update the C section of
STATUS.md when you stop.
```

## Person D (no Claude)

Read `docs/BRIEF.md`, then your list in `docs/STATUS.md`. Everything drafted for you is in
`docs/` (pitch, demo script, judge Q&A).
