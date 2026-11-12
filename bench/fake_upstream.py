"""Fake OpenAI-compatible upstream for the routing proof.

Serves POST /v1/chat/completions and answers with which upstream served it, so the
benchmark can see where Bifrost routed each turn without real provider keys.

It reports no prompt-cache numbers: cache and cost results only come from real providers
(see bench/README.md). Usage: python3 fake_upstream.py --name upstream-a --port 9101
"""

import argparse
import json
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer


def build_handler(upstream_name: str) -> type[BaseHTTPRequestHandler]:
    class Handler(BaseHTTPRequestHandler):
        def do_POST(self) -> None:
            if not self.path.rstrip("/").endswith("/chat/completions"):
                self._send(404, {"error": {"message": f"unsupported path {self.path}"}})
                return
            try:
                length = int(self.headers.get("Content-Length", "0"))
                body = json.loads(self.rfile.read(length) or b"{}")
            except (ValueError, json.JSONDecodeError) as exc:
                self._send(400, {"error": {"message": f"bad request body: {exc}"}})
                return
            messages = body.get("messages", [])
            prompt_chars = sum(len(str(m.get("content", ""))) for m in messages)
            self._send(200, {
                "id": f"fake-{int(time.time() * 1000)}",
                "object": "chat.completion",
                "created": int(time.time()),
                "model": body.get("model", "unknown"),
                "choices": [{
                    "index": 0,
                    "message": {"role": "assistant", "content": f"served-by:{upstream_name}"},
                    "finish_reason": "stop",
                }],
                "usage": {
                    "prompt_tokens": max(1, prompt_chars // 4),
                    "completion_tokens": 4,
                    "total_tokens": max(1, prompt_chars // 4) + 4,
                },
            })

        def do_GET(self) -> None:
            if self.path.rstrip("/").endswith("/models"):
                self._send(200, {"object": "list", "data": [{"id": "bench-model", "object": "model"}]})
                return
            self._send(404, {"error": {"message": "not found"}})

        def _send(self, status: int, payload: dict) -> None:
            data = json.dumps(payload).encode()
            self.send_response(status)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)

        def log_message(self, format: str, *args) -> None:  # noqa: A002 - signature fixed by base class
            return  # keep benchmark output readable

    return Handler


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--name", required=True, help="name reported in every answer")
    parser.add_argument("--port", type=int, required=True)
    args = parser.parse_args()
    server = ThreadingHTTPServer(("127.0.0.1", args.port), build_handler(args.name))
    print(f"{args.name} listening on 127.0.0.1:{args.port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
