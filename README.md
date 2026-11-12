# StickyRoute

**Session-sticky weighted routing for the Bifrost AI gateway.**
Geek Room Global AI Hackathon 2026, Bifrost track (Problem 04). Fixes maximhq/bifrost#5409.

Bifrost's weighted routing rules (say 70% Claude, 30% GPT) pick a provider **per request**, so
one conversation keeps jumping between providers: conversations break, prompt caches are thrown
away, and Bifrost's own session affinity gets undone. StickyRoute adds one opt-in flag per rule,
`"sticky_sessions": true`, that keeps every turn of a session on one target while the overall
split stays exact.

## Result

Real Bifrost gateway built from our branch, 70/30 rule, 1,000 conversations × 10 turns,
session affinity on (Bifrost's default). Source: `bench/results/routing-proof.json`.

| | Conversations that switched provider | Switches per conversation |
|---|---|---|
| Today (random per request) | **974 / 1000** | 3.76 |
| With `sticky_sessions` | **0 / 1000** | 0 |

The split stays exact: 70.08% over 100,000 sessions for a 70% target.

## How it works

Weighted rendezvous hashing over (session ID, rule ID, target): each target scores
`weight / -ln(u)` with `u` a uniform hash, and the highest wins. Same session → same target,
target order irrelevant, and removing a target moves only its own sessions. Session IDs come
from what Bifrost already reads (`x-bf-session-id`, Claude Code / Codex / OpenCode headers).
Failover reuses Bifrost's existing affinity. Details: [docs/DESIGN.md](docs/DESIGN.md).

## Repository layout

| Path | What |
|---|---|
| `bifrost/` | Not in this repo: clone [our fork](https://github.com/akashjhajharia123-ui/bifrost/tree/feat/sticky-weighted-targets) here (branch `feat/sticky-weighted-targets`). |
| `bench/` | Benchmark harness, fake upstreams, configs, committed results. [bench/README.md](bench/README.md) |
| `dashboard/` | Results page. Serve the repo root (`python3 -m http.server`) and open `/dashboard/`. |
| `docs/` | Brief, design, interfaces, decisions, status, pitch, demo script, judge Q&A, PR draft. |
| `CLAUDE.md` | Shared instructions for every teammate's Claude Code session. |

## Setup

```bash
git clone https://github.com/akashjhajharia123-ui/stickyroute.git && cd stickyroute && bash setup.sh
```

`setup.sh` clones our Bifrost fork into `bifrost/` on `feat/sticky-weighted-targets`, prepares the
Go workspace and runs the sticky tests. Team roles and the full onboarding: [docs/TEAM.md](docs/TEAM.md).
To build the gateway and run the benchmark: [bench/README.md](bench/README.md).

## Tests (in `bifrost/`)

```bash
make setup-workspace
```

```bash
cd plugins/routing && go test ./rules/ -run Sticky -v
```

## Use of AI

Built with Claude Code for research, implementation, tests and drafting. Every change was
reviewed by the team; every number here comes from a committed results file or a passing test.
