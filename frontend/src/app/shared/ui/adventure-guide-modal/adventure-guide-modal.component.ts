import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdventureGuideService } from '../../../core/services/adventure-guide.service';
import { LoomWeaverStoreService } from '../../../core/services/loomweaver-store.service';
import { WorldLoreFacadeService } from '../../../core/services/world-lore-facade.service';
import { LwBadgeComponent } from '../badge/badge.component';
import { LwButtonComponent } from '../button/button.component';
import { LwIconComponent } from '../icon/icon.component';
import { LwModalComponent } from '../modal/modal.component';

@Component({
  selector: 'lw-adventure-guide-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LwModalComponent,
    LwButtonComponent,
    LwBadgeComponent,
    LwIconComponent,
  ],
  templateUrl: './adventure-guide-modal.component.html',
  styleUrl: './adventure-guide-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwAdventureGuideModalComponent {
  readonly store = inject(LoomWeaverStoreService);
  readonly adventureGuide = inject(AdventureGuideService);
  readonly worldLore = inject(WorldLoreFacadeService);
  private readonly router = inject(Router);

  readonly isGm = computed(() => this.store.viewerRole() === 'gm');
  readonly activeScope = computed(() => this.store.adventureGuideModalScope());
  readonly guide = computed(() => this.adventureGuide.guide());

  readonly filteredLoreForGuide = computed(() => {
    const entries = this.worldLore.workspace().loreEntries;
    const isGm = this.isGm();
    const scope = this.activeScope();
    const activeSesId = this.store.activeSessionId();
    return entries
      .filter((e) => !e.archived && (isGm || e.visibility !== 'gm'))
      .filter((e) => {
        if (scope === 'adventure') return true;
        return !e.sessionId || e.sessionId === activeSesId;
      });
  });

  readonly filteredQuestsForGuide = computed(() => {
    const scope = this.activeScope();
    const activeSesId = this.store.activeSessionId();
    const attachments = this.store.sessionAttachments().filter(
      (a) =>
        (a.elementKind === 'Quest' || a.elementKind === 'SideQuest') &&
        (this.isGm() || a.visibility !== 'gm') &&
        (scope === 'adventure' || a.sessionId === activeSesId),
    );
    const guideQuests = this.guide().cluesAndHazards;
    return { guideQuests, attachedQuests: attachments };
  });

  readonly filteredAttachments = computed(() => {
    const scope = this.activeScope();
    const activeSesId = this.store.activeSessionId();
    const isGm = this.isGm();
    return this.store
      .sessionAttachments()
      .filter((a) => isGm || a.visibility !== 'gm')
      .filter((a) => scope === 'adventure' || a.sessionId === activeSesId);
  });

  setGuideScope(scope: 'session' | 'adventure'): void {
    this.store.adventureGuideModalScope.set(scope);
    if (scope === 'session') {
      this.adventureGuide.selectScope('session', this.store.activeSessionId());
    } else {
      this.adventureGuide.selectScope('adventure', 'adventure-shadow-of-the-mountain');
    }
  }

  onSessionSelectChange(sessionId: string): void {
    this.store.setActiveSession(sessionId);
    if (this.activeScope() === 'session') {
      this.adventureGuide.selectScope('session', sessionId);
    }
  }

  openBattlemapInArcaneScreen(sceneKey?: string): void {
    const key = sceneKey || this.guide().assignedBattlemap?.sceneKey || '';
    this.store.closeAdventureGuideModal();
    if (key) {
      void this.router.navigate(['/arcane-screen'], { queryParams: { scene: key } });
    } else {
      void this.router.navigate(['/arcane-screen']);
    }
  }

  openRoute(routeLink: string): void {
    this.store.closeAdventureGuideModal();
    void this.router.navigateByUrl(routeLink || '/sessions');
  }
}
