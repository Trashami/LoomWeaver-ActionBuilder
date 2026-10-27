import { CreatorAncestryOptionVm } from './character-studio.models';
export {
  CREATOR_BACKGROUNDS,
  CREATOR_CLASSES,
  buildSavingThrows,
  buildSkillsList,
} from './character-creator-classes.data';
export {
  CHARACTER_3D_PORTRAIT_PRESETS,
  CharacterPortraitPresetVm,
  FIVE_E_TOOLS_PORTRAIT_PRESETS,
} from './character-portrait-catalog.data';

export const CREATOR_ANCESTRIES: readonly CreatorAncestryOptionVm[] = [
  {
    id: 'human',
    name: 'Human',
    tagline: 'Versatile and ambitious.',
    description: 'Adaptable wayfarers across Vandia, Cinth, and the Plains of Vistagh.',
    source: 'PHB',
    portraitUrl: '/assets/5e-tools/races/PHB/Human.webp',
    galleryPortraits: [
      '/assets/5e-tools/races/PHB/Human.webp',
      '/assets/5e-tools/races/XPHB/Human.webp',
    ],
    traits: [
      { id: 'hum-asi', title: 'Ability Score Increase', description: '+1 to all ability scores or +1 to two scores plus a feat.', icon: 'zap' },
      { id: 'hum-vers', title: 'Cinth Artificer Ingenuity', description: 'Proficiency in one additional skill and one artisan tool.', icon: 'settings' },
      { id: 'hum-resolve', title: 'Frontier Resolve', description: 'Advantage on checks to resist exhaustion during long marches.', icon: 'shield' },
    ],
    subraces: [
      { id: 'cinth-guildborn', name: 'Cinth Guildborn', subtitle: 'Artificer craft and clockwork familiarity', portraitUrl: '/assets/5e-tools/races/PHB/Human.webp', source: 'Homebrew' },
      { id: 'vandia-mariner', name: 'Vandia Coastfarer', subtitle: 'Bay of Forgotten Treasures navigation', portraitUrl: '/assets/5e-tools/races/XPHB/Human.webp', source: 'PHB' },
    ],
  },
  {
    id: 'elf',
    name: 'Elf',
    tagline: 'Graceful and long-lived.',
    description: 'Graceful, long-lived, and deeply connected to magic.',
    source: 'PHB',
    portraitUrl: '/assets/5e-tools/races/PHB/Elf.webp',
    galleryPortraits: [
      '/assets/5e-tools/races/PHB/Elf.webp',
      '/assets/5e-tools/races/XPHB/Elf.webp',
      '/assets/5e-tools/races/MPMM/Shadar-kai.webp',
      '/assets/5e-tools/races/MPMM/Eladrin.webp',
    ],
    traits: [
      { id: 'elf-asi', title: 'Ability Score Increase', description: '+2 Dexterity, +1 Intelligence', icon: 'zap' },
      { id: 'elf-darkvision', title: 'Darkvision', description: 'See in dim light up to 60 feet.', icon: 'eye' },
      { id: 'elf-senses', title: 'Keen Senses', description: 'Proficiency in Perception.', icon: 'compass' },
      { id: 'elf-fey-ancestry', title: 'Fey Ancestry', description: 'Advantage on saves vs. charmed.', icon: 'shield' },
      { id: 'elf-trance', title: 'Trance', description: 'Instead of sleep, you meditate for 4 hours.', icon: 'clock' },
      { id: 'elf-weapon', title: 'Elf Weapon Training', description: 'Proficiency with longswords, shortswords, shortbows, and longbows.', icon: 'swords' },
    ],
    subraces: [
      { id: 'high-elf', name: 'High Elf', subtitle: 'Extra cantrip and language', portraitUrl: '/assets/5e-tools/races/PHB/Elf.webp', source: 'PHB' },
      { id: 'wood-elf', name: 'Wood Elf', subtitle: 'Faster and stealthier', portraitUrl: '/assets/5e-tools/races/XPHB/Elf.webp', source: 'PHB' },
      { id: 'drow', name: 'Dark Elf (Drow)', subtitle: 'Superior darkvision', portraitUrl: '/assets/5e-tools/races/MPMM/Shadar-kai.webp', source: 'SRD 5.1' },
      { id: 'eladrin', name: 'Eladrin (Homebrew)', subtitle: 'Seasonal fey magic', portraitUrl: '/assets/5e-tools/races/MPMM/Eladrin.webp', source: 'Homebrew' },
    ],
  },
  {
    id: 'dwarf',
    name: 'Dwarf',
    tagline: 'Resilient and proud.',
    description: 'Carved from mountain stone with ancient runic memory.',
    source: 'PHB',
    portraitUrl: '/assets/5e-tools/races/PHB/Dwarf.webp',
    galleryPortraits: [
      '/assets/5e-tools/races/PHB/Dwarf.webp',
      '/assets/5e-tools/races/XPHB/Dwarf.webp',
      '/assets/5e-tools/races/MPMM/Duergar.webp',
    ],
    traits: [
      { id: 'dwf-asi', title: 'Ability Score Increase', description: '+2 Constitution, +1 Wisdom or Strength', icon: 'zap' },
      { id: 'dwf-res', title: 'Dwarven Resilience', description: 'Advantage on saves vs. poison and resistance to poison damage.', icon: 'shield' },
      { id: 'dwf-stone', title: 'Stonecunning', description: 'Double proficiency on History checks related to stonework and runes.', icon: 'landmark' },
    ],
    subraces: [
      { id: 'mountain-dwarf', name: 'Mountain Dwarf', subtitle: 'Armor training and runic masonry', portraitUrl: '/assets/5e-tools/races/PHB/Dwarf.webp', source: 'PHB' },
      { id: 'hill-dwarf', name: 'Hill Dwarf', subtitle: 'Dwarven toughness (+1 HP per level)', portraitUrl: '/assets/5e-tools/races/XPHB/Dwarf.webp', source: 'SRD 5.1' },
    ],
  },
  {
    id: 'halfling',
    name: 'Halfling',
    tagline: 'Small but mighty.',
    description: 'Nimble wanderers touched by uncanny fortune and fey crossroads.',
    source: 'PHB',
    portraitUrl: '/assets/5e-tools/races/PHB/Halfling.webp',
    galleryPortraits: [
      '/assets/5e-tools/races/PHB/Halfling.webp',
      '/assets/5e-tools/races/XPHB/Halfling.webp',
      '/assets/5e-tools/races/EGW/Halfling (Lotusden).webp',
    ],
    traits: [
      { id: 'hlf-lucky', title: 'Lucky', description: 'Reroll natural 1s on attack rolls, ability checks, or saving throws.', icon: 'dices' },
      { id: 'hlf-brave', title: 'Brave', description: 'Advantage on saving throws against being frightened.', icon: 'shield' },
      { id: 'hlf-nimble', title: 'Halfling Nimbleness', description: 'Move through the space of any creature larger than you.', icon: 'compass' },
    ],
    subraces: [
      { id: 'feywild-outcast', name: 'Feywild Outcast (Homebrew)', subtitle: 'Sideways fey logic and slingshot trickery', portraitUrl: '/assets/5e-tools/races/PHB/Halfling.webp', source: 'Homebrew' },
      { id: 'lightfoot', name: 'Lightfoot', subtitle: 'Naturally stealthy', portraitUrl: '/assets/5e-tools/races/XPHB/Halfling.webp', source: 'SRD 5.1' },
    ],
  },
  {
    id: 'dragonborn',
    name: 'Dragonborn',
    tagline: 'Born of dragonkind.',
    description: 'Scions of the ancient dragons who once guarded the six Luminaries.',
    source: 'PHB',
    portraitUrl: '/assets/5e-tools/races/PHB/Dragonborn.webp',
    galleryPortraits: [
      '/assets/5e-tools/races/PHB/Dragonborn.webp',
      '/assets/5e-tools/races/XPHB/Dragonborn.webp',
      '/assets/5e-tools/races/FTD/Metallic Dragonborn.webp',
    ],
    traits: [
      { id: 'drg-breath', title: 'Breath Weapon', description: 'Exhale destructive elemental energy in a 15-ft cone or 30-ft line.', icon: 'zap' },
      { id: 'drg-resist', title: 'Draconic Resistance', description: 'Resistance to the damage type associated with your draconic ancestry.', icon: 'shield' },
    ],
    subraces: [
      { id: 'gold-draconic', name: 'Luminant Gold Lineage', subtitle: 'Fire breath and ancient memory', portraitUrl: '/assets/5e-tools/races/PHB/Dragonborn.webp', source: 'PHB' },
    ],
  },
  {
    id: 'gnome',
    name: 'Gnome',
    tagline: 'Inventive and curious.',
    description: 'Ingenious tinkerers and chroniclers of Cinth clockwork.',
    source: 'PHB',
    portraitUrl: '/assets/5e-tools/races/PHB/Gnome.webp',
    galleryPortraits: [
      '/assets/5e-tools/races/PHB/Gnome.webp',
      '/assets/5e-tools/races/XPHB/Gnome.webp',
      '/assets/5e-tools/races/MPMM/Deep Gnome.webp',
    ],
    traits: [
      { id: 'gnm-cunning', title: 'Gnome Cunning', description: 'Advantage on INT, WIS, and CHA saves against magic.', icon: 'shield' },
    ],
    subraces: [
      { id: 'rock-gnome', name: 'Artificer Rock Gnome', subtitle: 'Clockwork devices and alchemical lore', portraitUrl: '/assets/5e-tools/races/PHB/Gnome.webp', source: 'PHB' },
    ],
  },
  {
    id: 'half-elf',
    name: 'Half-Elf',
    tagline: 'Two worlds, one soul.',
    description: 'Walking between Edhellain courts and human cities.',
    source: 'PHB',
    portraitUrl: '/assets/5e-tools/races/PHB/Half-Elf.webp',
    galleryPortraits: [
      '/assets/5e-tools/races/PHB/Half-Elf.webp',
      '/assets/5e-tools/races/EFA/Khoravar.webp',
    ],
    traits: [
      { id: 'he-vers', title: 'Skill Versatility', description: 'Gain proficiency in two skills of your choice.', icon: 'book-open' },
    ],
    subraces: [
      { id: 'edhellain-heir', name: 'Edhellain Borderline', subtitle: 'Diplomacy and forest scouting', portraitUrl: '/assets/5e-tools/races/PHB/Half-Elf.webp', source: 'PHB' },
    ],
  },
  {
    id: 'half-orc',
    name: 'Half-Orc',
    tagline: 'Strength in heritage.',
    description: 'Unyielding frontliners who stand between villages and ruin.',
    source: 'PHB',
    portraitUrl: '/assets/5e-tools/races/PHB/Half-Orc.webp',
    galleryPortraits: [
      '/assets/5e-tools/races/PHB/Half-Orc.webp',
      '/assets/5e-tools/races/XPHB/Orc.webp',
    ],
    traits: [
      { id: 'ho-endurance', title: 'Relentless Endurance', description: 'Drop to 1 HP instead of 0 HP once per long rest.', icon: 'shield' },
      { id: 'ho-savage', title: 'Savage Attacks', description: 'Roll one additional weapon damage die on a melee critical hit.', icon: 'swords' },
    ],
    subraces: [
      { id: 'homestead-vanguard', name: 'Homestead Vanguard', subtitle: 'Guardian of the northern border villages', portraitUrl: '/assets/5e-tools/races/PHB/Half-Orc.webp', source: 'PHB' },
    ],
  },
  {
    id: 'tiefling',
    name: 'Tiefling',
    tagline: 'Marked by otherworldly blood.',
    description: 'Bearers of ancient pact-marks and twilight resonance.',
    source: 'SRD 5.1',
    portraitUrl: '/assets/5e-tools/races/PHB/Tiefling.webp',
    galleryPortraits: [
      '/assets/5e-tools/races/PHB/Tiefling.webp',
      '/assets/5e-tools/races/XPHB/Tiefling.webp',
      '/assets/5e-tools/races/MPMM/Tabaxi.webp',
    ],
    traits: [
      { id: 'tf-legacy', title: 'Otherworldly Legacy', description: 'Innate spellcasting and resistance to fire or shadow.', icon: 'zap' },
    ],
    subraces: [
      { id: 'catfolk-truthwatcher', name: 'Catfolk Truth-Watcher (Homebrew)', subtitle: 'Seeker of hidden truth and drake bond', portraitUrl: '/assets/5e-tools/races/MPMM/Tabaxi.webp', source: 'Homebrew' },
    ],
  },
];
