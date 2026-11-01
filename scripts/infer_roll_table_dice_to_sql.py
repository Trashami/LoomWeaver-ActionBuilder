"""Infer the roll die for canonical dnd_tables rows that have no die label.

A table qualifies when one column holds a contiguous range sequence (1..N, or 00..99 for d100)
and N is a supported die size. Results are stored in dnd_tables.roll_die / roll_die_source /
roll_range_col so the API can roll tables whose col_labels_json has no "dN" label.

Environment: LW_DB_PASSWORD (required), LW_DB_HOST (default localhost), LW_DB_USER (default loomweaver_app).
"""

import argparse
import json
import os
import re
import sys

import pymysql

SUPPORTED_SIDES = {4, 6, 8, 10, 12, 20, 100}
RANGE_RE = re.compile(r"^(\d+)(?:\s*[\u2013-]\s*(\d+))?$")
TAG_RE = re.compile(r"\{@\w+\s*([^{}]*)\}")
DIE_LABEL_RE = re.compile(r"\bd(\d+)\b", re.IGNORECASE)
MAX_RANGE_COLUMNS = 3


def cell_text(cell):
    if isinstance(cell, str):
        return TAG_RE.sub(lambda m: m.group(1).split("|")[0], cell).strip()
    if isinstance(cell, (int, float)):
        return str(cell)
    if isinstance(cell, dict):
        if isinstance(cell.get("entry"), str):
            return cell_text(cell["entry"])
        if isinstance(cell.get("entries"), list):
            return " ".join(filter(None, (cell_text(e) for e in cell["entries"] if isinstance(e, str))))
        roll = cell.get("roll")
        if isinstance(roll, dict):
            if "exact" in roll:
                return str(roll["exact"])
            if "min" in roll and "max" in roll:
                return f"{roll['min']}-{roll['max']}"
    return ""


def infer_die(rows, col):
    """Return the die sides when column `col` is a contiguous 1..N or 00..99 sequence, else None."""
    texts = [cell_text(row[col]) if col < len(row) else "" for row in rows]
    texts = [t for t in texts if t]
    if len(texts) < 2:
        return None

    ranges = []
    for text in texts:
        m = RANGE_RE.match(text)
        if not m:
            return None
        lo = int(m.group(1))
        hi = int(m.group(2)) if m.group(2) else lo
        ranges.append((text, lo, hi))

    _, first_lo, _ = ranges[0]
    if first_lo == 1:
        base = 1
    elif first_lo == 0:
        base = 0
    else:
        return None

    expected = base
    for _, lo, hi in ranges:
        if lo != expected or hi < lo:
            return None
        expected = hi + 1

    sides = expected - 1 if base == 1 else expected
    return sides if sides in SUPPORTED_SIDES else None


def infer_for_table(rows):
    for col in range(MAX_RANGE_COLUMNS):
        sides = infer_die(rows, col)
        if sides is not None:
            return col, sides
    return None


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--dry-run", action="store_true", help="report inferred dice without writing")
    args = parser.parse_args()

    password = os.environ.get("LW_DB_PASSWORD")
    if not password:
        sys.exit("LW_DB_PASSWORD must be set in the environment")
    conn = pymysql.connect(
        host=os.environ.get("LW_DB_HOST", "localhost"),
        port=int(os.environ.get("LW_DB_PORT", "3306")),
        user=os.environ.get("LW_DB_USER", "loomweaver_app"),
        password=password,
        database=os.environ.get("LW_DB_NAME", "loomweaver"),
        charset="utf8mb4",
        autocommit=False,
    )
    inferred = 0
    skipped = 0
    try:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT id, col_labels_json, rows_json FROM dnd_tables "
                "WHERE is_canonical = 1 AND roll_die IS NULL AND rows_json IS NOT NULL"
            )
            tables = cur.fetchall()
            updates = []
            for table_id, labels_json, rows_json in tables:
                labels = json.loads(labels_json) if labels_json else []
                first_label = cell_text(labels[0]) if labels else ""
                if first_label and DIE_LABEL_RE.search(first_label):
                    skipped += 1
                    continue
                rows = json.loads(rows_json)
                if not rows or not all(isinstance(r, list) for r in rows):
                    skipped += 1
                    continue
                found = infer_for_table(rows)
                if found is None:
                    skipped += 1
                    continue
                col, sides = found
                updates.append((f"1d{sides}", col, table_id))
            inferred = len(updates)
            if not args.dry_run and updates:
                cur.executemany(
                    "UPDATE dnd_tables SET roll_die = %s, roll_die_source = 'inferred', roll_range_col = %s WHERE id = %s",
                    updates,
                )
        if args.dry_run:
            conn.rollback()
        else:
            conn.commit()
    finally:
        conn.close()
    print(f"inferred={inferred} skipped={skipped} dry_run={args.dry_run}")


if __name__ == "__main__":
    main()
