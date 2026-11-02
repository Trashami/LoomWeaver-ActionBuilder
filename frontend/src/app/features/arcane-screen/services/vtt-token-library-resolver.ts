import {
  CHARACTER_3D_PORTRAIT_PRESETS,
  FIVE_E_TOOLS_PORTRAIT_PRESETS,
  resolveCharacterGlbUrl,
} from '../../characters/models/character-portrait-catalog.data';

export interface ResolvedTokenAsset {
  readonly avatarUrl: string;
  readonly glbUrl: string;
}

/**
 * Returns true if the URL is a dark 3D miniature turntable preview rather than a 2D token portrait.
 */
export function is3dPreviewThumbnailUrl(url?: string | null): boolean {
  if (!url) return false;
  return url.includes('/assets/object-library/previews/obj-');
}

/**
 * Resolves a bright, high-visibility 2D token portrait URL:
 * 1. Uses the character's assigned 2D token/portrait from their character sheet if present and not a 3D turntable preview.
 * 2. Otherwise selects a standard 2D token from our 5e-Tools 2D token library matching the character's class, species, or role.
 */
export function resolve2dTokenUrlFromLibrary(token: {
  name: string;
  roleLabel?: string;
  faction?: string;
  key?: string;
  avatarUrl?: string;
}): string {
  const existing = token.avatarUrl?.trim();
  if (existing && !is3dPreviewThumbnailUrl(existing)) {
    return existing;
  }

  const text = `${token.name} ${token.roleLabel ?? ''} ${token.key ?? ''}`.toLowerCase();
  const isHostile =
    token.faction === 'hostile' ||
    text.includes('hostile') ||
    text.includes('cultist') ||
    text.includes('monster') ||
    text.includes('assassin') ||
    text.includes('vampire') ||
    text.includes('guard');

  // Named campaign party & archetype matches -> bright 2D token library portraits
  if (text.includes('kycius') || text.includes('tabaxi') || text.includes('catfolk')) {
    return '/assets/5e-tools/races/MPMM/Tabaxi.webp';
  }
  if (text.includes('fivi') || text.includes('gnome') || text.includes('halfling') || text.includes('bard')) {
    return '/assets/5e-tools/classes/PHB/Bard.webp';
  }
  if (text.includes('kildrid') || text.includes('dwarf') || text.includes('artificer')) {
    return '/assets/5e-tools/races/PHB/Dwarf.webp';
  }
  if (text.includes('munk') || text.includes('monk') || text.includes('half-orc') || text.includes('brawler')) {
    return '/assets/5e-tools/classes/PHB/Monk.webp';
  }
  if (
    text.includes('ranger') ||
    text.includes('hunter') ||
    text.includes('bow') ||
    text.includes('archer') ||
    text.includes('tobin')
  ) {
    return '/assets/5e-tools/classes/PHB/Ranger.webp';
  }
  if (
    text.includes('rogue') ||
    text.includes('thief') ||
    text.includes('dal') ||
    text.includes('riata')
  ) {
    return '/assets/5e-tools/classes/PHB/Rogue.webp';
  }
  if (
    text.includes('wizard') ||
    text.includes('mage') ||
    text.includes('evocation') ||
    text.includes('witch') ||
    text.includes('mireth') ||
    text.includes('ciaran')
  ) {
    return '/assets/5e-tools/classes/PHB/Wizard.webp';
  }
  if (text.includes('sorcerer')) {
    return '/assets/5e-tools/classes/PHB/Sorcerer.webp';
  }
  if (text.includes('warlock')) {
    return '/assets/5e-tools/classes/PHB/Warlock.webp';
  }
  if (text.includes('barbarian')) {
    return '/assets/5e-tools/classes/PHB/Barbarian.webp';
  }
  if (text.includes('paladin')) {
    return '/assets/5e-tools/classes/PHB/Paladin.webp';
  }
  if (text.includes('druid')) {
    return '/assets/5e-tools/classes/PHB/Druid.webp';
  }
  if (
    text.includes('cleric') ||
    text.includes('priest') ||
    text.includes('healer')
  ) {
    return '/assets/5e-tools/classes/PHB/Cleric.webp';
  }
  if (
    text.includes('fighter') ||
    text.includes('champion') ||
    text.includes('warrior') ||
    text.includes('aldric') ||
    text.includes('aldrin') ||
    text.includes('vossen')
  ) {
    return '/assets/5e-tools/classes/PHB/Fighter.webp';
  }

  if (isHostile) {
    if (text.includes('vampire') || text.includes('spawn') || text.includes('drow') || text.includes('dark') || text.includes('shadow')) {
      return '/assets/5e-tools/races/MPMM/Shadar-kai.webp';
    }
    if (text.includes('dragon') || text.includes('drake') || text.includes('wyrm')) {
      return '/assets/5e-tools/races/PHB/Dragonborn.webp';
    }
    if (text.includes('orc') || text.includes('goblin') || text.includes('brute') || text.includes('bandit')) {
      return '/assets/5e-tools/races/XPHB/Orc.webp';
    }
    if (text.includes('cultist') || text.includes('fiend') || text.includes('tiefling') || text.includes('assassin')) {
      return '/assets/5e-tools/races/PHB/Tiefling.webp';
    }
    if (text.includes('goliath') || text.includes('giant') || text.includes('guard')) {
      return '/assets/5e-tools/races/XPHB/Goliath.webp';
    }
  }

  // Deterministic fallback across our bright 2D token library
  const presets2d = FIVE_E_TOOLS_PORTRAIT_PRESETS;
  let hash = 0;
  for (let i = 0; i < token.name.length; i++) {
    hash = (hash << 5) - hash + token.name.charCodeAt(i);
    hash |= 0;
  }
  return presets2d[Math.abs(hash) % presets2d.length].imageUrl;
}

/**
 * Assigns a default 2D portrait (from the character sheet or 2D token library) and 3D miniature
 * so that 2D mode always displays a bright, readable 2D token and 3D mode has a 3D miniature.
 */
export function resolveDefaultTokenFromLibrary(token: {
  name: string;
  roleLabel?: string;
  faction?: string;
  key?: string;
  avatarUrl?: string;
  glbUrl?: string;
}): ResolvedTokenAsset {
  const resolved2dAvatar = resolve2dTokenUrlFromLibrary(token);
  const existingGlb = token.glbUrl?.trim() || resolveCharacterGlbUrl(token.avatarUrl?.trim());

  if (existingGlb) {
    return { avatarUrl: resolved2dAvatar, glbUrl: existingGlb };
  }

  const text = `${token.name} ${token.roleLabel ?? ''} ${token.key ?? ''}`.toLowerCase();
  const isHostile =
    token.faction === 'hostile' ||
    text.includes('hostile') ||
    text.includes('cultist') ||
    text.includes('monster') ||
    text.includes('assassin') ||
    text.includes('guard');

  // 1. Specific archetype matchers for 3D GLB models
  if (
    text.includes('ranger') ||
    text.includes('hunter') ||
    text.includes('bow') ||
    text.includes('archer') ||
    text.includes('tobin') ||
    text.includes('rogue') ||
    text.includes('assassin') ||
    text.includes('thief') ||
    text.includes('dal') ||
    text.includes('riata')
  ) {
    return {
      avatarUrl: resolved2dAvatar,
      glbUrl: '/assets/object-library/models/obj-eeb636a657931a94.glb',
    };
  }

  if (
    text.includes('wizard') ||
    text.includes('mage') ||
    text.includes('evocation') ||
    text.includes('sorcerer') ||
    text.includes('witch') ||
    text.includes('mireth')
  ) {
    return {
      avatarUrl: resolved2dAvatar,
      glbUrl: '/assets/object-library/models/obj-0907a59f704528d4.glb',
    };
  }

  if (
    text.includes('fighter') ||
    text.includes('champion') ||
    text.includes('warrior') ||
    text.includes('barbarian') ||
    text.includes('aldric') ||
    text.includes('aldrin') ||
    text.includes('vossen')
  ) {
    return {
      avatarUrl: resolved2dAvatar,
      glbUrl: '/assets/object-library/models/obj-eda4c9d5e6270ac4.glb',
    };
  }

  if (
    text.includes('cleric') ||
    text.includes('paladin') ||
    text.includes('priest') ||
    text.includes('druid') ||
    text.includes('monk') ||
    text.includes('healer') ||
    text.includes('munk')
  ) {
    return {
      avatarUrl: resolved2dAvatar,
      glbUrl: '/assets/object-library/models/obj-4c95885ede2c59e4.glb',
    };
  }

  // 2. Monsters & Hostiles
  if (isHostile || text.includes('jackal') || text.includes('cultist') || text.includes('goblin')) {
    if (text.includes('warlock') || text.includes('dark') || text.includes('leader') || text.includes('spawn')) {
      return {
        avatarUrl: resolved2dAvatar,
        glbUrl: '/assets/object-library/models/obj-17a76e032a9384b2.glb',
      };
    }
    return {
      avatarUrl: resolved2dAvatar,
      glbUrl: '/assets/object-library/models/obj-5d41df3ebfdf4e7f.glb',
    };
  }

  // 3. Deterministic hash fallback from character 3D presets
  const presets = CHARACTER_3D_PORTRAIT_PRESETS;
  let hash = 0;
  for (let i = 0; i < token.name.length; i++) {
    hash = (hash << 5) - hash + token.name.charCodeAt(i);
    hash |= 0;
  }
  const picked = presets[Math.abs(hash) % presets.length];

  return {
    avatarUrl: resolved2dAvatar,
    glbUrl: picked.glbUrl || '/assets/object-library/models/obj-eda4c9d5e6270ac4.glb',
  };
}
