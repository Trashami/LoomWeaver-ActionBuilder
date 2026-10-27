import {
  CharacterSkillVm,
  CreatorBackgroundOptionVm,
  CreatorClassOptionVm,
  SavingThrowVm,
} from './character-studio.models';

export const CREATOR_CLASSES: readonly CreatorClassOptionVm[] = [
  {
    id: 'wizard',
    name: 'Wizard',
    subclassDefault: 'School of Evocation',
    tagline: 'Scholarly arcane mastery and sculpted spellcraft.',
    hitDie: 6,
    primaryAbility: 'INT',
    savingThrows: ['INT', 'WIS'],
    features: [
      { id: 'feat-spellcasting', title: 'Spellcasting', category: 'class', summary: 'Draws on innate magic through study.', icon: 'zap', tone: 'gold' },
      { id: 'feat-arcane-recovery', title: 'Arcane Recovery', category: 'class', summary: 'Recover spell slots during a short rest.', icon: 'clock', tone: 'emerald' },
      { id: 'feat-evocation-savant', title: 'Evocation Savant', category: 'class', summary: 'Add your Int modifier to evocation spell damage.', icon: 'book-open', tone: 'emerald' },
      { id: 'feat-sculpt-spells', title: 'Sculpt Spells', category: 'class', summary: 'Shape destructive magic to spare allies.', icon: 'shield', tone: 'crimson' },
    ],
    startingSpells: [
      {
        groupId: 'cantrips',
        label: 'At Will / Cantrips',
        slotsRemaining: 5,
        slotsMax: 5,
        isCantrip: true,
        spells: [
          { id: 'sp-fire-bolt', name: 'Fire Bolt', school: 'Evocation', icon: 'zap', tone: 'crimson', actionCost: '1 Action', summary: 'Ranged spell attack dealing 2d10 fire damage (120 ft).' },
          { id: 'sp-mage-hand', name: 'Mage Hand', school: 'Conjuration', icon: 'wand', tone: 'emerald', actionCost: '1 Action', summary: 'Spectral floating hand manipulates objects up to 30 ft away.' },
          { id: 'sp-prestidigitation', name: 'Prestidigitation', school: 'Transmutation', icon: 'book-open', tone: 'gold', actionCost: '1 Action', summary: 'Minor arcane trick, sensory effect, or glyph mark.' },
        ],
      },
      {
        groupId: 'level-1',
        label: '1st Level',
        slotsRemaining: 4,
        slotsMax: 4,
        spells: [
          { id: 'sp-magic-missile', name: 'Magic Missile', school: 'Evocation', icon: 'target', tone: 'emerald', actionCost: '1 Action', summary: 'Three glowing darts automatically strike targets for 1d4+1 force each.' },
          { id: 'sp-shield', name: 'Shield', school: 'Abjuration', icon: 'shield', tone: 'gold', actionCost: '1 Reaction', summary: '+5 bonus to AC until the start of your next turn, negating Magic Missile.' },
          { id: 'sp-detect-magic', name: 'Detect Magic', school: 'Divination', icon: 'eye', tone: 'emerald', actionCost: '1 Action (Ritual)', summary: 'Sense the presence and school of magic within 30 feet.' },
          { id: 'sp-mage-armor', name: 'Mage Armor', school: 'Abjuration', icon: 'shield-check', tone: 'emerald', actionCost: '1 Action', summary: 'Base AC becomes 13 + Dexterity modifier for 8 hours.' },
        ],
      },
      {
        groupId: 'level-2',
        label: '2nd Level',
        slotsRemaining: 3,
        slotsMax: 3,
        spells: [
          { id: 'sp-misty-step', name: 'Misty Step', school: 'Conjuration', icon: 'compass', tone: 'emerald', actionCost: '1 Bonus Action', summary: 'Teleport up to 30 feet to an unoccupied space you can see.' },
          { id: 'sp-scorching-ray', name: 'Scorching Ray', school: 'Evocation', icon: 'zap', tone: 'crimson', actionCost: '1 Action', summary: 'Hurl three rays of fire, each dealing 2d6 fire damage on a hit.' },
          { id: 'sp-invisibility', name: 'Invisibility', school: 'Illusion', icon: 'eye-off', tone: 'neutral', actionCost: '1 Action', summary: 'A creature you touch becomes invisible for up to 1 hour.' },
        ],
      },
      {
        groupId: 'level-3',
        label: '3rd Level',
        slotsRemaining: 2,
        slotsMax: 2,
        spells: [
          { id: 'sp-counterspell', name: 'Counterspell', school: 'Abjuration', icon: 'shield', tone: 'gold', actionCost: '1 Reaction', summary: 'Interrupt a creature in the process of casting a spell.' },
          { id: 'sp-fireball', name: 'Fireball', school: 'Evocation', icon: 'zap', tone: 'crimson', actionCost: '1 Action', summary: '20-ft radius blossom of flame dealing 8d6 fire damage (DEX save).' },
        ],
      },
    ],
  },
  {
    id: 'ranger',
    name: 'Ranger',
    subclassDefault: 'Horizon Walker',
    tagline: 'Pattern scout, archer, and borderland warden.',
    hitDie: 10,
    primaryAbility: 'DEX',
    savingThrows: ['STR', 'DEX'],
    features: [
      { id: 'feat-pattern-scout', title: 'Pattern Danger Sense', category: 'class', summary: 'Reads ambush geometry and hidden hazards before combat erupts.', icon: 'compass', tone: 'emerald' },
      { id: 'feat-extra-attack', title: 'Multiattack Volley', category: 'class', summary: 'Strike twice whenever you take the Attack action on your turn.', icon: 'swords', tone: 'gold' },
    ],
    startingSpells: [
      {
        groupId: 'level-1',
        label: '1st Level',
        slotsRemaining: 4,
        slotsMax: 4,
        spells: [
          { id: 'sp-hunters-mark', name: "Hunter's Mark", school: 'Divination', icon: 'target', tone: 'gold', actionCost: '1 Bonus Action', summary: 'Deal an extra 1d6 damage to the marked quarry on every weapon hit.' },
          { id: 'sp-ensnaring-strike', name: 'Ensnaring Strike', school: 'Conjuration', icon: 'link', tone: 'emerald', actionCost: '1 Bonus Action', summary: 'Thorny vines restrain the target on hit.' },
        ],
      },
    ],
  },
  {
    id: 'rogue',
    name: 'Rogue',
    subclassDefault: 'Fey Trickster',
    tagline: 'Precision strikes, uncanny evasion, and sideways fey logic.',
    hitDie: 8,
    primaryAbility: 'DEX',
    savingThrows: ['DEX', 'INT'],
    features: [
      { id: 'feat-sneak-attack', title: 'Fey Slingshot Sneak Attack', category: 'class', summary: 'Exploit a foe distraction to deal +4d6 precision damage.', icon: 'target', tone: 'crimson' },
      { id: 'feat-cunning-action', title: 'Cunning Action', category: 'class', summary: 'Dash, Disengage, or Hide as a Bonus Action.', icon: 'compass', tone: 'emerald' },
    ],
    startingSpells: [
      {
        groupId: 'cantrips',
        label: 'At Will / Cantrips',
        slotsRemaining: 3,
        slotsMax: 3,
        isCantrip: true,
        spells: [
          { id: 'sp-minor-illusion', name: 'Minor Illusion', school: 'Illusion', icon: 'eye', tone: 'gold', actionCost: '1 Action', summary: 'Create a sound or image of an object within range for 1 minute.' },
        ],
      },
    ],
  },
  {
    id: 'artificer',
    name: 'Artificer',
    subclassDefault: 'Cinth Clockwork Savant',
    tagline: 'Mechanical and runic answers to unchecked magical power.',
    hitDie: 8,
    primaryAbility: 'INT',
    savingThrows: ['CON', 'INT'],
    features: [
      { id: 'feat-infuse-item', title: 'Cinth Guild Infusions', category: 'class', summary: 'Imbue mundane gear with phosphor-bronze condensers and runic wards.', icon: 'settings', tone: 'gold' },
    ],
    startingSpells: [
      {
        groupId: 'cantrips',
        label: 'At Will / Cantrips',
        slotsRemaining: 3,
        slotsMax: 3,
        isCantrip: true,
        spells: [
          { id: 'sp-mending', name: 'Mending', school: 'Transmutation', icon: 'settings', tone: 'emerald', actionCost: '1 Minute', summary: 'Repairs a single break or tear in an object or construct.' },
        ],
      },
    ],
  },
  {
    id: 'fighter',
    name: 'Fighter',
    subclassDefault: 'Frontline Champion',
    tagline: 'Unbreakable martial discipline and physical courage.',
    hitDie: 10,
    primaryAbility: 'STR',
    savingThrows: ['STR', 'CON'],
    features: [
      { id: 'feat-action-surge', title: 'Action Surge', category: 'class', summary: 'Push beyond normal limits to take one additional action on your turn.', icon: 'zap', tone: 'gold' },
      { id: 'feat-second-wind', title: 'Second Wind', category: 'class', summary: 'Regain 1d10 + Fighter level HP as a bonus action.', icon: 'shield', tone: 'emerald' },
    ],
    startingSpells: [],
  },
];

export const CREATOR_BACKGROUNDS: readonly CreatorBackgroundOptionVm[] = [
  {
    id: 'sage',
    name: 'Sage',
    tagline: 'Arcane Scholar · Member of the Circle',
    summary: 'Your character has spent years in study, poring over ancient texts and seeking forgotten knowledge.',
    skillProficiencies: ['Arcana', 'History'],
    defaultQuote: '"Knowledge preserves what time would otherwise forget."',
    personality: {
      personality: 'Thoughtful, curious, and precise.',
      ideals: 'Knowledge should be preserved and shared.',
      bonds: 'The lost library of Cinth.',
      flaws: 'Can be overly cautious when others act rashly.',
    },
  },
  {
    id: 'outlander',
    name: 'Edhellain Exile',
    tagline: 'Borderland Wayfinder · Unclaimed Lineage',
    summary: 'Raised on the old roads and taught to live within the world rather than rule above it.',
    skillProficiencies: ['Perception', 'Survival'],
    defaultQuote: '"The road remembers who walked it before the banners fell."',
    personality: {
      personality: 'Watchful, measured, and quietly protective of the party.',
      ideals: 'Duty is proven in who you shelter, not the crown you claim.',
      bonds: 'The cliffside house near Vandia and the missing pages of Edhellain.',
      flaws: 'Carries every ambush as a personal failure of foresight.',
    },
  },
  {
    id: 'artificer-guild',
    name: 'Cinth Artificers Guild',
    tagline: 'Post-Moonlight Wars Craftsperson',
    summary: 'Trained in Cinth workshops where non-magical craft answers wizardry and ancient monsters alike.',
    skillProficiencies: ['Investigation', 'Sleight of Hand'],
    defaultQuote: '"If a god left a trap in the bedrock, bring a bigger wrench."',
    personality: {
      personality: 'Pragmatic, inventive, and skeptical of Council decrees.',
      ideals: 'Craft and intellect belong to everyone, not just the high towers.',
      bonds: 'The workshops of Cinth and Captain Kutler skyship schematics.',
      flaws: 'Cannot resist dismantling a dangerous relic to see how it ticks.',
    },
  },
];

export function buildSavingThrows(
  abilities: readonly { code: SavingThrowVm['code']; label: string; modifier: number }[],
  profBonus: number,
  proficientCodes: readonly SavingThrowVm['code'][],
): readonly SavingThrowVm[] {
  return abilities.map((a) => {
    const proficient = proficientCodes.includes(a.code);
    return {
      code: a.code,
      label: a.label,
      proficient,
      bonus: a.modifier + (proficient ? profBonus : 0),
    };
  });
}

export function buildSkillsList(
  abilities: readonly { code: SavingThrowVm['code']; modifier: number }[],
  profBonus: number,
  proficientSkills: readonly string[],
): readonly CharacterSkillVm[] {
  const modOf = (code: SavingThrowVm['code']) =>
    abilities.find((a) => a.code === code)?.modifier ?? 0;
  const defs: readonly { id: string; label: string; code: SavingThrowVm['code'] }[] = [
    { id: 'acrobatics', label: 'Acrobatics', code: 'DEX' },
    { id: 'arcana', label: 'Arcana', code: 'INT' },
    { id: 'athletics', label: 'Athletics', code: 'STR' },
    { id: 'deception', label: 'Deception', code: 'CHA' },
    { id: 'history', label: 'History', code: 'INT' },
    { id: 'insight', label: 'Insight', code: 'WIS' },
    { id: 'investigation', label: 'Investigation', code: 'INT' },
    { id: 'medicine', label: 'Medicine', code: 'WIS' },
    { id: 'nature', label: 'Nature', code: 'INT' },
    { id: 'perception', label: 'Perception', code: 'WIS' },
    { id: 'persuasion', label: 'Persuasion', code: 'CHA' },
    { id: 'sleight-of-hand', label: 'Sleight of Hand', code: 'DEX' },
    { id: 'stealth', label: 'Stealth', code: 'DEX' },
    { id: 'survival', label: 'Survival', code: 'WIS' },
  ];
  return defs.map((d) => {
    const proficient = proficientSkills.some(
      (s) => s.toLowerCase() === d.label.toLowerCase() || s.toLowerCase() === d.id,
    );
    return {
      id: d.id,
      label: d.label,
      abilityCode: d.code,
      proficient,
      bonus: modOf(d.code) + (proficient ? profBonus : 0),
    };
  });
}
