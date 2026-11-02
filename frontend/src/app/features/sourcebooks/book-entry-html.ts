// Converts 5etools-style entry trees (data_json of dnd_book_nodes) into HTML.
// Text is HTML-escaped before inline tags are rendered, so the output is safe to bind with innerHTML.

const BLOCK_TYPES = new Set([
  'entries',
  'section',
  'inset',
  'insetReadaloud',
  'quote',
  'variant',
  'optfeature',
  'abilityDc',
  'abilityAttackMod',
]);

let tableCounter = 0;

export function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function renderInlineTags(value: string): string {
  if (!value) return '';
  const tagRegex = /\{@([a-zA-Z0-9_-]+)\s*([^{}]*)\}/g;
  let lastIndex = 0;
  let result = '';
  let match: RegExpExecArray | null;

  while ((match = tagRegex.exec(value)) !== null) {
    if (match.index > lastIndex) {
      result += escapeHtml(value.slice(lastIndex, match.index));
    }
    lastIndex = tagRegex.lastIndex;

    const tag = match[1].toLowerCase();
    const rawBody = match[2];
    const parts = rawBody.split('|').map((p) => p.trim());
    const rawName = parts[0] ?? '';

    if (tag === 'item') {
      const displayText = parts[2] || parts[0] || 'Item';
      const searchParam = encodeURIComponent(rawName);
      result += `<a class="book-item-link" href="/items?search=${searchParam}" data-item-name="${escapeHtml(rawName)}" title="Inspect ${escapeHtml(rawName)} in Items Catalog">${escapeHtml(displayText)}</a>`;
    } else if (tag === 'spell') {
      const rawSource = parts[1] || '';
      const displayText = parts[2] || parts[0] || 'Spell';
      const spellParam = encodeURIComponent(rawName);
      result += `<a class="book-spell-link" href="?spell=${spellParam}" data-spell-name="${escapeHtml(rawName)}" data-spell-source="${escapeHtml(rawSource)}" title="View ${escapeHtml(rawName)} spell description">${escapeHtml(displayText)}</a>`;
    } else if (tag === 'creature') {
      const rawSource = parts[1] || '';
      const displayText = parts[2] || parts[0] || 'Creature';
      const monsterQuery = rawSource ? `${rawName}|${rawSource}` : rawName;
      result += `<a class="book-creature-link" href="/bestiary?monster=${encodeURIComponent(monsterQuery)}&search=${encodeURIComponent(rawName)}" data-monster-name="${escapeHtml(rawName)}" data-monster-source="${escapeHtml(rawSource)}" title="View ${escapeHtml(rawName)} in Bestiary">${escapeHtml(displayText)}</a>`;
    } else if (tag === 'dice' || tag === 'd20' || tag === 'hit') {
      const rawFormula = parts[0] || '1d20';
      const formula = tag === 'd20' || tag === 'hit'
        ? `1d20${rawFormula.startsWith('+') || rawFormula.startsWith('-') ? rawFormula : `+${rawFormula}`}`
        : rawFormula;
      const displayText = parts[1] || parts[0] || formula;
      result += `<button type="button" class="book-dice-btn" data-dice="${escapeHtml(formula)}" title="Roll ${escapeHtml(formula)}">${escapeHtml(displayText)}</button>`;
    } else if (tag === 'damage') {
      const formula = parts[0] || '';
      const displayText = parts[1] || parts[0] || formula;
      result += `<button type="button" class="book-dice-btn book-dice-btn--damage" data-dice="${escapeHtml(formula)}" title="Roll damage ${escapeHtml(formula)}">${escapeHtml(displayText)}</button>`;
    } else if (tag === 'condition' || tag === 'status') {
      const displayText = parts[2] || parts[0] || '';
      result += `<span class="book-tag-ref book-tag-ref--condition" title="Condition">${escapeHtml(displayText)}</span>`;
    } else {
      const displayText = parts[parts.length > 2 ? 2 : 0] || parts[0] || '';
      result += escapeHtml(displayText);
    }
  }

  if (lastIndex < value.length) {
    result += escapeHtml(value.slice(lastIndex));
  }

  return result;
}

export function inline(value: unknown): string {
  return renderInlineTags(String(value ?? ''));
}

export function renderEntries(entries: unknown): string {
  if (!Array.isArray(entries)) {
    return entries === undefined || entries === null ? '' : renderEntry(entries);
  }
  return entries.map((entry) => renderEntry(entry)).join('');
}

function formatMod(score: unknown): string {
  const n = typeof score === 'number' ? score : Number(score ?? 10);
  if (isNaN(n)) return '+0';
  const mod = Math.floor((n - 10) / 2);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

function renderCreatureStatblock(node: Record<string, unknown>): string {
  const name = typeof node['name'] === 'string' ? node['name'] : '';
  const src = typeof node['source'] === 'string' ? node['source'] : '';
  const bestiaryKey = typeof node['bestiaryKey'] === 'string' ? node['bestiaryKey'] : '';
  const monsterQuery = bestiaryKey || (src ? `${name}|${src}` : name);
  const href = `/bestiary?monster=${encodeURIComponent(monsterQuery)}&search=${encodeURIComponent(name)}`;

  const btnHtml = name
    ? `<a class="book-statblock-bestiary-btn" href="${escapeHtml(href)}" data-monster-key="${escapeHtml(bestiaryKey)}" data-monster-name="${escapeHtml(name)}" data-monster-source="${escapeHtml(src)}">View in Bestiary</a>`
    : '';

  const raw = (node['monsterRaw'] && typeof node['monsterRaw'] === 'object')
    ? (node['monsterRaw'] as Record<string, unknown>)
    : null;

  const cr = typeof node['crText'] === 'string' ? node['crText'] : '';
  const typeMain = typeof node['typeMain'] === 'string' ? node['typeMain'] : '';
  const ac = node['acBest'] ?? '';
  const hp = node['hpAvg'] ?? '';

  let statsHtml = '';
  if (raw) {
    const abilities: Array<[string, unknown]> = [
      ['STR', raw['str']],
      ['DEX', raw['dex']],
      ['CON', raw['con']],
      ['INT', raw['int']],
      ['WIS', raw['wis']],
      ['CHA', raw['cha']],
    ];
    const abilityCells = abilities
      .map(([lbl, val]) => `<div class="book-sb-ability"><span class="book-sb-ability-lbl">${lbl}</span><strong>${ escapeHtml(String(val ?? 10)) } (${formatMod(val)})</strong></div>`)
      .join('');

    const renderNamedList = (title: string, list: unknown): string => {
      if (!Array.isArray(list) || list.length === 0) return '';
      const rows = list
        .map((it) => {
          if (!it || typeof it !== 'object') return '';
          const rec = it as Record<string, unknown>;
          const nm = rec['name'] ? `<strong><em>${inline(rec['name'])}.</em></strong> ` : '';
          return `<div class="book-sb-trait">${nm}${renderEntries(rec['entries'])}</div>`;
        })
        .join('');
      return `<div class="book-sb-section"><h5 class="book-sb-section-title">${escapeHtml(title)}</h5>${rows}</div>`;
    };

    statsHtml = `
      <div class="book-sb-vitals">
        ${ac ? `<span><strong>AC</strong> ${escapeHtml(String(ac))}</span>` : ''}
        ${hp ? `<span><strong>HP</strong> ${escapeHtml(String(hp))}</span>` : ''}
        ${cr ? `<span><strong>CR</strong> ${escapeHtml(cr)}</span>` : ''}
      </div>
      <div class="book-sb-abilities">${abilityCells}</div>
      ${renderNamedList('Traits', raw['trait'])}
      ${renderNamedList('Actions', raw['action'])}
      ${renderNamedList('Bonus Actions', raw['bonus'])}
      ${renderNamedList('Reactions', raw['reaction'])}
      ${renderNamedList('Legendary Actions', raw['legendary'])}
    `;
  }

  const subtitle = [typeMain, cr ? `CR ${cr}` : '', src].filter(Boolean).join(' · ');
  return `<div class="book-block book-block--statblock">
    <div class="book-statblock-header">
      <div class="book-statblock-title-wrap">
        ${name ? `<h4 class="book-statblock-title">${inline(name)}</h4>` : ''}
        ${subtitle ? `<span class="book-statblock-subtitle">${escapeHtml(subtitle)}</span>` : ''}
      </div>
      ${btnHtml}
    </div>
    ${statsHtml}
    ${renderEntries(node['entries'])}
  </div>`;
}

export function renderEntry(entry: unknown): string {
  if (typeof entry === 'string') {
    return `<p>${inline(entry)}</p>`;
  }
  if (!entry || typeof entry !== 'object') {
    return '';
  }
  const node = entry as Record<string, unknown>;
  const type = typeof node['type'] === 'string' ? (node['type'] as string) : 'entries';

  switch (type) {
    case 'list': {
      const items = (node['items'] as unknown[]) ?? [];
      const isSpellList = items.length >= 6 && items.every((it) => typeof it === 'string' && it.trim().startsWith('{@spell'));
      const hasColumns = Boolean(node['columns']) || isSpellList;
      const listClass = hasColumns ? ' class="book-list-columns"' : '';
      const heading = node['name'] ? `<h4 class="book-list-heading">${inline(node['name'])}</h4>` : '';
      return `${heading}<ul${listClass}>${items.map((item) => `<li>${renderEntry(item)}</li>`).join('')}</ul>`;
    }
    case 'item': {
      const itemName = node['name'] ? `<strong>${inline(node['name'])}</strong> ` : '';
      const body = node['entry'] ? inline(node['entry']) : renderEntries(node['entries']);
      return `<div class="book-list-item">${itemName}${body}</div>`;
    }
    case 'table':
      return renderTable(node);
    case 'tableGroup':
      return (((node['tables'] as Record<string, unknown>[]) ?? []).map(renderTable)).join('');
    case 'statblock': {
      const tag = typeof node['tag'] === 'string' ? node['tag'].toLowerCase() : '';
      const name = typeof node['name'] === 'string' ? node['name'] : '';
      const src = typeof node['source'] === 'string' ? node['source'] : '';
      if (tag === 'spell' && name && !Array.isArray(node['entries'])) {
        return `<div class="book-spell-entry-row"><a class="book-spell-link book-spell-link--card" href="?spell=${encodeURIComponent(name)}" data-spell-name="${escapeHtml(name)}" data-spell-source="${escapeHtml(src)}" title="View ${escapeHtml(name)} spell description">${escapeHtml(name)}</a></div>`;
      }
      return renderCreatureStatblock(node);
    }
    case 'image': {
      let path = '';
      if (typeof node['path'] === 'string') {
        path = node['path'];
      } else if (node['href']) {
        const href = node['href'] as Record<string, unknown> | string;
        if (typeof href === 'string') path = href;
        else if (href && typeof href === 'object' && href['path']) path = String(href['path']);
      }
      if (!path) return '';
      const cleanPath = path.replace(/\\/g, '/').replace(/^\/+/, '');
      const fullSrc = cleanPath.startsWith('5etools/') ? `/${cleanPath}` : `/5etools/${cleanPath}`;
      const title = typeof node['title'] === 'string' ? node['title'] : '';
      const caption = title ? `<figcaption>${inline(title)}</figcaption>` : '';
      const isExampleStatblock = cleanPath.toLowerCase().includes('stat-block-overview');
      const exampleHeader = isExampleStatblock
        ? `<div class="book-statblock-header book-statblock-header--figure">
             <span class="book-statblock-subtitle">Example Stat Block: Vampire Familiar</span>
             <a class="book-statblock-bestiary-btn" href="/bestiary?monster=${encodeURIComponent('Vampire Familiar|XMM')}&search=${encodeURIComponent('Vampire Familiar')}" data-monster-name="Vampire Familiar" data-monster-source="XMM">View in Bestiary</a>
           </div>`
        : '';
      return `<figure class="book-figure">${exampleHeader}<img src="${escapeHtml(fullSrc)}" alt="${escapeHtml(title || 'Tome illustration')}" loading="lazy" />${caption}</figure>`;
    }
    case 'gallery': {
      const images = (node['images'] as unknown[] | undefined) ?? [];
      return `<div class="book-gallery">${images.map((img) => renderEntry(img)).join('')}</div>`;
    }
    case 'flowchart':
    case 'lwSection':
      return '';
    default:
      break;
  }

  if (BLOCK_TYPES.has(type) || Array.isArray(node['entries'])) {
    const isQuote = type === 'quote';
    const isInset = type === 'inset' || type === 'insetReadaloud';
    const modifierClass = isQuote ? 'book-block--quote' : isInset ? 'book-block--inset' : '';
    const heading = node['name'] ? `<h4>${inline(node['name'])}</h4>` : '';
    return `<div class="book-block ${modifierClass}">${heading}${renderEntries(node['entries'])}</div>`;
  }
  if (Array.isArray(node['items'])) {
    return `<ul>${(node['items'] as unknown[]).map((item) => `<li>${renderEntry(item)}</li>`).join('')}</ul>`;
  }
  if (typeof node['entry'] === 'string') {
    return `<p>${inline(node['entry'])}</p>`;
  }
  return '';
}

function parseRollRange(cell: unknown): { min: number; max: number } | null {
  if (cell && typeof cell === 'object') {
    const obj = cell as Record<string, unknown>;
    if ('roll' in obj && obj['roll'] && typeof obj['roll'] === 'object') {
      const roll = obj['roll'] as { exact?: number; min?: number; max?: number };
      if (typeof roll.exact === 'number') {
        const exactVal = roll.exact === 0 ? 100 : roll.exact;
        return { min: exactVal, max: exactVal };
      }
      if (typeof roll.min === 'number' && typeof roll.max === 'number') {
        const maxVal = roll.max === 0 && roll.min > 0 ? 100 : roll.max;
        return { min: roll.min, max: maxVal };
      }
    }
  }
  if (typeof cell === 'string') {
    const trimmed = cell.replace(/\{@[^}]+\}/g, '').trim();
    const rangeMatch = /^(\d+)\s*(?:-|–|—|to)\s*(\d+)$/i.exec(trimmed);
    if (rangeMatch) {
      let min = parseInt(rangeMatch[1], 10);
      let max = parseInt(rangeMatch[2], 10);
      if (rangeMatch[1] === '00') min = 100;
      if (rangeMatch[2] === '00' || (max === 0 && min > 0)) max = 100;
      if (!isNaN(min) && !isNaN(max)) return { min, max };
    }
    const exactMatch = /^(\d+)$/.exec(trimmed);
    if (exactMatch) {
      let num = parseInt(exactMatch[1], 10);
      if (exactMatch[1] === '00' || exactMatch[1] === '0') num = 100;
      if (!isNaN(num)) return { min: num, max: num };
    }
  }
  if (typeof cell === 'number') {
    const val = cell === 0 ? 100 : cell;
    return { min: val, max: val };
  }
  return null;
}

function extractTableDiceExpression(rawText: string): string {
  const cleaned = rawText.trim();
  if (!cleaned) return '';

  // 1. Explicit {@dice ...} tag
  const diceTagMatch = /\{@dice\s+([^|}]+)(?:\|[^}]*)?\}/i.exec(cleaned);
  if (diceTagMatch?.[1]) {
    const formula = diceTagMatch[1].trim().replace(/\s+/g, '');
    if (/^d\d+/i.test(formula)) return `1${formula.toLowerCase()}`;
    if (/^d%/i.test(formula)) return '1d100';
    return formula.toLowerCase();
  }

  // 2. Plain text d% or compound dice formula (e.g. 1d12 + 1d8, 2d6, d100, d8)
  if (/d%/i.test(cleaned)) {
    return '1d100';
  }
  const compoundMatch = /\b(\d*d\d+(?:\s*[+-]\s*\d*d?\d+)*)\b/i.exec(cleaned);
  if (compoundMatch?.[1]) {
    const normalized = compoundMatch[1].replace(/\s+/g, '').toLowerCase();
    return normalized.startsWith('d') ? `1${normalized}` : normalized;
  }
  return '';
}

function renderTable(node: Record<string, unknown>): string {
  const tableId = `lw-tbl-${++tableCounter}`;
  const rawCaption = node['caption'] ? String(node['caption']) : '';
  const caption = rawCaption ? `<caption>${inline(rawCaption)}</caption>` : '';
  const labels = (node['colLabels'] as unknown[] | undefined) ?? [];

  let diceExpr = '';
  for (const label of labels) {
    diceExpr = extractTableDiceExpression(String(label ?? ''));
    if (diceExpr) break;
  }
  if (!diceExpr && rawCaption) {
    diceExpr = extractTableDiceExpression(rawCaption);
  }

  const rawRows = (node['rows'] as unknown[][] | undefined) ?? [];
  let maxFoundRoll = 0;
  let hasRowRollRanges = false;

  const rowsHtml = rawRows
    .map((row) => {
      const range = row.length > 0 ? parseRollRange(row[0]) : null;
      let attr = '';
      if (range) {
        hasRowRollRanges = true;
        if (range.max > maxFoundRoll) maxFoundRoll = range.max;
        attr = ` class="book-table-row" data-roll-min="${range.min}" data-roll-max="${range.max}"`;
      }
      return `<tr${attr}>${row.map((cell) => `<td>${renderCell(cell)}</td>`).join('')}</tr>`;
    })
    .join('');

  if (!diceExpr && hasRowRollRanges && maxFoundRoll > 0) {
    if (maxFoundRoll <= 4) diceExpr = '1d4';
    else if (maxFoundRoll <= 6) diceExpr = '1d6';
    else if (maxFoundRoll <= 8) diceExpr = '1d8';
    else if (maxFoundRoll <= 10) diceExpr = '1d10';
    else if (maxFoundRoll <= 12) diceExpr = '1d12';
    else if (maxFoundRoll <= 20) diceExpr = '1d20';
    else diceExpr = '1d100';
  }

  const head = labels.length
    ? `<thead><tr>${labels.map((label) => `<th>${inline(label)}</th>`).join('')}</tr></thead>`
    : '';

  const toolbar = diceExpr
    ? `<div class="book-table-toolbar">
         <button type="button" class="book-roll-btn" data-dice="${escapeHtml(diceExpr)}" data-table-id="${tableId}" data-caption="${escapeHtml(rawCaption || 'Roll Table')}">
           Roll ${escapeHtml(diceExpr.toUpperCase())}
         </button>
         <span class="book-table-result" id="${tableId}-result"></span>
       </div>`
    : '';

  return `<div class="book-table-wrapper" id="${tableId}">
    ${toolbar}
    <div class="book-table-scroll">
      <table class="book-table">${caption}${head}<tbody>${rowsHtml}</tbody></table>
    </div>
  </div>`;
}

function renderCell(cell: unknown): string {
  if (cell && typeof cell === 'object' && 'roll' in (cell as Record<string, unknown>)) {
    const roll = (cell as { roll: { exact?: number; min?: number; max?: number } }).roll;
    return roll.exact !== undefined ? String(roll.exact) : `${roll.min ?? ''}–${roll.max ?? ''}`;
  }
  return typeof cell === 'string' ? inline(cell) : renderEntry(cell);
}
