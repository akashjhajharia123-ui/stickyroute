# Interfaces: contracts between tracks

These let A, B, C and D work in parallel. Changing one needs a line in `DECISIONS.md`.

## 1. Routing rule (what operators configure)

API: `POST /api/routing/rules` (create), `PUT /api/routing/rules/{rule_id}` (update); the older
`/api/governance/routing-rules` paths are aliases. The management API needs dashboard auth or a
`setup_token`; for local benchmarks, put rules in `config.json` under `governance.routing_rules`
instead (see `bench/routing-proof/config.json`).

```json
{
  "name": "claude-split",
  "cel_expression": "model == \"claude-sonnet\"",
  "targets": [
    {"provider": "anthropic", "model": "claude-sonnet-4-6", "weight": 0.7},
    {"provider": "openai",    "model": "gpt-5.4",          "weight": 0.3}
  ],
  "sticky_sessions": true,
  "scope": "global",
  "priority": 0
}
```

Model names in examples are placeholders; use current names from each provider.

## 2. Session ID (what clients send)

Header `x-bf-session-id: <conversation id>`, max 255 characters. Harness headers such as
`x-claude-code-session-id` also work.

## 3. Secrets

Environment variables only, never committed, never pasted into chat:

| Variable | Used by |
|---|---|
| `ANTHROPIC_API_KEY` | Bifrost provider config for the benchmark |
| `OPENAI_API_KEY` | Bifrost provider config for the benchmark |
| `BIFROST_URL` | Bench harness (default `http://localhost:8080`) |

## 4. Benchmark results file (C writes, dashboard and deck read)

Path: `bench/results/<run-name>.json`. One file per run. **Dashboard and slides use only
committed results files.**

```json
{
  "run": "2026-11-14-70-30",
  "created_at": "2026-11-14T10:00:00Z",
  "bifrost_commit": "<git sha of bifrost/>",
  "rule": {"targets": [{"provider": "anthropic", "model": "...", "weight": 0.7},
                       {"provider": "openai", "model": "...", "weight": 0.3}]},
  "workload": {"sessions": 20, "turns_per_session": 15, "system_prompt_tokens": 3000},
  "modes": [
    {
      "mode": "random | sticky | single",
      "sessions": [
        {
          "session_id": "s-001",
          "turns": [
            {"turn": 1, "provider": "anthropic", "model": "...",
             "input_tokens": 3120, "cached_input_tokens": 0, "output_tokens": 210,
             "cost_usd": 0.0123, "latency_ms": 1840, "error": null}
          ]
        }
      ],
      "summary": {
        "provider_switches_per_session": 0.0,
        "cached_input_ratio": 0.0,
        "total_cost_usd": 0.0,
        "p50_latency_ms": 0, "p95_latency_ms": 0,
        "error_rate": 0.0,
        "share_by_provider": {"anthropic": 0.7, "openai": 0.3}
      }
    }
  ]
}
```

Field rules:
- `cached_input_tokens`: as reported by the provider via Bifrost's usage fields. If a provider
  does not report it, write `null`, never 0.
- `cost_usd`: from Bifrost's cost reporting when available; otherwise computed from a dated
  price table committed at `bench/prices.json`, and the run notes which.
- `share_by_provider` is across sessions (first turn of each), so it shows that the split holds.
