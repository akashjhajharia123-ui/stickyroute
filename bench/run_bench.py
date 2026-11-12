"""Replay multi-turn sessions through Bifrost and record where every turn was served.

Each mode is a model name that a routing rule matches (see bench/routing-proof/config.json),
so one gateway can compare modes side by side:

    python3 run_bench.py --run routing-proof --sessions 200 --turns 10 \
        --mode random=bench-random --mode sticky=bench-sticky --mode single=upstream-a/bench-model

Writes bench/results/<run>.json in the format of docs/INTERFACES.md section 4. Numbers the
gateway does not report (cached tokens, cost) are written as null, never invented.
"""

import argparse
import json
import random
import statistics
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

BENCH_DIR = Path(__file__).resolve().parent
DEFAULT_SYSTEM_PROMPT = BENCH_DIR / "prompts" / "system.txt"
REQUEST_TIMEOUT_S = 120


def post_chat(base_url: str, model: str, session_id: str, messages: list[dict]) -> dict:
    """Send one chat turn; returns the parsed body or an error description."""
    payload = json.dumps({"model": model, "messages": messages}).encode()
    request = urllib.request.Request(
        f"{base_url}/v1/chat/completions",
        data=payload,
        headers={"Content-Type": "application/json", "x-bf-session-id": session_id},
        method="POST",
    )
    started = time.perf_counter()
    try:
        with urllib.request.urlopen(request, timeout=REQUEST_TIMEOUT_S) as response:
            body = json.loads(response.read())
            error = None
    except urllib.error.HTTPError as exc:
        body = _safe_json(exc.read())
        error = f"HTTP {exc.code}: {body.get('error', {}).get('message', '')[:200]}"
    except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as exc:
        body, error = {}, f"{type(exc).__name__}: {exc}"
    body["_latency_ms"] = round((time.perf_counter() - started) * 1000, 1)
    body["_error"] = error
    return body


def _safe_json(raw: bytes) -> dict:
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        return {"error": {"message": raw[:200].decode(errors="replace")}}


def turn_record(turn: int, body: dict) -> dict:
    extra = body.get("extra_fields") or {}
    usage = body.get("usage") or {}
    details = usage.get("prompt_tokens_details") or {}
    return {
        "turn": turn,
        "provider": extra.get("provider"),
        "model": (extra.get("routing_info") or {}).get("model") or body.get("model"),
        "input_tokens": usage.get("prompt_tokens"),
        "cached_input_tokens": details.get("cached_tokens"),  # null when not reported
        "output_tokens": usage.get("completion_tokens"),
        "cost_usd": extra.get("cost"),  # null when the gateway reports no cost
        "latency_ms": body["_latency_ms"],
        "error": body["_error"],
    }


CONTEXT_WORDS = ("request", "router", "gateway", "budget", "session", "provider", "token", "cache", "latency",
                 "fallback", "rule", "weight", "target", "model", "prompt", "handler", "store", "metric")


def session_context(session_id: str, chars: int) -> str:
    """A deterministic, session-unique document, like the repo or files an agent carries in its context.

    Unique per session so a provider cannot serve it from a prefix cached for another session:
    only a model that already saw THIS session's earlier turns can reuse its cache.
    """
    if chars <= 0:
        return ""
    rng = random.Random(session_id)
    words: list[str] = []
    size = 0
    while size < chars:
        word = f"{rng.choice(CONTEXT_WORDS)}{rng.randint(0, 9999)}"
        words.append(word)
        size += len(word) + 1
    return f"\n\nContext for {session_id}:\n" + " ".join(words)


def run_mode(base_url: str, model: str, sessions: int, turns: int, system_prompt: str, run: str, label: str,
             delay_s: float = 0.0, context_chars: int = 0) -> list[dict]:
    """Run all sessions of one mode, interleaving turns across sessions like concurrent users."""
    ids = [f"{run}-{label}-{i:04d}" for i in range(sessions)]
    histories = {sid: [{"role": "system", "content": system_prompt + session_context(sid, context_chars)}] for sid in ids}
    records: dict[str, list[dict]] = {sid: [] for sid in histories}
    for turn in range(1, turns + 1):
        for session_id, history in histories.items():
            history.append({"role": "user", "content": f"Turn {turn}: continue the task for {session_id}."})
            body = post_chat(base_url, model, session_id, history)
            records[session_id].append(turn_record(turn, body))
            if delay_s:
                time.sleep(delay_s)  # stay inside free-tier rate limits
            reply = ((body.get("choices") or [{}])[0].get("message") or {}).get("content") or ""
            history.append({"role": "assistant", "content": reply})
        print(f"  {label}: turn {turn}/{turns} done", file=sys.stderr, flush=True)
    return [{"session_id": sid, "turns": turns_} for sid, turns_ in records.items()]


def percentile(values: list[float], pct: float) -> float | None:
    if not values:
        return None
    ordered = sorted(values)
    index = min(len(ordered) - 1, max(0, round(pct / 100 * (len(ordered) - 1))))
    return ordered[index]


def route(turn: dict) -> str:
    """Where a turn was served: provider AND model, since caches are per model too."""
    return f'{turn["provider"]}/{turn["model"]}'


def summarise(sessions: list[dict]) -> dict:
    turns = [t for s in sessions for t in s["turns"]]
    switches = []
    for s in sessions:
        served = [route(t) for t in s["turns"] if t["error"] is None]
        switches.append(sum(1 for a, b in zip(served, served[1:]) if a != b))
    first = [route(s["turns"][0]) for s in sessions if s["turns"] and s["turns"][0]["error"] is None]
    share = {p: round(first.count(p) / len(first), 4) for p in sorted(set(first))} if first else {}
    cached = [t for t in turns if t["cached_input_tokens"] is not None and t["input_tokens"]]
    costs = [t["cost_usd"] for t in turns if t["cost_usd"] is not None]
    latencies = [t["latency_ms"] for t in turns if t["error"] is None]
    return {
        "provider_switches_per_session": round(statistics.mean(switches), 3) if switches else None,
        "sessions_with_any_switch": sum(1 for n in switches if n > 0),
        "cached_input_ratio": (
            round(sum(t["cached_input_tokens"] for t in cached) / sum(t["input_tokens"] for t in cached), 4)
            if cached else None
        ),
        "total_cost_usd": round(sum(costs), 6) if costs and len(costs) == len(turns) else None,
        "p50_latency_ms": percentile(latencies, 50),
        "p95_latency_ms": percentile(latencies, 95),
        "error_rate": round(sum(1 for t in turns if t["error"]) / len(turns), 4) if turns else None,
        "share_by_provider": share,
    }


def git_commit(path: Path) -> str | None:
    try:
        return subprocess.run(["git", "-C", str(path), "rev-parse", "HEAD"], capture_output=True, text=True, check=True).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return None


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--bifrost-url", default="http://localhost:8080")
    parser.add_argument("--run", required=True, help="run name; output goes to results/<run>.json")
    parser.add_argument("--mode", action="append", required=True, help="label=model, repeatable")
    parser.add_argument("--sessions", type=int, default=50)
    parser.add_argument("--turns", type=int, default=10)
    parser.add_argument("--system-prompt", type=Path, default=DEFAULT_SYSTEM_PROMPT)
    parser.add_argument("--note", default="", help="free text saved with the results")
    parser.add_argument("--delay", type=float, default=0.0, help="seconds to wait after each request (free-tier rate limits)")
    parser.add_argument("--session-context", type=int, default=0, metavar="CHARS",
                        help="add a unique per-session document of about CHARS characters to each session's system prompt")
    args = parser.parse_args()

    if args.sessions < 1 or args.turns < 2:
        parser.error("need at least 1 session and 2 turns")
    modes = []
    for spec in args.mode:
        label, sep, model = spec.partition("=")
        if not sep or not label or not model:
            parser.error(f"--mode must be label=model, got {spec!r}")
        modes.append((label, model))
    system_prompt = args.system_prompt.read_text()

    results = {
        "run": args.run,
        "created_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "bifrost_commit": git_commit(BENCH_DIR.parent / "bifrost"),
        "note": args.note,
        "workload": {"sessions": args.sessions, "turns_per_session": args.turns, "system_prompt_chars": len(system_prompt),
                     "session_context_chars": args.session_context, "delay_s": args.delay},
        "modes": [],
    }
    for label, model in modes:
        print(f"mode {label} (model {model})", file=sys.stderr)
        sessions = run_mode(args.bifrost_url, model, args.sessions, args.turns, system_prompt, args.run, label,
                            args.delay, args.session_context)
        results["modes"].append({"mode": label, "model": model, "sessions": sessions, "summary": summarise(sessions)})

    out = BENCH_DIR / "results" / f"{args.run}.json"
    out.parent.mkdir(exist_ok=True)
    out.write_text(json.dumps(results, separators=(",", ":")))  # compact: runs hold every turn
    print(f"\nwrote {out}")
    print(f"{'mode':<10}{'switches/session':>18}{'sessions switched':>19}{'share':>34}{'errors':>8}")
    for m in results["modes"]:
        s = m["summary"]
        print(f"{m['mode']:<10}{s['provider_switches_per_session']!s:>18}{s['sessions_with_any_switch']!s:>19}{json.dumps(s['share_by_provider']):>34}{s['error_rate']!s:>8}")


if __name__ == "__main__":
    main()
