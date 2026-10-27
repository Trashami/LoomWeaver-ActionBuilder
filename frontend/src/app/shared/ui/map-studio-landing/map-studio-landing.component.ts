import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgpButton } from 'ng-primitives/button';
import { LwBadgeComponent } from '../badge/badge.component';
import { LwIconComponent } from '../icon/icon.component';

export type LwMapDimensionMode = '2d' | '3d';

export interface LwExistingMapSummary {
  readonly sceneKey: string;
  readonly name: string;
  readonly dimensionMode: LwMapDimensionMode;
  readonly campaignId: number;
  readonly campaignName: string;
  readonly sessionLabel: string;
  readonly encounterLabel: string;
  readonly gridSummary: string;
  readonly floorBumpName: string;
  readonly previewUrl: string;
  readonly updatedLabel: string;
  readonly revision: number;
}

export interface LwCreateMapLaunchIntent {
  readonly name: string;
  readonly dimensionMode: LwMapDimensionMode;
  readonly gridCols: number;
  readonly gridRows: number;
  readonly campaignId: number;
  readonly sessionId: string;
  readonly encounterId: string;
  readonly starterFloorBumpId: string;
}

@Component({
  selector: 'lw-map-studio-landing',
  standalone: true,
  imports: [FormsModule, NgpButton, LwBadgeComponent, LwIconComponent],
  templateUrl: './map-studio-landing.component.html',
  styleUrl: './map-studio-landing.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwMapStudioLandingComponent {
  readonly existingMaps = input<readonly LwExistingMapSummary[]>([]);
  readonly campaigns = input<readonly { id: number; name: string }[]>([]);
  readonly sessions = input<readonly { id: string; label: string }[]>([]);
  readonly encounters = input<readonly { id: string; label: string }[]>([]);
  readonly activeCampaignId = input<number>(1);

  readonly createNewMap = output<LwCreateMapLaunchIntent>();
  readonly openExistingMap = output<LwExistingMapSummary>();
  readonly campaignChange = output<number>();

  readonly showCreatePrompt = signal<boolean>(false);
  readonly selectedDimension = signal<LwMapDimensionMode>('3d');
  readonly draftMapName = signal<string>('The Forgotten Crypt');
  readonly draftGridCols = signal<number>(50);
  readonly draftGridRows = signal<number>(50);
  readonly draftSessionId = signal<string>('session-15');
  readonly draftEncounterId = signal<string>('enc-cinth-masquerade');
  readonly draftStarterFloorId = signal<string>('bump-worn-castle-flagstone');

  openNewMapModal(defaultMode: LwMapDimensionMode = '3d'): void {
    this.selectedDimension.set(defaultMode);
    this.showCreatePrompt.set(true);
  }

  confirmCreateMap(): void {
    const cleanName = this.draftMapName().trim() || 'Untitled Campaign Map';
    this.createNewMap.emit({
      name: cleanName,
      dimensionMode: this.selectedDimension(),
      gridCols: this.draftGridCols(),
      gridRows: this.draftGridRows(),
      campaignId: this.activeCampaignId(),
      sessionId: this.draftSessionId(),
      encounterId: this.draftEncounterId(),
      starterFloorBumpId: this.draftStarterFloorId(),
    });
    this.showCreatePrompt.set(false);
  }

  onCampaignSelect(event: Event): void {
    const select = event.target as HTMLSelectElement | null;
    const id = Number(select?.value ?? 1);
    if (!Number.isNaN(id)) {
      this.campaignChange.emit(id);
    }
  }
}
