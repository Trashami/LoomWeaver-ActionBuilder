import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { NgpButton } from 'ng-primitives/button';
import { LwBadgeComponent } from '../badge/badge.component';
import { LwIconComponent } from '../icon/icon.component';
import { LwMapPngAssetItem } from '../map-png-asset-browser/map-png-asset-browser.component';

export type LwPolyFilterTier = 'all' | 'low' | 'medium' | 'high';
export type LwAssetFormatFilter = 'all' | '3d-glb' | '2d-stamp' | '2d-floor';

@Component({
  selector: 'lw-map-asset-picker-modal',
  standalone: true,
  imports: [NgpButton, LwBadgeComponent, LwIconComponent],
  templateUrl: './map-asset-picker-modal.component.html',
  styleUrl: './map-asset-picker-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LwMapAssetPickerModalComponent {
  readonly open = input<boolean>(false);
  readonly title = input<string>('Select 3D / 2D Map Asset');
  readonly assets = input<readonly LwMapPngAssetItem[]>([]);
  readonly categories = input<readonly string[]>(['All']);
  readonly selectedAssetId = input<string>('');
  readonly initialCategory = input<string>('All');

  readonly assetPicked = output<LwMapPngAssetItem>();
  readonly closed = output<void>();
  readonly uploadSingleGlb = output<File>();

  readonly searchQuery = signal<string>('');
  readonly activeCategory = signal<string>('All');
  readonly polyFilter = signal<LwPolyFilterTier>('all');
  readonly formatFilter = signal<LwAssetFormatFilter>('all');
  readonly selectedTag = signal<string>('all');
  readonly pageLimit = signal<number>(60);

  @HostListener('window:keydown.escape')
  onEscapeKey(): void {
    if (this.open()) {
      this.closed.emit();
    }
  }

  readonly availableTags = computed<readonly string[]>(() => {
    const counts = new Map<string, number>();
    for (const item of this.assets()) {
      for (const tag of item.tags ?? []) {
        const clean = tag.toLowerCase().trim();
        if (clean.length > 2) {
          counts.set(clean, (counts.get(clean) ?? 0) + 1);
        }
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 18)
      .map(([tag]) => tag);
  });

  readonly filteredAssets = computed<readonly LwMapPngAssetItem[]>(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const cat = this.activeCategory();
    const poly = this.polyFilter();
    const fmt = this.formatFilter();
    const tagFilter = this.selectedTag();

    return this.assets().filter((item) => {
      if (cat !== 'All' && item.category.toLowerCase() !== cat.toLowerCase()) {
        return false;
      }
      if (fmt === '3d-glb' && !item.modelUrl) return false;
      if (fmt === '2d-floor' && !item.isFloor) return false;
      if (fmt === '2d-stamp' && (item.isFloor || Boolean(item.modelUrl))) return false;

      if (poly !== 'all') {
        const faces = item.faceCount ?? 0;
        if (poly === 'low' && faces > 5000) return false;
        if (poly === 'medium' && (faces <= 5000 || faces > 20000)) return false;
        if (poly === 'high' && faces <= 20000) return false;
      }

      if (tagFilter !== 'all') {
        const hasTag = (item.tags ?? []).some((t) => t.toLowerCase() === tagFilter);
        if (!hasTag) return false;
      }

      if (!q) return true;
      return (
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.tags ?? []).some((t) => t.toLowerCase().includes(q))
      );
    });
  });

  readonly visibleAssets = computed(() => this.filteredAssets().slice(0, this.pageLimit()));
  readonly hasMore = computed(() => this.filteredAssets().length > this.pageLimit());

  onSearchInput(event: Event): void {
    const el = event.target as HTMLInputElement | null;
    this.searchQuery.set(el?.value ?? '');
    this.pageLimit.set(60);
  }

  selectCategory(cat: string): void {
    this.activeCategory.set(cat);
    this.pageLimit.set(60);
  }

  selectPolyFilter(tier: LwPolyFilterTier): void {
    this.polyFilter.set(tier);
    this.pageLimit.set(60);
  }

  selectFormatFilter(fmt: LwAssetFormatFilter): void {
    this.formatFilter.set(fmt);
    this.pageLimit.set(60);
  }

  selectTag(tag: string): void {
    this.selectedTag.set(this.selectedTag() === tag ? 'all' : tag);
    this.pageLimit.set(60);
  }

  loadMore(): void {
    this.pageLimit.update((n) => n + 60);
  }

  pickAsset(asset: LwMapPngAssetItem): void {
    this.assetPicked.emit(asset);
    this.closed.emit();
  }

  onFileSelected(event: Event): void {
    const el = event.target as HTMLInputElement | null;
    const file = el?.files?.[0];
    if (file) {
      this.uploadSingleGlb.emit(file);
      el.value = '';
    }
  }
}
