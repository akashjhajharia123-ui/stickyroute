# Demo video voiceover (for ElevenLabs)

About 2 minutes 30 seconds. This adds to `docs/DEMO_SCRIPT.md`, which stays the shot list.

Every number comes from a committed results file:

- `bench/results/routing-proof.json`
- `bench/results/free-gemini-70-30.json`
- the routing tests in `bifrost/plugins/routing/rules/engine_test.go`

The real-provider cache comparison is deliberately left out, because that run's cache numbers were invalid.

## How to generate it

- One clip per scene: paste each scene's text into ElevenLabs separately and download it as MP3.
  Name the files `01.mp3` to `09.mp3`. That lets the video cut exactly on each scene.
  One single file for everything also works; leave about one second of silence between scenes.
- Voice: a calm, clear narrator, for example "Brian" or "Adam".
  Settings: model Multilingual v2, stability about 50, similarity about 75, style 0.
- Numbers are written as words on purpose, so the voice reads them correctly. Paste the text exactly as it is.
- Save the clips in `video/voice/` in this repo, then tell Claude "voice is ready".

## Script

**01 · The problem** (title)
> Bifrost is an open-source AI gateway. It can split traffic across providers: say seventy percent to one model, thirty percent to another. But the split is rolled again on every single request. So one conversation keeps jumping between providers, turn after turn.

**02 · Why it hurts** (website hero, then issue #5409)
> That breaks prompt caching, changes the model's tone mid-chat, and makes bugs impossible to trace. It's a real open issue in Bifrost. We built the fix. We call it StickyRoute.

**03 · The idea** (website "how it works")
> One switch per routing rule: sticky sessions. Turn it on, and every conversation stays with one provider from its first message to its last, while the traffic as a whole still follows your split.

**04 · The proof setup** (config with the two rules)
> To prove it, we ran one thousand conversations, ten turns each, through the real Bifrost gateway built from our branch. Two identical seventy-thirty rules. The only difference is the sticky switch.

**05 · The result** (dashboard headline cards)
> Without it, nine hundred and seventy-four of the thousand conversations switched provider. With sticky sessions: zero. And the overall split stayed close to seventy-thirty.

**06 · The picture** (dashboard grids)
> Each row is a conversation, each cell is one turn. Today it looks like confetti. With StickyRoute, it's clean stripes: every conversation stays put.

**07 · Real providers** (real Gemini run)
> We repeated it on real Gemini models. Nine of ten conversations switched without sticky sessions. Zero with it.

**08 · How it works** (engine.go, then the UI switch, then the tests)
> Under the hood it's weighted rendezvous hashing. The same session always lands on the same target, and changing targets moves only the sessions that have to move. Operators turn it on from the UI, the API, or the config file. Twelve sticky-session tests pass, including a check that the split follows the weights.

**09 · Close** (closing slide)
> Opt-in, backward compatible, and already open as a pull request upstream. StickyRoute: one conversation, one provider. Thank you.
