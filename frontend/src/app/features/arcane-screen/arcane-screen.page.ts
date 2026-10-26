import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LoomWeaverStoreService } from '../../core/services/loomweaver-store.service';
import {
  LwBadgeComponent,
  LwButtonComponent,
  LwNpcCardComponent,
  LwPanelComponent,
} from '../../shared/ui/public-api';
import { BabylonEffectStageService } from '../effects/engine/babylon-effect-stage.service';
import { ActionRuleVm } from '../effects/engine/effect-timeline.contract';
import { VttCombatService } from './services/vtt-combat.service';

@Component({
  selector: 'lw-arcane-screen-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    LwPanelComponent,
    LwBadgeComponent,
    LwButtonComponent,
    LwNpcCardComponent,
  ],
  templateUrl: './arcane-screen.page.html',
  styleUrl: './arcane-screen.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArcaneScreenPageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('vttCanvas') private vttCanvasRef?: ElementRef<HTMLCanvasElement>;

  readonly store = inject(LoomWeaverStoreService);
  readonly vtt = inject(VttCombatService);
  readonly stage = inject(BabylonEffectStageService);

  readonly sessionNote = signal<string>(
    'Session 14 Live Note: Emrys greets the party near the Cinth chandelier balcony while vampire infiltrators circle the musicians.',
  );

  ngAfterViewInit(): void {
    const canvas = this.vttCanvasRef?.nativeElement;
    if (canvas) {
      this.stage.mountStage(
        canvas,
        this.vtt.tokens(),
        this.vtt.selectedAttackerKey(),
        this.vtt.selectedTargetKey(),
        (clickedKey) => this.selectTarget(clickedKey),
      );
    }
  }

  ngOnDestroy(): void {
    this.stage.dispose();
  }

  selectAttacker(key: string): void {
    this.vtt.selectedAttackerKey.set(key);
    this.stage.syncTokens(this.vtt.tokens(), key, this.vtt.selectedTargetKey());
  }

  selectTarget(key: string): void {
    this.vtt.selectedTargetKey.set(key);
    this.stage.syncTokens(this.vtt.tokens(), this.vtt.selectedAttackerKey(), key);
  }

  fireAction(rule: ActionRuleVm): void {
    const fx = this.vtt.executeActionOnTarget(rule);
    this.stage.syncTokens(
      this.vtt.tokens(),
      this.vtt.selectedAttackerKey(),
      this.vtt.selectedTargetKey(),
    );
    this.stage.playTrajectoryEffect(fx.preset, fx.startPos, fx.endPos);
  }

  nextTurn(): void {
    this.vtt.advanceTurn();
    this.stage.syncTokens(
      this.vtt.tokens(),
      this.vtt.selectedAttackerKey(),
      this.vtt.selectedTargetKey(),
    );
  }
}
