-- Roll table dice inferred from the row range sequence when col_labels_json has no die label.
-- roll_range_col is the column index that holds the range text (1..N, 01..N, 00..99).
ALTER TABLE `dnd_tables`
  ADD COLUMN `roll_die` VARCHAR(16) NULL AFTER `srd`,
  ADD COLUMN `roll_die_source` VARCHAR(16) NULL AFTER `roll_die`,
  ADD COLUMN `roll_range_col` TINYINT NULL AFTER `roll_die_source`;

-- Book TOC tables are replaced by the section tree in dnd_book_nodes (data_json holds entries).
-- Not dropped yet; see docs/DEPRECATIONS.md.
ALTER TABLE `dnd_book_toc_entries` COMMENT = 'DEPRECATED 2026-11-15: unused. Replaced by dnd_book_nodes. Drop after review.';
ALTER TABLE `dnd_book_toc_headers` COMMENT = 'DEPRECATED 2026-11-15: unused. Replaced by dnd_book_nodes. Drop after review.';
