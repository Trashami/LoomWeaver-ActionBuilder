import {
  CHARACTER_3D_PORTRAIT_PRESETS,
  resolveCharacterGlbUrl,
} from '../../characters/models/character-portrait-catalog.data';

export interface ResolvedTokenAsset {
  readonly avatarUrl: string;
  readonly glbUrl: string;
}

/**
 * Assigns a default 3D miniature and 2D portrait from our token library
 * so that no token ever falls back to a generic round puck or plain circle.
 */
export function resolveDefaultTokenFromLibrary(token: {
  name: string;
  roleLabel?: string;
  faction?: string;
  key?: string;
  avatarUrl?: string;
  glbUrl?: string;
}): ResolvedTokenAsset {
  const existingAvatar = token.avatarUrl?.trim();
  const existingGlb = token.glbUrl?.trim() || resolveCharacterGlbUrl(existingAvatar);

  if (existingAvatar && existingGlb) {
    return { avatarUrl: existingAvatar, glbUrl: existingGlb };
  }

  const text = `${token.name} ${token.roleLabel ?? ''} ${token.key ?? ''}`.toLowerCase();
  const isHostile =
    token.faction === 'hostile' ||
    text.includes('hostile') ||
    text.includes('cultist') ||
    text.includes('monster') ||
    text.includes('assassin') ||
    text.includes('guard');

  // 1. Specific archetype matchers from our token library
  if (
    text.includes('ranger') ||
    text.includes('hunter') ||
    text.includes('bow') ||
    text.includes('archer') ||
    text.includes('tobin')
  ) {
    return {
      avatarUrl: existingAvatar || '/assets/object-library/previews/obj-eeb636a657931a94.webp',
      glbUrl: existingGlb || '/assets/object-library/models/obj-eeb636a657931a94.glb',
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
      avatarUrl: existingAvatar || '/assets/object-library/previews/obj-0907a59f704528d4.webp',
      glbUrl: existingGlb || '/assets/object-library/models/obj-0907a59f704528d4.glb',
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
      avatarUrl: existingAvatar || '/assets/object-library/previews/obj-eda4c9d5e6270ac4.webp',
      glbUrl: existingGlb || '/assets/object-library/models/obj-eda4c9d5e6270ac4.glb',
    };
  }

  if (
    text.includes('rogue') ||
    text.includes('assassin') ||
    text.includes('thief') ||
    text.includes('dal') ||
    text.includes('riata')
  ) {
    return {
      avatarUrl: existingAvatar || '/assets/object-library/previews/obj-eeb636a657931a94.webp',
      glbUrl: existingGlb || '/assets/object-library/models/obj-eeb636a657931a94.glb',
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
      avatarUrl: existingAvatar || '/assets/object-library/previews/obj-4c95885ede2c59e4.webp',
      glbUrl: existingGlb || '/assets/object-library/models/obj-4c95885ede2c59e4.glb',
    };
  }

  // 2. Monsters & Hostiles
  if (isHostile || text.includes('jackal') || text.includes('cultist') || text.includes('goblin')) {
    if (text.includes('warlock') || text.includes('dark') || text.includes('leader') || text.includes('spawn')) {
      return {
        avatarUrl: existingAvatar || '/assets/object-library/previews/obj-17a76e032a9384b2.webp',
        glbUrl: existingGlb || '/assets/object-library/models/obj-17a76e032a9384b2.glb',
      };
    }
    return {
      avatarUrl: existingAvatar || '/assets/object-library/previews/obj-5d41df3ebfdf4e7f.webp',
      glbUrl: existingGlb || '/assets/object-library/models/obj-5d41df3ebfdf4e7f.glb',
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
    avatarUrl: existingAvatar || picked.imageUrl,
    glbUrl: existingGlb || picked.glbUrl || '/assets/object-library/models/obj-eda4c9d5e6270ac4.glb',
  };
}
