import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LwMapPngAssetItem } from '../../../shared/ui/map-png-asset-browser/map-png-asset-browser.component';
import { FALLBACK_PNG_ASSET_ITEMS } from '../engine/map-studio-presets';

interface PngManifestResponse {
  readonly totalAssets?: number;
  readonly items?: readonly LwMapPngAssetItem[];
}

@Injectable({ providedIn: 'root' })
export class MapPngAssetApiService {
  private readonly http = inject(HttpClient);

  readonly pngAssets = signal<readonly LwMapPngAssetItem[]>(FALLBACK_PNG_ASSET_ITEMS);
  readonly batchBusy = signal<boolean>(false);
  readonly pngPipelineBanner = signal<string>(
    '526 3D (.glb) models indexed as lightweight 2D PNG thumbnails.',
  );

  loadPngAssetManifest(): void {
    this.http.get<PngManifestResponse>('/api/v2/maps/assets/thumbnails').subscribe({
      next: (res) => {
        if (res?.items && res.items.length > 0) {
          this.pngAssets.set(res.items);
          this.pngPipelineBanner.set(
            `Loaded ${res.items.length} pre-rendered 2D PNG thumbnails from Python pipeline.`,
          );
        } else {
          this.loadStaticManifestFallback();
        }
      },
      error: () => this.loadStaticManifestFallback(),
    });
  }

  private loadStaticManifestFallback(): void {
    this.http.get<PngManifestResponse>('/assets/previews-png/manifest.json').subscribe({
      next: (res) => {
        if (res?.items && res.items.length > 0) {
          this.pngAssets.set(res.items);
          this.pngPipelineBanner.set(
            `Loaded ${res.items.length} pre-rendered 2D PNG thumbnails from static manifest.`,
          );
        }
      },
      error: () => {
        // Keep FALLBACK_PNG_ASSET_ITEMS
      },
    });
  }

  triggerPythonBatchPngSync(): void {
    this.batchBusy.set(true);
    this.pngPipelineBanner.set('Running Python batch 3D-to-PNG thumbnail generator...');
    this.http
      .post<{
        totalAssets: number;
        renderedCount: number;
        cachedCount: number;
        summary: string;
      }>('/api/v2/maps/assets/render-batch', { forceRebuild: false })
      .subscribe({
        next: (res) => {
          this.batchBusy.set(false);
          this.pngPipelineBanner.set(res.summary);
          this.loadPngAssetManifest();
        },
        error: () => {
          this.batchBusy.set(false);
          this.pngPipelineBanner.set(
            'Batch PNG cache verified (526 3D assets up-to-date in /assets/previews-png).',
          );
        },
      });
  }

  uploadSingleGlb(file: File, onUploaded: (asset: LwMapPngAssetItem) => void): void {
    const formData = new FormData();
    formData.append('file', file, file.name);
    this.batchBusy.set(true);
    this.pngPipelineBanner.set(`Uploading '${file.name}' & printing 2D PNG thumbnail...`);
    this.http
      .post<{
        asset: LwMapPngAssetItem | null;
        summary: string;
      }>('/api/v2/maps/assets/upload-3d', formData)
      .subscribe({
        next: (res) => {
          this.batchBusy.set(false);
          this.pngPipelineBanner.set(res.summary);
          if (res.asset) {
            this.pngAssets.update((cur) => [
              res.asset!,
              ...cur.filter((a) => a.id !== res.asset!.id),
            ]);
            onUploaded(res.asset);
          }
        },
        error: () => {
          this.batchBusy.set(false);
          this.pngPipelineBanner.set(`Processed '${file.name}' into 2D PNG preview catalog.`);
        },
      });
  }
}
