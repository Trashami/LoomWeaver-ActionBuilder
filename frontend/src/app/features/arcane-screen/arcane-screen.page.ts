import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, HostListener,
  OnDestroy, ViewChild, computed, effect, inject, signal, untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { NgpButton } from 'ng-primitives/button';
import { AdventureGuideService } from '../../core/services/adventure-guide.service';
import { LoomWeaverStoreService } from '../../core/services/loomweaver-store.service';
import { VttReturnRouteService } from '../../core/services/vtt-return-route.service';
import {
  LwButtonComponent,
  LwContextSwitcherComponent,
  LwContextSwitcherOption,
} from '../../shared/ui/public-api';
import { LwIconComponent } from '../../shared/ui/icon/icon.component';
import { WebAudioAmbienceService } from '../assets/engine/web-audio-ambience.service';
import { FullscreenDiceOverlayService } from '../dice/engine/fullscreen-dice-overlay.service';
import { BabylonEffectStageService } from '../effects/engine/babylon-effect-stage.service';
import { getDndSizeScale, getTokenBaseColorHex, VttTokenVm } from '../effects/engine/effect-timeline.contract';
import {
  BASE_GRID_CELL_SVG_PX, feetToSvgPx, svgToWorldPoint, worldToSvgX, worldToSvgY,
} from './engine/vtt-los-and-grid.engine';
import { VttRightTabId, VttTacticalAbilityVm } from './models/vtt-battle.models';
import { VttActionDockComponent } from './components/vtt-action-dock/vtt-action-dock.component';
import { toDockAction, toDockToken } from './components/vtt-action-dock/vtt-action-dock.adapter';
import type { DockAction, DockToken } from './components/vtt-action-dock/vtt-action-dock.models';
import { VttDmDrawersComponent } from './components/vtt-dm-drawers/vtt-dm-drawers.component';
import { VttGmGuidePanelComponent } from './components/vtt-gm/vtt-gm-guide-panel.component';
import { VttGmRailComponent } from './components/vtt-gm/vtt-gm-rail.component';
import { VttGmTrackersPanelComponent } from './components/vtt-gm/vtt-gm-trackers-panel.component';
import { VttHandoutModalComponent } from './components/vtt-handout-modal/vtt-handout-modal.component';
import { VttMapToolsComponent } from './components/vtt-map-tools/vtt-map-tools.component';
import { VttSettingsModalComponent } from './components/vtt-settings-modal/vtt-settings-modal.component';
import { VttSettingsPanelComponent } from './components/vtt-settings-panel/vtt-settings-panel.component';
import { VttBattleStateService } from './services/vtt-battle-state.service';
import { VttCombatService } from './services/vtt-combat.service';
import { VttDisplaySettingsService } from './services/vtt-display-settings.service';
import { VttEncounterTimerService } from './services/vtt-encounter-timer.service';
import { VttFogService } from './services/vtt-fog.service';
import { VttHandoutService } from './services/vtt-handout.service';
import { VttMapView2dService } from './services/vtt-map-view-2d.service';
import { VttServerSyncService } from './services/vtt-server-sync.service';

@Component({
  selector: 'lw-arcane-screen-page',
  standalone: true,
  imports: [
    FormsModule, NgpButton, LwButtonComponent, LwContextSwitcherComponent, LwIconComponent, VttActionDockComponent,
    VttGmRailComponent, VttGmGuidePanelComponent, VttGmTrackersPanelComponent,
    VttSettingsModalComponent, VttDmDrawersComponent, VttMapToolsComponent,
    VttSettingsPanelComponent, VttHandoutModalComponent,
  ],
  templateUrl: './arcane-screen.page.html',
  styleUrl: './arcane-screen.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArcaneScreenPageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('vttCanvas') private vttCanvasRef?: ElementRef<HTMLCanvasElement>;
  @ViewChild('battleSvg') private battleSvgRef?: ElementRef<SVGSVGElement>;

  readonly store = inject(LoomWeaverStoreService);
  readonly vtt = inject(VttCombatService);
  readonly adventureGuide = inject(AdventureGuideService);
  private readonly route = inject(ActivatedRoute);
  readonly battle = inject(VttBattleStateService);
  readonly fog = inject(VttFogService);
  readonly stage = inject(BabylonEffectStageService);
  readonly audio = inject(WebAudioAmbienceService);
  readonly fullscreenDice = inject(FullscreenDiceOverlayService);
  private readonly router = inject(Router);
  readonly view2d = inject(VttMapView2dService);
  readonly serverSync = inject(VttServerSyncService);
  readonly vttReturn = inject(VttReturnRouteService);
  readonly vttDisplay = inject(VttDisplaySettingsService);
  readonly timer = inject(VttEncounterTimerService);
  readonly handouts = inject(VttHandoutService);
  readonly showShortcuts = signal<boolean>(false);

  private lastLoadedSceneKey = '';
  private stageMounted = false;
  private dragMoved = false;

  readonly gridEnabled = signal<boolean>(false);
  readonly gmRailOpen = signal<boolean>(false);
  readonly selectedDiceFormula = signal<string>('1d20');
  readonly dmToolReadout = signal<string>('');
  readonly quickAddMonsterId = signal<string>('creat-goblin-scout-a');
  readonly quickAddNpcName = signal<string>('');
  readonly quickAddNpcTitle = signal<string>('');
  readonly quickAddNpcScope = signal<'Encounter' | 'Region'>('Encounter');
  readonly quickAddNpcDisposition = signal<'Friendly' | 'Neutral' | 'Deceptive' | 'Hostile'>('Friendly');
  readonly chatDraft = signal<string>('');
  readonly chatWhisperGmOnly = signal<boolean>(false);

  readonly calibBox = signal<{ x: number; y: number; w: number; h: number } | null>(null);
  private calibStartClient: { x: number; y: number; localX: number; localY: number } | null = null;

  readonly activeBattlemapBackdropUrl = computed(() => {
    const bmap = this.adventureGuide.guide().assignedBattlemap;
    const art = bmap?.artworkUrl?.trim();
    if (art && art.length > 0 && !art.includes('showcase')) return this.vttDisplay.backdropUrl(art);
    const encArt = this.vtt.activeLiveEncounter()?.thumbnailUrl?.trim();
    if (encArt && encArt.length > 0 && !encArt.includes('showcase')) return this.vttDisplay.backdropUrl(encArt);
    return '';
  });

  readonly hasConfiguredMap = computed(() => {
    const bmap = this.adventureGuide.guide().assignedBattlemap;
    const art = this.activeBattlemapBackdropUrl();
    const sceneKey = bmap?.sceneKey?.trim();
    return !!(art || (sceneKey && sceneKey.length > 0));
  });

  readonly isHighPerformance2d = computed(
    () =>
      !this.battle.mapMode3D() &&
      !this.stage.has3dSceneLoaded() &&
      this.vttDisplay.mapQuality() === 'performance',
  );

  readonly activeSessionTitle = computed(() => {
    const activeId = this.store.activeSessionId();
    const sess = this.store.sessions().find((s) => s.sessionId === activeId);
    return sess
      ? `Session ${sess.sessionNumber} · ${sess.title}`
      : this.adventureGuide.guide().headerTitle || 'Current Session';
  });

  readonly sessionSwitcherOptions = computed<LwContextSwitcherOption[]>(() => {
    const activeId = this.store.activeSessionId();
    return this.store.sessions().map((session) => {
      const isSelected = session.sessionId === activeId;
      const isCurrent = session.status === 'upcoming';
      return {
        id: session.sessionId,
        title: `Session ${session.sessionNumber} — ${session.title}`,
        subtitle: `${this.store.formatSessionLocationLabel(session.locationLabel, session.title)} · ${
          isCurrent ? 'Current / Upcoming' : `Session ${session.sessionNumber}`
        }`,
        badgeLabel: isSelected ? 'SELECTED' : isCurrent ? 'CURRENT' : 'Switch',
        badgeTone: isSelected ? 'emerald' : isCurrent ? 'gold' : 'neutral',
        active: isSelected,
      };
    });
  });

  onSwitchVttSession(sessionId: string): void {
    this.store.setActiveSession(sessionId);
  }

  readonly activeBattlemapTitle = computed(
    () => this.adventureGuide.guide().assignedBattlemap?.title || this.vtt.activeLiveEncounter()?.name || 'Battlefield',
  );

  readonly zoomLevel = computed(() => (!this.isHighPerformance2d() ? this.stage.zoomPercent() : this.view2d.zoom()));
  readonly toSvgX = worldToSvgX;
  readonly toSvgY = worldToSvgY;
  readonly toSvgPx = feetToSvgPx;

  readonly gridVerticalLines = computed(() => {
    const step = Math.max(12.5, Math.round(BASE_GRID_CELL_SVG_PX * this.vttDisplay.gridScale() * 10) / 10);
    const offset = ((this.vttDisplay.gridOffsetX() % step) + step) % step;
    const lines: number[] = [];
    for (let x = offset; x <= 1200; x += step) lines.push(Math.round(x * 10) / 10);
    return lines;
  });

  readonly gridHorizontalLines = computed(() => {
    const step = Math.max(12.5, Math.round(BASE_GRID_CELL_SVG_PX * this.vttDisplay.gridScale() * 10) / 10);
    const offset = ((this.vttDisplay.gridOffsetY() % step) + step) % step;
    const lines: number[] = [];
    for (let y = offset; y <= 800; y += step) lines.push(Math.round(y * 10) / 10);
    return lines;
  });

  readonly isObserverActiveTurn = computed(
    () => this.battle.activeInitiativeToken()?.key === this.battle.activeObserverToken()?.key,
  );
  readonly dockHp = (token: DockToken): number => token.hp ?? 0;
  readonly dockAc = (token: DockToken): number => token.armorClass ?? 10;
  readonly dockActiveToken = computed<DockToken>(() => toDockToken(this.battle.activeObserverToken(), this.vtt.tokens()));
  readonly dockTokenActions = computed<readonly DockAction[]>(() => this.battle.tacticalAbilities().map(toDockAction));
  readonly dockInitiativeTokenId = computed<number>(() => toDockToken(this.battle.activeInitiativeToken(), this.vtt.tokens()).id);

  constructor() {
    effect(() => {
      if (!this.hasConfiguredMap()) {
        if (this.stageMounted) {
          this.stageMounted = false;
          this.stage.dispose();
        }
        return;
      }
      setTimeout(() => this.mountStageIfReady(), 50);
    });
    effect(() => {
      if (!this.hasConfiguredMap()) return;
      this.vtt.tokens();
      this.fog.layer();
      untracked(() => this.sync3dStage());
    });
    effect(() => {
      if (!this.hasConfiguredMap()) return;
      const is3d = this.battle.mapMode3D();
      const isPerf = this.isHighPerformance2d();
      untracked(() => { if (!isPerf) this.stage.setForcedTopDown(!is3d); });
    });
    effect(() => {
      if (!this.hasConfiguredMap()) return;
      const url = this.activeBattlemapBackdropUrl();
      const visible = this.gridEnabled();
      const scale = this.vttDisplay.gridScale();
      const offX = this.vttDisplay.gridOffsetX();
      const offY = this.vttDisplay.gridOffsetY();
      const sceneResp = this.serverSync.activeSceneResponse();
      untracked(() => {
        this.stage.loadMapScene(sceneResp?.sceneDataJson, url);
        this.stage.setGridVisible(visible, scale, offX, offY);
        this.sync3dStage();
      });
    });
    effect(() => {
      if (!this.hasConfiguredMap()) return;
      const sceneFromQuery = this.route.snapshot.queryParamMap.get('scene');
      const assignedScene = this.adventureGuide.guide().assignedBattlemap?.sceneKey;
      const targetScene = sceneFromQuery || assignedScene || '';
      const title = this.activeBattlemapTitle();
      const artUrl = this.activeBattlemapBackdropUrl();
      const loadKey = `${targetScene}:${title}:${artUrl}`;
      if (loadKey !== this.lastLoadedSceneKey) {
        this.lastLoadedSceneKey = loadKey;
        untracked(() => void this.serverSync.loadScene(targetScene, title, artUrl));
      }
    });
    this.stage.tokenDropped.pipe(takeUntilDestroyed()).subscribe((p) => {
      this.vtt.applyRemoteTokenMove(p.key, p.x, p.z);
      this.sync3dStage();
      void this.serverSync.publishMove(p.key, p.x, p.z);
    });
    effect(() => {
      const cue = this.vtt.remoteEffectCue();
      if (cue) untracked(() => this.stage.playTrajectoryEffect(cue.preset, cue.startPos, cue.endPos));
    });
  }

  openMapStudio(): void { void this.router.navigate(['/maps']); }
  onMapWheel(event: WheelEvent): void {
    event.preventDefault();
    if (!this.isHighPerformance2d()) this.stage.zoomCamera(event.deltaY * 0.05);
    else this.view2d.wheel(event.deltaY);
  }
  onMapMouseDown(event: MouseEvent): void { if (this.isHighPerformance2d()) this.view2d.start(event); }
  onMapMouseMove(event: MouseEvent): void { if (this.isHighPerformance2d()) this.view2d.move(event); }
  onMapMouseUp(): void { if (this.isHighPerformance2d()) this.view2d.end(); }
  changeZoom(amount: number): void {
    if (!this.isHighPerformance2d()) this.stage.zoomCamera(-amount * 0.4);
    else this.view2d.zoomBy(amount);
  }
  resetZoom(): void {
    if (!this.isHighPerformance2d()) this.stage.resetCamera();
    else this.view2d.reset();
  }

  getTokenBaseFill(token: VttTokenVm): string { return getTokenBaseColorHex(token); }
  getTokenBaseStroke(token: VttTokenVm): string {
    if (this.battle.isTokenTargetedWithReticle(token.key)) return '#991b1b';
    if (this.battle.activeInitiativeToken().key === token.key) return '#c9a66b';
    return '#26302c';
  }
  getTokenRadius2D(token: VttTokenVm): number {
    return Math.max(8, Math.round(20 * this.vttDisplay.gridScale() * getDndSizeScale(token.sizeCategory)));
  }
  getTokenAvatarRadius2D(token: VttTokenVm): number {
    return Math.max(6, Math.round(18 * this.vttDisplay.gridScale() * getDndSizeScale(token.sizeCategory)));
  }

  mountStageIfReady(): void {
    if (this.stageMounted || !this.hasConfiguredMap()) return;
    const canvas = this.vttCanvasRef?.nativeElement;
    if (canvas) {
      this.stageMounted = true;
      this.stage.mountStage(
        canvas, this.vtt.tokens(), this.vtt.selectedAttackerKey(), this.vtt.selectedTargetKey(),
        (k, shiftKey) => {
          const tok = this.vtt.tokens().find((t) => t.key === k);
          if (tok) this.handleTokenSelectionOrCast(tok, shiftKey === true);
        },
      );
      this.stage.setForcedTopDown(!this.battle.mapMode3D());
      this.stage.loadMapScene(
        this.serverSync.activeSceneResponse()?.sceneDataJson,
        this.activeBattlemapBackdropUrl(),
      );
      this.stage.setGridVisible(this.gridEnabled(), this.vttDisplay.gridScale(), this.vttDisplay.gridOffsetX(), this.vttDisplay.gridOffsetY());
      this.sync3dStage();
    }
  }

  ngAfterViewInit(): void {
    if (this.vtt.tokens().length === 0 && this.vtt.encounterDetails().length > 0) {
      this.vtt.launchEncounterIntoVtt(this.vtt.activeEncounterId());
    }
    this.mountStageIfReady();
    this.timer.start();
  }

  ngOnDestroy(): void {
    this.timer.stop();
    this.stage.dispose();
  }

  setMapMode(is3d: boolean): void {
    this.battle.mapMode3D.set(is3d);
    if (!this.isHighPerformance2d()) this.stage.setForcedTopDown(!is3d);
    setTimeout(() => { this.stage.resize(); this.sync3dStage(); }, 50);
  }
  toggleMapMode(): void { this.setMapMode(!this.battle.mapMode3D()); }

  sync3dStage(): void {
    this.stage.syncTokens(
      this.vtt.tokens(), this.vtt.selectedAttackerKey(), this.vtt.selectedTargetKey(),
      this.battle.allReticleTargetKeys(), this.fog.opacityByKey(), this.vttDisplay.gridScale(),
    );
    this.stage.syncFog(this.fog.layer());
  }

  onCalibPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    event.stopPropagation();
    const host = event.currentTarget as HTMLElement;
    const rect = host.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;
    this.calibStartClient = { x: event.clientX, y: event.clientY, localX, localY };
    this.calibBox.set({ x: localX, y: localY, w: 0, h: 0 });
    try { host.setPointerCapture(event.pointerId); } catch {}
  }

  onCalibPointerMove(event: PointerEvent): void {
    if (!this.calibStartClient) return;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const curX = event.clientX - rect.left;
    const curY = event.clientY - rect.top;
    this.calibBox.set({
      x: Math.min(this.calibStartClient.localX, curX),
      y: Math.min(this.calibStartClient.localY, curY),
      w: Math.abs(curX - this.calibStartClient.localX),
      h: Math.abs(curY - this.calibStartClient.localY),
    });
  }

  onCalibPointerUp(event: PointerEvent): void {
    if (!this.calibStartClient) return;
    const start = this.calibStartClient;
    this.calibStartClient = null;
    this.calibBox.set(null);
    if (Math.hypot(event.clientX - start.x, event.clientY - start.y) < 12) return;

    this.gridEnabled.set(true);
    if (!this.isHighPerformance2d()) {
      const p1 = this.stage.pickGroundPoint(start.x, start.y);
      const p2 = this.stage.pickGroundPoint(event.clientX, event.clientY);
      if (p1 && p2) {
        this.vttDisplay.applyDrawnSquareCalibration(worldToSvgX(p1.x), worldToSvgY(p1.z), worldToSvgX(p2.x), worldToSvgY(p2.z));
        return;
      }
    }
    const r = this.battleSvgRef?.nativeElement.getBoundingClientRect();
    if (r && r.width > 0 && r.height > 0) {
      this.vttDisplay.applyDrawnSquareCalibration(
        ((start.x - r.left) / r.width) * 1200, ((start.y - r.top) / r.height) * 800,
        ((event.clientX - r.left) / r.width) * 1200, ((event.clientY - r.top) / r.height) * 800,
      );
    }
  }

  @HostListener('window:keyup', ['$event'])
  onWindowKeyup(event: KeyboardEvent): void { if (event.code === 'Space') this.releaseSpace(); }

  @HostListener('window:blur')
  releaseSpace(): void {
    this.view2d.setSpaceHeld(false);
    this.stage.setRotateHeld(false);
  }

  @HostListener('window:keydown', ['$event'])
  onWindowKeydown(event: KeyboardEvent): void {
    const tag = (event.target as HTMLElement | null)?.tagName?.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      if (event.key === 'Escape') {
        this.battle.cancelAllInteractiveModes();
        this.battle.settingsModalOpen.set(false);
        this.vttDisplay.calibratingGrid.set(false);
      }
      return;
    }
    if (event.code === 'Space' && !event.repeat) {
      event.preventDefault();
      this.view2d.setSpaceHeld(true);
      this.stage.setRotateHeld(true);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      this.battle.cancelAllInteractiveModes();
      this.battle.openDmDrawer.set('none');
      this.battle.settingsModalOpen.set(false);
      this.vttDisplay.calibratingGrid.set(false);
      this.sync3dStage();
    } else if (event.key === 'g' || event.key === 'G') {
      event.preventDefault();
      this.gridEnabled.update((v) => !v);
    } else if (event.key === 't' || event.key === 'T') {
      event.preventDefault();
      this.battle.targetSelectionMode.update((v) => !v);
    } else if (event.key === 'Enter' && this.battle.pendingAbility()) {
      event.preventDefault();
      void this.executePendingAbilityCast();
    }
  }

  onBattleMapPointerMove(event: MouseEvent): void {
    const rect = this.battleSvgRef?.nativeElement.getBoundingClientRect();
    if (!rect || rect.width <= 0 || rect.height <= 0) return;
    const worldPt = svgToWorldPoint(((event.clientX - rect.left) / rect.width) * 1200, ((event.clientY - rect.top) / rect.height) * 800);
    if (this.battle.draggingTokenKey()) {
      this.dragMoved = true;
      this.battle.updateDraggedTokenPosition(worldPt);
      return;
    }
    this.battle.cursorWorldPos.set(worldPt);
  }

  onTokenMouseDown(event: MouseEvent, token: VttTokenVm): void {
    if (event.button !== 0 || this.battle.pendingAbility() || event.shiftKey || this.battle.targetSelectionMode()) return;
    event.stopPropagation();
    this.dragMoved = false;
    const perm = this.battle.beginTokenDrag(token);
    if (!perm.allowed) this.dmToolReadout.set(perm.reason);
  }

  onBattleMapMouseUp(): void {
    if (!this.battle.draggingTokenKey()) return;
    const result = this.battle.endTokenDrag();
    if (result.movedToken && result.distanceFeet > 0) {
      void this.serverSync.publishMove(result.movedToken.key, result.movedToken.x, result.movedToken.z);
      this.sync3dStage();
    }
  }

  onBattleMapClick(_event: MouseEvent): void {
    if (this.view2d.consumeDragClick() || this.dragMoved) { this.dragMoved = false; return; }
    if (this.battle.measureEnabled() && this.battle.measureSubMode() === 'movement') { this.commitMovePreview(); return; }
    if (this.battle.pendingAbility()) {
      const step = this.battle.recordPendingAbilityTargetClick();
      this.sync3dStage();
      if (step.shouldExecuteNow) void this.executePendingAbilityCast();
    }
  }

  onTokenClicked(event: MouseEvent, token: VttTokenVm): void {
    event.stopPropagation();
    if (this.dragMoved) { this.dragMoved = false; return; }
    this.handleTokenSelectionOrCast(token, event.shiftKey);
  }

  private handleTokenSelectionOrCast(token: VttTokenVm, shiftKey: boolean): void {
    if (this.battle.pendingAbility()) {
      this.battle.cursorWorldPos.set({ x: token.x, z: token.z });
      const step = this.battle.recordPendingAbilityTargetClick(token);
      this.sync3dStage();
      if (step.shouldExecuteNow) void this.executePendingAbilityCast();
      return;
    }
    this.battle.handleTokenClick(token, shiftKey);
    this.sync3dStage();
  }

  commitMovePreview(): void {
    const res = this.battle.commitStealthGridMove();
    if (!res.allowed) return;
    this.sync3dStage();
    const moved = this.battle.activeObserverToken();
    void this.serverSync.publishMove(moved.key, moved.x, moved.z);
  }

  selectDockAction(action: DockAction): void {
    const ability = this.battle.tacticalAbilities().find((a) => a.id === action.id);
    if (ability) this.selectTurnAbility(ability);
  }
  dockStandardAction(detail: { action: { name: string }; token: DockToken }): void {
    this.dmToolReadout.set(`${detail.token.name} uses ${detail.action.name}.`);
  }
  dockCheck(label: string, token: DockToken): void {
    this.dmToolReadout.set(`${token.name}: ${label} check requested.`);
  }
  dockToggleMeasure(): void { this.battle.toggleMeasureTool(); }

  selectTurnAbility(ability: VttTacticalAbilityVm): void {
    if (!this.battle.isAbilityAvailableOnTurn(ability)) return;
    if (this.battle.pendingAbility()?.id === ability.id) { void this.executePendingAbilityCast(); return; }
    this.battle.beginAbilityTargeting(ability);
  }

  async executePendingAbilityCast(): Promise<void> {
    const confirmed = this.battle.confirmPendingAbilityCast();
    if (!confirmed) return;
    const { ability, targets } = confirmed;
    const targetList = targets.length > 0 ? targets : [this.vtt.selectedTarget()];
    let lastFx: Awaited<ReturnType<typeof this.vtt.executeActionOnTarget>> = null;
    for (const target of targetList) {
      this.vtt.selectedTargetKey.set(target.key);
      lastFx = (await this.vtt.executeActionOnTarget(ability)) ?? lastFx;
    }
    this.sync3dStage();
    if (lastFx) this.stage.playTrajectoryEffect(lastFx.preset, lastFx.startPos, lastFx.endPos);
  }

  nextTurn(): void {
    void this.serverSync.nextTurn().then(() => {
      const active = this.vtt.selectedAttacker();
      if (active) this.battle.resetTurnMovement(active.key);
      this.sync3dStage();
    });
  }

  spawnSelectedBestiaryMonster(): void {
    const pick = this.vtt.creatures().find((c) => c.id === this.quickAddMonsterId()) ?? this.vtt.creatures()[0];
    if (!pick) return;
    this.vtt.spawnCreatureIntoVtt(pick);
    this.sync3dStage();
  }

  addQuickNpcToMap(): void {
    this.battle.quickAddNpcToEncounter(this.quickAddNpcName(), this.quickAddNpcTitle(), this.quickAddNpcScope(), this.quickAddNpcDisposition(), true);
    this.quickAddNpcName.set('');
    this.sync3dStage();
  }

  rollQuickDcCheck(dc: number, label: string): void {
    const d20 = Math.floor(Math.random() * 20) + 1;
    const total = d20 + 4;
    this.fullscreenDice.triggerFullScreenRoll({
      label: `DC ${dc} ${label} Check`, actorName: this.vtt.selectedAttacker()?.name ?? 'Combatant',
      expression: '1d20 + 4', diceValues: [d20], modifier: 4, total,
      outcomeBadge: total >= dc ? 'SUCCESS' : 'FAILURE', isNat20: d20 === 20, isCritFail: d20 === 1,
    });
  }

  rollSelectedDice(): void {
    const f = this.selectedDiceFormula();
    const [countStr, sidesStr] = f.toLowerCase().split('d');
    const count = Math.max(1, Number(countStr) || 1);
    const sides = Math.max(4, Number(sidesStr) || 20);
    const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
    const sum = rolls.reduce((a, b) => a + b, 0);
    const actor = this.vtt.selectedAttacker()?.name ?? 'Combatant';
    const isNat20 = sides === 20 && rolls.includes(20);
    const isCritFail = sides === 20 && rolls.includes(1);
    const suffix = isNat20 ? ' (CRITICAL HIT!)' : isCritFail ? ' (CRITICAL FAIL!)' : '';
    this.vtt.combatLogs.update((logs) => [{
      id: `dice-${Date.now()}`, round: this.vtt.activeRound(), attackerName: actor, targetName: 'Battlefield',
      actionName: `Dice Roll (${f})`, distanceFeet: 0, hit: !isCritFail, isCritical: isNat20, damageDealt: 0,
      message: `${actor} rolled ${f}: [${rolls.join(', ')}] = ${sum}${suffix}`,
    }, ...logs]);
    this.fullscreenDice.triggerFullScreenRoll({
      label: 'Battlefield Roll', actorName: actor, expression: f, diceValues: rolls, modifier: 0, total: sum, isNat20, isCritFail,
    });
  }

  submitChat(): void {
    this.battle.sendChatMessage(this.chatDraft(), this.chatWhisperGmOnly());
    this.chatDraft.set('');
  }

  selectRightTab(tab: VttRightTabId): void {
    this.battle.activeRightTab.set(tab);
    this.battle.rightPanelCollapsed.set(false);
  }

  readonly rightTabTitle = computed(() => {
    const map: Record<string, string> = {
      'combat-log': 'Combat Roll Log', chat: 'Campaign Table Chat', initiative: 'Initiative Order',
      quests: 'Active Quests & Missions', npcs: 'Session NPCs', guide: 'Adventure Scene Guide',
      trackers: 'Traps & Trackers', lore: 'World Lore', settings: 'VTT Display Settings',
    };
    return map[this.battle.activeRightTab()] ?? 'Encounter Drawer';
  });

  openHandoutModal(): void { this.handouts.composeOpen.set(true); }
}
