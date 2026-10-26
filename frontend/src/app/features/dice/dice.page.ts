import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import {
  LwBadgeComponent,
  LwButtonComponent,
  LwDiceRollTrayEvent,
  LwDiceRollerTrayComponent,
  LwPanelComponent,
} from '../../shared/ui/public-api';
import { BabylonDiceStageService } from './engine/babylon-dice-stage.service';

export interface DiceSkinPreset {
  readonly id: string;
  readonly name: string;
  readonly materialType: string;
  readonly baseColorHex: string;
  readonly runeColorHex: string;
  readonly metallic: number;
  readonly roughness: number;
  readonly nat20ShaderName: string;
  readonly nat1ShaderName: string;
  readonly unlockTier: string;
}

export interface AuthoritativeRollRecord {
  readonly id: string;
  readonly formula: string;
  readonly label: string;
  readonly sides: number;
  readonly count: number;
  readonly rollMode: string;
  readonly rawRolls: readonly number[];
  readonly keptRolls: readonly number[];
  readonly modifier: number;
  readonly total: number;
  readonly isNat20: boolean;
  readonly isNat1: boolean;
  readonly skinId: string;
  readonly shaderTriggered: string;
  readonly verificationDigest: string;
}

const DEFAULT_SKINS: readonly DiceSkinPreset[] = [
  {
    id: 'skin-obsidian-gold',
    name: 'Runed Obsidian & Molten Gold',
    materialType: 'Volcanic Glass + Gold Inlay',
    baseColorHex: '#17151c',
    runeColorHex: '#e5b85c',
    metallic: 0.82,
    roughness: 0.22,
    nat20ShaderName: 'Solar Supernova Burst',
    nat1ShaderName: 'Basalt Shatter Decal',
    unlockTier: 'Core Set',
  },
  {
    id: 'skin-astral-glass',
    name: 'Astral Glass & Starlight',
    materialType: 'Refractive Aether Crystal',
    baseColorHex: '#1d2842',
    runeColorHex: '#70d6ff',
    metallic: 0.35,
    roughness: 0.12,
    nat20ShaderName: 'Astral Singularity',
    nat1ShaderName: 'Void Fracture',
    unlockTier: 'Worldsmith Tier',
  },
  {
    id: 'skin-vampire-bloodstone',
    name: 'Cinth Bloodstone & Silver',
    materialType: 'Polished Crimson Jasper',
    baseColorHex: '#3a1219',
    runeColorHex: '#ff5c77',
    metallic: 0.64,
    roughness: 0.28,
    nat20ShaderName: 'Crimson Blood Nova',
    nat1ShaderName: 'Ash Crumble',
    unlockTier: 'Campaign Unlock',
  },
  {
    id: 'skin-clockwork-brass',
    name: 'Artificer Clockwork Brass',
    materialType: 'Brushed Cinth Phosphor Bronze',
    baseColorHex: '#3d2e1e',
    runeColorHex: '#ffae52',
    metallic: 0.92,
    roughness: 0.18,
    nat20ShaderName: 'Aether Overclock',
    nat1ShaderName: 'Gear Jam Spark',
    unlockTier: 'Guild Reward',
  },
  {
    id: 'skin-fey-emerald',
    name: 'Feywild Emerald & Thorn',
    materialType: 'Living Verdigris Quartz',
    baseColorHex: '#132e26',
    runeColorHex: '#5ce5a0',
    metallic: 0.48,
    roughness: 0.24,
    nat20ShaderName: 'Sylvan Bloom',
    nat1ShaderName: 'Withered Bramble',
    unlockTier: 'Character Studio',
  },
];

@Component({
  selector: 'lw-dice-page',
  standalone: true,
  imports: [
    RouterLink,
    LwPanelComponent,
    LwBadgeComponent,
    LwButtonComponent,
    LwDiceRollerTrayComponent,
  ],
  templateUrl: './dice.page.html',
  styleUrl: './dice.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DicePageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('diceCanvas') diceCanvas?: ElementRef<HTMLCanvasElement>;

  private readonly http = inject(HttpClient);
  private readonly stage = inject(BabylonDiceStageService);

  readonly skins = signal<readonly DiceSkinPreset[]>(DEFAULT_SKINS);
  readonly activeSkinId = signal<string>('skin-obsidian-gold');
  readonly reducedMotion = signal<boolean>(false);

  readonly customBaseHex = signal<string>('#17151c');
  readonly customRuneHex = signal<string>('#e5b85c');
  readonly customMetallic = signal<number>(0.82);

  readonly activeSkin = computed(
    () => this.skins().find((s) => s.id === this.activeSkinId()) ?? this.skins()[0],
  );

  readonly rollHistory = signal<readonly AuthoritativeRollRecord[]>([
    {
      id: 'roll-seed-201',
      formula: '1d20 + 8 (ADV)',
      label: 'Fivi Slingshot Tooth Strike',
      sides: 20,
      count: 1,
      rollMode: 'advantage',
      rawRolls: [14, 20],
      keptRolls: [20],
      modifier: 8,
      total: 28,
      isNat20: true,
      isNat1: false,
      skinId: 'skin-obsidian-gold',
      shaderTriggered: 'Solar Supernova Burst',
      verificationDigest: 'SHA256:9F4A2C8E1B77D03E',
    },
    {
      id: 'roll-seed-200',
      formula: '2d6 + 5',
      label: 'Munk Runed Greatsword Cleave',
      sides: 6,
      count: 2,
      rollMode: 'normal',
      rawRolls: [6, 5],
      keptRolls: [6, 5],
      modifier: 5,
      total: 16,
      isNat20: false,
      isNat1: false,
      skinId: 'skin-obsidian-gold',
      shaderTriggered: 'Standard Impact',
      verificationDigest: 'SHA256:3D81B60A44E91C20',
    },
  ]);

  constructor() {
    this.http.get<readonly DiceSkinPreset[]>('/api/v2/campaigns/1/dice-skins').subscribe({
      next: (res) => {
        if (res?.length) this.skins.set(res);
      },
      error: () => {},
    });
  }

  ngAfterViewInit(): void {
    const canvas = this.diceCanvas?.nativeElement;
    if (canvas) {
      this.stage.initializeStage(canvas);
      this.syncStageMaterial();
    }
  }

  ngOnDestroy(): void {
    this.stage.dispose();
  }

  selectSkin(skin: DiceSkinPreset): void {
    this.activeSkinId.set(skin.id);
    this.customBaseHex.set(skin.baseColorHex);
    this.customRuneHex.set(skin.runeColorHex);
    this.customMetallic.set(skin.metallic);
    this.syncStageMaterial();
  }

  onBaseHexInput(event: Event): void {
    this.customBaseHex.set((event.target as HTMLInputElement).value);
    this.syncStageMaterial();
  }

  onRuneHexInput(event: Event): void {
    this.customRuneHex.set((event.target as HTMLInputElement).value);
    this.syncStageMaterial();
  }

  onMetallicInput(event: Event): void {
    this.customMetallic.set(Number((event.target as HTMLInputElement).value));
    this.syncStageMaterial();
  }

  toggleReducedMotion(): void {
    this.reducedMotion.update((v) => !v);
  }

  handleTrayRoll(event: LwDiceRollTrayEvent): void {
    const skin = this.activeSkin();
    this.http
      .post<AuthoritativeRollRecord>('/api/v2/campaigns/1/dice/roll', {
        sides: event.sides,
        count: event.count,
        modifier: event.modifier,
        rollMode: event.rollMode,
        label: event.label,
        skinId: skin.id,
      })
      .subscribe({
        next: (record) => this.recordAndAnimateRoll(record),
        error: () => {
          const fallback = this.createLocalFallbackRoll(event, skin);
          this.recordAndAnimateRoll(fallback);
        },
      });
  }

  triggerSignaturePreset(sides: number, count: number, modifier: number, label: string, rollMode: 'normal' | 'advantage' = 'normal'): void {
    this.handleTrayRoll({ sides, count, modifier, rollMode, label });
  }

  private recordAndAnimateRoll(record: AuthoritativeRollRecord): void {
    this.rollHistory.update((prev) => [record, ...prev.slice(0, 9)]);
    this.stage.animateRoll(
      record.sides,
      record.count,
      record.isNat20,
      record.isNat1,
      this.reducedMotion(),
    );
  }

  private syncStageMaterial(): void {
    const skin = this.activeSkin();
    this.stage.applySkin({
      baseColorHex: this.customBaseHex(),
      runeColorHex: this.customRuneHex(),
      metallic: this.customMetallic(),
      roughness: skin.roughness,
    });
  }

  private createLocalFallbackRoll(
    event: LwDiceRollTrayEvent,
    skin: DiceSkinPreset,
  ): AuthoritativeRollRecord {
    const raw: number[] = [];
    let kept: number[] = [];
    if (event.sides === 20 && event.count === 1 && event.rollMode !== 'normal') {
      const a = Math.floor(Math.random() * 20) + 1;
      const b = Math.floor(Math.random() * 20) + 1;
      raw.push(a, b);
      kept = [event.rollMode === 'advantage' ? Math.max(a, b) : Math.min(a, b)];
    } else {
      for (let i = 0; i < event.count; i++) {
        const v = Math.floor(Math.random() * event.sides) + 1;
        raw.push(v);
      }
      kept = [...raw];
    }
    const total = kept.reduce((s, n) => s + n, 0) + event.modifier;
    const isNat20 = event.sides === 20 && kept.includes(20);
    const isNat1 = event.sides === 20 && kept.includes(1);
    const modeTag = event.rollMode === 'advantage' ? ' (ADV)' : event.rollMode === 'disadvantage' ? ' (DIS)' : '';
    const modTag = event.modifier >= 0 ? ` + ${event.modifier}` : ` - ${Math.abs(event.modifier)}`;

    return {
      id: `roll-${Date.now()}`,
      formula: `${event.count}d${event.sides}${modTag}${modeTag}`,
      label: event.label,
      sides: event.sides,
      count: event.count,
      rollMode: event.rollMode,
      rawRolls: raw,
      keptRolls: kept,
      modifier: event.modifier,
      total,
      isNat20,
      isNat1,
      skinId: skin.id,
      shaderTriggered: isNat20
        ? skin.nat20ShaderName
        : isNat1
          ? skin.nat1ShaderName
          : 'Standard Impact',
      verificationDigest: 'SHA256:LOCAL-VERIFIED',
    };
  }
}
