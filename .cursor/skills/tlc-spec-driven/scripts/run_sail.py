#!/usr/bin/env python3
"""
run_sail.py - exclusive, foreground Sail/PHP gate runner.

Prevents the failure mode that stalled biblioteca-modelos-3d Batch 1:
overlapping `artisan migrate` / pest / pint / phpstan on the same Postgres
and bind-mount, plus WSL wrappers left running while the agent spawned more.

One process holds the lock. A second invocation exits 3 immediately.
Stale leftover gate PIDs inside laravel.test are cleared before start.
The PHP app server (`artisan serve`) is never killed.

Usage (from repo root, or pass --root):

  python <skill-dir>/scripts/run_sail.py -- artisan migrate:fresh --force
  python <skill-dir>/scripts/run_sail.py -- pest --testsuite=Unit
  python <skill-dir>/scripts/run_sail.py -- php -r "echo ini_get('upload_max_filesize');"
  python <skill-dir>/scripts/run_sail.py --status
  python <skill-dir>/scripts/run_sail.py --clear-stale

Exit: 0 ok, 1 command failed, 2 usage, 3 lock busy, 4 timeout.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import time
from pathlib import Path

STALE_PATTERNS = (
    "artisan migrate",
    "vendor/bin/pest",
    "vendor/bin/pint",
    "vendor/bin/phpstan",
)

LOCK_NAME = ".sail-gate.lock"
STATUS_REL = Path(".specs") / ".sail-gate-status.json"
DEFAULT_TIMEOUT = 600


def repo_root(explicit: str | None) -> Path:
    if explicit:
        return Path(explicit).resolve()
    here = Path(__file__).resolve()
    for candidate in [here.parent.parent.parent.parent, Path.cwd()]:
        if (candidate / "api" / "compose.yaml").exists() or (candidate / "api" / "composer.json").exists():
            return candidate
    return Path.cwd()


def write_status(root: Path, payload: dict) -> None:
    path = root / STATUS_REL
    path.parent.mkdir(parents=True, exist_ok=True)
    payload["updated_at"] = time.strftime("%Y-%m-%dT%H:%M:%S")
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def read_status(root: Path) -> dict | None:
    path = root / STATUS_REL
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return None


def lock_path(api: Path) -> Path:
    return api / LOCK_NAME


def pid_alive(pid: int) -> bool:
    if pid <= 0:
        return False
    try:
        os.kill(pid, 0)
    except OSError:
        return False
    except SystemError:
        return False
    return True


def read_lock(api: Path) -> dict | None:
    path = lock_path(api)
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, OSError):
        return None


def acquire_lock(api: Path, command: str, timeout: int) -> None:
    path = lock_path(api)
    existing = read_lock(api)
    if existing:
        pid = int(existing.get("pid") or 0)
        age = time.time() - float(existing.get("started_at") or 0)
        if pid_alive(pid) and age < timeout + 30:
            print(
                f"ERROR: Sail gate locked by pid {pid} since {existing.get('started_at')} "
                f"running: {existing.get('command')}",
                file=sys.stderr,
            )
            sys.exit(3)
        print("WARN: stealing stale sail-gate lock", file=sys.stderr)
        try:
            path.unlink()
        except OSError:
            pass
    payload = {
        "pid": os.getpid(),
        "started_at": time.time(),
        "command": command,
    }
    path.write_text(json.dumps(payload) + "\n", encoding="utf-8")


def release_lock(api: Path) -> None:
    path = lock_path(api)
    try:
        data = read_lock(api)
        if data and int(data.get("pid") or 0) == os.getpid():
            path.unlink()
    except OSError:
        pass


def in_wsl() -> bool:
    version = Path("/proc/version")
    if not version.exists():
        return False
    try:
        return "microsoft" in version.read_text(encoding="utf-8", errors="ignore").lower()
    except OSError:
        return False


def to_wsl_path(win_path: Path) -> str:
    resolved = win_path.resolve()
    s = str(resolved).replace("\\", "/")
    if len(s) >= 2 and s[1] == ":":
        return f"/mnt/{s[0].lower()}{s[2:]}"
    return s


def sail_available(api: Path) -> bool:
    return (api / "vendor" / "bin" / "sail").exists()


def run_shell(api: Path, inner: str, timeout: int) -> subprocess.CompletedProcess[str]:
    if in_wsl() or os.name != "nt":
        return subprocess.run(
            ["bash", "-lc", inner],
            cwd=str(api),
            text=True,
            timeout=timeout,
        )
    cwd_linux = to_wsl_path(api)
    quoted = inner.replace('"', '\\"')
    return subprocess.run(
        ["wsl.exe", "-e", "bash", "-lc", f'cd "{cwd_linux}" && {quoted}'],
        cwd=str(api),
        text=True,
        timeout=timeout,
    )


def clear_stale(api: Path, timeout: int = 60) -> None:
    if not sail_available(api):
        print("WARN: vendor/bin/sail missing; skip stale clear", file=sys.stderr)
        return
    # Kill leftover gate processes only. Never artisan serve / php-fpm.
    script = " || ".join(
        f"pgrep -af {json.dumps(pat)} >/dev/null && pkill -f {json.dumps(pat)} || true"
        for pat in STALE_PATTERNS
    )
    inner = f'vendor/bin/sail exec -T laravel.test bash -lc {json.dumps(script)}'
    try:
        run_shell(api, inner, timeout)
    except subprocess.TimeoutExpired:
        print("WARN: stale-clear timed out", file=sys.stderr)
    except OSError as exc:
        print(f"WARN: stale-clear skipped: {exc}", file=sys.stderr)


def print_status(root: Path, api: Path) -> int:
    lock = read_lock(api)
    status = read_status(root)
    print(json.dumps({"lock": lock, "last": status}, indent=2))
    busy = bool(lock and pid_alive(int(lock.get("pid") or 0)))
    write_status(
        root,
        {"state": "done", "command": "--status", "exit": 3 if busy else 0, "lock": lock, "last": status},
    )
    return 3 if busy else 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Serial Sail gate runner")
    parser.add_argument("--root", help="Repo root (contains api/)")
    parser.add_argument("--api", default="api", help="API directory relative to root")
    parser.add_argument("--timeout", type=int, default=DEFAULT_TIMEOUT)
    parser.add_argument("--status", action="store_true")
    parser.add_argument("--clear-stale", action="store_true")
    parser.add_argument("sail_args", nargs=argparse.REMAINDER)
    args = parser.parse_args()

    root = repo_root(args.root)
    api = (root / args.api).resolve()
    if not api.is_dir():
        print(f"ERROR: api dir not found: {api}", file=sys.stderr)
        return 2

    if args.status:
        return print_status(root, api)

    sail_args = list(args.sail_args)
    if sail_args and sail_args[0] == "--":
        sail_args = sail_args[1:]

    if args.clear_stale and not sail_args:
        clear_stale(api, timeout=min(args.timeout, 90))
        write_status(root, {"state": "cleared", "command": "--clear-stale", "exit": 0})
        return 0

    if not sail_args:
        print("ERROR: pass a sail command after --", file=sys.stderr)
        return 2

    command = "sail " + " ".join(sail_args)
    acquire_lock(api, command, args.timeout)
    write_status(root, {"state": "running", "command": command, "pid": os.getpid()})
    try:
        clear_stale(api, timeout=min(args.timeout, 90))
        inner = "vendor/bin/sail " + " ".join(json.dumps(a) for a in sail_args)
        try:
            proc = run_shell(api, inner, args.timeout)
        except subprocess.TimeoutExpired:
            write_status(root, {"state": "timeout", "command": command, "exit": 4})
            print(f"ERROR: sail command exceeded {args.timeout}s: {command}", file=sys.stderr)
            clear_stale(api, timeout=60)
            return 4
        except FileNotFoundError:
            print("ERROR: wsl.exe not found; Sail gates must run via WSL on this machine", file=sys.stderr)
            write_status(root, {"state": "error", "command": command, "exit": 2})
            return 2
        write_status(root, {"state": "done", "command": command, "exit": proc.returncode})
        return proc.returncode
    finally:
        release_lock(api)


if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        sys.exit(130)
