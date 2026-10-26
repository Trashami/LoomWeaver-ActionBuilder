import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

export type LwIconTone = 'inherit' | 'emerald' | 'gold' | 'crimson' | 'muted';

const MATERIAL_ICON_MAP: Readonly<Record<string, string>> = {
  home: 'dashboard',
  dashboard: 'dashboard',
  landmark: 'account_balance',
  users: 'group',
  crown: 'workspace_premium',
  compass: 'explore',
  globe: 'public',
  map: 'map',
  shield: 'shield',
  'shield-check': 'verified_user',
  'shield-alert': 'gpp_maybe',
  swords: 'gavel',
  dices: 'casino',
  zap: 'bolt',
  layers: 'layers',
  'book-open': 'menu_book',
  book: 'menu_book',
  scroll: 'description',
  network: 'hub',
  database: 'storage',
  search: 'search',
  eye: 'visibility',
  'eye-off': 'visibility_off',
  lock: 'lock',
  unlock: 'lock_open',
  check: 'check',
  'check-circle': 'check_circle',
  'arrow-right': 'arrow_forward',
  'arrow-left': 'arrow_back',
  'external-link': 'open_in_new',
  'chevron-down': 'expand_more',
  'chevron-up': 'expand_less',
  'chevron-right': 'chevron_right',
  'chevron-left': 'chevron_left',
  'alert-triangle': 'warning_amber',
  'alert-circle': 'error_outline',
  info: 'info',
  menu: 'menu',
  x: 'close',
  close: 'close',
  plus: 'add',
  minus: 'remove',
  play: 'play_arrow',
  pause: 'pause',
  grid: 'grid_on',
  ruler: 'straighten',
  target: 'my_location',
  link: 'link',
  trash: 'delete_outline',
  copy: 'content_copy',
  filter: 'tune',
  sliders: 'tune',
  settings: 'settings',
  undo: 'undo',
   'rotate-ccw': 'restart_alt',
  save: 'save',
  user: 'person',
  code: 'code',
  terminal: 'terminal',
};

@Component({
  selector: 'lw-icon',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './icon.component.html',
  styleUrl: './icon.component.scss',
})
export class LwIconComponent {
  readonly name = input.required<string>();
  readonly size = input<number>(16);
  readonly tone = input<LwIconTone>('inherit');
  readonly framed = input<boolean>(false);

  readonly materialLigature = computed(() => {
    const raw = (this.name() || '').trim();
    if (!raw) return 'circle';
    const kebab = raw
      .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
      .replace(/_/g, '-')
      .toLowerCase();
    const mapped = MATERIAL_ICON_MAP[kebab];
    if (mapped) {
      return mapped.toLowerCase();
    }
    return raw.replace(/-/g, '_').toLowerCase();
  });
}
