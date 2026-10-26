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
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LoomWeaverStoreService } from '../../core/services/loomweaver-store.service';
import {
  LwAssetCardComponent,
  LwBadgeComponent,
  LwButtonComponent,
  LwPanelComponent,
  LwRulesOptionSelectorComponent,
  RulesOptionItem,
} from '../../shared/ui/public-api';
import { VttCombatService } from '../arcane-screen/services/vtt-combat.service';
import { BabylonEffectStageService } from './engine/babylon-effect-stage.service';
import {
  ActionRuleVm,
  EffectTimelinePresetVm,
} from './engine/effect-timeline.contract';

@Component({
  selector: 'lw-effects-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    LwPanelComponent,
    LwBadgeComponent,
    LwButtonComponent,
    LwAssetCardComponent,
    LwRulesOptionSelectorComponent,
  ],
  templateUrl: './effects.page.html',
  styleUrl: './effects.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EffectsPageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('effectCanvas') private effectCanvasRef?: ElementRef<HTMLCanvasElement>;

  readonly store = inject(LoomWeaverStoreService);
  readonly vtt = inject(VttCombatService);
  readonly stage = inject(BabylonEffectStageService);

  readonly selectedEffectId = signal<string>('fx-projectile-arc');
  readonly newActionName = signal<string>('Cinth Clockwork Arc Discharge');
  readonly newActionCost = signal<ActionRuleVm['actionCost']>('1 Action');
  readonly newActionRange = signal<number>(45);
  readonly newActionWhen = signal<string>('WHEN: Artificer Capacitor Overcharge Activated');
  readonly newActionIf = signal<string>('IF: Target within 45ft & Attack Roll >= AC');
  readonly newActionThen = signal<string>('THEN: Deal 3d10 + 4 Lightning & Apply Shocked');
  readonly newActionFormula = signal<string>('3d10 + 4');

  readonly trajectoryOptions = computed<readonly RulesOptionItem[]>(() =>
    this.vtt.effectPresets().map((p) => ({
      id: p.id,
      label: p.name,
      subtitle: `Trajectory: ${p.trajectoryType.toUpperCase()} · ${p.particleCount} Particles · ${p.durationMs}ms`,
      badge: p.trajectoryType.toUpperCase(),
      badgeTone: 'gold' as const,
    })),
  );

  readonly activeEffectPreset = computed<EffectTimelinePresetVm>(
    () =>
      this.vtt.effectPresets().find((p) => p.id === this.selectedEffectId()) ??
      this.vtt.effectPresets()[0],
  );

  readonly spellAssets = computed(() =>
    this.store.assets().filter((a) => a.category === 'Spell FX'),
  );

  ngAfterViewInit(): void {
    const canvas = this.effectCanvasRef?.nativeElement;
    if (canvas) {
      this.stage.mountStage(
        canvas,
        this.vtt.tokens().slice(0, 3),
        '1:Character:char-fivi',
        '1:Encounter:vamp-1',
      );
      this.previewEffect(this.activeEffectPreset());
    }
  }

  ngOnDestroy(): void {
    this.stage.dispose();
  }

  onSelectEffect(effectId: string): void {
    this.selectedEffectId.set(effectId);
    const found = this.vtt.effectPresets().find((p) => p.id === effectId);
    if (found) {
      this.previewEffect(found);
    }
  }

  previewEffect(preset: EffectTimelinePresetVm): void {
    this.stage.playTrajectoryEffect(preset, { x: -4, z: -5 }, { x: 5, z: 2 });
  }

  previewRule(rule: ActionRuleVm): void {
    this.selectedEffectId.set(rule.linkedEffectPresetId);
    this.previewEffect(this.activeEffectPreset());
  }

  toggleReducedMotion(): void {
    this.stage.reducedMotion.update((v) => !v);
  }

  saveNewActionRule(): void {
    this.vtt.addCustomActionRule(
      this.newActionName(),
      'Homebrew Action / Spell',
      this.newActionCost(),
      this.newActionRange(),
      this.newActionWhen(),
      this.newActionIf(),
      this.newActionThen(),
      this.newActionFormula(),
      this.selectedEffectId(),
      this.store.viewerRole() === 'gm',
    );
    this.previewEffect(this.activeEffectPreset());
  }
}
