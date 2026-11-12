# Benchmark

Replays multi-turn sessions through a real Bifrost gateway built from our branch and records
which provider served every turn. Two setups:

| Setup | Needs keys | Measures |
|---|---|---|
| `routing-proof/` | No | Provider switches per conversation, weight split. Uses local fake upstreams. |
| `real/` | Yes | The same, plus cached input tokens, cost and latency from real providers. |

Results go to `results/<run>.json` (format: `docs/INTERFACES.md` section 4). Only committed
results files may be quoted in the deck, dashboard or README.

## Prerequisites

- Go 1.27.3+, Node 20+, Python 3.10+ (standard library only).
- Build the gateway from our branch (from the repo root):

```bash
cd bifrost && make setup-workspace && cd ui && npm ci && npx vite build && npm run copy-build
```

```bash
cd ../transports/bifrost-http && go build -o ../../../bin/bifrost-http .
```

## 1. Routing proof (no keys)

Three terminals from the repo root:

```bash
python3 bench/fake_upstream.py --name upstream-a --port 9101
```

```bash
python3 bench/fake_upstream.py --name upstream-b --port 9102
```

```bash
./bin/bifrost-http -app-dir bench/routing-proof -port 8080
```

Then:

```bash
python3 bench/run_bench.py --run routing-proof --sessions 1000 --turns 10 --mode random=bench-random --mode sticky=bench-sticky --mode single=upstream-a/bench-model
```

`bench-random` and `bench-sticky` are two identical 70/30 rules in `routing-proof/config.json`;
the only difference is `sticky_sessions`. Core session affinity is on in both (Bifrost's default).

**Result (2026-11-12, `results/routing-proof.json`, 1000 sessions × 10 turns):**

| Mode | Sessions that switched provider | Switches per conversation | Split (first turn) |
|---|---|---|---|
| random | 974 / 1000 | 3.76 | 70.7 / 29.3 |
| sticky | 0 / 1000 | 0 | 72.7 / 27.3 |
| single | 0 / 1000 | 0 | 100 / 0 |

The sticky assignments were cross-checked with an independent Python implementation of the
hash (200/200 match), and over 100,000 sessions in the same ID format the split is 70.08%.

## 1b. Real provider, free tier: Gemini (routing confirmed, cache comparison NOT valid)

`results/free-gemini-70-30.json`, 2026-11-12: real Gemini free-tier traffic through the gateway
built from `594b5b6`, 10 conversations × 6 turns per mode, a 70/30 rule across
`gemini-3.1-flash-lite` / `gemini-3.1-flash-lite-preview`, each conversation with its own
~3k-token context (`--session-context 12000`), 120/120 requests succeeded.

| Mode | Conversations that switched model | Switches per conversation | Errors |
|---|---|---|---|
| random | 9 / 10 | 2.0 | 0 |
| sticky | 0 / 10 | 0 | 0 |

**Routing result: valid.** With real provider traffic, sticky sessions kept every conversation
on one model; today's behaviour moved 9 of 10.

**Cache result: do not quote.** Random mode reported 67.4% cached input tokens and sticky 63.7%,
but the test cannot show a difference: the two Gemini models share one implicit cache. In random
mode, conversation `...-0000` sent turn 1 to the preview model and turn 2 to the lite model, and
the lite model already reported 8,157 cached tokens of that conversation's unique context. Real
providers (for example Anthropic vs OpenAI) keep separate caches, so a valid cache measurement
needs two providers whose caches are separate and which both report cached tokens. The free
options tried did not qualify: Groq reported no cached tokens and hit its free limit after two
calls; `gemini-3.5-flash` reported 0 cached; `gemini-3.8-flash` and `gemini-flash-latest` were
overloaded. Use section 2 (paid keys, a few dollars) for a valid cache number.

`bench/free/start-gateway.sh` starts the gateway for this setup, reading the keys without
echoing or storing them.

## 2. Real providers (cache and cost)

1. Open `real/config.json` and replace both `VERIFY-...` model names with current, cheap
   models from each provider's model list. Anthropic gets `prompt_cache.auto_inject`;
   OpenAI caches long prefixes automatically.
2. Export keys in your shell only (never in files or chat): `ANTHROPIC_API_KEY`, `OPENAI_API_KEY`.
3. Start the gateway:

```bash
./bin/bifrost-http -app-dir bench/real -port 8081
```

4. Smoke test with 2 sessions first and check `cached_input_tokens` and `cost_usd` appear in
   the results file (they are `null` if the gateway does not report them; fix that before a
   big run rather than assuming 0):

```bash
python3 bench/run_bench.py --bifrost-url http://localhost:8081 --run real-smoke --sessions 2 --turns 4 --mode random=real-random --mode sticky=real-sticky
```

5. Full run. Cost scales with sessions × turns × ~4k-token prompt; 20 × 8 is a sensible start:

```bash
python3 bench/run_bench.py --bifrost-url http://localhost:8081 --run real-70-30 --sessions 20 --turns 8 --mode random=real-random --mode sticky=real-sticky
```

What to look at: `cached_input_ratio` and `total_cost_usd` per mode. Sticky should cache more
because each conversation keeps hitting the same provider's cache.

## Files

- `fake_upstream.py`: OpenAI-compatible fake that says which upstream served the turn.
- `run_bench.py`: the session replayer.
- `prompts/system.txt`: fixed ~4k-token system prompt (generated with seed 5409) so caching applies.
- `routing-proof/config.json`, `real/config.json`: gateway configs. Bifrost writes its databases
  and logs next to them; those are gitignored.
