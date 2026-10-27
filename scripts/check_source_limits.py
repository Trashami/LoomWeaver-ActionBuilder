#!/usr/bin/env python3
"""
Checks hand-written source files in LoomWeaverV2 against the 500-line ceiling
and reports warnings for files over 300 lines.
"""
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCAN_DIRS = [
    os.path.join(ROOT, "frontend", "src"),
    os.path.join(ROOT, "effectbuilder-studio", "src"),
    os.path.join(ROOT, "actionbuilder-studio", "src"),
    os.path.join(ROOT, "loommaps-studio", "src"),
    os.path.join(ROOT, "backend", "src"),
]
EXTENSIONS = {".ts", ".html", ".scss", ".css", ".cs"}
IGNORE_DIRS = {"node_modules", "dist", ".angular", "bin", "obj", "migrations"}
SOFT_LIMIT = 300
HARD_LIMIT = 500


def main() -> int:
    warnings = []
    violations = []
    checked = 0

    for base in SCAN_DIRS:
        if not os.path.exists(base):
            continue
        for root, dirs, files in os.walk(base):
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            for f in files:
                ext = os.path.splitext(f)[1].lower()
                if ext not in EXTENSIONS:
                    continue
                full = os.path.join(root, f)
                rel = os.path.relpath(full, ROOT)
                with open(full, "r", encoding="utf-8", errors="ignore") as fp:
                    lines = sum(1 for _ in fp)
                checked += 1
                if lines > HARD_LIMIT:
                    violations.append((rel, lines))
                elif lines > SOFT_LIMIT:
                    warnings.append((rel, lines))

    print(f"Checked {checked} source files (soft={SOFT_LIMIT}, hard={HARD_LIMIT}).")
    for rel, lines in warnings:
        print(f"  [WARN] {rel}: {lines} lines (> {SOFT_LIMIT})")
    for rel, lines in violations:
        print(f"  [FAIL] {rel}: {lines} lines (> {HARD_LIMIT})")

    if violations:
        print(f"FAILED: {len(violations)} file(s) exceed {HARD_LIMIT} lines.")
        return 1
    print("PASSED: All hand-written files are within the 500-line limit.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
