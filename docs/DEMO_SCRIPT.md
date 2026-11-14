# Demo video script (about 3 minutes)

Voiceover text for ElevenLabs: `docs/VOICEOVER.md`.

Record at 1080p. Large terminal font. Close notifications. Rehearse twice first.

| Time | Screen | Say |
|---|---|---|
| 0:00 | Title slide | "Bifrost lets you split traffic across providers: say 70% Claude, 30% GPT. We found that the split is rolled per request, so a single conversation keeps jumping between providers." |
| 0:20 | Issue #5409 on GitHub | "This is a real open issue in Bifrost. We built the fix." |
| 0:30 | `bench/routing-proof/config.json`, the two rules | "Two identical 70/30 rules. The only difference: sticky_sessions." |
| 0:45 | Terminal: run `run_bench.py` routing proof | "A thousand ten-turn conversations through the real Bifrost gateway, built from our branch." |
| 1:05 | Dashboard, headline cards | "Today: 974 of 1,000 conversations switched provider. With sticky sessions: zero." |
| 1:20 | Dashboard grids | "Each row is a conversation, each cell a turn. Random is confetti. Sticky is stripes: every conversation stays put, and across conversations the split is still 70/30." |
| 1:45 | `engine.go`, `selectStickyWeightedTarget` | "Weighted rendezvous hashing: same session, same target; the split stays exact; changing targets moves only the sessions that must move." |
| 2:10 | Bifrost UI, routing rule sheet with the switch | "Operators turn it on per rule, from the UI, the API or config.json." |
| 2:25 | Terminal: `go test ./rules/ -run Sticky -v` | "Ten tests, including a chi-square check of the split, all green." |
| 2:40 | Real-provider results [only if real run exists] | "With real providers, sticky sessions keep the prompt cache warm: X% cached vs Y%." |
| 2:55 | Closing slide | "Opt-in, backward compatible, upstream-ready. Thank you." |

If the real-provider run is not done, cut the 2:40 row; do not show placeholder numbers.
