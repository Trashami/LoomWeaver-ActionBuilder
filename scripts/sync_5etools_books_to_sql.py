#!/usr/bin/env python3
"""Sync all 5eTools source books, adventures, chapters, sections, and images into MySQL (`loomweaver`).

Loads both:
  - Source books (data/books.json, data/book/book-*.json)
  - Adventure books (data/adventures.json, data/adventure/adventure-*.json)

Populates & structures:
  - `dnd_sources`: Canonical metadata for all books & adventures with verified cover paths
  - `dnd_adventures_books`: Full book and adventure catalog entries with contents JSON (TOC)
  - `dnd_book_nodes`: Hierarchical section & chapter tree with full-text search and child references
  - `dnd_assets`: All images from the 5e-tools separate images folder (book art, maps, handouts, covers)
  - `dnd_node_assets`: Maps each image asset directly to the book chapter/section where it appears
  - `v_dnd_source_books` & `v_dnd_source_images`: Optimized helper views for fast queries

Usage:
  # On the server:
  python3 sync_5etools_books_to_sql.py \
      --data-dir /var/www/jane-assets/5etools/data \
      --img-dir /var/www/jane-assets/5etools/img

  # From local dev machine via SSH:
  python sync_5etools_books_to_sql.py --remote

  # Dry run to inspect counts without writing:
  python sync_5etools_books_to_sql.py --remote --dry-run
"""

from __future__ import annotations

import argparse
import glob
import json
import os
import re
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Set, Tuple

TAG_RE = re.compile(r"\{@\w+\s*([^{}]*)\}")
SECTION_REF = "lwSection"

DEFAULT_SERVER_DATA_DIR = "/var/www/jane-assets/5etools/data"
DEFAULT_SERVER_IMG_DIR = "/var/www/jane-assets/5etools/img"

# Local machine fallbacks if running locally against a local MySQL instance
DEFAULT_LOCAL_DATA_DIR = r"c:\Users\JTromborg1\OneDrive\Documents\5e Tools\data"
DEFAULT_LOCAL_IMG_DIR = r"c:\Users\JTromborg1\OneDrive\Documents\5e Tools\img"


def plain_text(value: Any) -> str:
    """Collect display text from an entry tree for full-text search."""
    if isinstance(value, str):
        return TAG_RE.sub(lambda m: m.group(1).split("|")[0], value)
    if isinstance(value, list):
        return " ".join(filter(None, (plain_text(v) for v in value)))
    if isinstance(value, dict):
        parts: List[str] = [value.get("name", "") if isinstance(value.get("name"), str) else ""]
        for key in (
            "entries", "items", "rows", "cols", "colLabels",
            "tables", "caption", "entry", "headerEntries"
        ):
            if key in value:
                parts.append(plain_text(value[key]))
        return " ".join(p for p in parts if p)
    return ""


def strip_sections(value: Any, path: str, children: List[Tuple[Dict[str, Any], str]]) -> Any:
    """Return a copy of value with nested sections replaced by references; collect (node, path) pairs."""
    if isinstance(value, list):
        return [strip_sections(v, path, children) for v in value]
    if not isinstance(value, dict):
        return value
    if value.get("type") == "section":
        child_path = f"{path}.{len(children)}"
        children.append((value, child_path))
        return {"type": SECTION_REF, "nodeId": child_path}
    return {k: strip_sections(v, path, children) for k, v in value.items()}


def extract_node_images(
    node: Any,
    default_source_id: str,
) -> List[Tuple[str, Optional[str], Optional[int], Optional[int], str, Optional[Dict[str, Any]]]]:
    """Extract all image references from a node's entry tree.

    Returns list of tuples: (href_path, title, width, height, role, extra_dict)
    """
    results: List[Tuple[str, Optional[str], Optional[int], Optional[int], str, Optional[Dict[str, Any]]]] = []

    def _walk(obj: Any):
        if isinstance(obj, dict):
            if obj.get("type") == "image":
                href = obj.get("href")
                if isinstance(href, dict) and href.get("type") == "internal" and href.get("path"):
                    path = str(href["path"]).strip().replace("\\", "/")
                    title = obj.get("title") if isinstance(obj.get("title"), str) else None
                    width = obj.get("width") if isinstance(obj.get("width"), int) else None
                    height = obj.get("height") if isinstance(obj.get("height"), int) else None
                    
                    # Determine role
                    is_map_player = bool(obj.get("mapPlayer"))
                    is_map = bool(obj.get("map") or "map" in path.lower())
                    role = "mapPlayer" if is_map_player else ("map" if is_map else "inline")

                    extra: Dict[str, Any] = {}
                    for extra_key in ("map", "mapPlayer", "mapGrid", "credit", "imageType", "style"):
                        if extra_key in obj:
                            extra[extra_key] = obj[extra_key]

                    results.append((path, title, width, height, role, extra if extra else None))

            elif obj.get("type") == "gallery":
                images_list = obj.get("images")
                if isinstance(images_list, list):
                    for img in images_list:
                        _walk(img)

            for v in obj.values():
                _walk(v)

        elif isinstance(obj, list):
            for v in obj:
                _walk(v)

    _walk(node)
    return results


def ensure_tables_and_views(cur) -> None:
    """Structure or update the source book & image tables with best practice indexes."""
    # 1. dnd_sources
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS `dnd_sources` (
          `id` varchar(64) NOT NULL,
          `name` varchar(255) NOT NULL,
          `source_type` varchar(32) DEFAULT NULL,
          `source_group` varchar(32) DEFAULT NULL,
          `published` date DEFAULT NULL,
          `author` varchar(255) DEFAULT NULL,
          `cover_type` varchar(32) DEFAULT NULL,
          `cover_path` varchar(500) DEFAULT NULL,
          `cover_url` varchar(500) DEFAULT NULL,
          `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          KEY `idx_sources_group` (`source_group`),
          KEY `idx_sources_type` (`source_type`),
          KEY `idx_sources_published` (`published`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        """
    )

    # 2. dnd_adventures_books
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS `dnd_adventures_books` (
          `id` bigint NOT NULL AUTO_INCREMENT,
          `code` varchar(64) NOT NULL,
          `name` varchar(255) NOT NULL,
          `record_type` varchar(32) NOT NULL DEFAULT 'book',
          `source_book` varchar(64) NOT NULL,
          `group_name` varchar(64) DEFAULT NULL,
          `published` varchar(32) DEFAULT NULL,
          `author` varchar(255) DEFAULT NULL,
          `storyline` varchar(128) DEFAULT NULL,
          `level_start` int DEFAULT NULL,
          `level_end` int DEFAULT NULL,
          `contents_json` longtext,
          `raw_json` longtext,
          `created_at` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
          `cover_path` varchar(500) DEFAULT NULL,
          `image_path` varchar(500) DEFAULT NULL,
          PRIMARY KEY (`id`),
          UNIQUE KEY `uq_advbook_code` (`record_type`,`code`),
          KEY `idx_advbook_code` (`code`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        """
    )

    # 3. dnd_book_nodes
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS `dnd_book_nodes` (
          `id` bigint NOT NULL AUTO_INCREMENT,
          `source_id` varchar(64) NOT NULL,
          `source_node_id` varchar(64) DEFAULT NULL,
          `parent_id` bigint DEFAULT NULL,
          `seq` int NOT NULL,
          `node_type` varchar(32) NOT NULL DEFAULT 'section',
          `name` varchar(255) DEFAULT NULL,
          `page` int DEFAULT NULL,
          `text` longtext,
          `data_json` json DEFAULT NULL,
          `toc_entry_id` bigint DEFAULT NULL,
          `toc_header_id` bigint DEFAULT NULL,
          `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (`id`),
          UNIQUE KEY `uk_node_source_sourceid` (`source_id`,`source_node_id`),
          KEY `ix_node_source_parent_seq` (`source_id`,`parent_id`,`seq`),
          KEY `ix_node_source_type` (`source_id`,`node_type`),
          KEY `ix_node_source_page` (`source_id`,`page`),
          KEY `ix_node_source_name` (`source_id`,`name`),
          KEY `fk_node_parent` (`parent_id`),
          KEY `ix_node_source_seq` (`source_id`,`seq`),
          FULLTEXT KEY `ft_nodes_text` (`name`,`text`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        """
    )

    # 4. dnd_assets
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS `dnd_assets` (
          `id` bigint NOT NULL AUTO_INCREMENT,
          `source_id` varchar(64) NOT NULL,
          `href_type` varchar(32) DEFAULT 'internal',
          `href_path` varchar(255) NOT NULL,
          `local_path` varchar(512) DEFAULT NULL,
          `title` varchar(255) DEFAULT NULL,
          `width` int DEFAULT NULL,
          `height` int DEFAULT NULL,
          `extra_json` json DEFAULT NULL,
          PRIMARY KEY (`id`),
          UNIQUE KEY `uk_asset_source_href` (`source_id`,`href_path`),
          KEY `ix_asset_source` (`source_id`),
          KEY `ix_asset_local_path` (`local_path`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        """
    )

    # 5. dnd_node_assets
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS `dnd_node_assets` (
          `node_id` bigint NOT NULL,
          `asset_id` bigint NOT NULL,
          `role` varchar(32) NOT NULL DEFAULT 'inline',
          PRIMARY KEY (`node_id`,`asset_id`,`role`),
          KEY `fk_na_asset` (`asset_id`),
          KEY `ix_na_role` (`role`)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        """
    )

    # 6. Helper views for fast queries
    cur.execute(
        """
        CREATE OR REPLACE VIEW `v_dnd_source_books` AS
        SELECT 
            s.`id` AS `code`,
            s.`name`,
            s.`source_type`,
            s.`source_group`,
            s.`published`,
            s.`author`,
            s.`cover_path`,
            COALESCE(ab.`storyline`, '') AS `storyline`,
            ab.`level_start`,
            ab.`level_end`,
            (SELECT COUNT(*) FROM `dnd_book_nodes` n WHERE n.`source_id` = s.`id`) AS `total_sections`,
            (SELECT COUNT(*) FROM `dnd_assets` a WHERE a.`source_id` = s.`id`) AS `total_images`
        FROM `dnd_sources` s
        LEFT JOIN `dnd_adventures_books` ab ON ab.`code` COLLATE utf8mb4_0900_ai_ci = s.`id`
        WHERE s.`source_type` IN ('book', 'adventure', 'core', 'supplement', 'setting')
        ORDER BY s.`source_group`, s.`published` DESC, s.`name`;
        """
    )

    cur.execute(
        """
        CREATE OR REPLACE VIEW `v_dnd_source_images` AS
        SELECT 
            a.`id` AS `asset_id`,
            a.`source_id`,
            s.`name` AS `source_name`,
            s.`source_type`,
            a.`href_path`,
            a.`local_path`,
            a.`title`,
            a.`width`,
            a.`height`,
            na.`node_id`,
            n.`name` AS `section_name`,
            na.`role`
        FROM `dnd_assets` a
        JOIN `dnd_sources` s ON s.`id` = a.`source_id`
        LEFT JOIN `dnd_node_assets` na ON na.`asset_id` = a.`id`
        LEFT JOIN `dnd_book_nodes` n ON n.`id` = na.`node_id`;
        """
    )


def insert_or_get_asset(
    cur,
    source_id: str,
    href_path: str,
    title: Optional[str] = None,
    width: Optional[int] = None,
    height: Optional[int] = None,
    extra: Optional[Dict[str, Any]] = None,
    cache: Optional[Dict[Tuple[str, str], int]] = None,
) -> int:
    """Insert or retrieve the asset ID for (source_id, href_path)."""
    clean_path = href_path.strip().replace("\\", "/").lstrip("/")
    key = (source_id, clean_path)
    if cache is not None and key in cache:
        return cache[key]

    local_path = f"/5etools/{clean_path}"
    extra_json = json.dumps(extra, ensure_ascii=False) if extra else None

    cur.execute(
        """
        INSERT INTO `dnd_assets` (`source_id`, `href_type`, `href_path`, `local_path`, `title`, `width`, `height`, `extra_json`)
        VALUES (%s, 'internal', %s, %s, %s, %s, %s, %s)
        ON DUPLICATE KEY UPDATE
            `local_path` = VALUES(`local_path`),
            `title` = COALESCE(VALUES(`title`), `title`),
            `width` = COALESCE(VALUES(`width`), `width`),
            `height` = COALESCE(VALUES(`height`), `height`),
            `extra_json` = COALESCE(VALUES(`extra_json`), `extra_json`),
            `id` = LAST_INSERT_ID(`id`);
        """,
        (source_id, clean_path, local_path, title[:255] if title else None, width, height, extra_json),
    )
    asset_id = cur.lastrowid
    if not asset_id:
        cur.execute("SELECT `id` FROM `dnd_assets` WHERE `source_id` = %s AND `href_path` = %s LIMIT 1", (source_id, clean_path))
        row = cur.fetchone()
        asset_id = row[0] if row else 0

    if cache is not None and asset_id:
        cache[key] = asset_id

    return asset_id


def insert_node(
    cur,
    code: str,
    node: Dict[str, Any],
    path: str,
    parent_id: Optional[int],
    seq: int,
    counters: Dict[str, int],
    asset_cache: Dict[Tuple[str, str], int],
) -> None:
    """Recursively insert section tree node into dnd_book_nodes and relate images."""
    children: List[Tuple[Dict[str, Any], str]] = []
    
    # Extract image references from this section before stripping nested sections
    node_images = extract_node_images(node, code)

    own = {k: v for k, v in node.items() if k != "type"}
    own_data = strip_sections(own, path, children)
    own_data["type"] = node.get("type", "section")
    
    name = node.get("name") if isinstance(node.get("name"), str) else None
    page = node.get("page") if isinstance(node.get("page"), int) else None
    text = plain_text(own_data)

    cur.execute(
        """
        INSERT INTO `dnd_book_nodes` (`source_id`, `source_node_id`, `parent_id`, `seq`, `node_type`, `name`, `page`, `text`, `data_json`)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        (
            code,
            path,
            parent_id,
            seq,
            "section",
            name[:255] if name else None,
            page,
            text,
            json.dumps(own_data, ensure_ascii=False),
        ),
    )
    node_id = cur.lastrowid
    counters["nodes"] += 1

    # Link all images in this section to dnd_node_assets
    for href_path, title, width, height, role, extra in node_images:
        asset_id = insert_or_get_asset(cur, code, href_path, title, width, height, extra, asset_cache)
        if asset_id:
            cur.execute(
                """
                INSERT IGNORE INTO `dnd_node_assets` (`node_id`, `asset_id`, `role`)
                VALUES (%s, %s, %s)
                """,
                (node_id, asset_id, role),
            )
            counters["node_assets"] += 1

    # Recurse children
    for child_seq, (child, child_path) in enumerate(children):
        insert_node(cur, code, child, child_path, node_id, child_seq, counters, asset_cache)


def load_source_tree(
    cur,
    code: str,
    root_sections: List[Dict[str, Any]],
    counters: Dict[str, int],
    asset_cache: Dict[Tuple[str, str], int],
) -> None:
    """Clear old nodes and assets for a book/adventure and load fresh section tree."""
    # 1. Clean existing node_assets for this source
    cur.execute(
        """
        DELETE na FROM `dnd_node_assets` na
        JOIN `dnd_book_nodes` n ON na.`node_id` = n.`id`
        WHERE n.`source_id` = %s
        """,
        (code,),
    )
    # 2. Break parent_id self-referential keys then delete nodes
    cur.execute("UPDATE `dnd_book_nodes` SET `parent_id` = NULL WHERE `source_id` = %s", (code,))
    cur.execute("DELETE FROM `dnd_book_nodes` WHERE `source_id` = %s", (code,))

    # 3. Recursively insert all root sections and their child trees
    for seq, section in enumerate(root_sections):
        insert_node(cur, code, section, f"{seq}", None, seq, counters, asset_cache)


def scan_and_relate_disk_images(
    cur,
    img_dir: Path,
    source_codes: Set[str],
    counters: Dict[str, int],
    asset_cache: Dict[Tuple[str, str], int],
) -> None:
    """Scan the separate images folder on disk and ensure all book/adventure images are related to their source."""
    if not img_dir.is_dir():
        print(f"Warning: Image folder {img_dir} does not exist. Skipping disk scan.")
        return

    print(f"Scanning image directories in {img_dir} for source-related assets...")
    img_extensions = {".webp", ".png", ".jpg", ".jpeg", ".svg", ".gif"}
    added_disk_assets = 0

    # 1. Covers folder: img/covers/<source_code>.webp
    covers_dir = img_dir / "covers"
    if covers_dir.is_dir():
        for f in covers_dir.iterdir():
            if f.is_file() and f.suffix.lower() in img_extensions:
                code_stem = f.stem
                # Match to source if possible
                matched_source = code_stem if code_stem in source_codes else None
                if not matched_source:
                    # Case-insensitive match fallback
                    for s in source_codes:
                        if s.lower() == code_stem.lower():
                            matched_source = s
                            break

                sid = matched_source or code_stem
                rel_path = f"covers/{f.name}"
                aid = insert_or_get_asset(
                    cur,
                    source_id=sid,
                    href_path=rel_path,
                    title=f"{sid} Cover",
                    extra={"category": "cover", "source_book": sid},
                    cache=asset_cache,
                )
                if aid:
                    added_disk_assets += 1

    # 2. Book folder: img/book/<source_id>/*
    book_img_dir = img_dir / "book"
    if book_img_dir.is_dir():
        for book_sub in book_img_dir.iterdir():
            if book_sub.is_dir():
                sid = book_sub.name
                for f in book_sub.rglob("*"):
                    if f.is_file() and f.suffix.lower() in img_extensions:
                        rel_path = str(f.relative_to(img_dir)).replace("\\", "/")
                        is_map = "map" in f.name.lower()
                        aid = insert_or_get_asset(
                            cur,
                            source_id=sid,
                            href_path=rel_path,
                            title=f.stem.replace("-", " ").replace("_", " ").title(),
                            extra={"category": "map" if is_map else "book_art", "source_book": sid},
                            cache=asset_cache,
                        )
                        if aid:
                            added_disk_assets += 1

    # 3. Adventure folder: img/adventure/<source_id>/*
    adv_img_dir = img_dir / "adventure"
    if adv_img_dir.is_dir():
        for adv_sub in adv_img_dir.iterdir():
            if adv_sub.is_dir():
                sid = adv_sub.name
                for f in adv_sub.rglob("*"):
                    if f.is_file() and f.suffix.lower() in img_extensions:
                        rel_path = str(f.relative_to(img_dir)).replace("\\", "/")
                        is_map = "map" in f.name.lower()
                        aid = insert_or_get_asset(
                            cur,
                            source_id=sid,
                            href_path=rel_path,
                            title=f.stem.replace("-", " ").replace("_", " ").title(),
                            extra={"category": "map" if is_map else "adventure_art", "source_book": sid},
                            cache=asset_cache,
                        )
                        if aid:
                            added_disk_assets += 1

    counters["disk_assets"] = added_disk_assets
    print(f"Indexed {added_disk_assets} images directly from disk folders into dnd_assets.")


def sync_all_books_and_images(
    data_dir_path: str,
    img_dir_path: str,
    target_sources: Optional[Set[str]] = None,
    dry_run: bool = False,
    db_conn=None,
) -> None:
    data_dir = Path(data_dir_path)
    img_dir = Path(img_dir_path)

    if not data_dir.is_dir():
        sys.exit(f"Error: 5etools data directory not found: {data_dir}")

    print("=" * 70)
    print("5eTools Source Book & Image Synchronizer for LoomWeaver")
    print("=" * 70)
    print(f"Data directory:  {data_dir}")
    print(f"Image directory: {img_dir}")
    print(f"Dry run mode:    {dry_run}")
    if target_sources:
        print(f"Target sources:  {', '.join(sorted(target_sources))}")
    print("-" * 70)

    # 1. Read metadata from books.json & adventures.json
    books_meta: List[Dict[str, Any]] = []
    books_meta_file = data_dir / "books.json"
    if books_meta_file.is_file():
        with books_meta_file.open(encoding="utf-8") as fh:
            books_meta = json.load(fh).get("book", [])
    print(f"Loaded {len(books_meta)} book metadata entries from books.json")

    advs_meta: List[Dict[str, Any]] = []
    advs_meta_file = data_dir / "adventures.json"
    if advs_meta_file.is_file():
        with advs_meta_file.open(encoding="utf-8") as fh:
            advs_meta = json.load(fh).get("adventure", [])
    print(f"Loaded {len(advs_meta)} adventure metadata entries from adventures.json")

    # 2. Collect content files (book/book-*.json and adventure/adventure-*.json)
    book_trees: List[Tuple[str, str, List[Dict[str, Any]]]] = []
    # (code, record_type, root_sections)

    for path in sorted(glob.glob(str(data_dir / "book" / "book-*.json"))):
        with open(path, encoding="utf-8") as fh:
            payload = json.load(fh)
        for b in payload.get("bookData", []):
            code = b.get("id") or b.get("source")
            if code and (not target_sources or code in target_sources):
                book_trees.append((code, "book", b.get("data", [])))

    for path in sorted(glob.glob(str(data_dir / "adventure" / "adventure-*.json"))):
        with open(path, encoding="utf-8") as fh:
            payload = json.load(fh)
        for a in payload.get("adventureData", []):
            code = a.get("id") or a.get("source")
            if code and (not target_sources or code in target_sources):
                book_trees.append((code, "adventure", a.get("data", [])))

    total_root_sections = sum(len(s) for _, _, s in book_trees)
    print(f"Found {len(book_trees)} books & adventures with {total_root_sections} root chapters/sections to process.")

    if dry_run:
        print("\nDry-run completed successfully without modifying MySQL.")
        return

    # Database connection
    conn = db_conn
    close_at_end = False
    if conn is None:
        import pymysql
        password = os.environ.get("LW_DB_PASSWORD")
        if not password:
            sys.exit("Error: LW_DB_PASSWORD environment variable is required")

        conn = pymysql.connect(
            host=os.environ.get("LW_DB_HOST", "localhost"),
            port=int(os.environ.get("LW_DB_PORT", "3306")),
            user=os.environ.get("LW_DB_USER", "loomweaver_app"),
            password=password,
            database=os.environ.get("LW_DB_NAME", "loomweaver"),
            charset="utf8mb4",
            autocommit=False,
        )
        close_at_end = True

    counters = {
        "sources_upserted": 0,
        "adv_books_upserted": 0,
        "nodes": 0,
        "node_assets": 0,
        "disk_assets": 0,
    }
    asset_cache: Dict[Tuple[str, str], int] = {}
    all_source_codes: Set[str] = set()

    start_time = time.time()
    try:
        with conn.cursor() as cur:
            # 1. Structure tables & views
            print("\nEnsuring table structures, indexes, and views exist...")
            ensure_tables_and_views(cur)

            # 2. Upsert dnd_sources & dnd_adventures_books for all books
            print("Upserting source book metadata...")
            for b in books_meta:
                code = b.get("id") or b.get("source")
                if not code:
                    continue
                all_source_codes.add(code)
                if target_sources and code not in target_sources:
                    continue

                name = b.get("name", code)
                pub = b.get("published")
                if pub and not re.match(r"^\d{4}-\d{2}-\d{2}$", str(pub)):
                    pub = None
                author = b.get("author", "Wizards of the Coast")
                group_name = b.get("group", "core")

                cover_obj = b.get("cover") or {}
                cover_rel = cover_obj.get("path") if isinstance(cover_obj, dict) else None
                if not cover_rel and (img_dir / "covers" / f"{code}.webp").is_file():
                    cover_rel = f"covers/{code}.webp"
                cover_path = f"/5etools/{cover_rel.lstrip('/')}" if cover_rel else None

                contents_json = json.dumps(b.get("contents", []), ensure_ascii=False)
                raw_json = json.dumps(b, ensure_ascii=False)

                cur.execute(
                    """
                    INSERT INTO `dnd_sources` (`id`, `name`, `source_type`, `source_group`, `published`, `author`, `cover_type`, `cover_path`, `cover_url`)
                    VALUES (%s, %s, 'book', %s, %s, %s, 'internal', %s, %s)
                    ON DUPLICATE KEY UPDATE
                        `name` = VALUES(`name`),
                        `source_type` = 'book',
                        `source_group` = VALUES(`source_group`),
                        `published` = COALESCE(VALUES(`published`), `published`),
                        `author` = VALUES(`author`),
                        `cover_path` = COALESCE(VALUES(`cover_path`), `cover_path`),
                        `cover_url` = COALESCE(VALUES(`cover_url`), `cover_url`);
                    """,
                    (code, name, group_name, pub, author, cover_path, cover_path),
                )
                counters["sources_upserted"] += 1

                cur.execute(
                    """
                    INSERT INTO `dnd_adventures_books` (`code`, `name`, `record_type`, `source_book`, `group_name`, `published`, `author`, `storyline`, `level_start`, `level_end`, `contents_json`, `raw_json`, `cover_path`, `image_path`)
                    VALUES (%s, %s, 'book', %s, %s, %s, %s, NULL, NULL, NULL, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        `name` = VALUES(`name`),
                        `group_name` = VALUES(`group_name`),
                        `published` = VALUES(`published`),
                        `author` = VALUES(`author`),
                        `contents_json` = VALUES(`contents_json`),
                        `raw_json` = VALUES(`raw_json`),
                        `cover_path` = VALUES(`cover_path`),
                        `image_path` = VALUES(`image_path`);
                    """,
                    (code, name, code, group_name, str(pub) if pub else None, author, contents_json, raw_json, cover_path, cover_path),
                )
                counters["adv_books_upserted"] += 1

            # 3. Upsert dnd_sources & dnd_adventures_books for all adventures
            print("Upserting adventure metadata...")
            for a in advs_meta:
                code = a.get("id") or a.get("source")
                if not code:
                    continue
                all_source_codes.add(code)
                if target_sources and code not in target_sources:
                    continue

                name = a.get("name", code)
                pub = a.get("published")
                if pub and not re.match(r"^\d{4}-\d{2}-\d{2}$", str(pub)):
                    pub = None
                author = a.get("author", "Wizards of the Coast")
                group_name = a.get("group", "adventure")
                storyline = a.get("storyline")

                level_info = a.get("level") or {}
                level_start = level_info.get("start") if isinstance(level_info, dict) else None
                level_end = level_info.get("end") if isinstance(level_info, dict) else None

                cover_obj = a.get("cover") or {}
                cover_rel = cover_obj.get("path") if isinstance(cover_obj, dict) else None
                if not cover_rel and (img_dir / "covers" / f"{code}.webp").is_file():
                    cover_rel = f"covers/{code}.webp"
                cover_path = f"/5etools/{cover_rel.lstrip('/')}" if cover_rel else None

                contents_json = json.dumps(a.get("contents", []), ensure_ascii=False)
                raw_json = json.dumps(a, ensure_ascii=False)

                cur.execute(
                    """
                    INSERT INTO `dnd_sources` (`id`, `name`, `source_type`, `source_group`, `published`, `author`, `cover_type`, `cover_path`, `cover_url`)
                    VALUES (%s, %s, 'adventure', %s, %s, %s, 'internal', %s, %s)
                    ON DUPLICATE KEY UPDATE
                        `name` = VALUES(`name`),
                        `source_type` = 'adventure',
                        `source_group` = VALUES(`source_group`),
                        `published` = COALESCE(VALUES(`published`), `published`),
                        `author` = VALUES(`author`),
                        `cover_path` = COALESCE(VALUES(`cover_path`), `cover_path`),
                        `cover_url` = COALESCE(VALUES(`cover_url`), `cover_url`);
                    """,
                    (code, name, group_name, pub, author, cover_path, cover_path),
                )
                counters["sources_upserted"] += 1

                cur.execute(
                    """
                    INSERT INTO `dnd_adventures_books` (`code`, `name`, `record_type`, `source_book`, `group_name`, `published`, `author`, `storyline`, `level_start`, `level_end`, `contents_json`, `raw_json`, `cover_path`, `image_path`)
                    VALUES (%s, %s, 'adventure', %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        `name` = VALUES(`name`),
                        `group_name` = VALUES(`group_name`),
                        `published` = VALUES(`published`),
                        `author` = VALUES(`author`),
                        `storyline` = VALUES(`storyline`),
                        `level_start` = VALUES(`level_start`),
                        `level_end` = VALUES(`level_end`),
                        `contents_json` = VALUES(`contents_json`),
                        `raw_json` = VALUES(`raw_json`),
                        `cover_path` = VALUES(`cover_path`),
                        `image_path` = VALUES(`image_path`);
                    """,
                    (code, name, code, group_name, str(pub) if pub else None, author, storyline, level_start, level_end, contents_json, raw_json, cover_path, cover_path),
                )
                counters["adv_books_upserted"] += 1

            # 4. Load section trees & extract image links for each book / adventure
            print("\nLoading section trees and mapping images to sections...")
            for idx, (code, rtype, sections) in enumerate(book_trees, 1):
                sub_counters = {"nodes": 0, "node_assets": 0}
                load_source_tree(cur, code, sections, sub_counters, asset_cache)
                counters["nodes"] += sub_counters["nodes"]
                counters["node_assets"] += sub_counters["node_assets"]
                if idx % 10 == 0 or idx == len(book_trees):
                    print(f"[{idx}/{len(book_trees)}] Processed {code} ({rtype}): {len(sections)} root sections -> {sub_counters['nodes']} nodes, {sub_counters['node_assets']} image links")

            # 5. Scan the images folder on disk to index all physical files belonging to these books
            scan_and_relate_disk_images(cur, img_dir, all_source_codes, counters, asset_cache)

        conn.commit()
        elapsed = time.time() - start_time
        print("\n" + "=" * 70)
        print("SYNCHRONIZATION COMPLETE")
        print("=" * 70)
        print(f"Elapsed time:              {elapsed:.2f} seconds")
        print(f"Sources upserted:          {counters['sources_upserted']}")
        print(f"Adventures/Books catalog:  {counters['adv_books_upserted']}")
        print(f"Hierarchical nodes loaded: {counters['nodes']}")
        print(f"Section image links:       {counters['node_assets']}")
        print(f"Total disk images indexed: {counters['disk_assets']}")
        print("=" * 70)

    except Exception:
        conn.rollback()
        raise
    finally:
        if close_at_end:
            conn.close()


def run_remote(args: argparse.Namespace) -> None:
    """Execute the synchronization script on the remote production server."""
    # Find lw_deploy_env in this script's directory
    script_dir = Path(__file__).resolve().parent
    sys.path.insert(0, str(script_dir))
    import lw_deploy_env as env

    print("Connecting to production server via SSH...")
    ssh = env.connect()
    try:
        remote_script_path = "/tmp/sync_5etools_books_to_sql.py"
        local_script_path = str(Path(__file__).resolve())
        print(f"Uploading updated script to {remote_script_path}...")
        sftp = ssh.open_sftp()
        sftp.put(local_script_path, remote_script_path)
        sftp.close()

        dry_flag = " --dry-run" if args.dry_run else ""
        source_flag = f" --source {args.source}" if args.source else ""
        cmd = (
            f"LW_DB_PASSWORD={env.DB_PASSWORD} "
            f"python3 {remote_script_path} "
            f"--data-dir {DEFAULT_SERVER_DATA_DIR} "
            f"--img-dir {DEFAULT_SERVER_IMG_DIR}"
            f"{dry_flag}{source_flag}"
        )
        print(f"Executing synchronization on remote server:\n> {cmd.replace(env.DB_PASSWORD, '***')}\n")
        out = env.run(ssh, cmd)
        print(out)

        # Clean up temporary script
        env.run(ssh, f"rm -f {remote_script_path}", check=False)
        print("\nRemote execution finished successfully.")
    finally:
        ssh.close()


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--data-dir", default=None, help="Path to 5etools data folder")
    parser.add_argument("--img-dir", default=None, help="Path to 5etools img folder")
    parser.add_argument("--source", default=None, help="Comma-separated list of source codes to process (e.g. PHB,DMG,CoS)")
    parser.add_argument("--dry-run", action="store_true", help="Parse JSON and report counts without modifying MySQL")
    parser.add_argument("--remote", action="store_true", help="Run the sync remotely on the production server via SSH")
    args = parser.parse_args()

    if args.remote:
        run_remote(args)
        return

    # Determine default paths
    data_dir = args.data_dir
    img_dir = args.img_dir

    if not data_dir:
        if os.path.isdir(DEFAULT_SERVER_DATA_DIR):
            data_dir = DEFAULT_SERVER_DATA_DIR
        elif os.path.isdir(DEFAULT_LOCAL_DATA_DIR):
            data_dir = DEFAULT_LOCAL_DATA_DIR
        else:
            data_dir = str(Path(__file__).resolve().parent.parent / "data")

    if not img_dir:
        if os.path.isdir(DEFAULT_SERVER_IMG_DIR):
            img_dir = DEFAULT_SERVER_IMG_DIR
        elif os.path.isdir(DEFAULT_LOCAL_IMG_DIR):
            img_dir = DEFAULT_LOCAL_IMG_DIR
        else:
            img_dir = str(Path(__file__).resolve().parent.parent / "5etools-img-main")

    target_sources = set(s.strip() for s in args.source.split(",")) if args.source else None
    sync_all_books_and_images(data_dir, img_dir, target_sources=target_sources, dry_run=args.dry_run)


if __name__ == "__main__":
    main()
