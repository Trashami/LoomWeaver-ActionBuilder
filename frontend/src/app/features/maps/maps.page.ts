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
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { QualityProfile } from '../../core/models/loomweaver.models';
import { LoomWeaverStoreService } from '../../core/services/loomweaver-store.service';
import {
  BrushParameterState,
  LwAssetCardComponent,
  LwBadgeComponent,
  LwButtonComponent,
  LwIconComponent,
  LwMapToolPanelComponent,
  LwPanelComponent,
  LwRulesOptionSelectorComponent,
  RulesOptionItem,
} from '../../shared/ui/public-api';
import {
  MAP_STUDIO_TOOLS,
  MapCommandEntry,
  MapRenderMode,
  MapSceneGraphState,
} from './engine/map-scene-contract';
import { BabylonMapStageService } from './engine/rendering/babylon-map-stage.service';

@Component({
  selector: 'lw-maps-page',
  standalone: true,
  imports: [
    FormsModule,
    RouterLink,
    LwPanelComponent,
    LwBadgeComponent,
    LwButtonComponent,
    LwIconComponent,
    LwAssetCardComponent,
    LwMapToolPanelComponent,
    LwRulesOptionSelectorComponent,
  ],
  templateUrl: './maps.page.html',
  styleUrl: './maps.page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapsPageComponent implements AfterViewInit, OnDestroy {
  @ViewChild('babylonCanvas') private canvasRef?: ElementRef<HTMLCanvasElement>;

  private readonly http = inject(HttpClient);
  readonly store = inject(LoomWeaverStoreService);
  readonly stage = inject(BabylonMapStageService);

  readonly biomePresets = [
    'Gwaedhellain Poisoned Canopy',
    'Plains of Red Clay & Ruin',
    'Cinth Marble Ballroom Courtyard',
    'Runic Subterranean Basalt',
    'Alpine Limestone Cliffs',
  ];
  readonly selectedBiomePreset = signal<string>('Gwaedhellain Poisoned Canopy');
  readonly elevationDelta = signal<number>(6.5);
  readonly roughnessOctaves = signal<number>(4);
  readonly waterLevelMeters = signal<number>(1.8);
  readonly heightmapBanner = signal<string>(
    'Multi-octave heightmap & biome brush sculptor synchronized with Babylon.js terrain.',
  );

  readonly tools = MAP_STUDIO_TOOLS;
  readonly activeToolId = signal<string>('stamps');
  readonly renderMode = signal<MapRenderMode>('Linked 2D <-> 3D');
  readonly selectedSceneKey = signal<string>('scene-cinth-ballroom');
  readonly brushRadius = signal<number>(4);
  readonly brushIntensity = signal<number>(65);
  readonly deterministicSeed = signal<number>(1042);

  readonly renderModeOptions: readonly RulesOptionItem[] = [
    { id: '2D Blueprint', label: '2D Blueprint', badge: 'Top-Down', badgeTone: 'emerald' },
    { id: '3D Tabletop', label: '3D Tabletop', badge: 'Babylon.js', badgeTone: 'gold' },
    { id: 'Linked 2D <-> 3D', label: 'Linked 2D <-> 3D', badge: 'Unified Graph', badgeTone: 'gold' },
  ];

  readonly qualityProfiles: readonly QualityProfile[] = [
    'Auto',
    'Cinematic',
    'Balanced',
    'Performance 3D',
    'Classic 2D',
  ];

  readonly sceneGraph = signal<MapSceneGraphState>({
    sceneKey: 'scene-cinth-ballroom',
    name: 'Cinth Grand Masquerade Ballroom',
    biome: 'Obsidian & Gold Cathedral',
    revision: 14,
    scatterSeed: 1042,
    scatterDensity: 65,
    terrainRelief: 45,
    stamps: [
      {
        id: 'st-emrys',
        label: 'Lord Emrys Balcony Dais',
        category: 'Token',
        entityCompositeKey: '1:NPC:npc-emrys',
        x: -5.5,
        z: 3.5,
        scale: 1.25,
        rotationY: 0,
        colorHex: '#d4a853',
      },
      {
        id: 'st-kildrid',
        label: 'Kildrid [Stone Sense]',
        category: 'Token',
        entityCompositeKey: '1:Character:char-kildrid',
        x: 3.5,
        z: -2.5,
        scale: 1.15,
        rotationY: 0.4,
        colorHex: '#2ed39a',
      },
      {
        id: 'st-pillar-1',
        label: 'Cinth Gothic Pillar',
        category: 'Architecture',
        x: -8,
        z: -6,
        scale: 1.3,
        rotationY: 0,
        colorHex: '#8b7355',
      },
    ],
    waterSplines: [
      {
        id: 'ws-canal',
        name: 'Cinth Reflective Canal & Fountain Channel',
        width: 2.6,
        colorHex: '#1b6d82',
        points: [
          [-14, 0.14, -7],
          [-4, 0.14, -2],
          [5, 0.14, 2],
          [14, 0.14, 7],
        ],
      },
    ],
    lights: [
      {
        id: 'lt-chandelier',
        label: 'Grand Gold Chandelier',
        x: 0,
        y: 6.5,
        z: 0,
        range: 24,
        intensity: 1.5,
        colorHex: '#ffcf75',
      },
      {
        id: 'lt-sconce',
        label: 'Crimson Balcony Sconce',
        x: -6,
        y: 4.5,
        z: 4,
        range: 14,
        intensity: 1.15,
        colorHex: '#ef5d72',
      },
    ],
  });

  readonly commandLog = signal<readonly MapCommandEntry[]>([
    {
      id: 'cmd-14',
      timestamp: 'Rev 14',
      toolId: 'lighting',
      summary: 'Initialized Babylon.js 2.5D Chandelier & Canal Spline on Cinth Ballroom',
    },
  ]);

  readonly activeScene = computed(() => {
    const list = this.store.authorizedScenes();
    return list.find((s) => s.sceneKey === this.selectedSceneKey()) ?? list[0];
  });

  readonly mapAssets = computed(() =>
    this.store.assets().filter((a) => a.category === 'Map Pack' || a.category === 'Audio Pack'),
  );

  ngAfterViewInit(): void {
    const canvas = this.canvasRef?.nativeElement;
    if (canvas) {
      this.stage.mountCanvas(canvas, this.sceneGraph(), (x, z) => {
        this.applyCanvasStrokeAt(x, z);
      });
    }
  }

  ngOnDestroy(): void {
    this.stage.dispose();
  }

  selectScene(sceneKey: string, name: string, biome: string): void {
    this.selectedSceneKey.set(sceneKey);
    this.sceneGraph.update((cur) => {
      const next = {
        ...cur,
        sceneKey,
        name,
        biome,
        scatterSeed: cur.scatterSeed + 17,
      };
      this.stage.syncSceneGraph(next);
      return next;
    });
  }

  setRenderMode(mode: string): void {
    if (mode === '2D Blueprint' || mode === '3D Tabletop' || mode === 'Linked 2D <-> 3D') {
      this.renderMode.set(mode);
      this.stage.setCameraMode(mode);
    }
  }

  onBrushChanged(brush: BrushParameterState): void {
    this.brushRadius.set(brush.radius);
    this.brushIntensity.set(brush.intensity);
    this.deterministicSeed.set(brush.seed);

    this.sceneGraph.update((cur) => {
      const next: MapSceneGraphState = {
        ...cur,
        scatterSeed: brush.seed,
        scatterDensity: brush.intensity,
        terrainRelief: brush.intensity,
      };
      this.stage.syncSceneGraph(next);
      return next;
    });
  }

  onToolCommand(cmd: string): void {
    if (cmd === 'undo') {
      this.undoLastCommand();
      return;
    }
    const rx = Math.round((Math.random() * 14 - 7) * 10) / 10;
    const rz = Math.round((Math.random() * 10 - 5) * 10) / 10;
    this.applyCanvasStrokeAt(rx, rz);
  }

  applyCanvasStrokeAt(x: number, z: number): void {
    const tool = this.activeToolId();
    this.sceneGraph.update((cur) => {
      const nextRev = cur.revision + 1;
      let stamps = cur.stamps;
      let lights = cur.lights;
      let waterSplines = cur.waterSplines;
      let scatterSeed = cur.scatterSeed;

      if (tool === 'stamps' || tool === 'walls') {
        stamps = [
          ...cur.stamps,
          {
            id: `st-${nextRev}`,
            label: tool === 'walls' ? 'Obsidian Wall Segment' : 'Gothic Arch Stamp',
            category: 'Architecture',
            x,
            z,
            scale: 1.15,
            rotationY: (nextRev % 6) * 0.5,
            colorHex: tool === 'walls' ? '#6c8796' : '#d4a853',
          },
        ];
      } else if (tool === 'lighting') {
        lights = [
          ...cur.lights,
          {
            id: `lt-${nextRev}`,
            label: `Brazier Point Light #${nextRev}`,
            x,
            y: 4.5,
            z,
            range: Math.max(8, this.brushRadius() * 3),
            intensity: 1.35,
            colorHex: '#ffae52',
          },
        ];
      } else if (tool === 'water') {
        const first = cur.waterSplines[0];
        if (first) {
          waterSplines = [
            {
              ...first,
              points: [...first.points, [x, 0.14, z]],
            },
          ];
        }
      } else {
        scatterSeed = cur.scatterSeed + 31;
      }

      const updated: MapSceneGraphState = {
        ...cur,
        revision: nextRev,
        scatterSeed,
        stamps,
        lights,
        waterSplines,
      };
      this.stage.syncSceneGraph(updated);
      this.commandLog.update((logs) => [
        {
          id: `cmd-${nextRev}`,
          timestamp: `Rev ${nextRev}`,
          toolId: tool,
          summary: `Applied [${tool}] at (${x}, ${z}) on ${cur.name}`,
        },
        ...logs.slice(0, 5),
      ]);
      return updated;
    });
  }

  undoLastCommand(): void {
    this.sceneGraph.update((cur) => {
      if (cur.stamps.length <= 2) return cur;
      const updated: MapSceneGraphState = {
        ...cur,
        revision: Math.max(1, cur.revision - 1),
        stamps: cur.stamps.slice(0, -1),
      };
      this.stage.syncSceneGraph(updated);
      return updated;
    });
    this.commandLog.update((list) => (list.length > 1 ? list.slice(1) : list));
  }

  applyHeightmapBiomeSculpt(): void {
    const sceneId = this.selectedSceneKey();
    const payload = {
      biomePreset: this.selectedBiomePreset(),
      brushRadiusMeters: this.brushRadius(),
      elevationDelta: this.elevationDelta(),
      roughnessOctaves: this.roughnessOctaves(),
      waterLevelMeters: this.waterLevelMeters(),
    };

    this.http
      .post<{ summary: string }>(`/api/v2/campaigns/1/maps/${sceneId}/sculpt-heightmap`, payload)
      .subscribe({
        next: (res) => {
          if (res?.summary) this.heightmapBanner.set(res.summary);
          this.applyCanvasStrokeAt(0, 0);
        },
        error: () => {
          this.heightmapBanner.set(
            `Sculpted '${payload.biomePreset}' heightmap (Elevation +${payload.elevationDelta}m, Octaves=${payload.roughnessOctaves}).`,
          );
          this.applyCanvasStrokeAt(0, 0);
        },
      });
  }
}
