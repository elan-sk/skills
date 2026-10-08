#!/usr/bin/env python3
"""Synchronize local agent skill folders, preferring newest files."""

from __future__ import annotations

import argparse
import hashlib
import os
import shutil
import subprocess
import sys
from datetime import date
from pathlib import Path


DEFAULT_ROOTS = [
    Path.home() / ".claude" / "skills",
    Path.home() / ".codex" / "skills",
    Path.home() / ".agents" / "skills",
]

EXCLUDE_PARTS = {
    ".git",
    "node_modules",
    "__pycache__",
    ".pytest_cache",
}

EXCLUDE_SUFFIXES = {
    ".pyc",
    ".pyo",
    ".swp",
    ".tmp",
}

TIE_PREFERENCE = [
    Path.home() / ".codex" / "skills",
    Path.home() / ".claude" / "skills",
    Path.home() / ".agents" / "skills",
]


def is_excluded(rel: Path) -> bool:
    if any(part in EXCLUDE_PARTS for part in rel.parts):
        return True
    if rel.name in {".DS_Store", "Thumbs.db"}:
        return True
    return rel.suffix in EXCLUDE_SUFFIXES


def iter_skill_files(skill_dir: Path) -> dict[str, Path]:
    files: dict[str, Path] = {}
    if not skill_dir.exists():
        return files
    for path in skill_dir.rglob("*"):
        if not path.is_file():
            continue
        rel = path.relative_to(skill_dir)
        if is_excluded(rel):
            continue
        files[rel.as_posix()] = path
    return files


def file_digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def skill_digest(skill_dir: Path) -> str | None:
    if not (skill_dir / "SKILL.md").exists():
        return None
    h = hashlib.sha256()
    for rel, path in sorted(iter_skill_files(skill_dir).items()):
        h.update(rel.encode("utf-8") + b"\0")
        h.update(path.read_bytes())
    return h.hexdigest()


def existing_roots(roots: list[Path]) -> list[Path]:
    out = []
    for root in roots:
        if root.exists():
            out.append(root)
    return out


def discover_skill_names(roots: list[Path], requested: list[str]) -> list[str]:
    if requested:
        return sorted(set(requested))
    names: set[str] = set()
    for root in roots:
        if not root.exists():
            continue
        for child in root.iterdir():
            if child.is_dir() and (child / "SKILL.md").exists():
                names.add(child.name)
    return sorted(names)


def choose_newest(candidates: list[Path], roots: list[Path]) -> tuple[Path, bool]:
    newest_mtime = max(path.stat().st_mtime for path in candidates)
    newest = [path for path in candidates if path.stat().st_mtime == newest_mtime]
    if len(newest) == 1:
        return newest[0], False

    for preferred_root in TIE_PREFERENCE:
        for path in newest:
            try:
                path.relative_to(preferred_root)
                return path, len({file_digest(p) for p in newest}) > 1
            except ValueError:
                continue

    return newest[0], len({file_digest(p) for p in newest}) > 1


def sync(roots: list[Path], requested: list[str], dry_run: bool, push: bool = True) -> int:
    roots = existing_roots(roots)
    if not roots:
        print("No skill roots exist.", file=sys.stderr)
        return 2

    names = discover_skill_names(roots, requested)
    copied: list[tuple[Path, Path]] = []
    created_dirs: list[Path] = []
    tie_conflicts: list[str] = []

    for name in names:
        skill_dirs = [root / name for root in roots]
        if not any((d / "SKILL.md").exists() for d in skill_dirs):
            print(f"[skip] {name}: no SKILL.md found in any root")
            continue

        for skill_dir in skill_dirs:
            if not skill_dir.exists():
                created_dirs.append(skill_dir)
                if not dry_run:
                    skill_dir.mkdir(parents=True)

        rels: set[str] = set()
        file_maps = {d: iter_skill_files(d) for d in skill_dirs}
        for files in file_maps.values():
            rels.update(files)

        for rel in sorted(rels):
            candidates = [files[rel] for files in file_maps.values() if rel in files]
            if not candidates:
                continue
            src, tied = choose_newest(candidates, roots)
            if tied:
                tie_conflicts.append(f"{name}/{rel}")
            src_bytes = src.read_bytes()

            for skill_dir in skill_dirs:
                dst = skill_dir / rel
                if dst.exists() and dst.is_file() and dst.read_bytes() == src_bytes:
                    continue
                copied.append((src, dst))
                if not dry_run:
                    dst.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(src, dst)

    print(f"created_dirs {len(created_dirs)}")
    for path in created_dirs:
        print(f"  + {path}")

    print(f"copied_files {len(copied)}")
    for src, dst in copied:
        print(f"  {src} -> {dst}")

    print(f"same_mtime_conflicts {len(tie_conflicts)}")
    for rel in tie_conflicts:
        print(f"  ! {rel}")

    print("hashes")
    for name in names:
        values = {}
        for root in roots:
            digest = skill_digest(root / name)
            if digest:
                values[str(root)] = digest[:16]
        if values:
            status = "OK" if len(set(values.values())) == 1 else "DIFF"
            print(f"  {name}: {status} {values}")

    if not dry_run:
        if not validate(roots, names):
            print("git: skipped, validation failed")
            return 1
        if push:
            return publish(roots, names)

    return 0


def git(root: Path, *args: str) -> subprocess.CompletedProcess:
    return subprocess.run(["git", "-C", str(root), *args], text=True, capture_output=True, check=False)


def publish(roots: list[Path], names: list[str]) -> int:
    """Commit and push the synced skill folders in every root that is a git repo."""
    status = 0
    for root in roots:
        top = git(root, "rev-parse", "--show-toplevel")
        if top.returncode != 0 or Path(top.stdout.strip()).resolve() != root:
            continue
        paths = [name for name in names if (root / name).exists()]
        git(root, "add", "-A", "--", *paths)
        changed = git(root, "diff", "--cached", "--name-only", "--", *paths).stdout.split()
        if not changed:
            print(f"git {root}: nothing to commit")
            continue
        skills = sorted({Path(f).parts[0] for f in changed})
        msg = f"sync skills: {', '.join(skills)} ({date.today().isoformat()})"
        # Only the synced skill folders: anything else staged in the repo stays out.
        commit = git(root, "commit", "-m", msg, "--", *paths)
        if commit.returncode != 0:
            print(f"git {root}: commit FAIL {commit.stderr.strip() or commit.stdout.strip()}")
            status = 1
            continue
        pushed = git(root, "push")
        if pushed.returncode != 0:
            print(f"git {root}: committed, push FAIL {pushed.stderr.strip()}")
            status = 1
            continue
        print(f"git {root}: pushed '{msg}'")
    return status


def validate(roots: list[Path], names: list[str]) -> bool:
    validator = Path.home() / ".codex" / "skills" / ".system" / "skill-creator" / "scripts" / "quick_validate.py"
    if not validator.exists():
        print("validation skipped: quick_validate.py not found")
        return True

    print("validation")
    ok = True
    for name in names:
        for root in roots:
            skill_dir = root / name
            if not (skill_dir / "SKILL.md").exists():
                continue
            result = subprocess.run(
                [sys.executable, str(validator), str(skill_dir)],
                text=True,
                capture_output=True,
                check=False,
            )
            line = result.stdout.strip() or result.stderr.strip()
            prefix = "OK" if result.returncode == 0 else "FAIL"
            print(f"  {prefix} {skill_dir}: {line}")
            ok = ok and result.returncode == 0
    return ok


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("skills", nargs="*", help="Optional skill names to sync. Default: all discovered skills.")
    parser.add_argument("--dry-run", action="store_true", help="Show planned changes without writing files.")
    parser.add_argument("--no-push", action="store_true", help="Skip git commit/push of the synced skills.")
    parser.add_argument(
        "--root",
        action="append",
        type=Path,
        help="Skill root to include. May be repeated. Default: Claude, Codex, Agents roots.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    roots = [path.expanduser().resolve() for path in (args.root or DEFAULT_ROOTS)]
    return sync(roots, args.skills, args.dry_run, not args.no_push)


if __name__ == "__main__":
    raise SystemExit(main())
