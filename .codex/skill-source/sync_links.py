#!/usr/bin/env python3
"""Check or create project Skill entry-point symlinks safely.

The script never replaces a real file or directory. Compare and migrate any
real copy into the Codex-owned canonical source before running it again.
"""

import argparse
import json
import os
from pathlib import Path


ROOT = Path(__file__).resolve().parent
PROJECT_ROOT = ROOT.parent.parent
MANIFEST = ROOT / "manifest.json"

TARGET_ROOTS = {
    "codex": PROJECT_ROOT / ".agents" / "skills",
    "claude": PROJECT_ROOT / ".claude" / "skills",
}


def ensure_link(target: Path, canonical: Path, dry_run: bool) -> str:
    if not canonical.is_dir():
        return f"ERROR canonical missing: {canonical}"
    if target.is_symlink():
        if target.resolve() == canonical.resolve():
            return f"OK {target} -> {canonical}"
        return f"ERROR symlink points elsewhere: {target} -> {target.resolve()}"
    if target.exists():
        return f"REVIEW real path exists (not changed): {target}"
    if not dry_run:
        target.parent.mkdir(parents=True, exist_ok=True)
        relative = os.path.relpath(canonical, target.parent)
        target.symlink_to(relative)
    return f"LINK {target} -> {canonical}"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--check",
        action="store_true",
        help="report current link state without creating missing links",
    )
    args = parser.parse_args()

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    source_root = PROJECT_ROOT / manifest["source_root"]
    errors = 0

    for name, item in sorted(manifest.get("skills", {}).items()):
        if item.get("status") in {"retired", "disabled"}:
            continue
        canonical = source_root / item["canonical"]
        for runtime in item.get("targets", []):
            target_root = TARGET_ROOTS.get(runtime)
            if target_root is None:
                print(f"REVIEW unknown target runtime: {runtime} ({name})")
                continue
            result = ensure_link(target_root / name, canonical, args.check)
            print(result)
            if result.startswith("ERROR"):
                errors += 1

    raise SystemExit(1 if errors else 0)


if __name__ == "__main__":
    main()
