#!/usr/bin/env python3
"""Smoke-test a running News Intelligence Platform backend.

Only the Python standard library is used, so it works from any machine that
can reach the API:

    python scripts/smoke_test.py
    python scripts/smoke_test.py --base-url http://localhost:8000

Exit codes:
    0  API root and health endpoints behave as expected
    1  a critical check failed (unreachable backend, database down, bad payload)
"""

from __future__ import annotations

import argparse
import json
import sys
import time
import urllib.error
import urllib.request

CHECKS: list[tuple[str, str, int | tuple[int, ...]]] = [
    # (label, path, acceptable HTTP status codes)
    ("API root", "/api/v1/", (200,)),
    ("Health (liveness)", "/api/v1/health/", (200,)),
    ("Readiness", "/api/v1/health/ready/", (200, 503)),
    ("Database", "/api/v1/health/database/", (200, 503)),
]


def fetch(url: str, timeout: float) -> tuple[int | None, object, str | None]:
    """Return (status, parsed_json_or_none, error_message_or_none)."""
    started = time.perf_counter()
    request = urllib.request.Request(url, headers={"Accept": "application/json"})
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            raw = response.read().decode("utf-8", errors="replace")
            status: int | None = response.status
    except urllib.error.HTTPError as exc:
        raw = exc.read().decode("utf-8", errors="replace")
        status = exc.code
    except Exception as exc:  # noqa: BLE001 - reported to the operator
        return None, None, f"{type(exc).__name__}: {exc}"

    elapsed_ms = round((time.perf_counter() - started) * 1000, 1)
    try:
        payload = json.loads(raw)
    except json.JSONDecodeError:
        return status, None, "response was not valid JSON"
    if isinstance(payload, dict):
        payload["_elapsed_ms"] = elapsed_ms
    return status, payload, None


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--base-url",
        default="http://localhost:8000",
        help="Backend base URL (default: http://localhost:8000)",
    )
    parser.add_argument(
        "--timeout",
        type=float,
        default=5.0,
        help="Per-request timeout in seconds (default: 5)",
    )
    args = parser.parse_args()
    base = args.base_url.rstrip("/")

    failures = 0
    print(f"News Intelligence Platform - smoke test against {base}\n")

    for label, path, expected in CHECKS:
        status, payload, error = fetch(f"{base}{path}", args.timeout)
        if error is not None:
            print(f"  [FAIL] {label:<18} {path:<26} {error}")
            failures += 1
            continue
        if status not in expected:
            print(f"  [FAIL] {label:<18} {path:<26} HTTP {status}")
            failures += 1
            continue

        detail = ""
        if isinstance(payload, dict):
            state = payload.get("status") or payload.get("api_version") or ""
            elapsed = payload.pop("_elapsed_ms", None)
            detail = f"status={state}" + (f" ({elapsed} ms)" if elapsed else "")
            if path.endswith("/health/ready/"):
                checks = payload.get("checks", {})
                detail += " " + " ".join(
                    f"{name}={info.get('status')}"
                    for name, info in checks.items()
                    if isinstance(info, dict)
                )
        print(f"  [ OK ] {label:<18} {path:<26} {detail}")

    print()
    if failures:
        print(f"{failures} check(s) failed.")
        return 1
    print("All checks passed.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
